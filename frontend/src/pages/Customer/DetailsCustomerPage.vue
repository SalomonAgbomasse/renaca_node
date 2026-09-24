<template>
  <div>
    <!-- Page Header & Breadcrumb -->
    <BreadCrumb PageTitle="Détails du client" />

    <!-- Loading Indicator -->
    <div v-if="loading" class="text-center p-5 card shadow-sm border-0 bg-white">
      <div class="spinner-border text-success" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <p class="mt-3 text-muted fw-semibold">Chargement des informations du client...</p>
    </div>

    <!-- Error View -->
    <div v-else-if="errorMessage" class="text-center p-5 card shadow-sm border-0 bg-white">
      <i class="flaticon-cancel fs-1 text-danger mb-3"></i>
      <h5 class="text-danger font-weight-bold">Une erreur est survenue</h5>
      <p class="text-muted">{{ errorMessage }}</p>
      <div class="mt-3">
        <button class="btn btn-primary px-4 py-2 me-2" @click="loadCustomerDetails">
          <i class="flaticon-refresh me-1"></i> Réessayer
        </button>
        <router-link to="/liste-clients" class="btn btn-outline-secondary px-4 py-2">
          Retour à la liste
        </router-link>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="customer" class="content-fade pb-4">
      
      <!-- HERO HEADER CARD (Compact & Sleek) -->
      <div class="card shadow-sm border-0 mb-3 rounded-3">
        <div class="card-body p-3 bg-white">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
            
            <!-- Identity Block -->
            <div class="d-flex align-items-center gap-3">
              <div class="client-avatar-badge rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-5" style="width: 46px; height: 46px; flex-shrink: 0;">
                {{ clientInitials }}
              </div>
              <div>
                <div class="d-flex align-items-center flex-wrap gap-1 mb-1">
                  <span class="badge bg-light text-dark border me-1 py-1 px-2 fs-8">
                    <i class="flaticon-user me-1"></i> N° {{ customer.numCustomer || customer.code || 'N/A' }}
                  </span>
                  <span class="badge bg-info text-white me-1 py-1 px-2 fs-8">
                    {{ typeClientLabel }}
                  </span>
                  <span :class="customer.isActive ? 'badge bg-success py-1 px-2 fs-8' : 'badge bg-danger py-1 px-2 fs-8'">
                    {{ customer.isActive ? 'ACTIF' : 'INACTIF' }}
                  </span>
                </div>
                <h4 class="fw-bold mb-0 text-dark fs-5">{{ clientFullName }}</h4>
              </div>
            </div>

            <!-- Action Buttons (Compact Single Row) -->
            <div class="d-flex align-items-center gap-2">
              <router-link to="/liste-clients" class="btn btn-sm btn-outline-secondary px-3">
                <i class="flaticon-left-arrow-1 me-1"></i> Liste
              </router-link>
              <button 
                type="button"
                class="btn btn-sm btn-primary px-3" 
                @click="faireCotation">
                <i class="flaticon-settings me-1"></i> Cotation
              </button>
              <button 
                type="button"
                class="btn btn-sm btn-success px-3" 
                @click="creerContrat">
                <i class="flaticon-plus me-1"></i> Contrat
              </button>
            </div>
          </div>

          <!-- Horizontal Metrics Bar (Compact Grid) -->
          <div class="row g-2 p-2 px-3 bg-light rounded-3 border">
            <div class="col-6 col-md-3 border-end">
              <span class="text-muted fs-8 text-uppercase fw-semibold d-block">Contrats Actifs / Total</span>
              <span class="fw-bold fs-6 text-dark">{{ stats.activeContracts }} <small class="text-muted fs-7">/ {{ stats.totalContracts }}</small></span>
            </div>
            <div class="col-6 col-md-3 border-end">
              <span class="text-muted fs-8 text-uppercase fw-semibold d-block">Capital Garanti Cumulé</span>
              <span class="fw-bold fs-6 text-success">{{ formatMontant(stats.totalCapital) }}</span>
            </div>
            <div class="col-6 col-md-3 border-end">
              <span class="text-muted fs-8 text-uppercase fw-semibold d-block">Primes Totales (PUTTC)</span>
              <span class="fw-bold fs-6 text-primary">{{ formatMontant(stats.totalPuttc) }}</span>
            </div>
            <div class="col-6 col-md-3">
              <span class="text-muted fs-8 text-uppercase fw-semibold d-block">Cotations Enregistrées</span>
              <span class="fw-bold fs-6 text-warning">{{ cotations.length }}</span>
            </div>
          </div>

        </div>
      </div>

      <!-- NAVIGATION TABS -->
      <ul class="nav nav-pills mb-4 gap-2 bg-white p-2 rounded-3 shadow-sm border" id="customerTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button 
            class="nav-item-btn nav-link active fw-semibold" 
            id="profile-tab" 
            data-bs-toggle="tab" 
            data-bs-target="#profile-tab-pane" 
            type="button" 
            role="tab">
            <i class="flaticon-user me-1"></i> Informations Client
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button 
            class="nav-item-btn nav-link fw-semibold" 
            id="contracts-tab" 
            data-bs-toggle="tab" 
            data-bs-target="#contracts-tab-pane" 
            type="button" 
            role="tab">
            <i class="flaticon-file-1 me-1"></i> Contrats ({{ contracts.length }})
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button 
            class="nav-item-btn nav-link fw-semibold" 
            id="cotations-tab" 
            data-bs-toggle="tab" 
            data-bs-target="#cotations-tab-pane" 
            type="button" 
            role="tab">
            <i class="flaticon-settings me-1"></i> Cotations ({{ cotations.length }})
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button 
            class="nav-item-btn nav-link fw-semibold" 
            id="limits-tab" 
            data-bs-toggle="tab" 
            data-bs-target="#limits-tab-pane" 
            type="button" 
            role="tab">
            <i class="flaticon-calendar me-1"></i> Quotas & Plafonds Crédits
          </button>
        </li>
      </ul>

      <!-- TAB CONTENTS -->
      <div class="tab-content" id="customerTabsContent">
        
        <!-- TAB 1: INFORMATIONS PERSONNELLES -->
        <div class="tab-pane fade show active" id="profile-tab-pane" role="tabpanel" tabindex="0">
          <div class="row g-4">
            
            <!-- Information d'identité -->
            <div class="col-lg-6">
              <div class="card shadow-sm border-0 h-100">
                <div class="card-header bg-white py-3 border-bottom">
                  <h5 class="card-title fw-bold mb-0 text-dark">
                    <i class="flaticon-user text-primary me-2"></i> Identité & État Civil
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-6">
                      <span class="text-muted fs-7 d-block">Nom</span>
                      <strong class="text-dark">{{ customer.lastname || '-' }}</strong>
                    </div>
                    <div class="col-6">
                      <span class="text-muted fs-7 d-block">Prénom(s)</span>
                      <strong class="text-dark">{{ customer.firstname || '-' }}</strong>
                    </div>
                    <div class="col-6">
                      <span class="text-muted fs-7 d-block">Date de naissance</span>
                      <strong>{{ formatDate(customer.birthdate) }}</strong>
                    </div>
                    <div class="col-6">
                      <span class="text-muted fs-7 d-block">Lieu de naissance</span>
                      <strong>{{ customer.placeOfBirth || '-' }}</strong>
                    </div>
                    <div class="col-6">
                      <span class="text-muted fs-7 d-block">Genre / Sexe</span>
                      <strong>{{ customer.gender === 'M' ? 'Masculin (M)' : (customer.gender === 'F' ? 'Féminin (F)' : '-') }}</strong>
                    </div>
                    <div class="col-6">
                      <span class="text-muted fs-7 d-block">Profession</span>
                      <strong>{{ customer.occupation || '-' }}</strong>
                    </div>
                    <div class="col-6">
                      <span class="text-muted fs-7 d-block">Établissement / Organisme</span>
                      <strong>{{ customer.etablissement || '-' }}</strong>
                    </div>
                    <div class="col-6">
                      <span class="text-muted fs-7 d-block">Type de client</span>
                      <span class="badge bg-info text-white">{{ typeClientLabel }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Coordonnées & Suivi -->
            <div class="col-lg-6">
              <div class="card shadow-sm border-0 h-100">
                <div class="card-header bg-white py-3 border-bottom">
                  <h5 class="card-title fw-bold mb-0 text-dark">
                    <i class="flaticon-phone-call text-success me-2"></i> Coordonnées & Suivi System
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-6">
                      <span class="text-muted fs-7 d-block">Téléphone</span>
                      <strong class="text-success"><i class="flaticon-phone-call me-1"></i> {{ customer.phone || '-' }}</strong>
                    </div>
                    <div class="col-6">
                      <span class="text-muted fs-7 d-block">Adresse Email</span>
                      <strong class="text-primary">{{ customer.email || '-' }}</strong>
                    </div>
                    <div class="col-12">
                      <span class="text-muted fs-7 d-block">Adresse Résidence / Domicile</span>
                      <strong>{{ customer.address || '-' }}</strong>
                    </div>
                    <div class="col-6">
                      <span class="text-muted fs-7 d-block">Agent Référent / Créateur</span>
                      <strong>{{ customer.user ? `${customer.user.lastname} ${customer.user.firstname}` : '-' }}</strong>
                    </div>
                    <div class="col-6">
                      <span class="text-muted fs-7 d-block">Date d'enregistrement</span>
                      <strong>{{ formatDate(customer.createdAt) }}</strong>
                    </div>
                    <div class="col-12" v-if="customer.updatedAt">
                      <span class="text-muted fs-7 d-block">Dernière mise à jour</span>
                      <small class="text-muted">{{ formatDate(customer.updatedAt) }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- TAB 2: CONTRATS -->
        <div class="tab-pane fade" id="contracts-tab-pane" role="tabpanel" tabindex="0">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 class="card-title fw-bold mb-0 text-dark">
                <i class="flaticon-file-1 text-primary me-2"></i> Historique des Contrats ({{ contracts.length }})
              </h5>
              <button class="btn btn-sm btn-success" @click="creerContrat">
                <i class="flaticon-plus me-1"></i> Nouveau contrat
              </button>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="bg-light">
                    <tr>
                      <th class="ps-3 py-3">Police / Réf</th>
                      <th class="py-3">Nature Crédit</th>
                      <th class="py-3">Capital Garanti</th>
                      <th class="py-3">Prime TTC</th>
                      <th class="py-3">Durée</th>
                      <th class="py-3">Date Prise d'effet</th>
                      <th class="py-3">Échéance</th>
                      <th class="py-3">Statut</th>
                      <th class="pe-3 py-3 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="contracts.length === 0">
                      <td colspan="9" class="text-center py-4 text-muted">
                        Aucun contrat enregistré pour ce client.
                      </td>
                    </tr>
                    <tr v-for="contract in contracts" :key="contract.id">
                      <td class="ps-3 fw-bold">
                        <router-link :to="`/details-contrat/${contract.uuid || contract.id}`" class="text-primary text-decoration-underline">
                          {{ contract.police || contract.reference || `#${contract.id}` }}
                        </router-link>
                      </td>
                      <td>
                        <span class="badge bg-light text-dark border">
                          {{ contract.natureCredit?.libelle || getNatureLabel(contract.idNatureCredit) }}
                        </span>
                      </td>
                      <td class="fw-bold text-success">{{ formatMontant(contract.capital) }}</td>
                      <td class="fw-bold text-primary">{{ formatMontant(contract.puttc) }}</td>
                      <td>{{ contract.duration }} mois</td>
                      <td>{{ formatDate(contract.dateEff) }}</td>
                      <td>{{ formatDate(contract.dateEch) }}</td>
                      <td>
                        <span :class="getContractStatusBadgeClass(contract.idContractState)">
                          {{ contract.contractState?.libelle || getContractStatusLabel(contract.idContractState) }}
                        </span>
                      </td>
                      <td class="pe-3 text-end">
                        <router-link :to="`/details-contrat/${contract.uuid || contract.id}`" class="btn btn-sm btn-outline-primary">
                          <i class="flaticon-eye"></i> Voir
                        </router-link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: COTATIONS -->
        <div class="tab-pane fade" id="cotations-tab-pane" role="tabpanel" tabindex="0">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 class="card-title fw-bold mb-0 text-dark">
                <i class="flaticon-settings text-warning me-2"></i> Historique des Cotations ({{ cotations.length }})
              </h5>
              <button class="btn btn-sm btn-primary" @click="faireCotation">
                <i class="flaticon-settings me-1"></i> Faire une cotation
              </button>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="bg-light">
                    <tr>
                      <th class="ps-3 py-3">Référence</th>
                      <th class="py-3">Nature Crédit</th>
                      <th class="py-3">Capital</th>
                      <th class="py-3">Prime TTC</th>
                      <th class="py-3">Durée</th>
                      <th class="py-3">Date de Saisie</th>
                      <th class="py-3">Statut</th>
                      <th class="pe-3 py-3 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="cotations.length === 0">
                      <td colspan="8" class="text-center py-4 text-muted">
                        Aucune cotation enregistrée pour ce client.
                      </td>
                    </tr>
                    <tr v-for="cotation in cotations" :key="cotation.id">
                      <td class="ps-3 fw-bold">
                        <router-link :to="`/details-cotation/${cotation.uuid || cotation.id}`" class="text-primary text-decoration-underline">
                          {{ cotation.reference }}
                        </router-link>
                      </td>
                      <td>
                        <span class="badge bg-light text-dark border">
                          {{ cotation.natureCredit?.libelle || getNatureLabel(cotation.idNatureCredit) }}
                        </span>
                      </td>
                      <td class="fw-bold text-success">{{ formatMontant(cotation.capital) }}</td>
                      <td class="fw-bold text-primary">{{ formatMontant(cotation.puttc) }}</td>
                      <td>{{ cotation.duration }} mois</td>
                      <td>{{ formatDate(cotation.dateSaisie || cotation.createdAt) }}</td>
                      <td>
                        <span :class="getCotationStatusBadgeClass(cotation.status)">
                          {{ getCotationStatusLabel(cotation.status) }}
                        </span>
                      </td>
                      <td class="pe-3 text-end">
                        <router-link :to="`/details-cotation/${cotation.uuid || cotation.id}`" class="btn btn-sm btn-outline-info me-1">
                          <i class="flaticon-eye"></i> Voir
                        </router-link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: SUIVI DES PLAFONDS CRÉDITS -->
        <div class="tab-pane fade" id="limits-tab-pane" role="tabpanel" tabindex="0">
          <div class="row g-4">
            
            <!-- AMORT Quota Card -->
            <div class="col-md-6">
              <div class="card shadow-sm border-0 h-100 border-start border-4 border-success">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold text-dark mb-0">Crédit Amortissable (AMORT)</h6>
                    <span class="badge bg-success text-white">Max 1 / Jour</span>
                  </div>
                  <div class="display-6 fw-bold text-success my-3">
                    {{ stats.amortCount }} <small class="fs-6 text-muted">actif(s) au total</small>
                  </div>
                  <small class="text-muted d-block mt-2">
                    <i class="flaticon-information me-1"></i> Règle : Au plus 1 crédit Amortissable par jour pour un même client.
                  </small>
                </div>
              </div>
            </div>

            <!-- CONST Card -->
            <div class="col-md-6">
              <div class="card shadow-sm border-0 h-100 border-start border-4 border-primary">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold text-dark mb-0">Crédit Constant (CONST)</h6>
                    <span class="badge bg-primary text-white">Max 1 / Jour</span>
                  </div>
                  <div class="display-6 fw-bold text-primary my-3">
                    {{ stats.constCount }} <small class="fs-6 text-muted">actif(s) au total</small>
                  </div>
                  <small class="text-muted d-block mt-2">
                    <i class="flaticon-information me-1"></i> Règle : Au plus 1 crédit Constant par jour pour un même client.
                  </small>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>

    <!-- Empty View Fallback -->
    <div v-else class="text-center p-5 card shadow-sm border-0 bg-white">
      <i class="flaticon-search fs-1 text-muted mb-3"></i>
      <h5 class="text-muted fw-bold">Aucune donnée trouvée</h5>
      <p class="text-muted">Aucun client ne correspond à cet identifiant.</p>
      <div class="mt-3">
        <router-link to="/liste-clients" class="btn btn-outline-secondary px-4 py-2">
          Retour à la liste des clients
        </router-link>
      </div>
    </div>
    <!-- Modal de cotation -->
    <CotationModal
      :visible="showCotationModal"
      :client-data="customer || undefined"
      @update:visible="showCotationModal = $event"
      @cotation-success="handleCotationSuccess"
      @close="showCotationModal = false"
    />

    <!-- Modal des primes calculées (flux cotation -> conversion) -->
    <PrimesCalculatedModal
      :visible="showPrimesSection"
      :primes="calculatedPrimes"
      :is-converting="false"
      context="cotation-modal"
      @close="closePrimesSection"
      @convert-cotation-modal="openConvertModalWithData"
    />

    <!-- Modal de conversion cotation vers contrat -->
    <CotationToContratModal
      :visible="showCotationToContratModal"
      :selected-client="selectedClientForConversion || undefined"
      :selected-cotation="selectedCotationForConversion || undefined"
      :client-editable="false"
      :modal-title="'Nouveau Contrat - ' + (selectedClientForConversion ? selectedClientForConversion.lastname + ' ' + selectedClientForConversion.firstname : '')"
      @conversion-success="handleCotationToContratSuccess"
      @close="handleCotationToContratClose"
      @update:visible="showCotationToContratModal = $event"
    />

    <!-- Modal création contrat -->
    <CotationToContratModal
      :visible="showCreateContratModal"
      :selected-client="customer || undefined"
      :client-editable="false"
      :modal-title="'Créer un Contrat - ' + (customer ? (customer.lastname || '').toUpperCase() + ' ' + (customer.firstname || '') : '')"
      @conversion-success="handleCreateContratSuccess"
      @close="showCreateContratModal = false"
      @update:visible="showCreateContratModal = $event"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BreadCrumb from '../../components/Common/BreadCrumb.vue';
import ApiService from '../../services/ApiService';
import CotationModal from '../../components/Customer/CotationModal.vue';
import CotationToContratModal from '../../components/Common/CotationToContratModal.vue';
import PrimesCalculatedModal from '../../components/Common/PrimesCalculatedModal.vue';
import { success, error } from '../../utils/utils';

export default defineComponent({
  name: 'DetailsCustomerPage',
  components: {
    BreadCrumb,
    CotationModal,
    CotationToContratModal,
    PrimesCalculatedModal
  },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const customerIdentifier = computed(() => {
      return (route.params.uuid || route.params.id) as string;
    });

    const loading = ref(true);
    const errorMessage = ref<string | null>(null);

    const customer = ref<any>(null);
    const contracts = ref<any[]>([]);
    const cotations = ref<any[]>([]);
    const stats = ref<any>({
      totalContracts: 0,
      activeContracts: 0,
      totalCapital: 0,
      totalPuttc: 0,
      constCount: 0,
      amortCount: 0
    });

    const clientFullName = computed(() => {
      if (!customer.value) return 'Client non spécifié';
      const last = (customer.value.lastname || '').toUpperCase();
      const first = customer.value.firstname || '';
      return `${last} ${first}`.trim();
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
      if (!customer.value) return 'Client Ordinaire';
      return customer.value.typeCustomer?.libelle || 'Client Ordinaire';
    });

    async function loadCustomerDetails() {
      if (!customerIdentifier.value) {
        errorMessage.value = 'Identifiant du client manquant';
        loading.value = false;
        return;
      }

      loading.value = true;
      errorMessage.value = null;

      try {
        const response = await ApiService.get(`/customers/${customerIdentifier.value}/details`);
        const payload = response.data?.data || response.data;

        if (payload && (payload.customer || payload.id)) {
          customer.value = payload.customer || payload;
          contracts.value = payload.contracts || [];
          cotations.value = payload.cotations || [];
          if (payload.stats) {
            stats.value = payload.stats;
          }
        } else {
          throw new Error('Informations du client introuvables');
        }
      } catch (err: any) {
        console.error('Erreur chargement détails client:', err);
        errorMessage.value = err?.response?.data?.message || err.message || 'Erreur lors du chargement des détails du client';
      } finally {
        loading.value = false;
      }
    }

    const showCotationModal = ref(false);
    const showCreateContratModal = ref(false);
    const showCotationToContratModal = ref(false);
    const selectedClientForConversion = ref<any>(null);
    const selectedCotationForConversion = ref<any>(null);

    const showPrimesSection = ref(false);
    const calculatedPrimes = ref({
      pd: 0,
      pc: 0,
      surp: 0,
      acc: 0,
      fm: 0,
      puttc: 0
    });
    const cotationData = ref<any>(null);

    function faireCotation() {
      if (!customer.value) {
        error('Données du client non encore chargées');
        return;
      }
      showCotationModal.value = true;
    }

    function handleCotationSuccess(cotation: any) {
      success('Cotation créée avec succès');
      cotationData.value = cotation;
      if (cotation && cotation.primes) {
        calculatedPrimes.value = {
          pd: cotation.primes.pd || 0,
          pc: cotation.primes.pc || 0,
          surp: cotation.primes.surp || 0,
          acc: cotation.primes.acc || 0,
          fm: cotation.primes.fm || 0,
          puttc: cotation.primes.puttc || 0
        };
      }
      showCotationModal.value = false;
      showPrimesSection.value = true;
    }

    function closePrimesSection() {
      showPrimesSection.value = false;
      document.body.classList.remove('modal-open');
    }

    function openConvertModalWithData() {
      if (!customer.value || !cotationData.value) {
        error('Données manquantes pour la conversion');
        return;
      }

      const clientData = {
        lastname: customer.value.lastname,
        firstname: customer.value.firstname,
        address: customer.value.address || '',
        email: customer.value.email || '',
        phone: customer.value.phone,
        gender: customer.value.gender,
        typeClient: customer.value.typeCustomer?.id?.toString() || '1',
        birthdate: customer.value.birthdate,
        placeOfBirth: customer.value.placeOfBirth || '',
        occupation: customer.value.occupation || '',
        numCustomer: customer.value.numCustomer,
        code: customer.value.code
      };

      const idNC = cotationData.value.idNatureCredit || cotationData.value.natureCredit?.id;
      const codeNC = cotationData.value.natureCredit?.code;
      let mappedCreditType = cotationData.value.creditType || codeNC;
      if (!mappedCreditType && idNC) {
        mappedCreditType = idNC === 2 ? 'CP' : idNC === 3 ? 'OBA' : 'AMORT';
      }

      const cotationInfo = {
        capital: cotationData.value.capital || 0,
        duration: cotationData.value.duration || 0,
        creditType: mappedCreditType || 'AMORT',
        idNatureCredit: idNC,
        garantieCompl: cotationData.value.garantieCompl || 'NON'
      };

      selectedClientForConversion.value = clientData as any;
      selectedCotationForConversion.value = cotationInfo;
      showPrimesSection.value = false;
      showCotationToContratModal.value = true;
    }

    function handleCotationToContratSuccess() {
      success('Contrat créé avec succès depuis la cotation');
      loadCustomerDetails();
    }

    function handleCotationToContratClose() {
      showCotationToContratModal.value = false;
      selectedClientForConversion.value = null;
      selectedCotationForConversion.value = null;
    }

    function creerContrat() {
      if (!customer.value) {
        error('Données du client non encore chargées');
        return;
      }
      showCreateContratModal.value = true;
    }

    function handleCreateContratSuccess() {
      showCreateContratModal.value = false;
      success('Contrat créé avec succès');
      loadCustomerDetails();
    }

    function formatDate(dateString: string | null | undefined): string {
      if (!dateString) return '-';
      try {
        return new Date(dateString).toLocaleDateString('fr-FR');
      } catch {
        return dateString;
      }
    }

    function formatMontant(montant: number | null | undefined): string {
      if (montant == null || isNaN(Number(montant))) return '0 FCFA';
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
      }).format(Number(montant));
    }

    function getNatureLabel(idNatureCredit: number | undefined): string {
      if (idNatureCredit === 2) return 'Crédit Constant (CONST)';
      return 'Crédit Amortissable (AMORT)';
    }

    function getContractStatusLabel(stateId: number | undefined): string {
      if (stateId === 1) return 'EN COURS';
      if (stateId === 2) return 'RENOUVELÉ';
      if (stateId === 3) return 'RÉSILIÉ';
      if (stateId === 4) return 'EXPIRÉ';
      if (stateId === 5) return 'SINISTRE';
      return 'INACTIF';
    }

    function getContractStatusBadgeClass(stateId: number | undefined): string {
      if (stateId === 1) return 'badge bg-success';
      if (stateId === 2) return 'badge bg-info';
      if (stateId === 3) return 'badge bg-danger';
      if (stateId === 4) return 'badge bg-secondary';
      if (stateId === 5) return 'badge bg-warning text-dark';
      return 'badge bg-secondary';
    }

    function getCotationStatusLabel(status: string | undefined): string {
      if (status === 'ACCEPTED') return 'ACCEPTÉE';
      if (status === 'REJECTED') return 'REJETÉE';
      return 'EN ATTENTE';
    }

    function getCotationStatusBadgeClass(status: string | undefined): string {
      if (status === 'ACCEPTED') return 'badge bg-success';
      if (status === 'REJECTED') return 'badge bg-danger';
      return 'badge bg-warning text-dark';
    }

    onMounted(() => {
      loadCustomerDetails();
    });

    return {
      customerIdentifier,
      loading,
      errorMessage,
      customer,
      contracts,
      cotations,
      stats,
      clientFullName,
      clientInitials,
      typeClientLabel,
      showCotationModal,
      showCreateContratModal,
      showCotationToContratModal,
      selectedClientForConversion,
      selectedCotationForConversion,
      showPrimesSection,
      calculatedPrimes,
      closePrimesSection,
      openConvertModalWithData,
      handleCotationToContratSuccess,
      handleCotationToContratClose,
      handleCotationSuccess,
      handleCreateContratSuccess,
      loadCustomerDetails,
      faireCotation,
      creerContrat,
      formatDate,
      formatMontant,
      getNatureLabel,
      getContractStatusLabel,
      getContractStatusBadgeClass,
      getCotationStatusLabel,
      getCotationStatusBadgeClass
    };
  }
});
</script>

<style scoped>
.client-avatar-badge {
  font-family: var(--bs-font-sans-serif);
}
.nav-item-btn {
  color: #495057;
  border-radius: 0.5rem;
  transition: all 0.2s ease-in-out;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}
.nav-item-btn.active {
  background-color: #0d6efd !important;
  color: #fff !important;
}
.fs-8 {
  font-size: 0.75rem !important;
}
</style>
