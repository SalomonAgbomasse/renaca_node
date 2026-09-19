<template>
  <Modal
    :isVisible="isVisible"
    :title="clientDetails ? `Détails du client ${clientDetails.lastname || ''} ${clientDetails.firstname || ''}` : 'Détails du client'"
    icon="flaticon-user"
    size="xlarge"
    @close="handleClose"
    @update:isVisible="handleUpdateVisibility"
  >
    <!-- Indicateur de chargement -->
    <div v-if="loading" class="text-center p-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <p class="mt-3 text-muted">Chargement des détails du client...</p>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="errorMessage" class="text-center p-5">
      <i class="flaticon-cancel fs-1 text-danger mb-3"></i>
      <h5 class="text-danger">Erreur</h5>
      <p class="text-muted">{{ errorMessage }}</p>
      <button class="btn btn-sm btn-primary" @click="loadClientDetails">
        <i class="flaticon-refresh me-1"></i>Réessayer
      </button>
    </div>

    <!-- Contenu du modal -->
    <div v-else-if="showContent" :key="`content-${clientDetails?.id || 'new'}`">
        <!-- Navigation par onglets -->
        <ul class="nav nav-tabs nav-tabs-custom mb-4" id="clientTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link d-flex align-items-center" 
                  :class="{ active: activeTab === 'info' }"
                  @click="activeTab = 'info'"
                  type="button">
            <i class="flaticon-user me-2"></i>
            Informations Personnelles
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link d-flex align-items-center" 
                  :class="{ active: activeTab === 'contrats' }"
                  @click="activeTab = 'contrats'; onContratsTabClick()"
                  type="button">
            <i class="flaticon-file-1 me-2"></i>
            Contrats ({{ clientContrats.length }})
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link d-flex align-items-center" 
                  :class="{ active: activeTab === 'history' }"
                  @click="activeTab = 'history'; onHistoryTabClick()"
                  type="button">
            <i class="flaticon-history me-2"></i>
            Historique des modifications
          </button>
        </li>
      </ul>

      <!-- Contenu des onglets -->
      <div class="tab-content">
        
        <!-- Onglet Informations Personnelles -->
        <div v-if="activeTab === 'info' && clientDetails" class="tab-pane client-info-tab">
          <div class="client-info-container">
            <!-- Section Nom complet -->
            <div class="info-section client-header-section">
              <div class="client-name-card">
                <div class="client-avatar">
                  <i class="flaticon-user-1"></i>
                </div>
                <div class="client-name-content">
                  <div class="client-name-value">
                    {{ clientDetails.lastname || 'N/A' }} {{ clientDetails.firstname || 'N/A' }}
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
                    <span :class="clientDetails.typeCustomer?.libelle === 'Personnel' ? 'badge bg-warning text-dark' : clientDetails.typeCustomer?.libelle === 'Professionnel' ? 'badge bg-info' : clientDetails.typeCustomer?.libelle === 'Entreprise' ? 'badge bg-primary' : 'badge bg-secondary'">
                      <i class="flaticon-star me-1"></i>
                      {{ clientDetails.typeCustomer?.libelle || 'Non défini' }}
                    </span>
                  </div>
                </div>
                <div class="info-card date-card">
                  <label class="info-label">Date de naissance</label>
                  <div class="info-value">
                    <i class="flaticon-calendar me-2"></i>
                    {{ formatDate(clientDetails.birthdate) }}
                  </div>
                </div>
                <div class="info-card">
                  <label class="info-label">Âge</label>
                  <div class="info-value">
                    <span class="badge bg-info">{{ calculateAge(clientDetails.birthdate) }} ans</span>
                  </div>
                </div>
                <div class="info-card">
                  <label class="info-label">Genre</label>
                  <div class="info-value">
                    <span :class="clientDetails.gender === 'M' ? 'badge bg-primary' : 'badge bg-danger'">
                      <i :class="clientDetails.gender === 'M' ? 'flaticon-male' : 'flaticon-female'" class="me-1"></i>
                      {{ getGenderText(clientDetails.gender) }}
                    </span>
                  </div>
                </div>
                <div class="info-card">
                  <label class="info-label">Lieu de naissance</label>
                  <div class="info-value">
                    <i class="flaticon-location me-2"></i>
                    {{ clientDetails.placeOfBirth || 'Non renseigné' }}
                  </div>
                </div>
                <div class="info-card">
                  <label class="info-label">Profession</label>
                  <div class="info-value">
                    <i class="flaticon-briefcase me-2"></i>
                    {{ clientDetails.occupation || 'N/A' }}
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
                    <a :href="`tel:${clientDetails.phone}`" class="contact-link">
                      {{ clientDetails.phone || 'N/A' }}
                    </a>
                  </div>
                </div>
                <div class="info-card contact-card">
                  <label class="info-label">Email</label>
                  <div class="info-value">
                    <i class="flaticon-email me-2"></i>
                    <a v-if="clientDetails.email" 
                       :href="`mailto:${clientDetails.email}`" 
                       class="contact-link">
                      {{ clientDetails.email }}
                    </a>
                    <span v-else class="text-muted">Non renseigné</span>
                  </div>
                </div>
                <div class="info-card">
                  <label class="info-label">Profession</label>
                  <div class="info-value">
                    <i class="flaticon-briefcase me-2"></i>
                    {{ clientDetails.occupation || 'N/A' }}
                  </div>
                </div>
                <div class="info-card address-card">
                  <label class="info-label">Adresse</label>
                  <div class="info-value">
                    <i class="flaticon-location me-2"></i>
                    {{ clientDetails.address || 'Non renseignée' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Onglet Historique des modifications -->
        <div v-if="activeTab === 'history'" class="tab-pane">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center" style="background-color: #dee2e6; border-bottom: 1px solid #dee2e6;">
              <h5 class="card-title mb-0 text-dark">
                <i class="flaticon-history me-2 text-info"></i>
                Historique des modifications
              </h5>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary" 
                        @click="rechargerHistorique"
                        :disabled="loadingHistory"
                        title="Actualiser l'historique">
                  <i class="flaticon-refresh" :class="{ 'fa-spin': loadingHistory }"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" 
                        @click="exportHistoryToPdf"
                        :disabled="loadingHistory || clientHistory.length === 0"
                        title="Exporter en PDF">
                  <i class="flaticon-file-1 me-1"></i>
                  Exporter PDF
                </button>
              </div>
            </div>
            <div class="card-body" style="background-color: #f8f9fa;">
              <div v-if="loadingHistory" class="text-center py-4">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Chargement...</span>
                </div>
              </div>
              <div v-else-if="errorHistory" class="text-center py-5">
                <i class="flaticon-cancel fs-1 text-danger mb-3"></i>
                <h5 class="text-danger">Erreur</h5>
                <p class="text-muted">{{ errorHistory }}</p>
                <button class="btn btn-sm btn-primary" @click="chargerHistorique">
                  <i class="flaticon-refresh me-1"></i>Réessayer
                </button>
              </div>
              <div v-else-if="clientHistory.length === 0" class="text-center py-5">
                <i class="flaticon-history fs-1 text-muted opacity-50 mb-3"></i>
                <h5 class="text-muted">Aucun historique</h5>
                <p class="text-muted">Aucune modification enregistrée pour ce client</p>
              </div>
              <div v-else class="history-timeline">
                <div v-for="(item, index) in clientHistory" :key="item.id" class="history-item">
                  <div class="history-item-header">
                    <div class="history-action-badge" :class="getHistoryActionClass(item.action)">
                      <i :class="getHistoryActionIcon(item.action)" class="me-1"></i>
                      {{ getHistoryActionLabel(item.action) }}
                    </div>
                    <div class="history-date">
                      <i class="flaticon-calendar me-1"></i>
                      {{ formatDateTime(item.createdAt) }}
                    </div>
                  </div>
                  <div class="history-item-meta">
                    <div v-if="item.ipAddress" class="history-meta-item">
                      <i class="flaticon-location me-1"></i>
                      <strong>IP:</strong> {{ formatIpAddress(item.ipAddress) }}
                    </div>
                    <div v-if="item.userAgent" class="history-meta-item">
                      <i class="flaticon-computer me-1"></i>
                      <strong>Navigateur:</strong> {{ parseUserAgent(item.userAgent) }}
                    </div>
                  </div>
                  <div class="history-item-body">
                    <div v-if="item.description" class="history-description">
                      {{ item.description }}
                    </div>
                    <div v-if="item.changedByUser" class="history-user">
                      <i class="flaticon-user me-1"></i>
                      Modifié par: <strong>{{ item.changedByUser.firstname }} {{ item.changedByUser.lastname }}</strong>
                    </div>
                    <div v-if="item.changedFields && item.changedFields.length > 0" class="history-changes mt-2">
                      <div class="history-changes-title">
                        <i class="flaticon-edit me-1"></i>
                        Champs modifiés:
                      </div>
                      <div class="history-changes-list">
                        <div v-for="field in item.changedFields" :key="field" class="history-change-item">
                          <span class="field-name">{{ getFieldLabel(field) }}:</span>
                          <span v-if="item.oldValues && item.oldValues[field] !== undefined" class="old-value">
                            {{ formatFieldValue(field, item.oldValues[field]) }}
                          </span>
                          <i class="flaticon-right-arrow mx-2 text-muted"></i>
                          <span v-if="item.newValues && item.newValues[field] !== undefined" class="new-value">
                            {{ formatFieldValue(field, item.newValues[field]) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="index < clientHistory.length - 1" class="history-divider"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Onglet Contrats -->
        <div v-if="activeTab === 'contrats'" class="tab-pane">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center" style="background-color: #dee2e6; border-bottom: 1px solid #dee2e6;">
              <h5 class="card-title mb-0 text-dark">
                <i class="flaticon-file-1 me-2 text-info"></i>
                Contrats du client ({{ clientContrats.length }})
              </h5>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-info" 
                        @click="testerApiContrats"
                        title="Tester l'API contrats">
                  <i class="flaticon-settings"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary" 
                        @click="rechargerContrats"
                        :disabled="loadingContrats"
                        title="Actualiser la liste">
                  <i class="flaticon-refresh" :class="{ 'fa-spin': loadingContrats }"></i>
                </button>
                <button class="btn btn-sm" 
                        style="background-color: #adb5bd; color: #495057; border-color: #adb5bd;" 
                        @click="handleCreateContrat">
                  <i class="flaticon-plus me-1"></i>
                  Nouveau contrat
                </button>
              </div>
            </div>
            <div class="card-body" style="background-color: #f8f9fa;">
              <div v-if="loadingContrats" class="text-center py-4">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Chargement...</span>
                </div>
              </div>
              <div v-else-if="clientContrats.length === 0" class="text-center py-5">
                <i class="flaticon-file-1 fs-1 text-muted opacity-50 mb-3"></i>
                <h5 class="text-muted">Aucun contrat trouvé</h5>
                <p class="text-muted">Ce client n'a pas encore de contrat</p>
                <button class="btn" 
                        style="background-color: #868e96; color: white; border-color: #868e96;" 
                        @click="handleCreateContrat">
                  <i class="flaticon-plus me-2"></i>
                  Créer le premier contrat
                </button>
              </div>
              <div v-else class="table-responsive">
                <table class="table table-sm">
                  <thead class="table-light">
                    <tr>
                      <th>Référence</th>
                      <th>Police</th>
                      <th>Capital</th>
                      <!-- <th>Nature de crédit</th> -->
                      <th>Prime TTC</th>
                      <th>Date Effet</th>
                      <th>Date Échéance</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="contrat in clientContrats" :key="contrat.id">
                      <td>
                        <strong class="text-primary">{{ contrat.reference }}</strong>
                      </td>
                      <td>
                        <span class="badge bg-info">{{ contrat.police }}</span>
                      </td>
                      <td>
                        <strong class="text-success">{{ formatMontant(contrat.capital) }}</strong>
                      </td>
                      <!-- <td>
                        <strong class="text-dark fw-bold">
                          {{ contrat.natureCredit?.libelle || 'Non défini' }}
                        </strong>
                      </td> -->
                      <td>
                        <strong class="text-warning">{{ formatMontant(contrat.puttc) }}</strong>
                      </td>
                      <td>
                        <span class="text-info">{{ formatDate(contrat.dateEff) }}</span>
                      </td>
                      <td>
                        <span class="text-warning">{{ formatDate(contrat.dateEch) }}</span>
                      </td>
                      <td>
                        <span :class="getStatutClass(contrat)">
                          {{ getStatutTexte(contrat) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="d-flex justify-content-between w-100">
        <button type="button" class="btn btn-sm btn-outline-secondary fw-bold" 
                @click="handleClose">
          <i class="flaticon-cancel me-1"></i>Fermer
        </button>
        
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-sm fw-bold" 
                  style="background-color: #17a2b8; color: white; border-color: #17a2b8;"
                  v-if="clientDetails?.id && clientDetails?.isActive === true" 
                  @click="handleFaireCotation">
            <i class="flaticon-settings me-1"></i>Faire une cotation
          </button>
          
          <button type="button" class="btn btn-sm fw-bold" 
                  style="background-color: #33b04a; color: #231f20; border-color: #33b04a;"
                  v-if="clientDetails?.id && clientDetails?.isActive === true" 
                  @click="handleCreateContrat">
            <i class="flaticon-plus me-1"></i>Créer un contrat
          </button>
          
          <button type="button" class="btn btn-sm fw-bold" 
                  style="background-color: #dc3545; color: white; border-color: #dc3545;"
                  v-if="clientDetails?.id && clientDetails?.isActive === true && canCreateHorsConvention" 
                  @click="handleCreateHorsConvention">
            <i class="flaticon-file-1 me-1"></i>Créer contrat hors convention
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, nextTick } from "vue";
import ApiService from "../../services/ApiService";
import JwtService from "../../services/JwtService";
import { error, extractFilenameFromResponse } from "../../utils/utils";
import Modal from '../Common/Modal.vue';

// Interface pour les clients
interface Client {
  id: number;
  uuid?: string;
  idTypeCustomer: number;
  idUser: number;
  updatedBy?: number;
  deletedBy?: number;
  lastname: string;
  firstname: string;
  email?: string;
  address: string;
  phone: string;
  placeOfBirth: string;
  birthdate: string;
  occupation: string;
  gender: "M" | "F";
  autreAss?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  version: number;
  typeCustomer?: {
    id: number;
    libelle: string;
  };
  code?: string;
  profession?: string;
  phone2?: string;
  maritalStatus?: string;
  numberChildren?: string;
  salaryBracket?: string;
  residenceArea?: string;
  locomotion?: string;
  accomodation?: string;
  groupe?: string;
  ifu?: string;
  status?: number;
  contracts?: any[];
}

// Interface pour les contrats
interface ContratClient {
  id: number;
  idCustomer: number;
  idUser: number;
  idProduct: number;
  idContractState: number;
  idAgency: number;
  capital: number;
  duration: number;
  dateEff: string;
  dateEch1: string;
  dateEch: string;
  pd: number;
  pc: number;
  surp: number;
  acc: number;
  fm: number;
  puttc: number;
  police: string;
  reference: string;
  garantieCompl: string;
  description?: string;
  keyCont: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  contractState?: {
    id: number;
    libelle: string;
  };
  natureCredit?: {
    id: number;
    libelle: string;
    code: string;
  };
}

export default defineComponent({
  name: "CustomerDetailsModal",
  components: {
    Modal
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    clientId: {
      type: Number as () => number | null,
      default: null
    },
    canCreateHorsConvention: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'update:isVisible', 'createContrat', 'faireCotation', 'createHorsConvention'],
  setup(props, { emit }) {
    const clientDetails = ref<Client | null>(null);
    const clientContrats = ref<Array<ContratClient>>([]);
    const loadingContrats = ref(false);
    const loading = ref(false);
    const errorMessage = ref<string | null>(null);
    const activeTab = ref<'info' | 'contrats' | 'history'>('info');
    const isLoadingInProgress = ref(false);
    const clientHistory = ref<Array<any>>([]);
    const loadingHistory = ref(false);
    const errorHistory = ref<string | null>(null);

    // Computed pour déterminer si le contenu doit être affiché
    const showContent = computed(() => {
      const result = !loading.value && !errorMessage.value && !!clientDetails.value;
      console.log('🔍 showContent computed:', { 
        loading: loading.value, 
        errorMessage: errorMessage.value, 
        hasClient: !!clientDetails.value,
        result 
      });
      return result;
    });

    // Watcher pour déboguer les changements d'état
    watch([loading, errorMessage, clientDetails], ([newLoading, newError, newClient]) => {
      console.log('🔄 État changé:', { 
        loading: newLoading, 
        errorMessage: newError, 
        hasClient: !!newClient,
        clientId: newClient?.id,
        showContent: !newLoading && !newError && !!newClient
      });
    }, { deep: true });

    // Fonctions utilitaires
    function formatDate(dateString: string | null | undefined): string {
      if (!dateString) return '-';
      try {
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateString.split('-');
          return `${day}/${month}/${year}`;
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('fr-FR');
      } catch {
        return '-';
      }
    }

    function formatDateTime(dateString: string | null | undefined): string {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch {
        return '-';
      }
    }

    function formatMontant(montant: number | null | undefined): string {
      if (montant == null) return '-';
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(montant);
    }

    function calculateAge(birthdate: string): number {
      if (!birthdate) return 0;
      try {
        const birth = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age;
      } catch {
        return 0;
      }
    }

    function getTypeClass(type: string): string {
      const baseClass = 'badge fs-7 px-2 py-1';
      switch (type) {
        case 'Personnel':
          return `${baseClass} bg-warning text-dark`;
        case 'Professionnel':
          return `${baseClass} bg-info text-white`;
        case 'Entreprise':
          return `${baseClass} bg-primary text-white`;
        default:
          return `${baseClass} bg-secondary text-white`;
      }
    }

    function getStatutClass(item: any): string {
      const baseClass = 'badge fs-7 px-2 py-1';
      if (item.isActive === false) {
        return `${baseClass} bg-danger text-white`;
      } else if (item.isActive === true) {
        return `${baseClass} bg-success text-white`;
      } else if (item.contractState?.libelle) {
        const state = item.contractState.libelle.toLowerCase();
        if (state.includes('actif') || state.includes('valid')) {
          return `${baseClass} bg-success text-white`;
        } else if (state.includes('inactif') || state.includes('annul')) {
          return `${baseClass} bg-danger text-white`;
        }
      }
      return `${baseClass} bg-secondary text-white`;
    }

    function getStatutTexte(item: any): string {
      if (item.isActive === false) {
        return 'Inactif';
      } else if (item.isActive === true) {
        return 'Actif';
      } else if (item.contractState?.libelle) {
        return item.contractState.libelle;
      }
      return 'Non défini';
    }

    function getInitials(firstname: string, lastname: string): string {
      const firstInitial = firstname ? firstname.charAt(0).toUpperCase() : '';
      const lastInitial = lastname ? lastname.charAt(0).toUpperCase() : '';
      return firstInitial + lastInitial;
    }

    function isMale(gender: string): boolean {
      if (!gender) return false;
      const genderLower = gender.toLowerCase().trim();
      return genderLower === 'm' || 
             genderLower === 'masculin' || 
             genderLower === 'homme' || 
             genderLower === 'male';
    }

    function getGenderText(gender: string): string {
      if (!gender) return 'Non défini';
      const genderLower = gender.toLowerCase().trim();
      if (isMale(gender)) {
        return 'Masculin';
      } else if (genderLower === 'f' || genderLower === 'féminin' || genderLower === 'femme' || genderLower === 'female') {
        return 'Féminin';
      }
      return 'Non défini';
    }

    // Charger les détails du client depuis l'API
    async function loadClientDetails() {
      if (!props.clientId) {
        errorMessage.value = 'Aucun identifiant de client fourni';
        loading.value = false;
        return;
      }

      // Éviter les chargements multiples simultanés
      if (isLoadingInProgress.value) {
        console.log('⚠️ Chargement déjà en cours, ignoré');
        return;
      }

      isLoadingInProgress.value = true;
      loading.value = true;
      errorMessage.value = null;
      console.log('📥 Début du chargement pour clientId:', props.clientId);

      try {
        const { data } = await ApiService.get(`/customers/${props.clientId}`);
        console.log('📋 Réponse API complète:', data);
        
        if (data && data.data && data.data.customer) {
          clientDetails.value = data.data.customer;
          console.log('📋 clientDetails.value après assignation:', clientDetails.value);
          console.log('📋 loading avant chargement contrats:', loading.value);
          
          // Charger les contrats après avoir chargé les détails du client
          await chargerContratsClient();
          console.log('📋 Après chargement contrats - loading:', loading.value);
          console.log('📋 Après chargement contrats - clientDetails:', clientDetails.value);
          
          // Forcer une mise à jour du DOM
          await nextTick();
          console.log('📋 Après nextTick - showContent devrait être recalculé');
        } else {
          console.warn('⚠️ Structure de réponse inattendue:', data);
          errorMessage.value = 'Structure de réponse inattendue';
          clientDetails.value = null;
          clientContrats.value = [];
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des détails:', err);
        errorMessage.value = err?.response?.data?.message || 'Erreur lors du chargement des détails du client';
        clientDetails.value = null;
        clientContrats.value = [];
      } finally {
        loading.value = false;
        isLoadingInProgress.value = false;
        console.log('📋 finally - loading mis à false:', loading.value);
        console.log('📋 finally - isLoadingInProgress mis à false:', isLoadingInProgress.value);
        console.log('📋 finally - clientDetails:', clientDetails.value);
        console.log('📋 finally - errorMessage:', errorMessage.value);
      }
    }

    async function chargerContratsClient() {
      if (!clientDetails.value?.id) {
        console.warn('⚠️ ID client manquant pour charger les contrats');
        return;
      }
      
      try {
        loadingContrats.value = true;
        const { data } = await ApiService.get(`/contracts/customer/${clientDetails.value.id}`);
        
        if (data && data.contracts && Array.isArray(data.contracts)) {
          clientContrats.value = data.contracts;
        } else if (data && data.data && data.data.contracts && Array.isArray(data.data.contracts)) {
          clientContrats.value = data.data.contracts;
        } else {
          console.warn('⚠️ Structure de réponse inattendue pour les contrats');
          clientContrats.value = [];
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des contrats:', err);
        error('Erreur lors du chargement des contrats du client');
        clientContrats.value = [];
      } finally {
        loadingContrats.value = false;
      }
    }

    function rechargerContrats() {
      chargerContratsClient();
    }

    function onContratsTabClick() {
      if (clientDetails.value?.id && clientContrats.value.length === 0) {
        chargerContratsClient();
      }
    }

    async function testerApiContrats() {
      if (!clientDetails.value?.id) {
        console.warn('⚠️ Aucun client sélectionné pour tester l\'API contrats');
        return;
      }
      // Fonction de test - peut être implémentée si nécessaire
      console.log('Test API contrats pour client:', clientDetails.value.id);
    }

    function handleClose() {
      clientDetails.value = null;
      clientContrats.value = [];
      clientHistory.value = [];
      activeTab.value = 'info';
      emit('close');
      emit('update:isVisible', false);
    }

    function handleUpdateVisibility(value: boolean) {
      if (!value) {
        clientDetails.value = null;
        clientContrats.value = [];
        clientHistory.value = [];
        activeTab.value = 'info';
      }
      emit('update:isVisible', value);
    }

    function handleCreateContrat() {
      if (clientDetails.value) {
        emit('createContrat', clientDetails.value);
      }
    }

    function handleFaireCotation() {
      if (clientDetails.value) {
        emit('faireCotation', clientDetails.value);
      }
    }

    function handleCreateHorsConvention() {
      if (clientDetails.value) {
        emit('createHorsConvention', clientDetails.value);
      }
    }

    async function exportHistoryToPdf() {
      if (!clientDetails.value?.id) {
        error('Aucun client sélectionné');
        return;
      }

      try {
        loadingHistory.value = true;
        
        const response = await ApiService.vueInstance.axios.get(
          `/customers/${clientDetails.value.id}/history/pdf`,
          {
            responseType: 'blob',
            headers: { 
              'Accept': 'application/pdf',
              'Authorization': `Bearer ${JwtService.getToken()}`
            }
          }
        );

        // Vérifier que c'est bien un blob
        if (!(response.data instanceof Blob)) {
          throw new Error('Réponse invalide du serveur');
        }

        // Vérifier que le blob n'est pas vide
        if (response.data.size === 0) {
          throw new Error('Le PDF généré est vide');
        }

        // Créer un blob PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        // Extraire le nom de fichier depuis les headers ou utiliser un nom par défaut
        const fallbackFilename = `historique_${clientDetails.value.lastname}_${clientDetails.value.firstname}.pdf`;
        const filename = extractFilenameFromResponse(response, fallbackFilename);
        
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err: any) {
        console.error('❌ Erreur lors de l\'export PDF:', err);
        error('Erreur lors de l\'export de l\'historique en PDF');
      } finally {
        loadingHistory.value = false;
      }
    }

    // Fonctions pour l'historique
    async function chargerHistorique() {
      if (!clientDetails.value?.id) {
        console.warn('⚠️ ID client manquant pour charger l\'historique');
        return;
      }
      
      try {
        loadingHistory.value = true;
        errorHistory.value = null;
        const { data } = await ApiService.get(`/customers/${clientDetails.value.id}/history`);
        
        if (data && data.history && Array.isArray(data.history)) {
          clientHistory.value = data.history;
        } else if (data && data.data && data.data.history && Array.isArray(data.data.history)) {
          clientHistory.value = data.data.history;
        } else {
          console.warn('⚠️ Structure de réponse inattendue pour l\'historique');
          clientHistory.value = [];
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement de l\'historique:', err);
        errorHistory.value = err?.response?.data?.message || 'Erreur lors du chargement de l\'historique';
        clientHistory.value = [];
      } finally {
        loadingHistory.value = false;
      }
    }

    function rechargerHistorique() {
      chargerHistorique();
    }

    function onHistoryTabClick() {
      if (clientDetails.value?.id && clientHistory.value.length === 0 && !loadingHistory.value) {
        chargerHistorique();
      }
    }

    function getHistoryActionLabel(action: string): string {
      const labels: { [key: string]: string } = {
        'CREATE': 'Création',
        'UPDATE': 'Modification',
        'DELETE': 'Suppression'
      };
      return labels[action] || action;
    }

    function getHistoryActionClass(action: string): string {
      const classes: { [key: string]: string } = {
        'CREATE': 'bg-success',
        'UPDATE': 'bg-info',
        'DELETE': 'bg-danger'
      };
      return classes[action] || 'bg-secondary';
    }

    function getHistoryActionIcon(action: string): string {
      const icons: { [key: string]: string } = {
        'CREATE': 'flaticon-plus',
        'UPDATE': 'flaticon-edit',
        'DELETE': 'flaticon-cancel'
      };
      return icons[action] || 'flaticon-info';
    }

    function getFieldLabel(field: string): string {
      const labels: { [key: string]: string } = {
        'firstname': 'Prénom',
        'lastname': 'Nom',
        'email': 'Email',
        'phone': 'Téléphone',
        'address': 'Adresse',
        'birthdate': 'Date de naissance',
        'placeOfBirth': 'Lieu de naissance',
        'occupation': 'Profession',
        'gender': 'Genre',
        'idTypeCustomer': 'Type de client',
        'numCustomer': 'Numéro de client',
        'isActive': 'Statut'
      };
      return labels[field] || field;
    }

    function formatFieldValue(field: string, value: any): string {
      if (value === null || value === undefined) {
        return 'Non renseigné';
      }
      
      // Formatage spécial pour certains champs
      if (field === 'birthdate' && typeof value === 'string') {
        return formatDate(value);
      }
      
      if (field === 'gender') {
        return getGenderText(value);
      }
      
      if (field === 'isActive') {
        return value ? 'Actif' : 'Inactif';
      }
      
      if (field === 'idTypeCustomer' && typeof value === 'number') {
        // Vous pourriez vouloir récupérer le libellé depuis typeCustomer
        return `Type ${value}`;
      }
      
      return String(value);
    }

    function formatIpAddress(ip: string): string {
      if (!ip || ip === 'unknown') {
        return 'Non disponible';
      }
      // Remplacer ::1 par localhost
      if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        return '127.0.0.1 (localhost)';
      }
      return ip;
    }

    function parseUserAgent(userAgent: string): string {
      if (!userAgent || userAgent === 'unknown') {
        return 'Non disponible';
      }

      // Extraire le navigateur et l'OS depuis le User-Agent
      let browser = 'Navigateur inconnu';
      let os = '';

      // Détecter le navigateur
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        browser = 'Chrome';
      } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browser = 'Safari';
      } else if (userAgent.includes('Edg')) {
        browser = 'Edge';
      } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
        browser = 'Opera';
      }

      // Détecter l'OS
      if (userAgent.includes('Windows')) {
        os = 'Windows';
      } else if (userAgent.includes('Mac')) {
        os = 'macOS';
      } else if (userAgent.includes('Linux')) {
        os = 'Linux';
      } else if (userAgent.includes('Android')) {
        os = 'Android';
      } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        os = 'iOS';
      }

      return os ? `${browser} sur ${os}` : browser;
    }

    // Watcher pour charger les détails quand le modal s'ouvre avec un clientId
    watch(() => props.isVisible, async (newValue) => {
      console.log('👀 Watcher isVisible déclenché:', { newValue, clientId: props.clientId, loading: loading.value });
      if (newValue && props.clientId) {
        activeTab.value = 'info';
        loading.value = true;
        errorMessage.value = null;
        clientDetails.value = null; // Réinitialiser avant de charger
        clientContrats.value = [];
        await loadClientDetails();
      } else if (!newValue) {
        // Réinitialiser les données quand le modal se ferme
        clientDetails.value = null;
        clientContrats.value = [];
        clientHistory.value = [];
        errorMessage.value = null;
        errorHistory.value = null;
        loading.value = false;
        activeTab.value = 'info';
      }
    });

    // Watcher pour recharger si clientId change pendant que le modal est ouvert
    watch(() => props.clientId, async (newClientId, oldClientId) => {
      console.log('👀 Watcher clientId déclenché:', { newClientId, oldClientId, isVisible: props.isVisible });
      if (newClientId && props.isVisible && newClientId !== oldClientId) {
        activeTab.value = 'info';
        loading.value = true;
        errorMessage.value = null;
        clientDetails.value = null;
        clientContrats.value = [];
        clientHistory.value = [];
        await loadClientDetails();
      }
    });

    return {
      clientDetails,
      clientContrats,
      loadingContrats,
      loading,
      errorMessage,
      activeTab,
      showContent,
      clientHistory,
      loadingHistory,
      errorHistory,
      loadClientDetails,
      formatDate,
      formatDateTime,
      formatMontant,
      calculateAge,
      getTypeClass,
      getStatutClass,
      getStatutTexte,
      getInitials,
      isMale,
      getGenderText,
      rechargerContrats,
      onContratsTabClick,
      testerApiContrats,
      chargerHistorique,
      rechargerHistorique,
      onHistoryTabClick,
      exportHistoryToPdf,
      getHistoryActionLabel,
      getHistoryActionClass,
      getHistoryActionIcon,
      getFieldLabel,
      formatFieldValue,
      formatIpAddress,
      parseUserAgent,
      handleClose,
      handleUpdateVisibility,
      handleCreateContrat,
      handleFaireCotation,
      handleCreateHorsConvention
    };
  }
});
</script>

<style scoped>
/* Container principal */
.client-info-container {
  padding: 0;
  max-width: 100%;
  overflow-x: hidden;
}

.client-info-tab {
  overflow-x: hidden;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.tab-content {
  display: block !important;
}

.tab-pane {
  display: block !important;
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

.date-card .info-value {
  display: flex;
  align-items: center;
  color: #495057;
}

.date-card .info-value i {
  color: #6c757d;
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

/* Badges */
.badge {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 6px;
}

.nav-tabs-custom .nav-link {
  border: 1px solid transparent;
  border-radius: 0.5rem 0.5rem 0 0;
  margin-bottom: -1px;
}

.nav-tabs-custom .nav-link.active {
  background-color: #fff;
  border-color: #dee2e6 #dee2e6 #fff;
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

/* Styles pour l'historique */
.history-timeline {
  padding: 1rem 0;
}

.history-item {
  padding: 1rem 0;
  position: relative;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.history-action-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.history-date {
  font-size: 0.875rem;
  color: #6c757d;
  display: flex;
  align-items: center;
}

.history-item-body {
  padding-left: 1rem;
  border-left: 2px solid #e9ecef;
  margin-left: 0.5rem;
}

.history-description {
  font-weight: 500;
  color: #212529;
  margin-bottom: 0.5rem;
}

.history-user {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.history-changes {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.75rem;
}

.history-changes-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.history-changes-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-change-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  font-size: 0.875rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.field-name {
  font-weight: 600;
  color: #495057;
  min-width: 120px;
}

.old-value {
  color: #dc3545;
  text-decoration: line-through;
  padding: 0.25rem 0.5rem;
  background: #fff5f5;
  border-radius: 4px;
}

.new-value {
  color: #28a745;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  background: #f0fff4;
  border-radius: 4px;
}

.history-divider {
  height: 1px;
  background: #e9ecef;
  margin: 1rem 0;
}

.history-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e9ecef;
  font-size: 0.875rem;
}

.history-meta-item {
  display: flex;
  align-items: center;
  color: #6c757d;
}

.history-meta-item i {
  color: #868e96;
  margin-right: 0.25rem;
}

.history-meta-item strong {
  color: #495057;
  margin-right: 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
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
</style>

