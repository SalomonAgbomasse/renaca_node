<template>
  <div class="agency-detail-container">
    <div v-if="loading" class="d-flex align-items-center justify-content-center" style="min-height: 400px;">
      <div class="text-center">
        <div class="spinner-border text-fnda" style="width:3rem;height:3rem;" role="status"></div>
        <p class="mt-3 text-muted">Chargement de l'agence…</p>
      </div>
    </div>

    <div v-else-if="!agency" class="text-center py-5">
      <i class="ph-bold ph-storefront-x fs-1 text-muted"></i>
      <p class="text-muted mt-3">Agence introuvable.</p>
      <router-link :to="{ name: 'ListeAgencePage' }" class="btn btn-fnda mt-2">Retour à la liste</router-link>
    </div>

    <template v-else>
      <!-- ── Hero header ── -->
      <div class="hero-card card border-0 shadow-sm mb-4 overflow-hidden bg-white">
        <div class="hero-bg"></div>
        <div class="card-body position-relative pt-4 pb-3 px-4">
          <div class="d-flex flex-wrap align-items-end gap-4">
            <!-- Icon Box -->
            <div class="avatar-hero" :style="{ background: '#33b04a' }">
              <i class="ph-bold ph-storefront text-white fs-1"></i>
            </div>

            <!-- Info principale -->
            <div class="flex-grow-1">
              <h3 class="fw-bold mb-1 text-dark">{{ agency.name }}</h3>
              <div class="d-flex flex-wrap gap-3 align-items-center">
                <span class="badge rounded-pill px-3 py-2 fw-semibold fs-13 bg-dark text-white">
                  Code : {{ agency.code || 'AG-' + agency.id }}
                </span>
                <span v-if="agency.location" class="text-muted fs-13">
                  <i class="ph-bold ph-map-pin me-1"></i>{{ agency.location }}
                </span>
              </div>
            </div>

            <!-- Action buttons -->
            <div v-if="canManageAgencies" class="d-flex flex-wrap gap-2 ms-auto">
              <button @click="goEdit" class="btn btn-fnda btn-sm d-flex align-items-center gap-1 px-3">
                <i class="ph-bold ph-pencil-simple"></i> Modifier
              </button>
              <button @click="duplicateAgency" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 px-3">
                <i class="ph-bold ph-copy"></i> Dupliquer
              </button>
              <button @click="deleteAgency" class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 px-3">
                <i class="ph-bold ph-trash"></i> Supprimer
              </button>
            </div>
          </div>

          <!-- Contacts row -->
          <div class="d-flex flex-wrap gap-4 mt-3 pt-3 border-top">
            <div class="contact-chip">
              <i class="ph-bold ph-phone text-success me-1"></i>
              <span>{{ agency.phone || 'Numéro non configuré' }}</span>
            </div>
            <div class="contact-chip">
              <i class="ph-bold ph-envelope text-info me-1"></i>
              <span>{{ agency.email || 'Email non configuré' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── KPI row ── -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-4">
          <div class="kpi-chip">
            <div class="kpi-icon bg-soft-success"><i class="ph-bold ph-users text-success"></i></div>
            <div>
              <div class="kpi-label">Utilisateurs</div>
              <div class="kpi-value">{{ totalUsers }}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-4">
          <div class="kpi-chip">
            <div class="kpi-icon bg-soft-fnda"><i class="ph-bold ph-file-text text-fnda"></i></div>
            <div>
              <div class="kpi-label">Contrats</div>
              <div class="kpi-value">{{ totalContracts }}</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="kpi-chip">
            <div class="kpi-icon bg-soft-warning"><i class="ph-bold ph-coins text-warning"></i></div>
            <div>
              <div class="kpi-label">Primes totales collectées</div>
              <div class="kpi-value text-nowrap">{{ formatMontant(totalPrimes) }} F</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tabs ── -->
      <div class="card border-0 shadow-sm bg-white mb-25">
        <div class="card-header bg-white border-bottom px-4 pt-3 pb-0">
          <ul class="nav nav-tabs border-0 gap-1" id="agencyDetailTabs">
            <li class="nav-item">
              <button class="nav-link fw-semibold fs-13 px-3 py-2" :class="{ active: tab === 'contrats' }" @click="tab = 'contrats'">
                <i class="ph-bold ph-file-text me-1"></i> Contrats
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link fw-semibold fs-13 px-3 py-2" :class="{ active: tab === 'utilisateurs' }" @click="tab = 'utilisateurs'; loadUtilisateurs()">
                <i class="ph-bold ph-users me-1"></i> Utilisateurs
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link fw-semibold fs-13 px-3 py-2" :class="{ active: tab === 'infos' }" @click="tab = 'infos'">
                <i class="ph-bold ph-identification-card me-1"></i> Informations
              </button>
            </li>
          </ul>
        </div>

        <div class="card-body p-4">

          <!-- TAB: Contrats -->
          <div v-show="tab === 'contrats'">
            <div v-if="loadingContrats" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-fnda"></div>
              <span class="ms-2 text-muted">Chargement des contrats de l'agence…</span>
            </div>
            <div v-else-if="contrats.length === 0" class="text-center text-muted py-5">
              <i class="ph-bold ph-file-dashed fs-1 d-block mb-2"></i>
              Aucun contrat émis par cette agence.
            </div>
            <template v-else>
              <div class="table-responsive">
                <table class="table table-striped align-middle mb-0 fs-13">
                  <thead>
                    <tr>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Référence</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Client</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Nature</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Capital</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Prime TTC</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Statut</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Effet</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3 pe-0 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in contrats" :key="c.id">
                      <td class="fw-semibold text-fnda">{{ c.reference }}</td>
                      <td>
                        <span v-if="c.customer">
                          {{ c.customer.raisonSociale || `${c.customer.lastname || ''} ${c.customer.firstname || ''}`.trim() }}
                        </span>
                        <span v-else class="text-muted">—</span>
                      </td>
                      <td>{{ c.natureCredit?.libelle || '—' }}</td>
                      <td class="text-nowrap">{{ formatMontant(c.capital) }} F</td>
                      <td class="text-nowrap fw-semibold text-success">{{ formatMontant(c.puttc) }} F</td>
                      <td>
                        <span class="badge rounded-pill" :class="c.isActive ? 'bg-success' : 'bg-warning text-dark'">
                          {{ c.isActive ? 'Actif' : 'Suspendu' }}
                        </span>
                      </td>
                      <td class="text-muted">{{ formatDate(c.dateEff) }}</td>
                      <td class="text-end pe-0">
                        <button
                          @click="voirDetailsContrat(c.id)"
                          class="btn btn-sm btn-outline-fnda py-1 px-2 fs-xs d-inline-flex align-items-center gap-1 me-1"
                        >
                          <i class="ph-bold ph-eye"></i>
                          Voir
                        </button>
                        <button
                          @click="genererPDFContrat(c.id)"
                          class="btn btn-sm btn-fnda py-1 px-2 fs-xs d-inline-flex align-items-center gap-1"
                          :disabled="downloadingContractId === c.id"
                        >
                          <span v-if="downloadingContractId === c.id" class="spinner-border spinner-border-sm" role="status" style="width: 12px; height: 12px;"></span>
                          <i v-else class="ph-bold ph-download-simple"></i>
                          PDF
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination des contrats -->
              <div
                class="pagination-area d-md-flex mt-15 mt-sm-20 mt-md-25 justify-content-between align-items-center"
                v-if="contratsTotalElements > 0"
              >
                <PaginationComponent 
                  :page="contratsPage" 
                  :totalPages="contratsTotalPages" 
                  :totalElements="contratsTotalElements" 
                  :limit="contratsLimit" 
                  @paginate="handleContratsPagination" 
                />
              </div>
            </template>
          </div>

          <!-- TAB: Utilisateurs -->
          <div v-show="tab === 'utilisateurs'">
            <div v-if="loadingUtilisateurs" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-fnda"></div>
              <span class="ms-2 text-muted">Chargement des utilisateurs…</span>
            </div>
            <div v-else-if="utilisateurs.length === 0" class="text-center text-muted py-5">
              <i class="ph-bold ph-user-circle-dashed fs-1 d-block mb-2"></i>
              Aucun utilisateur affecté à cette agence.
            </div>
            <div v-else class="table-responsive">
              <table class="table table-striped align-middle mb-0 fs-13">
                <thead>
                  <tr>
                    <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Utilisateur</th>
                    <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Rôle</th>
                    <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Statut</th>
                    <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Date d'embauche</th>
                    <th class="text-uppercase text-muted fw-semibold fs-xs py-3 pe-0 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in utilisateurs" :key="u.id">
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="avatar-circle" :style="{ background: getAvatarColor(u.lastname + u.firstname) }">
                          {{ getInitials(u) }}
                        </div>
                        <div>
                          <div class="fw-semibold text-dark">{{ u.lastname }} {{ u.firstname }}</div>
                          <div class="text-muted fs-xs">{{ u.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td>{{ u.role?.libelle || '—' }}</td>
                    <td>
                      <span class="badge rounded-pill" :class="u.status === 'ACTIVE' ? 'bg-success' : 'bg-warning text-dark'">
                        {{ u.status === 'ACTIVE' ? 'Actif' : 'Suspendu' }}
                      </span>
                    </td>
                    <td class="text-muted">{{ formatDate(u.createdAt) }}</td>
                    <td class="text-end pe-0">
                      <router-link
                        :to="{ name: 'UserDetailPage', params: { id: u.id } }"
                        class="btn btn-sm btn-fnda py-1 px-3"
                      >
                        <i class="ph-bold ph-eye me-1 fs-12"></i> Fiche profil
                      </router-link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB: Informations -->
          <div v-show="tab === 'infos'">
            <div class="row g-4">
              <div class="col-md-6">
                <div class="info-section">
                  <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <i class="ph-bold ph-storefront text-fnda"></i> Coordonnées de l'agence
                  </h6>
                  <div class="info-grid">
                    <div class="info-row"><span class="info-label">Nom</span><span>{{ agency.name }}</span></div>
                    <div class="info-row"><span class="info-label">Code interne</span><span>{{ agency.code || '—' }}</span></div>
                    <div class="info-row"><span class="info-label">Adresse physique</span><span>{{ agency.location || '—' }}</span></div>
                    <div class="info-row"><span class="info-label">Téléphone</span><span class="text-success">{{ agency.phone || '—' }}</span></div>
                    <div class="info-row"><span class="info-label">Adresse Email</span><span class="text-info">{{ agency.email || '—' }}</span></div>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="info-section">
                  <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <i class="ph-bold ph-info text-fnda"></i> Notes d'administration
                  </h6>
                  <div class="p-3 bg-white rounded border fs-13 text-muted">
                    {{ agency.description || "Aucune description ou note administrative disponible pour cette agence." }}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </template>

    <!-- Modal d'édition d'agence -->
    <AddAgencyModal 
      v-if="agency && agency.id" 
      :show="showModal"
      :agencyId="agency.id" 
      @modal-closed="showModal = false" 
      @agency-saved="handleAgencySaved" 
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ApiService from '../../services/ApiService';
import JwtService from '../../services/JwtService';
import PaginationComponent from '../Utilities/Pagination.vue';
import AddAgencyModal from './AddAgenceModal.vue';
import Swal from 'sweetalert2';
import { useAuthStore } from '../../services/auth';

export default defineComponent({
  name: 'AgencyDetail',
  components: {
    PaginationComponent,
    AddAgencyModal
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    const canManageAgencies = computed(() => {
      const roleName = (authStore.user?.role?.libelle || authStore.user?.role || '').toString().toUpperCase();
      return authStore.user?.idRole === 1 || authStore.user?.idRole === 5 || roleName === 'ADMIN' || roleName === 'SUPER ADMIN' || roleName === 'SUPER_ADMIN';
    });
    const agencyId = computed(() => String(route.params.id || ''));

    const agency = ref<any>(null);
    const loading = ref(true);
    const showModal = ref(false);

    // Contrats
    const contrats = ref<any[]>([]);
    const loadingContrats = ref(false);
    const contratsPage = ref(1);
    const contratsLimit = ref(10);
    const contratsTotalPages = ref(0);
    const contratsTotalElements = ref(0);
    const downloadingContractId = ref<number | null>(null);

    // Utilisateurs
    const utilisateurs = ref<any[]>([]);
    const loadingUtilisateurs = ref(false);

    // Statistiques globales
    const totalUsers = ref(0);
    const totalContracts = ref(0);
    const totalPrimes = ref(0);

    const tab = ref('contrats');

    // ── Computed ──────────────────────────────────────────────────────────────
    const statusClass = computed(() => agency.value?.isActive ? 'bg-success' : 'bg-secondary');

    // ── Helpers ───────────────────────────────────────────────────────────────
    function formatDate(d: string | null): string {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    function formatMontant(v: number): string {
      return (v || 0).toLocaleString('fr-FR');
    }
    const getInitials = (u: any) => {
      const first = u.firstname?.charAt(0)?.toUpperCase() || '';
      const last = u.lastname?.charAt(0)?.toUpperCase() || '';
      return (first + last) || '?';
    };
    function getAvatarColor(name: string): string {
      const colors = ['#33b04a','#17a2b8','#6f42c1','#fd7e14','#dc3545','#007bff','#20c997','#e83e8c'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
    }

    // ── API calls ─────────────────────────────────────────────────────────────
    async function loadAgency() {
      try {
        loading.value = true;
        const { data } = await ApiService.get(`/agencies/${agencyId.value}`);
        agency.value = data?.data?.agency || data?.data || data;
      } catch {
        agency.value = null;
      } finally {
        loading.value = false;
      }
    }

    async function loadContrats(page = 1) {
      try {
        loadingContrats.value = true;
        const { data } = await ApiService.get(`/agencies/${agencyId.value}/contracts?limit=${contratsLimit.value}&page=${page}`);
        const d = data?.data;
        if (d) {
          contrats.value = d.contracts || [];
          contratsTotalElements.value = d.total || contrats.value.length;
          contratsTotalPages.value = d.totalPages || Math.ceil(contratsTotalElements.value / contratsLimit.value);
        } else {
          contrats.value = [];
        }
        contratsPage.value = page;
        calculateStatsSummary();
      } catch {
        contrats.value = [];
      } finally {
        loadingContrats.value = false;
      }
    }

    async function loadUtilisateurs() {
      if (utilisateurs.value.length > 0) return;
      try {
        loadingUtilisateurs.value = true;
        const { data } = await ApiService.get(`/agencies/${agencyId.value}/users`);
        const d = data?.data;
        utilisateurs.value = d?.users || (Array.isArray(d) ? d : []);
        totalUsers.value = utilisateurs.value.length;
      } catch {
        utilisateurs.value = [];
      } finally {
        loadingUtilisateurs.value = false;
      }
    }

    // Calculer les statistiques globales
    async function calculateStatsSummary() {
      try {
        // Obtenir le résumé global (sans limitation de pagination) des contrats de l'agence
        const { data } = await ApiService.get(`/agencies/${agencyId.value}/contracts?limit=5000`);
        const list = data?.data?.contracts || [];
        totalContracts.value = list.length;
        totalPrimes.value = list.reduce((sum: number, c: any) => sum + (Number(c.puttc) || Number(c.primeTTC) || 0), 0);
      } catch (err) {
        console.error('Erreur calcul stats globales:', err);
      }
    }

    const handleContratsPagination = ({ page_, limit_ }: { page_: number; limit_: number }) => {
      contratsLimit.value = limit_;
      loadContrats(page_);
    };

    // ── Actions ───────────────────────────────────────────────────────────────
    function goEdit() {
      showModal.value = true;
    }

    async function handleAgencySaved() {
      showModal.value = false;
      await loadAgency();
      Swal.fire({ icon: 'success', title: 'Modifications enregistrées !', timer: 1500, showConfirmButton: false });
    }

    async function duplicateAgency() {
      const { isConfirmed } = await Swal.fire({
        title: 'Dupliquer l\'agence',
        text: `Voulez-vous créer une copie de l'agence "${agency.value.name}" ?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Oui, dupliquer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#33b04a',
      });

      if (!isConfirmed) return;

      try {
        const { data } = await ApiService.post(`/agencies/${agency.value.id}/duplicate`, {});
        Swal.fire({
          icon: 'success',
          title: 'Agence dupliquée',
          text: `L'agence "${data.data.name}" a été créée avec succès.`,
          timer: 3000,
          showConfirmButton: true
        });
        router.push({ name: 'ListeAgencePage' });
      } catch (err: any) {
        console.error('Erreur lors de la duplication:', err);
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de dupliquer l\'agence.' });
      }
    }

    async function deleteAgency() {
      const { isConfirmed } = await Swal.fire({
        title: 'Êtes-vous sûr?',
        text: `Voulez-vous vraiment supprimer définitivement l'agence "${agency.value.name}" ? Cette action supprimera tous les contrats et utilisateurs associés.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#dc3545',
      });

      if (!isConfirmed) return;

      try {
        await ApiService.delete(`/agencies/${agency.value.id}`);
        Swal.fire({ icon: 'success', title: 'Supprimée', text: 'L\'agence a été supprimée avec succès.', timer: 2000, showConfirmButton: false });
        router.push({ name: 'ListeAgencePage' });
      } catch (err) {
        console.error('Erreur suppression agence:', err);
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de supprimer cette agence.' });
      }
    }

    async function genererPDFContrat(contractId: number) {
      if (!contractId) return;
      try {
        downloadingContractId.value = contractId;
        const response = await ApiService.vueInstance.axios.get(`/contracts/${contractId}/pdf`, {
          responseType: 'blob',
          headers: { 
            'Accept': 'application/pdf',
            'Authorization': `Bearer ${JwtService.getToken()}`
          }
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contrat_${contractId}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire({
          toast: true,
          position: 'top-right',
          icon: 'success',
          title: 'PDF téléchargé',
          showConfirmButton: false,
          timer: 2000
        });
      } catch (err) {
        console.error('Erreur PDF:', err);
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de télécharger le PDF.' });
      } finally {
        downloadingContractId.value = null;
      }
    }

    function voirDetailsContrat(contractId: number) {
      router.push({ name: 'DetailsContratPage', params: { id: contractId.toString() } });
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    onMounted(async () => {
      await loadAgency();
      if (agency.value) {
        await Promise.all([
          loadContrats(1),
          loadUtilisateurs()
        ]);
      }
    });

    return {
      canManageAgencies,
      agency, loading, tab, showModal,
      contrats, loadingContrats,
      utilisateurs, loadingUtilisateurs,
      totalUsers, totalContracts, totalPrimes,
      statusClass,
      formatDate, formatMontant,
      loadUtilisateurs,
      goEdit, handleAgencySaved, duplicateAgency, deleteAgency,
      contratsPage, contratsLimit, contratsTotalPages, contratsTotalElements, downloadingContractId,
      handleContratsPagination, genererPDFContrat, voirDetailsContrat,
      getInitials, getAvatarColor
    };
  }
});
</script>

<style scoped>
/* Hero */
.hero-card { border-radius: 12px; }
.hero-bg {
  position: absolute; top: 0; left: 0; right: 0; height: 90px;
  background: linear-gradient(135deg, #231f20 0%, #33b04a 100%);
  opacity: 0.12;
  pointer-events: none;
}
.avatar-hero {
  width: 80px; height: 80px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 4px solid #fff; box-shadow: 0 4px 16px rgba(0,0,0,.15);
  flex-shrink: 0; overflow: hidden;
}
.contact-chip { display: flex; align-items: center; font-size: 13px; color: #444; }

/* KPI */
.kpi-chip {
  background: #fff; border: 1px solid #eee; border-radius: 10px;
  padding: 14px 16px; display: flex; align-items: center; gap: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,.05);
}
.kpi-icon {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
.kpi-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #888; line-height: 1; }
.kpi-value { font-size: 16px; font-weight: 700; color: #231f20; line-height: 1.3; }

/* Tabs */
.nav-tabs .nav-link { border: none; border-bottom: 3px solid transparent; border-radius: 0; color: #888; }
.nav-tabs .nav-link.active { color: #231f20; border-bottom-color: #33b04a; font-weight: 700; }

/* Info grid */
.info-section { background: #f8f9fa; border-radius: 10px; padding: 20px; }
.info-grid { display: flex; flex-direction: column; gap: 10px; }
.info-row { display: flex; justify-content: space-between; font-size: 13px; border-bottom: 1px dashed #dee2e6; padding-bottom: 8px; }
.info-label { color: #888; font-weight: 600; }

/* Avatar circles inside user table */
.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
  font-size: 12px;
  flex-shrink: 0;
}

/* Soft colors */
.bg-soft-warning { background: rgba(255,193,7,.15) !important; }
.bg-soft-success { background: rgba(51,176,74,.12) !important; }
.bg-soft-fnda    { background: rgba(35,31,32,.08) !important; }
</style>
