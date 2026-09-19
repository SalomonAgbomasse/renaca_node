<template>
    <div class="subscriber-main-container">
      <!-- Indicateur de chargement -->
      <div v-if="loading" class="text-center p-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <p class="mt-3 text-muted">Chargement des souscripteurs...</p>
      </div>
  
      <!-- Vue en cartes -->
      <div v-else class="subscribers-cards-container">
        <!-- Message si aucun souscripteur -->
        <div v-if="subscribers.length === 0" class="text-center py-5">
          <div class="empty-state">
            <i class="flaticon-building fs-1 text-muted opacity-50 mb-3"></i>
            <h5 class="text-muted">Aucun souscripteur trouvé</h5>
            <p class="text-muted">Il n'y a actuellement aucun souscripteur dans le système.</p>
          </div>
        </div>
        
        <!-- Carte unique du souscripteur -->
        <div v-else class="row">
          <div 
            v-for="(subscriber, index) in subscribers" 
            :key="`subscriber-${subscriber.id || index}`"
            class="col-12">
            <div class="subscriber-profile">
              <div class="profile-header">
                <div class="profile-title-area">
                  <h1>{{ subscriber.name || 'Sans nom' }}</h1>
                  <div class="profile-badges">
                    <span v-if="subscriber.createdAt">{{ formatDate(subscriber.createdAt?.toString()) }}</span>
                  </div>
                </div>
                <div class="profile-actions">
                  <button 
                    v-if="subscriber.id" 
                    @click="voirDetails(subscriber)" 
                    class="btn-action-primary">
                    <i class="flaticon-eye me-2"></i>
                    Détails
                  </button>
                  <button 
                    v-if="subscriber.id" 
                    @click="modifier(subscriber)" 
                    class="btn-action-secondary">
                    <i class="flaticon-pen me-2"></i>
                    Modifier
                  </button>
                </div>
              </div>
              
              <div class="profile-body">
                <div class="profile-info-grid">
                  <div class="info-group">
                    <div class="info-item">
                      <div class="info-icon">
                        <i class="flaticon-phone-call"></i>
                      </div>
                      <div class="info-content">
                        <div class="info-label">Téléphone</div>
                        <div v-if="subscriber.phone" class="info-text">
                          <a :href="`tel:${subscriber.phone}`">{{ subscriber.phone }}</a>
                        </div>
                        <div v-else class="info-text text-muted">-</div>
                      </div>
                    </div>
                    
                    <div v-if="subscriber.phone2" class="info-item">
                      <div class="info-icon">
                        <i class="flaticon-phone-call"></i>
                      </div>
                      <div class="info-content">
                        <div class="info-label">Téléphone 2</div>
                        <div class="info-text">
                          <a :href="`tel:${subscriber.phone2}`">{{ subscriber.phone2 }}</a>
                        </div>
                      </div>
                    </div>
                    
                    <div class="info-item">
                      <div class="info-icon">
                        <i class="flaticon-email"></i>
                      </div>
                      <div class="info-content">
                        <div class="info-label">Email</div>
                        <div v-if="subscriber.email" class="info-text">
                          <a :href="`mailto:${subscriber.email}`">{{ subscriber.email }}</a>
                        </div>
                        <div v-else class="info-text text-muted">-</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="info-group">
                    <div class="info-item">
                      <div class="info-icon">
                        <i class="flaticon-location"></i>
                      </div>
                      <div class="info-content">
                        <div class="info-label">Adresse</div>
                        <div v-if="subscriber.address" class="info-text">{{ subscriber.address }}</div>
                        <div v-else class="info-text text-muted">-</div>
                      </div>
                    </div>
                    
                    <div class="info-item">
                      <div class="info-icon">
                        <i class="flaticon-printer"></i>
                      </div>
                      <div class="info-content">
                        <div class="info-label">Fax</div>
                        <div v-if="subscriber.fax" class="info-text">{{ subscriber.fax }}</div>
                        <div v-else class="info-text text-muted">-</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  
    <!-- Modal détails -->
    <Modal
      :isVisible="showDetailsModal"
      :title="subscriberDetails ? `Détails du souscripteur ${subscriberDetails.name || 'Sans nom'}` : 'Détails du souscripteur'"
      icon="flaticon-building"
      size="large"
      @close="closeDetailsModal"
      @update:isVisible="showDetailsModal = $event"
    >
      <div v-if="subscriberDetails" class="row g-4">
        <!-- Informations générales -->
        <div class="col-md-6">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-light border-0">
              <h6 class="mb-0 fw-bold text-dark">
                <i class="flaticon-building me-2 text-primary"></i>
                Informations générales
              </h6>
            </div>
            <div class="card-body">
              <div class="info-field mb-3">
                <label class="info-label">Nom</label>
                <div class="info-value">
                  <i class="flaticon-building me-2 text-muted"></i>
                  {{ subscriberDetails.name }}
                </div>
              </div>
              <div class="info-field mb-3">
                <label class="info-label">Date de création</label>
                <div class="info-value">
                  <i class="flaticon-calendar me-2 text-muted"></i>
                  {{ formatDate(subscriberDetails.createdAt) }}
                </div>
              </div>
              <div v-if="subscriberDetails.updatedAt && subscriberDetails.updatedAt !== subscriberDetails.createdAt" class="info-field mb-3">
                <label class="info-label">Dernière modification</label>
                <div class="info-value">
                  <i class="flaticon-refresh me-2 text-muted"></i>
                  {{ formatDate(subscriberDetails.updatedAt) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Informations de Contact -->
        <div class="col-md-6">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-light border-0">
              <h6 class="mb-0 fw-bold text-dark">
                <i class="flaticon-phone-call me-2 text-success"></i>
                Informations de contact
              </h6>
            </div>
            <div class="card-body">
              <div class="info-field mb-3">
                <label class="info-label">Téléphone</label>
                <div class="info-value">
                  <i class="flaticon-phone-call me-2 text-success"></i>
                  <a v-if="subscriberDetails.phone" :href="`tel:${subscriberDetails.phone}`" class="text-decoration-none fw-semibold">
                    {{ subscriberDetails.phone }}
                  </a>
                  <span v-else class="text-muted">Non renseigné</span>
                </div>
              </div>
              <div v-if="subscriberDetails.phone2" class="info-field mb-3">
                <label class="info-label">Téléphone 2</label>
                <div class="info-value">
                  <i class="flaticon-phone-call me-2 text-muted"></i>
                  <a :href="`tel:${subscriberDetails.phone2}`" class="text-decoration-none">
                    {{ subscriberDetails.phone2 }}
                  </a>
                </div>
              </div>
              <div class="info-field mb-3">
                <label class="info-label">Email</label>
                <div class="info-value">
                  <i class="flaticon-email me-2 text-primary"></i>
                  <a v-if="subscriberDetails.email" :href="`mailto:${subscriberDetails.email}`" class="text-decoration-none">
                    {{ subscriberDetails.email }}
                  </a>
                  <span v-else class="text-muted">Non renseigné</span>
                </div>
              </div>
              <div class="info-field mb-3">
                <label class="info-label">Adresse</label>
                <div class="info-value">
                  <i class="flaticon-location me-2 text-muted"></i>
                  {{ subscriberDetails.address || 'Non renseignée' }}
                </div>
              </div>
              <div v-if="subscriberDetails.fax" class="info-field mb-3">
                <label class="info-label">Fax</label>
                <div class="info-value">
                  <i class="flaticon-printer me-2 text-muted"></i>
                  {{ subscriberDetails.fax }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="d-flex justify-content-between w-100">
          <button type="button" class="btn btn-sm btn-outline-secondary fw-bold" 
                  @click="closeDetailsModal">
            <i class="flaticon-cancel me-1"></i>Fermer
          </button>
          
          <button type="button" class="btn btn-sm fw-bold" 
                  style="background-color: #ffc107; color: #231f20; border-color: #ffc107;"
                  v-if="subscriberDetails?.id" 
                  @click="modifier(subscriberDetails)">
            <i class="flaticon-pen me-1"></i>Modifier
          </button>
        </div>
      </template>
    </Modal>

    <!-- Modal d'ajout/édition de souscripteur -->
    <AddSubscriberModal 
      :show="showModal"
      :subscriber-id="selectedSubscriberId || undefined"
      @subscriber-saved="handleSubscriberSaved"
      @modal-closed="showModal = false"
    />
  </template>
  
  <script lang="ts">
  import { defineComponent, onMounted, ref, computed, nextTick, Teleport, watch } from "vue";
  import { useRouter } from "vue-router";
  import Swal from "sweetalert2";
  import ApiService from "../../services/ApiService";
  import { error, success } from "../../utils/utils";
  import { useForm } from 'vee-validate';
  import * as yup from 'yup';
  import PaginationComponent from '../Utilities/Pagination.vue';
  import Modal from '../Common/Modal.vue';
  import AddSubscriberModal from './AddSubscriberModal.vue';
  
  // Interface pour les souscripteurs
  interface Subscriber {
    id: number;
    name: string;
    address: string;
    email: string;
    phone: string;
    phone2?: string;
    fax: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
  }
  
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
    // Relations
    typeCustomer?: {
      id: number;
      libelle: string;
    };
    // Champs optionnels pour compatibilité
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
  
  // Interface pour NatureCredit
  interface NatureCredit {
    id: number;
    libelle: string;
    code: string;
    description?: string;
    isActive?: boolean;
  }
  
  // Interface pour les contrats dans le modal
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
    // Relations
    customer?: any;
    user?: any;
    product?: any;
    contractState?: {
      id: number;
      libelle: string;
    };
    agency?: any;
    createdByUser?: any;
    updatedByUser?: any;
    deletedByUser?: any;
    natureCredit?: NatureCredit;
  }
  
  export default defineComponent({
    name: "ListeSubscriber",
    components: {
      PaginationComponent,
      Modal,
      AddSubscriberModal
    },
    setup() {
      // Composables
      const router = useRouter();
  
      // Refs
      const subscribers = ref<Array<Subscriber>>([]);   
      const subscriberDetails = ref<Subscriber | null>(null);
      const loading = ref(false);
      const showDetailsModal = ref(false);
      const showModal = ref(false);
      const selectedSubscriberId = ref<number | null>(null);
      const conversionModalRef = ref<any>(null);
      const showConversionModal = ref(false);
      const cotationModalRef = ref<any>(null);
      const selectedClientForCotation = ref<Client | null>(null);
      const showCotationModal = ref(false);
      
      // Gestion des rôles
      const userRole = ref<number | null>(null);
      
      // Variables pour le menu d'actions
      const activeActionMenu = ref<number | null>(null);
      const buttonRefs = ref<Record<number, HTMLElement>>({});
      const menuPosition = ref<Record<number, { top: string; left: string }>>({});
      
      // Pagination
      const searchTerm = ref('');
      const page = ref(1);
      const totalPages = ref(0);
      const limit = ref(10);
      const totalElements = ref(0);
  
      // Computed pour vérifier les permissions
      const canCreateHorsConvention = computed(() => {
        // ADMIN (role = 1) ou SUPER ADMIN (role = 5)
        const canCreate = userRole.value === 1 || userRole.value === 5;
       /*  console.log('🔍 canCreateHorsConvention check:', {
          userRole: userRole.value,
          canCreate: canCreate
        }); */
        return canCreate;
      });
  
    const handlePaginate = ({ page_, limit_ }: { page_: number; limit_: number }) => {
      try {
        page.value = page_;
        limit.value = limit_;
        getAllSubscribers(page_, limit_, searchTerm.value);
      } catch (err) {
        console.error('Erreur pagination:', err);
      }
    };

    function rechercher() {
      page.value = 1;
      getAllSubscribers(page.value, limit.value, searchTerm.value);
    }
  
      async function getAllSubscribers(pageNum = 1, limitNum = 10, search = '') {
        try {
          loading.value = true;
          
         /*  console.log("🔗 Appel API /subscribers");
          console.log("📋 Paramètres:", { pageNum, limitNum, search }); */
  
          const response = await ApiService.get('/subscribers');
          //console.log("📦 Réponse API:", response);
          
          const { data } = response;
          
          // Structure réelle : { code: 200, message: string, data: { message: string, subscribers: Subscriber[] }, timestamp: string }
          if (data && data.data && data.data.subscribers && Array.isArray(data.data.subscribers)) {
            let allSubscribers = data.data.subscribers;
            
            // Filtrer par recherche si un terme est fourni
            if (search && search.trim()) {
              const searchLower = search.toLowerCase().trim();
              allSubscribers = allSubscribers.filter(subscriber => 
                subscriber.name?.toLowerCase().includes(searchLower) ||
                subscriber.phone?.toLowerCase().includes(searchLower) ||
                subscriber.email?.toLowerCase().includes(searchLower) ||
                subscriber.address?.toLowerCase().includes(searchLower) ||
                subscriber.fax?.toLowerCase().includes(searchLower)
              );
            }
            
            // Pagination côté frontend
            const startIndex = (pageNum - 1) * limitNum;
            const endIndex = startIndex + limitNum;
            subscribers.value = allSubscribers.slice(startIndex, endIndex);
            
            // Calculer les infos de pagination
            totalElements.value = allSubscribers.length;
            totalPages.value = Math.ceil(allSubscribers.length / limitNum);
            page.value = pageNum;
            limit.value = limitNum;
            
           /*  console.log("✅ Souscripteurs chargés:", {
              total: allSubscribers.length,
              affichés: subscribers.value.length,
              page: pageNum,
              totalPages: totalPages.value
            }); */
          } else {
            console.warn("⚠️ Structure de données inattendue:", data);
            subscribers.value = [];
            totalPages.value = 0;
            totalElements.value = 0;
          }
          
        } catch (err: any) {
          console.error("❌ Erreur lors de la récupération des souscripteurs:", err);
          error(err?.response?.data?.message || "Erreur lors de la récupération des souscripteurs");
          subscribers.value = [];
          totalPages.value = 0;
          totalElements.value = 0;
        } finally {
          loading.value = false;
        }
      }
      
      // Fonction utilitaire pour fermer le modal avant navigation
      function closeModalBeforeNavigation() {
        showDetailsModal.value = false;
      }
  
      // Fonctions de gestion des modals
      function ouvrirModalAjout() {
        selectedSubscriberId.value = null;
        showModal.value = true;
      }

      function modifier(subscriber: Subscriber) {
        selectedSubscriberId.value = subscriber.id;
        showModal.value = true;
        
        // Fermer le modal de détails si ouvert
        showDetailsModal.value = false;
      }

      function handleSubscriberSaved(event: any) {
        showModal.value = false;
        selectedSubscriberId.value = null;
        
        // Rafraîchir la liste
        getAllSubscribers(page.value, limit.value, searchTerm.value);
      }

      async function voirDetails(subscriber: Subscriber) {
        try {
          // Initialiser avec les données de base
          subscriberDetails.value = subscriber;
          
          const { data } = await ApiService.get(`/subscribers/${subscriber.id}`);
          
          if (data && data.data) {
            // L'API retourne { code, message, data: { subscriber: {...} } }
            if (data.data.subscriber) {
              subscriberDetails.value = data.data.subscriber;
            } else {
              subscriberDetails.value = data.data;
            }
          } else {
            subscriberDetails.value = subscriber;
          }
          
          await nextTick();
          
          showDetailsModal.value = true;
          
        } catch (err: any) {
          console.error('❌ Erreur lors du chargement des détails:', err);
          subscriberDetails.value = subscriber;
          showDetailsModal.value = true;
         // console.log('✅ Modal détails ouvert (avec erreur), subscriberDetails:', subscriberDetails.value);
        }
      }
      
      function closeDetailsModal() {
        showDetailsModal.value = false;
        subscriberDetails.value = null;
      }
  
  
  
  
  
  
      async function confirmerSuppression(subscriberToDelete: Subscriber) {
        if (!subscriberToDelete.id) {
          console.error('ID de souscripteur manquant');
          return;
        }
        
        try {
          const result = await Swal.fire({
            title: 'Êtes-vous sûr?',
            text: `Voulez-vous vraiment supprimer définitivement le souscripteur #${subscriberToDelete.id} (${subscriberToDelete.name})?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler',
            heightAuto: false
          });
  
          if (result.isConfirmed) {
            await deleteSubscriber(subscriberToDelete.id);
          }
        } catch (err) {
          console.error('Erreur lors de la confirmation:', err);
        }
      }
  
      async function deleteSubscriber(id: number) {
        try {
          const { data } = await ApiService.delete(`/subscribers/${id}`);
          
          // Supprimer de la liste locale
          subscribers.value = subscribers.value.filter(s => s.id !== id);
          totalElements.value = Math.max(0, totalElements.value - 1);
          
          // Afficher message de succès
          await Swal.fire({
            text: data.message || 'Souscripteur supprimé avec succès',
            toast: true,
            icon: 'success',
            title: 'Suppression réussie',
            animation: false,
            position: 'top-right',
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true,
            heightAuto: false
          });
  
          // Recharger si la page courante est vide
          if (subscribers.value.length === 0 && page.value > 1) {
            page.value--;
            await getAllSubscribers(page.value, limit.value, searchTerm.value);
          }
        } catch (err: any) {
          console.error('Erreur suppression:', err);
          await Swal.fire({
            text: err?.response?.data?.message || 'Erreur lors de la suppression',
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Réessayer",
            heightAuto: false,
            customClass: {
              confirmButton: "btn fw-semibold btn-light-danger",
            },
          });
        }
      }
  
      // Utilitaires de formatage
      function formatDate(dateString: string | null | undefined): string {
        if (!dateString) return '-';
        try {
          if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
          }
          if (dateString.includes('/')) {
            return dateString;
          }
          return new Date(dateString).toLocaleDateString('fr-FR');
        } catch {
          return dateString;
        }
      }

      function formatDateRelative(dateString: string | null | undefined): string {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - date.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) return 'hier';
          if (diffDays < 7) return `il y a ${diffDays} jours`;
          if (diffDays < 30) return `il y a ${Math.ceil(diffDays / 7)} semaines`;
          if (diffDays < 365) return `il y a ${Math.ceil(diffDays / 30)} mois`;
          return `il y a ${Math.ceil(diffDays / 365)} ans`;
        } catch {
          return dateString;
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
  
      // Utilitaires de style
      function getTypeClass(type: string): string {
        const baseClass = 'badge fs-7 px-2 py-1';
        
        switch (type) {
          case 'Personnel':
            return `${baseClass} bg-warning text-dark`;
          case 'Entreprise':
            return `${baseClass} bg-info text-white`;
          case 'Professionnel':
            return `${baseClass} bg-primary text-white`;
          case 'Particulier':
          default:
            return `${baseClass} bg-secondary text-white`;
        }
      }
  
      // Fonction pour obtenir l'icône selon le type
      function getTypeIcon(type: string): string {
        switch (type) {
          case 'Personnel':
            return 'flaticon-user-1';
          case 'Entreprise':
            return 'flaticon-briefcase';
          case 'Professionnel':
            return 'flaticon-user';
          case 'Particulier':
          default:
            return 'flaticon-user';
        }
      }
  
      function getStatutClass(item: any): string {
        const baseClass = 'badge fs-7 px-2 py-1';
        
        if (item.isActive === false) {
          return `${baseClass} bg-danger text-white`;      // Inactif
        } else if (item.isActive === true) {
          return `${baseClass} bg-success text-white`;     // Actif
        } else if (item.contractState?.libelle) {
          // Utiliser le statut du contrat s'il est disponible
          const statut = item.contractState.libelle.toLowerCase();
          if (statut.includes('actif') || statut.includes('active')) {
            return `${baseClass} bg-success text-white`;
          } else if (statut.includes('expiré') || statut.includes('expired')) {
            return `${baseClass} bg-warning text-dark`;
          } else if (statut.includes('annulé') || statut.includes('cancelled')) {
            return `${baseClass} bg-danger text-white`;
          } else if (statut.includes('en attente') || statut.includes('pending')) {
            return `${baseClass} bg-info text-white`;
          } else {
            return `${baseClass} bg-secondary text-white`;
          }
        } else {
          return `${baseClass} bg-secondary text-white`;   // Non défini
        }
      }
  
      function getStatutTexte(item: any): string {
        return 'Actif';
      }

      // Fonctions pour gérer le menu d'actions
      function hasMoreActions(subscriber: Subscriber): boolean {
        return !!(subscriber.id);
      }

      function setButtonRef(subscriberId: number, el: any) {
        if (el && el instanceof HTMLElement) {
          buttonRefs.value[subscriberId] = el;
        } else if (el && (el as any).$el instanceof HTMLElement) {
          buttonRefs.value[subscriberId] = (el as any).$el;
        }
      }

      function getMenuPosition(subscriberId: number): Record<string, string> {
        if (!menuPosition.value[subscriberId]) {
          return { top: '0px', left: '0px' };
        }
        return menuPosition.value[subscriberId];
      }

      function toggleActionMenu(event: Event, subscriberId: number) {
        if (activeActionMenu.value === subscriberId) {
          closeActionMenu();
        } else {
          activeActionMenu.value = subscriberId;
          const button = buttonRefs.value[subscriberId] || (event.currentTarget as HTMLElement);
          
          nextTick(() => {
            if (button) {
              const buttonRect = button.getBoundingClientRect();
              const viewportHeight = window.innerHeight;
              const viewportWidth = window.innerWidth;
              
              const menuHeight = 200;
              const menuWidth = 180;
              
              let menuTop = buttonRect.bottom + 8;
              let menuLeft = buttonRect.right - menuWidth;
              
              if (buttonRect.bottom + menuHeight + 10 > viewportHeight) {
                menuTop = buttonRect.top - menuHeight - 8;
                if (menuTop < 10) {
                  menuTop = buttonRect.bottom + 8;
                }
              }
              
              if (buttonRect.right - menuWidth < 10) {
                menuLeft = buttonRect.left - menuWidth;
              }
              
              if (menuLeft < 10) {
                menuLeft = 10;
              }
              
              menuPosition.value[subscriberId] = {
                top: `${menuTop}px`,
                left: `${menuLeft}px`
              };
            }
          });
          
          setTimeout(() => {
            document.addEventListener('click', closeActionMenuOnOutsideClick, { once: true });
          }, 50);
        }
      }

      function closeActionMenu() {
        activeActionMenu.value = null;
        setTimeout(() => {
          if (!activeActionMenu.value) {
            menuPosition.value = {};
          }
        }, 200);
      }

      function closeActionMenuOnOutsideClick(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.action-dropdown-menu') && !target.closest('.btn-action-more')) {
          closeActionMenu();
        }
      }
  
  
      // Fonction pour charger le rôle de l'utilisateur
      async function loadUserRole() {
        try {
          //console.log('🔍 Chargement du rôle utilisateur...');
          const response = await ApiService.get('auth/profile');
          
          if (response.data && response.data.data && response.data.data.user) {
            const user = response.data.data.user;
            //console.log('👤 Utilisateur:', user);
            
            // Mapping des rôles (comme dans MainSidebar.vue)
            const roleMapping: { [key: string]: number } = {
              'ADMIN': 1,
              'MANAGER': 2,
              'USER': 3,
              'SUPER ADMIN': 5
            };
            
            if (user.role && user.role.libelle) {
              userRole.value = roleMapping[user.role.libelle] || null;
              //console.log('🔍 Rôle utilisateur chargé:', user.role.libelle, '-> userRole:', userRole.value);
             // console.log('🔍 canCreateHorsConvention après chargement:', canCreateHorsConvention.value);
            } else {
              console.warn('⚠️ Rôle utilisateur non trouvé');
              userRole.value = null;
            }
          } else {
            console.warn('⚠️ Structure de réponse profil inattendue');
            userRole.value = null;
          }
        } catch (err: any) {
          console.error('❌ Erreur lors du chargement du rôle utilisateur:', err);
          userRole.value = null;
        }
      }

  
      // Lifecycle
      onMounted(async () => {
        try {
          await getAllSubscribers();
        } catch (err) {
          console.error('❌ Erreur dans onMounted:', err);
        }
      });
  
      return {
        // Refs
        subscribers,
        subscriberDetails,
        loading,
        showModal,
        selectedSubscriberId,
        showDetailsModal,
        searchTerm,
        page, 
        totalPages,
        limit,
        totalElements,
        
        // Methods
        getAllSubscribers,
        deleteSubscriber,
        confirmerSuppression,
        voirDetails,
        modifier,
        ouvrirModalAjout,
        handleSubscriberSaved,
        handlePaginate,
        rechercher,
        formatDate,
        formatDateRelative,
        getStatutTexte,
        // Variables pour le menu d'actions
        activeActionMenu,
        hasMoreActions,
        setButtonRef,
        getMenuPosition,
        toggleActionMenu,
        closeActionMenu,
        closeDetailsModal
      };
    },
  });
  </script>
  
  <style scoped>
  /* Optimisation mobile pour le header */
  @media (max-width: 768px) {
    .card-head {
      padding: 10px 15px !important;
    }
    
    .search-box {
      width: 200px !important;
      max-width: 200px !important;
    }
    
    .search-box input {
      font-size: 14px !important;
      padding: 8px 12px !important;
    }
    
    .default-btn {
      font-size: 13px !important;
      padding: 8px 12px !important;
    }
  }
  </style>
  
  <style scoped>
  .info-item {
    margin-bottom: 1rem;
  }
  
  .info-item label {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
  }
  
  .modal-xl {
    max-width: 80vw;
  }
  
  @media (min-width: 1400px) {
    .modal-xl {
      max-width: 1200px;
    }
  }
  
  .table th {
    background-color: #f8f9fa;
    border-bottom: 2px solid #dee2e6;
  }
  
  .table td {
    vertical-align: middle;
  }
  
  .badge {
    font-size: 0.875rem;
  }
  
  .search-box {
    width: 300px;
  }
  
  .search-box input {
    padding-left: 15px;
    padding-right: 40px;
  }
  
  .search-box button {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
  
  .avatar-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
    border: 2px solid #dee2e6;
    font-weight: bold;
    font-size: 14px;
    text-transform: uppercase;
  }
  
  .avatar-large {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
    border: 3px solid #dee2e6;
    margin: 0 auto;
  }
  
  /* Styles pour les badges colorés */
  .bg-pink {
    background-color: #e91e63 !important;
    color: white !important;
  }
  
  /* Style pour les onglets personnalisés */
  .nav-tabs-custom .nav-link {
    border: 1px solid transparent;
    border-radius: 0.5rem 0.5rem 0 0;
    margin-bottom: -1px;
  }
  
  .nav-tabs-custom .nav-link.active {
    background-color: #fff;
    border-color: #dee2e6 #dee2e6 #fff;
  }
  
  /* Responsive design pour les tableaux */
  @media (max-width: 768px) {
    .table-responsive {
      font-size: 0.875rem;
    }
    
    .avatar-circle {
      width: 30px;
      height: 30px;
    }
    
    .search-box {
      width: 250px;
    }
  }
  
  /* Styles personnalisés avec les couleurs de l'entreprise */
  
  /* Styles pour l'avatar de profil */
  .avatar-profile {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 3px solid #dee2e6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    font-weight: bold;
    font-size: 2rem;
    text-transform: uppercase;
  }
  
  .avatar-profile i {
    font-size: 2.5rem;
  }
  
  /* Styles pour les champs d'information */
  .info-field {
    margin-bottom: 1.5rem;
  }
  
  .info-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6c757d;
    margin-bottom: 0.5rem;
  }
  
  .info-value {
    font-size: 0.95rem;
    color: #495057;
    font-weight: 500;
    display: flex;
    align-items: center;
    min-height: 1.5rem;
  }
  
  .info-value i {
    font-size: 1rem;
    width: 20px;
    text-align: center;
  }
  
  /* Styles pour les badges personnalisés */
  .bg-pink {
    background-color: #e91e63 !important;
    color: white !important;
  }
  
  /* Styles pour les badges de type de client plus subtils */
  .badge.bg-light {
    background-color: #f8f9fa !important;
    border: 1px solid #dee2e6 !important;
    color: #6c757d !important;
    font-weight: 500;
    padding: 0.375rem 0.75rem;
  }
  
  .badge.bg-light.text-dark {
    color: #495057 !important;
    font-weight: 600;
  }
  
  /* Styles pour les cartes */
  .card {
    transition: all 0.3s ease;
  }
  
  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
  }
  
  /* Styles pour les boutons au survol */
  .btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    transition: all 0.2s ease;
  }
  
  /* Animation pour les cartes */
  .card {
    transition: box-shadow 0.3s ease;
  }
  
  .card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  /* Colonne Actions fixe à droite - Style professionnel */
  .sticky-actions {
    position: sticky !important;
    right: 0 !important;
    background-color: white !important;
    z-index: 10;
    min-width: 180px;
    white-space: nowrap;
    padding: 8px 12px !important;
    transition: box-shadow 0.3s ease;
    isolation: isolate; /* Créer un nouveau contexte d'empilement */
    box-shadow: none;
  }
  
  /* Ombre subtile pour indiquer la colonne fixe */
  .table-responsive:hover .sticky-actions {
    box-shadow: -3px 0 8px rgba(0, 0, 0, 0.08);
  }
  
  .table thead th.sticky-actions {
    background-color: #f8f9fa !important;
    z-index: 11;
    border-left: 1px solid #dee2e6;
    text-align: center;
    position: sticky !important;
    right: 0 !important;
  }
  
  .table tbody td.sticky-actions {
    border-left: 1px solid #e9ecef;
    text-align: center;
    background-color: white !important;
    position: sticky !important;
    right: 0 !important;
  }
  
  /* Groupe de boutons d'action */
  .action-buttons-group {
    display: flex;
    gap: 6px;
    justify-content: center;
    align-items: center;
    flex-wrap: nowrap;
    position: relative;
  }
  
  /* Menu déroulant pour actions supplémentaires */
  .action-buttons-group .dropdown {
    position: relative;
  }
  
  .action-dropdown-menu {
    position: fixed !important;
    min-width: 220px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    border-radius: 8px;
    border: 1px solid #dee2e6;
    background-color: white !important;
    z-index: 10000 !important;
    padding: 5px 0;
    display: none;
    max-height: 300px;
    overflow-y: auto;
    margin: 0 !important;
  }
  
  .action-dropdown-menu.show {
    display: block;
    animation: fadeInDown 0.2s ease-out;
  }
  
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .action-dropdown-menu .dropdown-item {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    color: #212529;
    text-decoration: none;
    transition: background-color 0.2s ease;
    cursor: pointer;
  }
  
  .action-dropdown-menu .dropdown-item:hover {
    background-color: #f8f9fa;
  }
  
  .action-dropdown-menu .dropdown-item.text-danger {
    color: #dc3545;
  }
  
  .action-dropdown-menu .dropdown-item.text-danger:hover {
    background-color: #fff5f5;
  }
  
  .action-dropdown-menu .dropdown-divider {
    margin: 5px 0;
    border-top: 1px solid #e9ecef;
  }
  
  /* Style des boutons d'action */
  .btn-action {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 16px;
    padding: 0;
    background-color: transparent;
    color: #6c757d;
  }
  
  .btn-action:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  .btn-action:active {
    transform: translateY(0);
  }
  
  .btn-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  /* Bouton Voir détails */
  .btn-action-view {
    color: #0d6efd;
    background-color: rgba(13, 110, 253, 0.1);
  }
  
  .btn-action-view:hover {
    background-color: rgba(13, 110, 253, 0.2);
    color: #0d6efd;
  }
  
  /* Bouton Modifier */
  .btn-action-edit {
    color: #ffc107;
    background-color: rgba(255, 193, 7, 0.1);
  }
  
  .btn-action-edit:hover {
    background-color: rgba(255, 193, 7, 0.2);
    color: #ffc107;
  }
  
  /* Bouton Plus d'actions */
  .btn-action-more {
    color: #6c757d;
    background-color: rgba(108, 117, 125, 0.1);
  }
  
  .btn-action-more:hover {
    background-color: rgba(108, 117, 125, 0.2);
    color: #495057;
  }
  
  /* Colonne Actions - permettre les clics sur les boutons */
  .table td:last-child {
    pointer-events: none;
  }
  
  .table td:last-child .action-buttons-group {
    pointer-events: auto;
  }
  
  .table td:last-child .btn-action {
    pointer-events: auto;
    cursor: pointer;
  }
  
  /* Indicateur visuel pour scroll horizontal */
  .table-responsive {
    position: relative;
    overflow-x: auto;
  }
  
  .table-responsive::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 30px;
    height: 100%;
    background: linear-gradient(to left, rgba(255, 255, 255, 0.9), transparent);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 5;
  }
  
  .table-responsive:not(:hover)::after {
    opacity: 1;
  }
  
  /* Styles pour les onglets gérés par Vue */
  .nav-tabs-custom .nav-link {
    border: 1px solid transparent;
    border-radius: 0.5rem 0.5rem 0 0;
    margin-bottom: -1px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .nav-tabs-custom .nav-link.active {
    background-color: #fff;
    border-color: #dee2e6 #dee2e6 #fff;
    color: #0d6efd;
    font-weight: 600;
  }
  
  .nav-tabs-custom .nav-link:not(.active) {
    color: #6c757d;
  }
  
  .nav-tabs-custom .nav-link:not(.active):hover {
    color: #0d6efd;
    background-color: #f8f9fa;
  }
  
  /* Forcer l'affichage des tab-pane quand ils sont visibles via v-show */
  .tab-content .tab-pane[style*="display: block"],
  .tab-content .tab-pane:not([style*="display: none"]) {
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
  
  /* Conteneur principal sans marges */
  .subscriber-main-container {
    padding: 0 !important;
    margin: 0 !important;
  }
  
  /* Styles pour les cartes de souscripteurs */
  .subscribers-cards-container {
    min-height: 400px;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  /* Design minimaliste et professionnel */
  .subscriber-profile {
    background: #ffffff;
  }
  
  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 3rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .profile-title-area h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }
  
  .profile-badges {
    display: flex;
    gap: 1.5rem;
    font-size: 0.8125rem;
    color: #6b7280;
  }
  
  .profile-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .btn-action-primary,
  .btn-action-secondary {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  .btn-action-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-action-primary:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
  }
  
  .btn-action-secondary {
    background: #f59e0b;
    color: white;
  }
  
  .btn-action-secondary:hover {
    background: #d97706;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);
  }
  
  .btn-action-primary i,
  .btn-action-secondary i {
    font-size: 0.875rem;
  }
  
  .profile-body {
    padding: 3rem;
  }
  
  .profile-info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 3rem;
  }
  
  .info-group {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .info-item {
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
  }
  
  .info-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9fafb;
    border-radius: 0.5rem;
    flex-shrink: 0;
  }
  
  .info-icon i {
    font-size: 1.25rem;
    color: #6b7280;
  }
  
  .info-content {
    flex: 1;
  }
  
  .info-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #9ca3af;
    margin-bottom: 0.5rem;
  }
  
  .info-text {
    font-size: 1rem;
    color: #111827;
    font-weight: 500;
  }
  
  .info-text a {
    color: #111827;
    text-decoration: none;
  }
  
  .info-text a:hover {
    color: #3b82f6;
    text-decoration: underline;
  }
  
  .info-text.text-muted {
    color: #9ca3af;
    font-style: italic;
  }
  
  .empty-state {
    padding: 3rem 1rem;
  }
  
  .empty-state i {
    display: block;
    margin: 0 auto;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .profile-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1.5rem;
      padding: 1.5rem 1.25rem;
    }
    
    .profile-title-area h1 {
      font-size: 1.5rem;
    }
    
    .profile-actions {
      width: 100%;
      justify-content: flex-end;
    }
    
    .profile-body {
      padding: 1.5rem 1.25rem;
    }
    
    .profile-info-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    
    .info-group {
      gap: 1.5rem;
    }
  }
  </style>