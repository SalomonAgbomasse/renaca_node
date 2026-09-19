<template>
  <div>
    <!-- Page Header & Breadcrumb -->
    <BreadCrumb PageTitle="Détails de la cotation" />

    <!-- Loading indicator -->
    <div v-if="loading" class="text-center p-5 card shadow-sm border-0 bg-white">
      <div class="spinner-border text-success" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <p class="mt-3 text-muted fw-semibold">Chargement des détails de la cotation...</p>
    </div>

      <!-- Error view -->
      <div v-else-if="errorMessage" class="text-center p-5 card shadow-sm border-0 bg-white">
        <i class="flaticon-cancel fs-1 text-danger mb-3"></i>
        <h5 class="text-danger font-weight-bold">Une erreur est survenue</h5>
        <p class="text-muted">{{ errorMessage }}</p>
        <div class="mt-3">
          <button class="btn btn-primary px-4 py-2 me-2" @click="loadCotationDetails">
            <i class="flaticon-refresh me-1"></i> Réessayer
          </button>
          <router-link to="/liste-cotations" class="btn btn-outline-secondary px-4 py-2">
            Retour à la liste
          </router-link>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else-if="cotationDetails" class="content-fade pb-4">
        
        <!-- EXECUTIVE HERO HEADER -->
        <div class="cotation-header-card mb-4">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <!-- Identity block -->
            <div class="d-flex align-items-center gap-3">
              <div class="client-avatar-badge">
                {{ clientInitials }}
              </div>
              <div>
                <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                  <span class="ref-tag"><i class="flaticon-file-1 me-1"></i> Référence N° {{ cotationDetails.reference }}</span>
                  <span :class="cotationStatusClass">
                    <i class="dot me-1"></i> {{ cotationStatusLabel }}
                  </span>
                </div>
                <h2 class="client-title mb-0">{{ clientFullName }}</h2>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="d-flex flex-wrap align-items-center gap-2">
              <router-link to="/liste-cotations" class="btn btn-action-secondary">
                <i class="flaticon-left-arrow-1 me-1"></i> Liste
              </router-link>
              <button 
                @click="genererPDFCotation" 
                class="btn btn-action-pdf"
                :disabled="isGeneratingPDF">
                <i v-if="!isGeneratingPDF" class="flaticon-file me-1"></i>
                <span v-else class="spinner-border spinner-border-sm me-1" role="status"></span>
                Devis PDF
              </button>
            </div>
          </div>

          <!-- Horizontal Metrics Bar -->
          <div class="cotation-metrics-strip">
            <div class="metric-cell">
              <span class="metric-label">Capital Garanti</span>
              <span class="metric-val">{{ formatMontant(cotationDetails.capital) }} <small class="unit">FCFA</small></span>
            </div>
            <div class="metric-divider"></div>
            <div class="metric-cell">
              <span class="metric-label">Durée du prêt</span>
              <span class="metric-val">{{ cotationDetails.duration }} <small class="unit">mois</small></span>
            </div>
            <div class="metric-divider"></div>
            <div class="metric-cell">
              <span class="metric-label">Nature Crédit</span>
              <span class="metric-val text-primary">{{ natureCreditLabel }}</span>
            </div>
            <div class="metric-divider"></div>
            <div class="metric-cell">
              <span class="metric-label">Type de client</span>
              <span class="metric-val text-dark">{{ typeClientLabel }}</span>
            </div>
            <div class="metric-divider"></div>
            <div class="metric-cell highlight-cell">
              <span class="metric-label text-success">Prime TTC</span>
              <span class="metric-val text-emerald">{{ formatMontant(cotationDetails.puttc) }} <small class="unit text-emerald">FCFA</small></span>
            </div>
          </div>
        </div>

        <!-- 3-COLUMN CONTENT GRID -->
        <div class="row">
          
          <!-- LEFT SIDE: Profile & Details Card (2/3 width on large screens) -->
          <div class="col-lg-8 col-md-12 mb-4">
            
            <!-- Client profile card -->
            <div class="glass-card mb-4">
              <div class="card-header-modern">
                <i class="flaticon-user"></i>
                <h5>Fiche Client & Cotation</h5>
              </div>
              <div class="card-body p-4">
                <div class="data-grid">
                  <!-- Name -->
                  <div class="data-item span-2">
                    <span class="label-modern">Nom & Prénoms</span>
                    <span class="value-modern name-highlight">{{ clientFullName }}</span>
                  </div>

                  <!-- Client Type -->
                  <div class="data-item">
                    <span class="label-modern">Type de client</span>
                    <span class="value-modern">
                      <span class="badge bg-light-info text-info px-2 py-1">
                        {{ typeClientLabel }}
                      </span>
                    </span>
                  </div>

                  <!-- Date of birth -->
                  <div class="data-item">
                    <span class="label-modern">Date de Naissance</span>
                    <span class="value-modern">{{ formatDate(cotationDetails.customer?.birthdate || cotationDetails.birthdate) }}</span>
                  </div>

                  <!-- Phone -->
                  <div class="data-item">
                    <span class="label-modern">Téléphone</span>
                    <span class="value-modern">
                      <span v-if="cotationDetails.customer?.phone || cotationDetails.phone" class="phone-link">
                        <i class="flaticon-phone-call me-1"></i> 
                        {{ cotationDetails.customer?.phone || cotationDetails.phone }}
                      </span>
                      <span v-else class="text-muted">-</span>
                    </span>
                  </div>

                  <!-- Email -->
                  <div class="data-item">
                    <span class="label-modern">Email</span>
                    <span class="value-modern" :class="(cotationDetails.customer?.email || cotationDetails.email) ? 'text-lowercase' : 'text-muted'">
                      {{ cotationDetails.customer?.email || cotationDetails.email || '-' }}
                    </span>
                  </div>

                  <!-- Gender -->
                  <div class="data-item">
                    <span class="label-modern">Genre</span>
                    <span class="value-modern">
                      <span v-if="cotationDetails.customer?.gender === 'M' || cotationDetails.gender === 'M'" class="badge bg-light-primary text-primary px-2 py-1">
                        Masculin
                      </span>
                      <span v-else-if="cotationDetails.customer?.gender === 'F' || cotationDetails.gender === 'F'" class="badge bg-light-danger text-danger px-2 py-1">
                        Féminin
                      </span>
                      <span v-else-if="cotationDetails.customer?.gender || cotationDetails.gender" class="badge bg-light-secondary text-secondary px-2 py-1">
                        {{ cotationDetails.customer?.gender || cotationDetails.gender }}
                      </span>
                      <span v-else class="text-muted">-</span>
                    </span>
                  </div>

                  <!-- Profession -->
                  <div class="data-item">
                    <span class="label-modern">Profession</span>
                    <span class="value-modern" :class="(cotationDetails.customer?.occupation || cotationDetails.occupation) ? '' : 'text-muted'">
                      {{ cotationDetails.customer?.occupation || cotationDetails.occupation || '-' }}
                    </span>
                  </div>

                  <!-- Address -->
                  <div class="data-item span-2">
                    <span class="label-modern">Adresse de Résidence</span>
                    <span class="value-modern" :class="(cotationDetails.customer?.address || cotationDetails.address) ? '' : 'text-muted'">
                      {{ cotationDetails.customer?.address || cotationDetails.address || '-' }}
                    </span>
                  </div>

                  <!-- Divider -->
                  <div class="span-full my-3 border-top-gray"></div>

                  <!-- Nature de crédit -->
                  <div class="data-item">
                    <span class="label-modern">Nature de crédit</span>
                    <span class="value-modern product-highlight">{{ natureCreditLabel }}</span>
                  </div>

                  <!-- Durée -->
                  <div class="data-item">
                    <span class="label-modern">Durée</span>
                    <span class="value-modern">{{ cotationDetails.duration }} mois</span>
                  </div>

                  <!-- Garantie complémentaire -->
                  <div class="data-item">
                    <span class="label-modern">Garantie Complémentaire</span>
                    <span class="value-modern">
                      <span :class="garantieComplLabel === 'OUI' ? 'badge bg-light-success text-success' : 'badge bg-light-secondary text-secondary'" class="px-2 py-1">
                        {{ garantieComplLabel }}
                      </span>
                    </span>
                  </div>

                  <!-- Périodicité -->
                  <div class="data-item">
                    <span class="label-modern">Périodicité</span>
                    <span class="value-modern">{{ periodiciteLabel }}</span>
                  </div>

                  <!-- Description -->
                  <div class="data-item span-full">
                    <span class="label-modern">Description / Notes</span>
                    <span class="value-modern">{{ cotationDetails.description || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- RIGHT SIDE: Financial Widget & Traçabilité (1/3 width on large screens) -->
          <div class="col-lg-4 col-md-12">
            
            <!-- Financial breakdown widget -->
            <div class="finance-widget mb-4">
              <div class="finance-hero-total">
                <span class="total-label">Prime Totale TTC</span>
                <span class="total-amount">{{ formatMontant(cotationDetails.puttc) }}</span>
                <span class="total-currency">FRANCS CFA</span>
              </div>
              <div class="finance-items">
                <div class="finance-item">
                  <span>Prime Décès</span>
                  <b>{{ formatMontant(cotationDetails.pd) }} FCFA</b>
                </div>
                <div class="finance-item">
                  <span>Prime Perte d'Emploi</span>
                  <b>{{ formatMontant(cotationDetails.pc) }} FCFA</b>
                </div>
                <div class="finance-item">
                  <span>Surprime</span>
                  <b>{{ formatMontant(cotationDetails.surp) }} FCFA</b>
                </div>
                <div class="finance-item">
                  <span>Frais Médicaux</span>
                  <b>{{ formatMontant(cotationDetails.fm) }} FCFA</b>
                </div>
                <div class="finance-item">
                  <span>Accessoires</span>
                  <b>{{ formatMontant(cotationDetails.acc) }} FCFA</b>
                </div>
              </div>
              <div class="finance-meta">
                <div class="finance-meta-row">
                  <span>Capital</span>
                  <b>{{ formatMontant(cotationDetails.capital) }} FCFA</b>
                </div>
                <div class="finance-meta-row">
                  <span>Durée</span>
                  <b>{{ cotationDetails.duration }} mois</b>
                </div>
                <div class="finance-meta-row">
                  <span>Status</span>
                  <b>{{ cotationDetails.isActive ? 'Actif' : 'Inactif' }}</b>
                </div>
              </div>
            </div>

            <!-- Audit Trail & Traçabilité -->
            <div class="trace-card mb-4">
              <div class="trace-header">
                <div class="trace-header-icon">
                  <i class="flaticon-user"></i>
                </div>
                <h6>Traçabilité</h6>
              </div>
              <div class="trace-body">
                <div class="trace-item">
                  <div class="trace-dot bg-success"></div>
                  <div class="trace-content">
                    <div class="trace-label">Créé par</div>
                    <div class="trace-value" v-if="cotationDetails.user">
                      {{ cotationDetails.user.lastname }} {{ cotationDetails.user.firstname }}
                    </div>
                    <div class="trace-value text-muted" v-else>Non défini</div>
                  </div>
                </div>
                <div class="trace-item" v-if="cotationDetails.user?.email">
                  <div class="trace-dot bg-primary"></div>
                  <div class="trace-content">
                    <div class="trace-label">Email Créateur</div>
                    <div class="trace-value">{{ cotationDetails.user.email }}</div>
                  </div>
                </div>
              </div>
              <div class="audit-footer flex-column align-items-start gap-1">
                <span>Créé le: <b>{{ formatDateTime(cotationDetails.createdAt) }}</b></span>
                <span class="text-secondary small">Dernière mise à jour: <b>{{ formatDateTime(cotationDetails.updatedAt) }}</b></span>
              </div>
            </div>

          </div>

        </div>

      </div> <!-- /.content-fade -->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import BreadCrumb from '../../components/Common/BreadCrumb.vue';
import ApiService from '../../services/ApiService';
import JwtService from '../../services/JwtService';
import { success, error, extractFilenameFromResponse } from '../../utils/utils';

export default defineComponent({
  name: 'DetailsCotationPage',
  components: {
    BreadCrumb
  },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const cotationIdentifier = computed(() => {
      const id = route.params.id;
      return id ? (id as string) : null;
    });

    const cotationDetails = ref<any>(null);
    const loading = ref(false);
    const errorMessage = ref<string | null>(null);
    const isGeneratingPDF = ref(false);

    // Computed properties
    const clientFullName = computed(() => {
      if (cotationDetails.value?.customer?.lastname || cotationDetails.value?.customer?.firstname) {
        const last = (cotationDetails.value.customer.lastname || '').toUpperCase();
        const first = cotationDetails.value.customer.firstname || '';
        return `${last} ${first}`.trim();
      }
      if (cotationDetails.value?.lastname || cotationDetails.value?.firstname) {
        const last = (cotationDetails.value.lastname || '').toUpperCase();
        const first = cotationDetails.value.firstname || '';
        return `${last} ${first}`.trim();
      }
      return 'Client non spécifié';
    });

    const clientInitials = computed(() => {
      const name = clientFullName.value;
      if (!name || name === 'Client non spécifié') return 'C';
      const parts = name.split(' ').filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      return name.charAt(0).toUpperCase();
    });

    const typeClientLabel = computed(() => {
      if (!cotationDetails.value) return 'Client Ordinaire';
      const tc = cotationDetails.value.typeCustomer?.libelle || cotationDetails.value.customer?.typeCustomer?.libelle;
      if (tc) return tc;
      const val = String(cotationDetails.value.typeAss || cotationDetails.value.idTypeCustomer || '').trim();
      if (val === '1') return 'Client Ordinaire';
      if (val === '2') return 'Personnel PADME';
      if (val && isNaN(Number(val))) return val;
      return 'Client Ordinaire';
    });

    const garantieComplLabel = computed(() => {
      if (!cotationDetails.value) return 'NON';
      const val = String(cotationDetails.value.garantieCompl || '').toUpperCase();
      if (val === 'OUI' || val === '1' || val === 'TRUE') return 'OUI';
      return 'NON';
    });

    const periodiciteLabel = computed(() => {
      if (!cotationDetails.value) return 'Mensuelle';
      if (cotationDetails.value.periodicite?.libelle) {
        return cotationDetails.value.periodicite.libelle;
      }
      const idP = String(cotationDetails.value.idPeriodicite || '');
      if (idP === '12') return 'Annuelle';
      if (idP === '6') return 'Semestrielle';
      if (idP === '3') return 'Trimestrielle';
      if (idP === '2') return 'Bimestrielle';
      return 'Mensuelle';
    });

    const natureCreditLabel = computed(() => {
      if (!cotationDetails.value) return 'AMORT';
      if (cotationDetails.value.natureCredit?.libelle) {
        return cotationDetails.value.natureCredit.libelle;
      }
      const idNature = String(cotationDetails.value.idNatureCredit || '');
      if (idNature === '1') return 'Crédit Amortissable (AMORT)';
      if (idNature === '2') return 'Campagne (CP)';
      if (idNature === '3') return 'OBA (Trésorerie)';
      return 'Hors Convention';
    });

    const cotationStatusLabel = computed(() => {
      const status = cotationDetails.value?.status;
      if (status === 'ACCEPTED') return 'ACCEPTÉ';
      if (status === 'REJECTED') return 'REJETÉ';
      return 'EN ATTENTE';
    });

    const cotationStatusClass = computed(() => {
      const status = cotationDetails.value?.status;
      if (status === 'ACCEPTED') return 'status-pill active';
      if (status === 'REJECTED') return 'status-pill rejected';
      return 'status-pill pending';
    });

    // Actions
    async function loadCotationDetails() {
      if (!cotationIdentifier.value) {
        errorMessage.value = 'Identifiant de cotation invalide ou manquant';
        return;
      }

      loading.value = true;
      errorMessage.value = null;

      try {
        const response = await ApiService.get(`/cotations/${cotationIdentifier.value}`);
        let cotation = null;
        if (response.data?.data?.cotation) {
          cotation = response.data.data.cotation;
        } else if (response.data?.cotation) {
          cotation = response.data.cotation;
        } else if (response.data && response.data.id) {
          cotation = response.data;
        }

        if (cotation) {
          cotationDetails.value = cotation;
        } else {
          throw new Error('Cotation non trouvée dans la réponse du serveur');
        }
      } catch (err: any) {
        console.error('Erreur chargement détails cotation:', err);
        errorMessage.value = err?.response?.data?.message || err?.message || 'Erreur technique lors du chargement';
      } finally {
        loading.value = false;
      }
    }

    function convertirEnContrat() {
      if (!cotationDetails.value) return;
      const identifier = cotationDetails.value.uuid || cotationDetails.value.id;
      router.push({
        path: '/ajouter-cotation',
        query: {
          cotationId: identifier.toString(),
          action: 'convert'
        }
      });
    }

    function modifierCotation() {
      if (!cotationDetails.value) return;
      const identifier = cotationDetails.value.uuid || cotationDetails.value.id;
      router.push({
        path: '/ajouter-cotation',
        query: {
          cotationId: identifier.toString(),
          action: 'edit'
        }
      });
    }

    async function genererPDFCotation() {
      if (!cotationDetails.value) return;
      const identifier = cotationDetails.value.uuid || cotationDetails.value.id;
      isGeneratingPDF.value = true;
      try {
        const response = await ApiService.vueInstance.axios.get(`/contracts/cotation/${identifier}/pdf`, {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf',
            'Authorization': `Bearer ${JwtService.getToken()}`
          }
        });

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const filename = extractFilenameFromResponse(response, `devis_${cotationDetails.value.reference || cotationDetails.value.id}.pdf`);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);

        success('Devis PDF téléchargé avec succès !');
      } catch (err: any) {
        console.error('Erreur PDF devis cotation:', err);
        error('Impossible de télécharger le devis PDF.');
      } finally {
        isGeneratingPDF.value = false;
      }
    }

    // Formatter helpers
    function formatMontant(val: number | null | undefined): string {
      if (val == null) return '0';
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }

    function formatDate(dateStr: string | null | undefined): string {
      if (!dateStr) return '-';
      try {
        if (dateStr.includes('/')) return dateStr;
        return new Date(dateStr).toLocaleDateString('fr-FR');
      } catch {
        return dateStr;
      }
    }

    function formatDateTime(dateStr: string | null | undefined): string {
      if (!dateStr) return '-';
      try {
        const date = new Date(dateStr);
        return date.toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return dateStr;
      }
    }

    onMounted(() => {
      loadCotationDetails();
    });

    return {
      cotationDetails,
      loading,
      errorMessage,
      clientFullName,
      clientInitials,
      typeClientLabel,
      garantieComplLabel,
      periodiciteLabel,
      natureCreditLabel,
      cotationStatusLabel,
      cotationStatusClass,
      loadCotationDetails,
      convertirEnContrat,
      modifierCotation,
      genererPDFCotation,
      isGeneratingPDF,
      formatMontant,
      formatDate,
      formatDateTime
    };
  }
});
</script>

<style scoped>
.content-fade {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== EXECUTIVE HERO HEADER ===== */
.cotation-header-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.client-avatar-badge {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  font-weight: 800;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  flex-shrink: 0;
}

.ref-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 3px 10px;
  border-radius: 6px;
  letter-spacing: 0.3px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.3px;
}

.status-pill.active {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.status-pill.active .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.status-pill.pending {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}

.status-pill.pending .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
}

.client-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
}

/* Action buttons */
.btn-action-primary {
  background: #10b981;
  color: #ffffff !important;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
  cursor: pointer;
}

.btn-action-primary:hover {
  background: #059669;
  transform: translateY(-1px);
}

.btn-action-pdf {
  background: #0f172a;
  color: #ffffff !important;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
  cursor: pointer;
}

.btn-action-pdf:hover {
  background: #1e293b;
  transform: translateY(-1px);
}

.btn-action-secondary {
  background: #f8fafc;
  color: #334155 !important;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.82rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;
}

.btn-action-secondary:hover {
  background: #f1f5f9;
  color: #0f172a !important;
}

/* Metrics Strip */
.cotation-metrics-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  padding: 16px 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.metric-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
}

.metric-val {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.metric-val .unit {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.text-emerald {
  color: #059669 !important;
}

.highlight-cell {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 8px 16px;
  border-radius: 8px;
}

.metric-divider {
  width: 1px;
  height: 36px;
  background: #e2e8f0;
}

/* Hero buttons */
.hero-btn-primary {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff !important;
  border: none;
  padding: 10px 20px;
  border-radius: 0px;
  font-weight: 700;
  font-size: 0.8rem;
  box-shadow: none;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  text-decoration: none;
}

.hero-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: none;
}

.hero-btn-outline {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0 !important;
  padding: 10px 20px;
  border-radius: 0px;
  font-weight: 700;
  font-size: 0.8rem;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  cursor: pointer;
}

.hero-btn-outline:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #fff !important;
  transform: translateY(-2px);
}

.hero-btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff !important;
  border: none;
  padding: 10px 20px;
  border-radius: 0px;
  font-weight: 700;
  font-size: 0.8rem;
  box-shadow: none;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  text-decoration: none;
}

.hero-btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: none;
}

/* ===== CARDS & DETAILS LAYOUT ===== */
.glass-card {
  background: #fff;
  border-radius: 0px;
  box-shadow: none;
  border: none;
  transition: all 0.25s ease;
  overflow: hidden;
}

.glass-card:hover {
  transform: none;
  box-shadow: none;
}

.card-header-modern {
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
}

.card-header-modern i {
  width: 32px;
  height: 32px;
  background: #ecfdf5;
  color: #10b981;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 1rem;
}

.card-header-modern h5 {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Data grid within Fiche */
.data-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px 24px;
}

.data-item {
  display: flex;
  flex-direction: column;
}

.data-grid .span-2 {
  grid-column: span 2;
}

.data-grid .span-full {
  grid-column: 1 / -1;
}

.label-modern {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.value-modern {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.name-highlight {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.product-highlight {
  color: #059669;
  font-weight: 700;
}

.phone-link {
  color: #2563eb;
}

.border-top-gray {
  border-top: 1px solid #f1f5f9;
}

/* ===== FINANCE WIDGET ===== */
.finance-widget {
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
  color: white;
  border-radius: 0px;
  overflow: hidden;
  box-shadow: none;
}

.finance-hero-total {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
}

.total-label {
  display: block;
  font-size: 0.65rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
  margin-bottom: 6px;
}

.total-amount {
  font-size: 2rem;
  font-weight: 800;
  color: #10b981;
  display: block;
  letter-spacing: -0.5px;
}

.total-currency {
  font-size: 0.65rem;
  color: #475569;
  font-weight: 800;
  letter-spacing: 1px;
}

.finance-items {
  padding: 16px 24px;
}

.finance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 0.82rem;
}

.finance-item:last-child {
  border-bottom: none;
}

.finance-item span {
  color: #94a3b8;
}

.finance-item b {
  color: #e2e8f0;
  font-weight: 600;
}

.finance-meta {
  padding: 14px 24px;
  background: rgba(0, 0, 0, 0.15);
}

.finance-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 6px;
}

.finance-meta-row:last-child {
  margin-bottom: 0;
}

.finance-meta-row b {
  color: #94a3b8;
}

/* ===== TRACE CARD ===== */
.trace-card {
  background: white;
  border-radius: 0px;
  box-shadow: none;
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.trace-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 12px;
}

.trace-header-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #ecfdf5;
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.trace-header h6 {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #0f172a;
}

.trace-body {
  padding: 14px 20px;
}

.trace-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px solid #f8fafc;
}

.trace-item:last-child {
  border-bottom: none;
}

.trace-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.trace-content {
  display: flex;
  flex-direction: column;
}

.trace-value {
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
}

.audit-footer {
  background: #f8fafc;
  padding: 12px 20px;
  border-top: 1px solid #edf2f7;
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #94a3b8;
}

.audit-footer b {
  color: #64748b;
}

/* Responsive adjustments */
@media (max-width: 991px) {
  .contract-hero {
    padding: 20px;
  }
  
  .hero-divider-line {
    margin: 16px 0;
  }

  .hero-top-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .hero-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .hero-metrics {
    gap: 16px 0;
  }
  
  .hero-metric-item {
    min-width: 50%;
  }
  
  .hero-vdivider {
    display: none;
  }
  
  .data-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 575px) {
  .contract-hero {
    padding: 16px;
  }
  
  .hero-divider-line {
    margin: 12px 0;
  }
  
  .hero-identity {
    gap: 12px;
  }
  
  .avatar-initials {
    width: 50px;
    height: 50px;
    font-size: 1.1rem;
  }
  
  .hero-police-number {
    font-size: 1.25rem;
  }
  
  .hero-police-label {
    font-size: 0.65rem;
  }
  
  .hero-badge-status {
    padding: 2px 10px;
    font-size: 0.6rem;
  }
  
  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }
  
  .hero-actions .hero-btn-primary,
  .hero-actions .hero-btn-outline,
  .hero-actions .hero-btn-danger {
    flex: 1 1 calc(50% - 4px);
    justify-content: center;
    font-size: 0.72rem;
    padding: 8px 10px;
  }
  
  .data-grid {
    grid-template-columns: 1fr;
  }
  
  .data-grid .span-2 {
    grid-column: span 1;
  }
}
</style>
