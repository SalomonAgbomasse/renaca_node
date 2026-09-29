<template>
  <Modal
    :isVisible="visible"
    :title="`Détails du contrat ${contratDetails?.reference || ''}`"
    icon="flaticon-file-1"
    size="xlarge"
    @close="handleClose"
    @update:isVisible="handleUpdateVisible"
  >
    <!-- Indicateur de chargement -->
    <div v-if="loading" class="text-center p-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <p class="mt-3 text-muted">Chargement des détails du contrat...</p>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="errorMessage" class="text-center p-5">
      <i class="flaticon-cancel fs-1 text-danger mb-3"></i>
      <h5 class="text-danger">Erreur</h5>
      <p class="text-muted">{{ errorMessage }}</p>
      <button class="btn btn-sm btn-primary" @click="loadContractDetails">
        <i class="flaticon-refresh me-1"></i>Réessayer
      </button>
    </div>

    <!-- Contenu du modal -->
    <div v-if="!loading && !errorMessage && contratDetails">
        <!-- Navigation par onglets -->
        <ul class="nav nav-tabs nav-tabs-custom mb-4" role="tablist">
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link d-flex align-items-center" 
              :class="{ active: activeTab === 'contrat' }"
              @click="activeTab = 'contrat'"
              type="button">
              <i class="flaticon-file-1 me-2"></i>
              Informations Contrat
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link d-flex align-items-center" 
              :class="{ active: activeTab === 'client' }"
              @click="activeTab = 'client'"
              type="button">
              <i class="flaticon-user me-2"></i>
              Informations Client
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link d-flex align-items-center" 
              :class="{ active: activeTab === 'history' }"
              @click="onHistoryTabClick"
              type="button">
              <i class="flaticon-time me-2"></i>
              Historique des modifications
            </button>
          </li>
        </ul>

        <!-- Contenu des onglets -->
        <div class="tab-content">
          <!-- Onglet Informations Contrat -->
          <div v-show="activeTab === 'contrat' && contratDetails" class="tab-pane contract-info-tab">
              <div v-if="!contratDetails" class="text-center p-4">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Chargement...</span>
                </div>
              </div>
              <div v-else class="contract-info-container">
                <!-- Section 1: Informations générales -->
                <div class="info-section">
                  <h6 class="section-title">Informations générales</h6>
                  <div class="info-grid">
                    <div class="info-card">
                      <label class="info-label">Référence contrat</label>
                      <div class="info-value">{{ contratDetails.reference }}</div>
                    </div>
                    <div class="info-card">
                      <label class="info-label">Numéro de police</label>
                      <div class="info-value">{{ contratDetails.police }}</div>
                    </div>
                    <div class="info-card">
                      <label class="info-label">Établissement</label>
                      <div class="info-value">{{ contratDetails.etablissement || contratDetails.agency?.libelle || 'Non spécifié' }}</div>
                    </div>
                    <div class="info-card">
                      <label class="info-label">Bénéficiaire</label>
                      <div class="info-value">{{ contratDetails.benef || 'Non spécifié' }}</div>
                    </div>
                  </div>
                </div>

                <!-- Section 2: Informations financières -->
                <div class="info-section">
                  <div class="row mb-3">
                    <div class="col-md-4">
                      <h6 class="section-title">Date d'effet : {{ formatDate(contratDetails.dateEff) }}</h6>
                    </div>
                    <div class="col-md-4">
                      <h6 class="section-title">Date 1re échéance {{ formatDate(contratDetails.dateEch1) }}</h6>
                    </div>
                    <div class="col-md-4">
                      <h6 class="section-title">Date d'échéance {{ formatDate(contratDetails.dateEch) }}</h6>
                    </div>
                  </div>

                  <div class="row mb-3">
                    <div class="col-md-4">
                      <h6 class="section-title">Durée : {{ contratDetails.duration }} mois</h6>
                    </div>
                    <div class="col-md-4">
                      <h6 class="section-title">Garantie Perte d'Emploi : {{ contratDetails.garantieCompl === 'OUI' ? 'Oui' : 'Non' }}</h6>
                    </div>
                    <div class="col-md-4">
                      <h6 class="section-title">Statut : {{ getStatutTexte(contratDetails) }}</h6>
                    </div>
                  </div>


                  <h6 class="section-title">Informations financières </h6>
                  <div class="info-grid financial-grid">
                    <div class="info-card financial-card">
                      <label class="info-label">Capital assuré</label>
                      <div class="info-value financial-value">{{ formatMontant(contratDetails.capital) }} <span class="currency">FCFA</span></div>
                    </div>
                    <div class="premium-card premium-total">
                      <div class="premium-label">Total TTC</div>
                      <div class="premium-value">{{ formatMontant(contratDetails.puttc) }}</div>
                    </div>
                    <div class="info-card financial-card">
                      <label class="info-label">Taux</label>
                      <div class="info-value financial-value">{{ contratDetails.taux || '15' }}%</div>
                    </div>
                    <div class="info-card financial-card">
                      <label class="info-label">Nature crédit</label>
                      <div class="info-value">{{ contratDetails.natureCredit?.libelle || 'Non défini' }}</div>
                    </div>
                  </div>
                </div>

                <!-- Section 3: Détail des primes -->
                <div class="info-section">
                  <h6 class="section-title">Détail des primes</h6>

                  <div class="row mb-3">
                    <div class="col-md-2">
                      <h6 class="section-title">Prime décès : {{ formatMontant(contratDetails.pd) }}</h6>
                    </div>
                    <div class="col-md-2">
                      <h6 class="section-title">Prime PE : {{ formatMontant(contratDetails.pc) }}</h6>
                    </div>
                    <div class="col-md-2">
                      <h6 class="section-title">Surprime : {{ formatMontant(contratDetails.surp) }}</h6>
                    </div>
                    <div class="col-md-2">
                      <h6 class="section-title">Frais médicaux : {{ formatMontant(contratDetails.fm) }}</h6>
                    </div>
                    <div class="col-md-4">
                      <h6 class="section-title">Accessoires : {{ formatMontant(contratDetails.acc) }}</h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          <!-- Onglet Informations Client -->
          <div v-show="activeTab === 'client' && contratDetails" class="tab-pane client-info-tab">
              <div v-if="!contratDetails" class="text-center p-4">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Chargement...</span>
                </div>
              </div>
              <div v-else-if="contratDetails.customer" class="client-info-container">
                <!-- Section Nom complet -->
                <div class="info-section client-header-section">
                  <div class="client-name-card">
                    <div class="client-avatar">
                      <i class="flaticon-user-1"></i>
                    </div>
                    <div class="client-name-content">
                      <!-- <label class="info-label">Nom complet</label> -->
                      <div class="client-name-value">
                        {{ contratDetails.customer?.lastname || 'N/A' }} {{ contratDetails.customer?.firstname || 'N/A' }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Section Informations personnelles -->
                <div class="info-section">
                  <h6 class="section-title">Informations personnelles</h6>
                  <div class="info-grid">
                    <div class="info-card">
                      <label class="info-label">Type de client</label>
                      <div class="info-value">
                        <span :class="contratDetails.customer.typeCustomer?.libelle === 'Personnel' ? 'badge bg-warning text-dark' : 'badge bg-info'">
                          <i class="flaticon-star me-1"></i>
                          {{ contratDetails.customer.typeCustomer?.libelle || 'Non défini' }}
                        </span>
                      </div>
                    </div>
                    <div class="info-card date-card">
                      <label class="info-label">Date de naissance</label>
                      <div class="info-value">
                        <i class="flaticon-calendar me-2"></i>
                        {{ formatDate(contratDetails.customer?.birthdate) }}
                      </div>
                    </div>
                    <div class="info-card">
                      <label class="info-label">Genre</label>
                      <div class="info-value">
                        <span :class="contratDetails.customer?.gender === 'M' ? 'badge bg-primary' : 'badge bg-danger'">
                          <i :class="contratDetails.customer?.gender === 'M' ? 'flaticon-male' : 'flaticon-female'" class="me-1"></i>
                          {{ contratDetails.customer?.gender === 'M' ? 'Masculin' : 'Féminin' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Section Contact, Profession et adresse -->
                <div class="info-section mb-3">
                  <h6 class="section-title">Contact, Profession et adresse</h6>
                  <div class="info-grid">
                    <div class="info-card contact-card">
                      <label class="info-label">Téléphone</label>
                      <div class="info-value">
                        <i class="flaticon-phone-call me-2"></i>
                        <a :href="`tel:${contratDetails.customer?.phone}`" class="contact-link">
                          {{ contratDetails.customer?.phone || 'N/A' }}
                        </a>
                      </div>
                    </div>
                    <div class="info-card contact-card">
                      <label class="info-label">Email</label>
                      <div class="info-value">
                        <i class="flaticon-email me-2"></i>
                        <a v-if="contratDetails.customer?.email" 
                           :href="`mailto:${contratDetails.customer?.email}`" 
                           class="contact-link">
                          {{ contratDetails.customer?.email }}
                        </a>
                        <span v-else class="text-muted">Non renseigné</span>
                      </div>
                    </div>
                    <div class="info-card">
                      <label class="info-label">Profession</label>
                      <div class="info-value">
                        <i class="flaticon-briefcase me-2"></i>
                        {{ contratDetails.customer?.occupation || 'N/A' }}
                      </div>
                    </div>
                    <div class="info-card address-card">
                      <label class="info-label">Adresse</label>
                      <div class="info-value">
                        <i class="flaticon-location me-2"></i>
                        {{ contratDetails.customer?.address || 'Non renseignée' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="client-empty-state">
                <i class="flaticon-user fs-1 opacity-50 mb-3"></i>
                <h5 class="text-muted">Informations client non disponibles</h5>
                <p class="mb-0">Code client: <span class="fw-bold">{{ contratDetails.codeCustomer }}</span></p>
              </div>
          </div>

          <!-- Onglet Historique des modifications -->
          <div v-show="activeTab === 'history' && contratDetails" class="tab-pane history-tab">
            <div v-if="loadingHistory" class="text-center p-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Chargement...</span>
              </div>
              <p class="mt-3 text-muted">Chargement de l'historique...</p>
            </div>
            
            <div v-else-if="errorHistory" class="text-center p-5">
              <i class="flaticon-cancel fs-1 text-danger mb-3"></i>
              <h5 class="text-danger">Erreur</h5>
              <p class="text-muted">{{ errorHistory }}</p>
              <button class="btn btn-sm btn-primary" @click="chargerHistorique">
                <i class="flaticon-refresh me-1"></i>Réessayer
              </button>
            </div>
            
            <div v-else-if="contractHistory && contractHistory.length > 0" class="history-container">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="section-title mb-0">Historique des modifications</h6>
                <button 
                  class="btn btn-sm btn-outline-primary"
                  @click="exportHistoryToPdf"
                  :disabled="isExportingHistory">
                  <i v-if="!isExportingHistory" class="flaticon-file me-1"></i>
                  <div v-else class="spinner-border spinner-border-sm me-1" role="status">
                    <span class="visually-hidden">Chargement...</span>
                  </div>
                  {{ isExportingHistory ? 'Export...' : 'Exporter PDF' }}
                </button>
              </div>
              
              <div class="history-timeline">
                <div 
                  v-for="(item, index) in contractHistory" 
                  :key="item.id || index"
                  class="history-item"
                  :class="getHistoryActionClass(item.action)">
                  <div class="history-item-header">
                    <span class="history-action-badge" :class="getHistoryActionClass(item.action)">
                      <i :class="getHistoryActionIcon(item.action)" class="me-1"></i>
                      {{ getHistoryActionLabel(item.action) }}
                    </span>
                    <span class="history-date">{{ formatDateTime(item.createdAt) }}</span>
                  </div>
                  
                  <div v-if="item.description" class="history-description">
                    {{ item.description }}
                  </div>
                  
                  <div v-if="item.changedByUser" class="history-user">
                    Modifié par: <strong>{{ item.changedByUser.firstname }} {{ item.changedByUser.lastname }}</strong>
                  </div>
                  
                  <div v-if="item.changedFields && item.changedFields.length > 0" class="history-changes">
                    <div class="history-changes-title">Champs modifiés:</div>
                    <div class="change-list">
                      <div 
                        v-for="field in item.changedFields" 
                        :key="field"
                        class="change-item">
                        <span class="field-name">{{ getFieldLabel(field) }}:</span>
                        <span v-if="item.oldValues && item.oldValues[field] !== undefined" class="old-value">
                          {{ formatFieldValue(field, item.oldValues[field]) }}
                        </span>
                        <span v-if="item.oldValues && item.newValues && item.oldValues[field] !== undefined && item.newValues[field] !== undefined" class="arrow">→</span>
                        <span v-if="item.newValues && item.newValues[field] !== undefined" class="new-value">
                          {{ formatFieldValue(field, item.newValues[field]) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="history-meta">
                    <span v-if="item.ipAddress">
                      <i class="flaticon-location me-1"></i>
                      IP: {{ formatIpAddress(item.ipAddress) }}
                    </span>
                    <span v-if="item.userAgent" class="ms-3">
                      <i class="flaticon-monitor me-1"></i>
                      {{ parseUserAgent(item.userAgent) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="text-center p-5">
              <i class="flaticon-time fs-1 opacity-50 mb-3"></i>
              <h5 class="text-muted">Aucun historique disponible</h5>
              <p class="mb-0">Aucune modification n'a été enregistrée pour ce contrat.</p>
            </div>
          </div>

        </div>
    </div>
    
    <template #footer>
      <button type="button" class="btn btn-sm btn-outline-secondary" @click="handleClose">
        <i class="flaticon-cancel me-1"></i>Fermer
      </button>
      
      <!-- Bouton PDF dans le modal -->
      <button 
        type="button" 
        class="btn btn-sm btn-outline-primary"
        v-if="contratDetails?.id"
        @click="handleGeneratePDF"
        :disabled="isGeneratingPDF || loading">
        <i v-if="!isGeneratingPDF" class="flaticon-file me-1"></i>
        <div v-else class="spinner-border spinner-border-sm me-1" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        {{ isGeneratingPDF ? 'Génération...' : 'PDF' }}
      </button>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch, nextTick } from 'vue';
import Modal from '../Common/Modal.vue';
import ApiService from '../../services/ApiService';
import JwtService from '../../services/JwtService';
import { error, success } from '../../utils/utils';
import { extractFilenameFromResponse } from '../../utils/utils';

interface Contrat {
  id: number;
  idCustomer: number;
  idUser: number;
  updatedBy?: number;
  deletedBy?: number;
  idProduct: number;
  idContractState: number;
  idAgency: number;
  police: string;
  reference: string;
  capital: number;
  puttc: number;
  garantieCompl: string;
  dateEff: string;
  dateEch: string;
  dateEch1: string;
  duration: number;
  duree?: number;
  isActive: boolean;
  codeCustomer?: string;
  etablissement?: string;
  benef?: string;
  taux?: string;
  pd: number;
  pc: number;
  surp: number;
  acc: number;
  fm: number;
  customer?: {
    id: number;
    code?: string;
    lastname: string;
    firstname: string;
    email?: string;
    address: string;
    phone: string;
    birthdate: string;
    occupation: string;
    gender: string;
    typeCustomer?: {
      id: number;
      libelle: string;
    };
  };
  agency?: {
    id: number;
    libelle: string;
  };
  natureCredit?: {
    id: number;
    libelle: string;
    code: string;
  };
  contractState?: {
    id: number;
    libelle: string;
  };
}

export default defineComponent({
  name: 'DetailsContratModal',
  components: {
    Modal
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    contrat: {
      type: Object as () => Contrat | null,
      default: null
    },
    contractId: {
      type: Number as () => number | null,
      default: null
    }
  },
  emits: ['close', 'update:visible', 'generate-pdf'],
  setup(props, { emit }) {
    const activeTab = ref<'contrat' | 'client' | 'history'>('contrat');
    const isGeneratingPDF = ref(false);
    const contratDetails = ref<Contrat | null>(null);
    const loading = ref(false);
    const errorMessage = ref<string | null>(null);
    
    // Historique
    const contractHistory = ref<any[]>([]);
    const loadingHistory = ref(false);
    const errorHistory = ref<string | null>(null);
    const isExportingHistory = ref(false);
    const lastLoadedContractId = ref<number | null>(null); // Pour suivre quel contrat a été chargé

    // Charger les détails du contrat depuis l'API
    async function loadContractDetails() {
      // Si on a déjà un contrat passé en props, l'utiliser
      if (props.contrat) {
        contratDetails.value = props.contrat;
        return;
      }

      // Sinon, charger depuis l'API si on a un contractId
      if (!props.contractId) {
        errorMessage.value = 'Aucun identifiant de contrat fourni';
        return;
      }

      loading.value = true;
      errorMessage.value = null;

      try {
        const response = await ApiService.get(`/contracts/${props.contractId}`);
        /* console.log('📋 Réponse API complète:', response);
        console.log('📋 Type de response:', typeof response);
        console.log('📋 response.data:', response.data);
        console.log('📋 response.data?.code:', response.data?.code);
        console.log('📋 response.data?.data:', response.data?.data);
        console.log('📋 response.data?.data?.contract:', response.data?.data?.contract); */
        
        // ApiService.get retourne AxiosResponse, donc response.data contient { code, message, data: { contract } }
        // Mais d'après les logs utilisateur, la structure semble être directement dans response.data
        let contract: Contrat | null = null;
        
        // Essayer différentes structures possibles
        if (response.data?.data?.contract) {
          contract = response.data.data.contract as Contrat;
         // console.log('✅ Contrat trouvé via response.data.data.contract');
        } else if (response.data?.contract) {
          contract = response.data.contract as Contrat;
         // console.log('✅ Contrat trouvé via response.data.contract');
        } else if (response.data && (response.data as any).id) {
          // Peut-être que response.data est directement le contrat
          contract = response.data as Contrat;
         // console.log('✅ Contrat trouvé directement dans response.data');
        }
        
        if (contract) {
         /*  console.log('✅ Contrat trouvé:', contract);
          console.log('✅ Contrat ID:', contract.id);
          console.log('✅ Contrat reference:', contract.reference); */
          contratDetails.value = contract;
          /* console.log('✅ contratDetails.value après assignation:', contratDetails.value);
          console.log('✅ contratDetails.value.id:', contratDetails.value?.id);
          console.log('✅ contratDetails.value.reference:', contratDetails.value?.reference); */
          
          // Forcer la mise à jour du DOM
          await nextTick();
             // console.log('✅ DOM mis à jour après nextTick');
        } else {
          // console.error('❌ Contrat non trouvé dans la réponse');
          // console.error('❌ Structure complète de response:', JSON.stringify(response, null, 2));
          throw new Error('Format de réponse invalide - contrat non trouvé');
        }
      } catch (err: any) {
        // console.error('❌ Erreur lors du chargement des détails:', err);
        errorMessage.value = err?.response?.data?.message || err?.message || 'Erreur lors du chargement des détails du contrat';
        contratDetails.value = null;
      } finally {
        loading.value = false;
      }
    }

    // Watcher pour déboguer l'état de contratDetails
    watch(contratDetails, (newValue) => {
      /* console.log('🔄 contratDetails a changé:', newValue);
      console.log('🔄 loading:', loading.value);
      console.log('🔄 errorMessage:', errorMessage.value); */
    }, { deep: true });

    // Réinitialiser l'onglet actif et charger les détails quand le modal s'ouvre
    watch(() => props.visible, (newValue) => {
        //console.log('🔄 Modal visible changé:', newValue);
      if (newValue) {
        activeTab.value = 'contrat';
        loadContractDetails();
        /* console.log('🔄 Après loadContractDetails - contratDetails:', contratDetails.value);
        console.log('🔄 Après loadContractDetails - loading:', loading.value);
        console.log('🔄 Après loadContractDetails - errorMessage:', errorMessage.value); */
      } else {
        // Réinitialiser les données quand le modal se ferme
        contratDetails.value = null;
        errorMessage.value = null;
        // Réinitialiser l'historique
        contractHistory.value = [];
        errorHistory.value = null;
        lastLoadedContractId.value = null;
      }
    });

    // Réinitialiser l'historique quand le contrat change
    watch(() => contratDetails.value?.id, (newId, oldId) => {
      if (newId !== oldId && newId !== undefined) {
        // Le contrat a changé, réinitialiser l'historique
        contractHistory.value = [];
        errorHistory.value = null;
        lastLoadedContractId.value = null;
      }
    });

    // Charger aussi si contractId change
    watch(() => props.contractId, () => {
      if (props.visible && props.contractId) {
        loadContractDetails();
      }
    });

    function handleClose() {
      emit('close');
      emit('update:visible', false);
    }

    function handleUpdateVisible(value: boolean) {
      emit('update:visible', value);
    }

    async function handleGeneratePDF() {
      if (!contratDetails.value || !contratDetails.value.id) {
        error('Contrat invalide ou ID manquant');
        return;
      }

      isGeneratingPDF.value = true;

      try {
        const response = await ApiService.vueInstance.axios.get(`/contracts/${contratDetails.value.id}/pdf`, {
          responseType: 'blob',
          headers: { 
            'Accept': 'application/pdf',
            'Authorization': `Bearer ${JwtService.getToken()}`
          }
        });

        if (!(response.data instanceof Blob)) {
          throw new Error('Réponse invalide du serveur');
        }

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `contrat_${contratDetails.value.reference || contratDetails.value.id}.pdf`;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);

        success('PDF généré avec succès !');
        emit('generate-pdf', contratDetails.value);

      } catch (err: any) {
        console.error('❌ Erreur génération PDF:', err);
        
        if (err.response?.status === 404) {
          error('Contrat non trouvé');
        } else if (err.response?.status === 400) {
          error('ID de contrat invalide');
        } else if (err.response?.status === 500) {
          error('Erreur serveur lors de la génération');
        } else {
          error('Erreur lors de la génération du PDF');
        }
      } finally {
        isGeneratingPDF.value = false;
      }
    }

    // Utilitaires de formatage
    function formatDate(dateString: string | null | undefined): string {
      if (!dateString) return '-';
      try {
        if (dateString.includes('/')) {
          return dateString;
        }
        return new Date(dateString).toLocaleDateString('fr-FR');
      } catch {
        return dateString;
      }
    }

    function formatMontant(montant: number | null | undefined): string {
      if (montant == null) return '-';
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(montant);
    }

    // Utilitaires de statut
    function getStatutClass(contrat: Contrat): string {
      if (contrat.isActive === false) {
        return 'badge bg-danger';
      } else if (contrat.isActive === true) {
        return 'badge bg-success';
      } else {
        return 'badge bg-secondary';
      }
    }

    function getStatutTexte(contrat: Contrat): string {
      if (contrat.contractState) {
        return contrat.contractState.libelle;
      } else if (contrat.isActive === false) {
        return 'Inactif';
      } else if (contrat.isActive === true) {
        return 'Actif';
      } else {
        return 'Non défini';
      }
    }

    // Fonctions pour l'historique
    async function chargerHistorique() {
      if (!contratDetails.value?.id) {
        errorHistory.value = 'Aucun contrat sélectionné';
        return;
      }

      const currentContractId = contratDetails.value.id;

      // Si l'historique a déjà été chargé pour ce contrat exact, ne pas recharger
      if (lastLoadedContractId.value === currentContractId && contractHistory.value.length > 0 && !errorHistory.value) {
        return;
      }

      loadingHistory.value = true;
      errorHistory.value = null;

      try {
        const response = await ApiService.get(`/contracts/${currentContractId}/history`);
        
        if (response.data?.data?.history) {
          contractHistory.value = response.data.data.history;
        } else if (response.data?.history) {
          contractHistory.value = response.data.history;
        } else if (Array.isArray(response.data)) {
          contractHistory.value = response.data;
        } else {
          contractHistory.value = [];
        }
        
        // Mettre à jour l'ID du dernier contrat chargé
        lastLoadedContractId.value = currentContractId;
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement de l\'historique:', err);
        errorHistory.value = err?.response?.data?.message || err?.message || 'Erreur lors du chargement de l\'historique';
        contractHistory.value = [];
        lastLoadedContractId.value = null;
      } finally {
        loadingHistory.value = false;
      }
    }

    function onHistoryTabClick() {
      activeTab.value = 'history';
      // Toujours charger l'historique si le contrat a changé ou si l'historique est vide
      const currentContractId = contratDetails.value?.id;
      if (!currentContractId) {
        return;
      }
      
      // Si le contrat a changé ou si l'historique n'a pas encore été chargé pour ce contrat, charger
      if (lastLoadedContractId.value !== currentContractId || contractHistory.value.length === 0) {
        chargerHistorique();
      }
    }

    async function exportHistoryToPdf() {
      if (!contratDetails.value?.id) {
        error('Aucun contrat sélectionné');
        return;
      }

      isExportingHistory.value = true;

      try {
        const response = await ApiService.vueInstance.axios.get(
          `/contracts/${contratDetails.value.id}/history/pdf`,
          {
            responseType: 'blob',
            headers: {
              'Accept': 'application/pdf',
              'Authorization': `Bearer ${JwtService.getToken()}`
            }
          }
        );

        if (!(response.data instanceof Blob)) {
          throw new Error('Réponse invalide du serveur');
        }

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        // Extraire le nom de fichier depuis les headers
        const filename = extractFilenameFromResponse(response) || 
          `historique_${contratDetails.value.reference || contratDetails.value.id}_${Date.now()}.pdf`;

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);

        success('PDF de l\'historique généré avec succès !');
      } catch (err: any) {
        console.error('❌ Erreur lors de l\'export PDF de l\'historique:', err);
        
        if (err.response?.status === 404) {
          error('Historique non trouvé');
        } else if (err.response?.status === 400) {
          error('ID de contrat invalide');
        } else if (err.response?.status === 500) {
          error('Erreur serveur lors de la génération');
        } else {
          error('Erreur lors de la génération du PDF de l\'historique');
        }
      } finally {
        isExportingHistory.value = false;
      }
    }

    function getHistoryActionLabel(action: string): string {
      const labels: { [key: string]: string } = {
        CREATE: 'Création',
        UPDATE: 'Modification',
        DELETE: 'Suppression'
      };
      return labels[action] || action;
    }

    function getHistoryActionClass(action: string): string {
      const classes: { [key: string]: string } = {
        CREATE: 'history-create',
        UPDATE: 'history-update',
        DELETE: 'history-delete'
      };
      return classes[action] || 'history-default';
    }

    function getHistoryActionIcon(action: string): string {
      const icons: { [key: string]: string } = {
        CREATE: 'flaticon-check',
        UPDATE: 'flaticon-pen',
        DELETE: 'flaticon-cancel'
      };
      return icons[action] || 'flaticon-time';
    }

    function getFieldLabel(field: string): string {
      const labels: { [key: string]: string } = {
        capital: 'Capital',
        duration: 'Durée',
        taux: 'Taux d\'intérêt',
        dateEff: 'Date d\'effet',
        dateEch: 'Date d\'échéance',
        dateEch1: 'Date de première échéance',
        idNatureCredit: 'Nature de crédit',
        idPeriodicite: 'Périodicité',
        differe: 'Différé',
        garantieCompl: 'Garantie complémentaire',
        etablissement: 'Établissement',
        reference: 'Référence',
        description: 'Description',
        isActive: 'Statut'
      };
      return labels[field] || field;
    }

    function formatFieldValue(field: string, value: any): string {
      if (value === null || value === undefined || value === '') {
        return 'Non renseigné';
      }

      // Formatage des dates
      if (field.includes('date') || field.includes('Date')) {
        try {
          if (typeof value === 'string' && value.includes('T')) {
            return new Date(value).toLocaleDateString('fr-FR');
          }
          return String(value);
        } catch {
          return String(value);
        }
      }

      // Formatage des montants
      if (field === 'capital' || field === 'puttc' || field === 'pd' || field === 'pc' || field === 'surp' || field === 'acc' || field === 'fm') {
        return formatMontant(value);
      }

      // Formatage des pourcentages
      if (field === 'taux') {
        return `${value}%`;
      }

      // Formatage des booléens
      if (field === 'isActive') {
        return value ? 'Actif' : 'Inactif';
      }

      return String(value);
    }

    function formatDateTime(dateString: string | Date): string {
      if (!dateString) return '-';
      try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        return date.toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return String(dateString);
      }
    }

    function formatIpAddress(ip: string): string {
      if (ip === '::1') {
        return '127.0.0.1 (localhost)';
      }
      return ip;
    }

    function parseUserAgent(userAgent: string): string {
      if (!userAgent) return 'Non disponible';
      
      // Extraire le navigateur
      let browser = 'Navigateur inconnu';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      else if (userAgent.includes('Opera')) browser = 'Opera';
      
      // Extraire l'OS
      let os = '';
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iOS')) os = 'iOS';
      
      return os ? `${browser} sur ${os}` : browser;
    }

    return {
      activeTab,
      isGeneratingPDF,
      contratDetails,
      loading,
      errorMessage,
      handleClose,
      handleUpdateVisible,
      handleGeneratePDF,
      loadContractDetails,
      formatDate,
      formatMontant,
      getStatutClass,
      getStatutTexte,
      contractHistory,
      loadingHistory,
      errorHistory,
      isExportingHistory,
      chargerHistorique,
      onHistoryTabClick,
      exportHistoryToPdf,
      getHistoryActionLabel,
      getHistoryActionClass,
      getHistoryActionIcon,
      getFieldLabel,
      formatFieldValue,
      formatDateTime,
      formatIpAddress,
      parseUserAgent
    };
  }
});
</script>

<style scoped>
/* Container principal */
.contract-info-container {
  padding: 0;
  max-width: 100%;
  overflow-x: hidden;
}

/* Sections d'information */
.info-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.info-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6c757d;
  margin-bottom: 1.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

/* Grille d'information */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.financial-grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

/* Cartes d'information */
.info-card {
  padding: 1rem;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.info-card:hover {
  border-color: #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.info-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
  color: #212529;
  word-break: break-word;
  overflow-wrap: break-word;
}

.financial-card .info-value {
  font-size: 1.25rem;
  font-weight: 600;
}

.financial-value {
  color: #28a745;
}

.currency {
  font-size: 0.875rem;
  font-weight: 400;
  color: #6c757d;
  margin-left: 0.25rem;
}

.date-card .info-value {
  display: flex;
  align-items: center;
  color: #495057;
}

.date-card .info-value i {
  color: #6c757d;
}

/* Grille des primes */
.premium-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.premium-card {
  padding: 1rem;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  text-align: center;
  transition: all 0.2s ease;
}

.premium-card:hover {
  border-color: #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.premium-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.premium-value {
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
}

.premium-total {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #28a745;
}

.premium-total .premium-label {
  color: #28a745;
  font-weight: 700;
}

.premium-total .premium-value {
  color: #28a745;
  font-size: 1.125rem;
  font-weight: 700;
}

/* Badges */
.badge {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 6px;
}

/* Responsive */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .financial-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .premium-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .financial-card .info-value {
    font-size: 1.125rem;
  }
}

@media (max-width: 576px) {
  .financial-grid {
    grid-template-columns: 1fr;
  }
  
  .premium-grid {
    grid-template-columns: 1fr;
  }
}

/* Forcer l'affichage des tab-pane quand ils sont visibles via v-show */
.tab-content .tab-pane[style*="display: block"],
.tab-content .tab-pane:not([style*="display: none"]) {
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.contract-info-tab {
  overflow-x: hidden;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

/* Empêcher les débordements */
.contract-info-tab * {
  max-width: 100%;
  box-sizing: border-box;
}

.info-value,
.premium-value {
  overflow-wrap: break-word;
  word-break: break-word;
}

/* Styles pour l'onglet Informations Client */
.client-info-container {
  padding: 0;
  max-width: 100%;
  overflow-x: hidden;
}

.client-info-tab {
  overflow-x: hidden;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

/* Section header avec nom du client */
.client-header-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
}

.client-name-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 1px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.client-name-card:hover {
  border-color: #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.client-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.client-avatar i {
  font-size: 1.5rem;
  color: #ffffff;
}

.client-name-content {
  width: 100%;
  min-width: 0;
}

.client-name-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #212529;
  margin-top: 0.25rem;
  overflow-wrap: break-word;
  word-break: break-word;
  text-align: center;
}

/* Cartes de contact */
.contact-card .info-value {
  display: flex;
  align-items: center;
}

.contact-link {
  color: #0d6efd;
  text-decoration: none;
  transition: color 0.2s ease;
  overflow-wrap: break-word;
  word-break: break-word;
}

.contact-link:hover {
  color: #0a58ca;
  text-decoration: underline;
}

/* Carte d'adresse */
.address-card .info-value {
  display: flex;
  align-items: flex-start;
  line-height: 1.6;
}

.address-card .info-value i {
  margin-top: 0.25rem;
  flex-shrink: 0;
}

/* État vide */
.client-empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6c757d;
}

.client-empty-state i {
  display: block;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.client-empty-state h5 {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

/* Empêcher les débordements pour l'onglet client */
.client-info-tab * {
  max-width: 100%;
  box-sizing: border-box;
}

.client-info-container .info-value {
  overflow-wrap: break-word;
  word-break: break-word;
}

/* Responsive pour l'onglet client */
@media (max-width: 768px) {
  .client-name-card {
    flex-direction: column;
    text-align: center;
  }
  
  .client-avatar {
    width: 56px;
    height: 56px;
  }
  
  .client-avatar i {
    font-size: 1.75rem;
  }
  
  .client-name-value {
    font-size: 1.25rem;
  }
}

/* Styles pour l'onglet Historique */
.history-tab {
  overflow-x: hidden;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.history-container {
  padding: 0;
  max-width: 100%;
}

.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history-item {
  padding: 1.25rem;
  background: #ffffff;
  border-left: 4px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.history-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.history-item.history-create {
  border-left-color: #28a745;
}

.history-item.history-update {
  border-left-color: #17a2b8;
}

.history-item.history-delete {
  border-left-color: #dc3545;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.history-action-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
}

.history-action-badge.history-create {
  background-color: #28a745;
}

.history-action-badge.history-update {
  background-color: #17a2b8;
}

.history-action-badge.history-delete {
  background-color: #dc3545;
}

.history-date {
  font-size: 0.875rem;
  color: #6c757d;
}

.history-description {
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #212529;
}

.history-user {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.75rem;
}

.history-changes {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.history-changes-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #495057;
}

.change-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.change-item {
  font-size: 0.875rem;
  padding: 0.5rem;
  background: #ffffff;
  border-radius: 4px;
}

.field-name {
  font-weight: 600;
  color: #495057;
}

.old-value {
  color: #dc3545;
  text-decoration: line-through;
  margin: 0 0.25rem;
}

.arrow {
  margin: 0 0.5rem;
  color: #6c757d;
}

.new-value {
  color: #28a745;
  font-weight: 500;
  margin: 0 0.25rem;
}

.history-meta {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e9ecef;
  font-size: 0.75rem;
  color: #6c757d;
}

.history-meta i {
  font-size: 0.75rem;
}
</style>

