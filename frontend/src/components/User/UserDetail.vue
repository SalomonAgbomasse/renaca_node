<template>
  <div class="user-detail-container">
    <div v-if="loading" class="d-flex align-items-center justify-content-center" style="min-height: 400px;">
      <div class="text-center">
        <div class="spinner-border text-fnda" style="width:3rem;height:3rem;" role="status"></div>
        <p class="mt-3 text-muted">Chargement du profil…</p>
      </div>
    </div>

    <div v-else-if="!user" class="text-center py-5">
      <i class="ph-bold ph-user-x fs-1 text-muted"></i>
      <p class="text-muted mt-3">Utilisateur introuvable.</p>
      <router-link :to="{ name: 'ListeUserPage' }" class="btn btn-fnda mt-2">Retour à la liste</router-link>
    </div>

    <template v-else>
      <!-- ── Hero header ── -->
      <div class="hero-card card border-0 shadow-sm mb-4 overflow-hidden bg-white">
        <div class="hero-bg"></div>
        <div class="card-body position-relative pt-4 pb-3 px-4">
          <div class="d-flex flex-wrap align-items-end gap-4">
            <!-- Avatar -->
            <div class="avatar-hero" :style="{ background: avatarColor }">
              <img v-if="user.avatar" :src="user.avatar" class="w-100 h-100 rounded-circle object-fit-cover" :alt="fullName">
              <span v-else class="initials-text">{{ initials }}</span>
            </div>

            <!-- Info principale -->
            <div class="flex-grow-1">
              <h3 class="fw-bold mb-1 text-dark">{{ fullName }}</h3>
              <div class="d-flex flex-wrap gap-3 align-items-center">
                <span class="badge rounded-pill px-3 py-2 fw-semibold fs-13" :style="roleBadgeStyle">
                  <i class="ph-bold ph-shield me-1"></i>{{ user.role?.libelle || 'Rôle #' + user.idRole }}
                </span>
                <span :class="statusClass" class="badge rounded-pill px-3 py-2 fw-semibold fs-13">
                  <i :class="statusIcon" class="me-1"></i>{{ statusText }}
                </span>
                <span v-if="user.agency" class="text-muted fs-13">
                  <i class="ph-bold ph-map-pin me-1"></i>{{ user.agency.name || user.agency.libelle }}
                </span>
              </div>
              <p class="text-muted mb-0 mt-1 fs-13">
                <i class="ph-bold ph-briefcase me-1"></i>{{ user.fonction || 'Fonction non définie' }}
              </p>
            </div>

            <!-- Action buttons -->
            <div v-if="canManageUsers" class="d-flex flex-wrap gap-2 ms-auto">
              <button @click="goEdit" class="btn btn-fnda btn-sm d-flex align-items-center gap-1 px-3">
                <i class="ph-bold ph-pencil-simple"></i> Modifier
              </button>
              <button @click="resetPassword" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 px-3">
                <i class="ph-bold ph-lock-key"></i> Réinitialiser MDP
              </button>
              <button @click="toggleSuspension" :class="user.status === 'SUSPENDED' ? 'btn-success' : 'btn-warning'"
                class="btn btn-sm d-flex align-items-center gap-1 px-3">
                <i :class="user.status === 'SUSPENDED' ? 'ph-bold ph-play' : 'ph-bold ph-pause'"></i>
                {{ user.status === 'SUSPENDED' ? 'Réactiver' : 'Suspendre' }}
              </button>
              <button @click="deleteUser" class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 px-3">
                <i class="ph-bold ph-trash"></i> Supprimer
              </button>
            </div>
          </div>

          <!-- Contacts row -->
          <div class="d-flex flex-wrap gap-4 mt-3 pt-3 border-top">
            <div class="contact-chip">
              <i class="ph-bold ph-phone text-success me-1"></i>
              <span>{{ user.phone || '—' }}</span>
            </div>
            <div class="contact-chip">
              <i class="ph-bold ph-envelope text-info me-1"></i>
              <span>{{ user.email || '—' }}</span>
            </div>
            <div v-if="user.dateNaissance" class="contact-chip">
              <i class="ph-bold ph-cake text-warning me-1"></i>
              <span>{{ formatDate(user.dateNaissance) }} ({{ age }} ans)</span>
            </div>
            <div class="contact-chip">
              <i :class="user.gender === 'M' ? 'ph-bold ph-gender-male text-primary' : 'ph-bold ph-gender-female text-danger'" class="me-1"></i>
              <span>{{ user.gender === 'M' ? 'Masculin' : 'Féminin' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── KPI row ── -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="kpi-chip">
            <div class="kpi-icon bg-soft-success"><i class="ph-bold ph-file-text text-success"></i></div>
            <div>
              <div class="kpi-label">Contrats</div>
              <div class="kpi-value">{{ contractsSummary.total }}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-chip">
            <div class="kpi-icon bg-soft-fnda"><i class="ph-bold ph-bank text-fnda"></i></div>
            <div>
              <div class="kpi-label">Capital total</div>
              <div class="kpi-value text-nowrap">{{ formatMontant(contractsSummary.capital) }} F</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-chip">
            <div class="kpi-icon" style="background:rgba(35,31,32,.1)"><i class="ph-bold ph-coins text-dark"></i></div>
            <div>
              <div class="kpi-label">Primes TTC</div>
              <div class="kpi-value text-nowrap">{{ formatMontant(contractsSummary.primes) }} F</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-chip">
            <div class="kpi-icon bg-soft-warning"><i class="ph-bold ph-key text-warning"></i></div>
            <div>
              <div class="kpi-label">Permissions</div>
              <div class="kpi-value">{{ userPermissions.length }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tabs ── -->
      <div class="card border-0 shadow-sm bg-white mb-25">
        <div class="card-header bg-white border-bottom px-4 pt-3 pb-0">
          <ul class="nav nav-tabs border-0 gap-1" id="userDetailTabs">
            <li class="nav-item">
              <button class="nav-link fw-semibold fs-13 px-3 py-2" :class="{ active: tab === 'contrats' }" @click="tab = 'contrats'">
                <i class="ph-bold ph-file-text me-1"></i> Contrats
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link fw-semibold fs-13 px-3 py-2" :class="{ active: tab === 'permissions' }" @click="tab = 'permissions'; loadPermissions()">
                <i class="ph-bold ph-key me-1"></i> Permissions
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
              <span class="ms-2 text-muted">Chargement des contrats…</span>
            </div>
            <div v-else-if="contrats.length === 0" class="text-center text-muted py-5">
              <i class="ph-bold ph-file-dashed fs-1 d-block mb-2"></i>
              Aucun contrat associé à cet utilisateur.
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

          <!-- TAB: Permissions -->
          <div v-show="tab === 'permissions'">
            <div v-if="loadingPermissions" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-fnda"></div>
              <span class="ms-2 text-muted">Chargement des permissions…</span>
            </div>
            <div v-else-if="userPermissions.length === 0" class="text-center text-muted py-5">
              <i class="ph-bold ph-key fs-1 d-block mb-2"></i>
              Aucune permission spécifique assignée.
            </div>
            <div v-else>
              <div class="row g-2">
                <div v-for="perm in userPermissions" :key="perm.id" class="col-md-4 col-sm-6">
                  <div class="permission-chip d-flex align-items-center gap-2 p-2 border rounded-2 bg-light">
                    <i class="ph-bold ph-check-circle text-success"></i>
                    <div>
                      <div class="fw-semibold fs-13">{{ perm.name || perm.permission?.name }}</div>
                      <div class="text-muted fs-xs">{{ perm.module || perm.permission?.module }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB: Informations -->
          <div v-show="tab === 'infos'">
            <div class="row g-4">
              <div class="col-md-6">
                <div class="info-section">
                  <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <i class="ph-bold ph-user text-fnda"></i> Informations personnelles
                  </h6>
                  <div class="info-grid">
                    <div class="info-row"><span class="info-label">Prénom</span><span>{{ user.firstname }}</span></div>
                    <div class="info-row"><span class="info-label">Nom</span><span>{{ user.lastname }}</span></div>
                    <div class="info-row"><span class="info-label">Genre</span><span>{{ user.gender === 'M' ? 'Masculin' : 'Féminin' }}</span></div>
                    <div class="info-row"><span class="info-label">Date naissance</span><span>{{ formatDate(user.dateNaissance) || '—' }}</span></div>
                    <div class="info-row"><span class="info-label">Âge</span><span>{{ age > 0 ? age + ' ans' : '—' }}</span></div>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="info-section">
                  <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <i class="ph-bold ph-buildings text-fnda"></i> Informations professionnelles
                  </h6>
                  <div class="info-grid">
                    <div class="info-row"><span class="info-label">Fonction</span><span>{{ user.fonction || '—' }}</span></div>
                    <div class="info-row"><span class="info-label">Rôle</span><span>{{ user.role?.libelle || '—' }}</span></div>
                    <div class="info-row"><span class="info-label">Agence</span><span>{{ user.agency?.name || user.agency?.libelle || '—' }}</span></div>
                    <div class="info-row"><span class="info-label">Email</span><span class="text-info">{{ user.email }}</span></div>
                    <div class="info-row"><span class="info-label">Téléphone</span><span class="text-success">{{ user.phone || '—' }}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ApiService from '../../services/ApiService';
import JwtService from '../../services/JwtService';
import PaginationComponent from '../Utilities/Pagination.vue';
import Swal from 'sweetalert2';
import { useAuthStore } from '../../services/auth';

export default defineComponent({
  name: 'UserDetail',
  components: {
    PaginationComponent
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    const canManageUsers = computed(() => {
      const roleName = (authStore.user?.role?.libelle || authStore.user?.role || '').toString().toUpperCase();
      return authStore.user?.idRole === 1 || authStore.user?.idRole === 5 || roleName === 'ADMIN' || roleName === 'SUPER ADMIN' || roleName === 'SUPER_ADMIN';
    });
    const userId = computed(() => Number(route.params.id));

    const user = ref<any>(null);
    const loading = ref(true);
    const contrats = ref<any[]>([]);
    const loadingContrats = ref(false);
    const userPermissions = ref<any[]>([]);
    const loadingPermissions = ref(false);
    const tab = ref('contrats');

    // Pagination contrats
    const contratsPage = ref(1);
    const contratsLimit = ref(10);
    const contratsTotalPages = ref(0);
    const contratsTotalElements = ref(0);
    const downloadingContractId = ref<number | null>(null);

    // ── Computed ──────────────────────────────────────────────────────────────
    const fullName = computed(() => `${user.value?.lastname || ''} ${user.value?.firstname || ''}`.trim());

    const initials = computed(() => {
      const f = user.value?.firstname?.charAt(0)?.toUpperCase() || '';
      const l = user.value?.lastname?.charAt(0)?.toUpperCase() || '';
      return f + l || '??';
    });

    const COLORS = ['#33b04a','#17a2b8','#6f42c1','#fd7e14','#dc3545','#007bff','#20c997','#e83e8c'];
    const avatarColor = computed(() => {
      const name = (user.value?.lastname || '') + (user.value?.firstname || '');
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return COLORS[Math.abs(hash) % COLORS.length];
    });

    const statusClass = computed(() => {
      if (user.value?.status === 'ACTIVE') return 'bg-success';
      if (user.value?.status === 'SUSPENDED') return 'bg-warning text-dark';
      return 'bg-secondary';
    });
    const statusIcon = computed(() => user.value?.status === 'ACTIVE' ? 'ph-bold ph-check-circle' : 'ph-bold ph-pause-circle');
    const statusText = computed(() => user.value?.status === 'ACTIVE' ? 'Actif' : user.value?.status === 'SUSPENDED' ? 'Suspendu' : user.value?.status || '—');

    const roleBadgeStyle = computed(() => ({ background: '#231f20', color: '#ede947' }));

    const age = computed(() => {
      if (!user.value?.dateNaissance) return 0;
      const d = new Date(user.value.dateNaissance);
      const now = new Date();
      let a = now.getFullYear() - d.getFullYear();
      if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
      return a;
    });

    const contractsSummary = computed(() => ({
      total: contratsTotalElements.value,
      capital: contrats.value.reduce((s, c) => s + (Number(c.capital) || 0), 0),
      primes: contrats.value.reduce((s, c) => s + (Number(c.puttc) || 0), 0),
    }));

    // ── Helpers ───────────────────────────────────────────────────────────────
    function formatDate(d: string | null): string {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    function formatMontant(v: number): string {
      return (v || 0).toLocaleString('fr-FR');
    }

    // ── API calls ─────────────────────────────────────────────────────────────
    async function loadUser() {
      try {
        loading.value = true;
        const { data } = await ApiService.get(`/users/${userId.value}?includeRole=true&includeAgency=true`);
        user.value = data?.data?.user || data?.data || data?.user || data;
      } catch {
        user.value = null;
      } finally {
        loading.value = false;
      }
    }

    async function loadContrats(page = 1) {
      try {
        loadingContrats.value = true;
        const { data } = await ApiService.get(`/contracts/user/${userId.value}?includeCustomer=true&includeAgency=true&includeProduct=true&limit=${contratsLimit.value}&page=${page}`);
        const d = data?.data;
        if (d) {
          contrats.value = d.contracts || [];
          contratsTotalElements.value = d.total || contrats.value.length;
          contratsTotalPages.value = d.totalPages || Math.ceil(contratsTotalElements.value / contratsLimit.value);
        } else {
          contrats.value = [];
        }
        contratsPage.value = page;
      } catch {
        contrats.value = [];
      } finally {
        loadingContrats.value = false;
      }
    }

    async function loadPermissions() {
      if (userPermissions.value.length > 0) return;
      try {
        loadingPermissions.value = true;
        const { data } = await ApiService.get(`/users/${userId.value}/permissions`);
        const d = data?.data;
        userPermissions.value = d?.permissions || (Array.isArray(d) ? d : []);
      } catch {
        userPermissions.value = [];
      } finally {
        loadingPermissions.value = false;
      }
    }

    const handleContratsPagination = ({ page_, limit_ }: { page_: number; limit_: number }) => {
      contratsLimit.value = limit_;
      loadContrats(page_);
    };

    // ── Actions ───────────────────────────────────────────────────────────────
    function goEdit() {
      router.push({ name: 'EditUserPage', params: { id: userId.value } });
    }

    async function resetPassword() {
      const { value: customPassword, isConfirmed } = await Swal.fire({
        title: 'Réinitialiser le mot de passe',
        text: `Veuillez renseigner le nouveau mot de passe pour ${fullName.value} :`,
        input: 'text',
        inputPlaceholder: 'Entrez le nouveau mot de passe',
        showCancelButton: true,
        confirmButtonText: 'Enregistrer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#33b04a',
        inputValidator: (value) => {
          if (!value) {
            return 'Vous devez saisir un mot de passe !';
          }
          if (value.length < 6) {
            return 'Le mot de passe doit contenir au moins 6 caractères.';
          }
        }
      });

      if (!isConfirmed || !customPassword) return;

      try {
        await ApiService.put(`/user-management/reset-password/${userId.value}`, {
          newPassword: customPassword
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Mot de passe modifié !',
          text: `Le mot de passe de ${fullName.value} a été mis à jour avec succès.`,
          timer: 3000,
          showConfirmButton: true
        });
      } catch (err: any) {
        console.error('Erreur de réinitialisation:', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.response?.data?.message || 'Impossible de réinitialiser le mot de passe.'
        });
      }
    }

    async function toggleSuspension() {
      const isSuspended = user.value?.status === 'SUSPENDED';
      const action = isSuspended ? 'réactiver' : 'suspendre';
      const { isConfirmed } = await Swal.fire({
        title: `${isSuspended ? 'Réactiver' : 'Suspendre'} ${fullName.value} ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: `Oui, ${action}`,
        cancelButtonText: 'Annuler',
        confirmButtonColor: isSuspended ? '#33b04a' : '#ffc107',
      });
      if (!isConfirmed) return;
      try {
        await ApiService.put(`/users/${userId.value}/toggle-suspension`, {});
        await loadUser();
        Swal.fire({ icon: 'success', title: 'Fait !', timer: 1500, showConfirmButton: false });
      } catch {
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Action impossible.' });
      }
    }

    async function deleteUser() {
      const { isConfirmed } = await Swal.fire({
        title: `Supprimer ${fullName.value} ?`,
        text: 'Cette action est irréversible.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#dc3545',
      });
      if (!isConfirmed) return;
      try {
        await ApiService.delete(`/users/${userId.value}`);
        Swal.fire({ icon: 'success', title: 'Supprimé', timer: 1500, showConfirmButton: false });
        router.push({ name: 'ListeUserPage' });
      } catch {
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de supprimer cet utilisateur.' });
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
          title: 'PDF téléchargé avec succès',
          showConfirmButton: false,
          timer: 3000
        });
      } catch (err) {
        console.error('Erreur de téléchargement PDF:', err);
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de télécharger le PDF.' });
      } finally {
        downloadingContractId.value = null;
      }
    }

    function voirDetailsContrat(contractId: number) {
      if (!contractId) return;
      router.push({ name: 'DetailsContratPage', params: { id: contractId.toString() } });
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    onMounted(async () => {
      await loadUser();
      loadContrats(1);
    });

    return {
      canManageUsers,
      user, loading, tab,
      contrats, loadingContrats,
      userPermissions, loadingPermissions,
      fullName, initials, avatarColor,
      statusClass, statusIcon, statusText,
      roleBadgeStyle, age, contractsSummary,
      formatDate, formatMontant,
      loadPermissions,
      goEdit, resetPassword, toggleSuspension, deleteUser, genererPDFContrat, voirDetailsContrat,
      contratsPage, contratsLimit, contratsTotalPages, contratsTotalElements, downloadingContractId,
      handleContratsPagination
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
.initials-text { color: #fff; font-weight: 800; font-size: 26px; line-height: 1; }
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

/* Permission chips */
.permission-chip { background: #fff; border-radius: 8px; }

/* Soft colors */
.bg-soft-warning { background: rgba(255,193,7,.15) !important; }
.bg-soft-success { background: rgba(51,176,74,.12) !important; }
.bg-soft-fnda    { background: rgba(35,31,32,.08) !important; }
</style>
