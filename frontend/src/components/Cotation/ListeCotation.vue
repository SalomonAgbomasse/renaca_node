<template>
  <div>
    <div class="card mb-25 border-0 rounded-0 bg-white letter-spacing">
    <div
      class="card-head box-shadow bg-white d-flex align-items-center justify-content-between p-15 p-sm-20 p-md-25">
      <div class="d-flex align-items-center">
        <router-link
          class="default-btn position-relative transition border-0 fw-medium text-white pt-11 pb-11 ps-15 pe-15 ps-md-25 pe-md-25 pt-md-12 pb-md-12 ps-md-30 pe-md-30 rounded-1 bg-success fs-14 fs-md-15 fs-lg-16 d-inline-block me-10 mb-0 text-decoration-none"
          to="/ajouter-cotation">
          <i class="flaticon-plus position-relative ms-2 ms-md-5 fs-12"></i>
          <span class="d-none d-sm-inline">Faire une cotation</span>
          <span class="d-sm-none">Cotation</span>
        </router-link>
      </div>
      <div class="d-flex align-items-center">
        <form class="search-box position-relative me-15" @submit.prevent="rechercher">
          <input
            type="text"
            v-model="searchTerm"
            @keyup="rechercher"
            class="form-control shadow-none text-black rounded-0 border-0"
            placeholder="Rechercher..."
          />
          <button
            type="submit"
            class="bg-transparent text-primary transition p-0 border-0"
          >
            <i class="flaticon-search-interface-symbol"></i>
          </button>
        </form>
      </div>
    </div>
    
    <!-- Skeleton loader -->
    <div v-if="loading" class="card-body p-15 p-sm-20 p-md-25">
      <div class="table-responsive">
        <table class="table text-nowrap align-middle mb-0">
          <thead>
            <tr>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Référence</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Client</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Type Client</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Capital</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Prime TTC</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Prime Décès</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Surprime</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Accessoires</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Frais Médicaux</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Durée</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Créé par</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Date création</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3 pe-0">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in 8" :key="i" class="skeleton-row">
              <td><div class="skeleton-line" style="width: 90px;"></div></td>
              <td>
                <div class="d-flex align-items-center">
                  <div class="skeleton-circle me-3"></div>
                  <div>
                    <div class="skeleton-line" style="width: 120px;"></div>
                    <div class="skeleton-line mt-1" style="width: 80px; height: 10px;"></div>
                  </div>
                </div>
              </td>
              <td><div class="skeleton-badge"></div></td>
              <td><div class="skeleton-line" style="width: 80px;"></div></td>
              <td><div class="skeleton-line" style="width: 80px;"></div></td>
              <td><div class="skeleton-line" style="width: 80px;"></div></td>
              <td><div class="skeleton-line" style="width: 70px;"></div></td>
              <td><div class="skeleton-line" style="width: 70px;"></div></td>
              <td><div class="skeleton-line" style="width: 70px;"></div></td>
              <td><div class="skeleton-badge"></div></td>
              <td><div class="skeleton-line" style="width: 100px;"></div></td>
              <td><div class="skeleton-line" style="width: 80px;"></div></td>
              <td><div class="skeleton-btn"></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="card-body p-15 p-sm-20 p-md-25">
      <div class="table-responsive">
        <table class="table text-nowrap align-middle mb-0">
          <thead>
            <tr>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Référence</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Client</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Type Client</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Capital</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Prime TTC</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Prime Décès</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Surprime</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Accessoires</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Frais Médicaux</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Durée</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Créé par</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Date création</th>
              <th key="actions" scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3 text pe-0">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="contrats.length === 0">
              <td colspan="13" class="text-center text-muted py-4">
                Aucune cotation trouvée
              </td>
            </tr>
            <tr v-for="(contrat, index) in contrats" :key="`cotation-${contrat.id || index}`">
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <a href="javascript:void(0);" @click="voirDetails(contrat)" class="text-primary text-decoration-underline fw-bold">
                  {{ contrat.reference }}
                </a>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <div>
                  <strong v-if="getClientFullName(contrat)">
                    {{ getClientFullName(contrat) }}
                  </strong>
                  <span v-else class="text-muted fst-italic">
                    Client non défini
                  </span>
                </div>
                <div v-if="getClientBirthdate(contrat)" class="mt-1 d-flex align-items-center gap-1 flex-wrap">
                  <small class="text-muted">
                    <i class="flaticon-calendar me-1"></i>Né(e) le {{ formatBirthdate(getClientBirthdate(contrat)) }}
                  </small>
                  <span v-if="getAgeAtCotation(contrat) !== null" class="badge bg-light text-dark border ms-1 fw-bold fs-11" style="padding: 2px 6px;">
                    {{ getAgeAtCotation(contrat) }} ans
                  </span>
                </div>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <span class="badge bg-info text-white">
                  {{ contrat.typeCustomer?.libelle || contrat.customer?.typeCustomer?.libelle || contrat.typeAss || 'CLIENT ORDINAIRE' }}
                </span>
              </td>
              
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <strong class="text-success">{{ formatMontant(contrat.capital) }}</strong>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <strong class="text-warning">{{ formatMontant(contrat.puttc) }}</strong>
              </td>


              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <strong class="text-danger">{{ formatMontant(contrat.pd) }}</strong>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <strong class="text-info">{{ formatMontant(contrat.surp) }}</strong>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <strong class="text-primary">{{ formatMontant(contrat.acc) }}</strong>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <strong class="text-warning">{{ formatMontant(contrat.fm) }}</strong>
              </td>
              
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <span class="badge bg-secondary">
                  {{ contrat.duration }} mois
                </span>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <div v-if="contrat.user">
                  <strong>{{ contrat.user.lastname }} {{ contrat.user.firstname }}</strong>
                  <br>
                  <small class="text-muted">{{ contrat.user.email }}</small>
                </div>
                <span v-else class="text-muted">Utilisateur non défini</span>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                {{ formatDate(contrat.dateSaisie || contrat.createdAt) }}
              </td>


              <td class="shadow-none lh-1 fw-medium text-body-tertiary text pe-0">
                <div class="dropdown">
                  <span class="badge text-white bg-primary fs-15 dropdown-toggle" 
                        data-bs-toggle="dropdown" 
                        aria-expanded="false"
                        style="cursor: pointer;">
                    Actions
                    <i class="flaticon-chevron-2 position-relative ms-5 top-2 fs-15"></i>
                  </span>
                  <ul class="dropdown-menu">
                    <!-- Voir les détails -->
                    <li v-if="contrat.id">
                      <a class="dropdown-item d-flex align-items-center" 
                        href="javascript:void(0);" 
                        @click="voirDetails(contrat)">
                        <i class="flaticon-eye lh-1 me-8 position-relative top-1"></i>
                        Voir détails
                      </a>
                    </li>

                    <!-- Convertir en contrat -->
                    <li v-if="contrat.id && contrat.isActive">
                      <a class="dropdown-item d-flex align-items-center" 
                        href="javascript:void(0);" 
                        @click="convertirEnContrat(contrat)">
                        <i class="flaticon-file-1 lh-1 me-8 position-relative top-1"></i>
                        Convertir en contrat
                      </a>
                    </li>
                    
                    <!-- Modifier -->
                    <li v-if="contrat.id && contrat.isActive">
                      <a class="dropdown-item d-flex align-items-center" 
                        href="javascript:void(0);" 
                        @click="modifier(contrat)">
                        <i class="flaticon-pen lh-1 me-8 position-relative top-1"></i>
                        Modifier
                      </a>
                    </li>

                    <!-- Télécharger PDF -->
                    <li v-if="contrat.id">
                      <hr class="dropdown-divider">
                      <a class="dropdown-item d-flex align-items-center text-primary" 
                         href="javascript:void(0);" 
                         @click="genererPDFCotation(contrat)">
                        <i class="ph-bold ph-download-simple lh-1 me-8 position-relative top-1 fs-16"></i>
                        Télécharger PDF
                      </a>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div
        class="pagination-area d-md-flex mt-15 mt-sm-20 mt-md-25 justify-content-between align-items-center"
        v-if="totalElements > 0"
      >
        <PaginationComponent 
          :page="page" 
          :totalPages="totalPages" 
          :totalElements="totalElements" 
          :limit="limit" 
          @paginate="handlePaginate" 
        />
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import Swal from "sweetalert2";
import ApiService from "../../services/ApiService";
import { suppression, error, success } from "../../utils/utils";
import PaginationComponent from '../Utilities/Pagination.vue';

import { nextTick } from 'vue';

// Interface pour les cotations
interface Contrat {
  id: number;
  uuid?: string;
  lastname?: string;
  firstname?: string;
  birthdate?: string;
  idUser: number;
  idTypeCustomer?: number;
  idNatureCredit?: number;
  idPeriodicite?: number;
  typeCustomer?: {
    id: number;
    libelle: string;
  };
  natureCredit?: {
    id: number;
    libelle: string;
    code?: string;
  };
  periodicite?: {
    id: number;
    libelle: string;
  };
  updatedBy?: number;
  deletedBy?: number;
  idAgency: number;
  idCustomer?: number;
  idCreditType: number;
  typeAss: string;
  capital: number;
  capitalInteret?: number;
  duration: number;
  pd?: number;
  pc?: number;
  surp?: number;
  acc?: number;
  fm?: number;
  puttc: number;
  reference: string;
  description?: string;
  isActive: boolean;
  
  // Relations
  user?: {
    id: number;
    firstname: string;
    lastname: string;
    email?: string;
  };
  agency?: {
    id: number;
    libelle: string;
  };
  customer?: {
    id: number;
    code?: string;
    lastname: string;
    firstname: string;
    email?: string;
    phone: string;
    address?: string;
    birthdate?: string;
    gender?: string;
    occupation?: string;
    typeCustomer?: {
      id: number;
      libelle: string;
      description?: string;
    };
  };
  
  dateSaisie?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export default defineComponent({
  name: "ListeCotations",
  components: {
    PaginationComponent
  },
  setup() {
    // Composables
    const router = useRouter();
    const route = useRoute();

    // Refs
    const contrats = ref<Array<Contrat>>([]);   
    const contrat = ref<Contrat | null>(null);
    const contratDetails = ref<Contrat | null>(null);
    const loading = ref(false);
    const showDetailsModal = ref(false);

    // Pagination
    const searchTerm = ref('');
    const page = ref(1);
    const totalPages = ref(0);
    const limit = ref(10);
    const totalElements = ref(0);


    const handlePaginate = ({ page_, limit_ }: { page_: number; limit_: number }) => {
      try {
        page.value = page_;
        limit.value = limit_;
        getAllContrats(page_, limit_, searchTerm.value);
      } catch (err) {
        console.error('Erreur pagination:', err);
      }
    };

    function rechercher() {
      page.value = 1;
      getAllContrats(page.value, limit.value, searchTerm.value);
    }

    async function getAllContrats(pageNum = page.value, limitNum = limit.value, search = searchTerm.value) {
      try {
        loading.value = true;
        
        const params: any = {
          page: pageNum,
          limit: limitNum,
          search: search && search.trim() ? search.trim() : undefined
        };

        if (route.query.my === '1' || route.query.my === 'true') {
          params.my = '1';
        }
        
        const { data } = await ApiService.get(`/cotations`, { params });
        
        if (data && data.data && data.data.cotations && Array.isArray(data.data.cotations)) {
          contrats.value = data.data.cotations;
          
          if (data.data.pagination) {
            totalElements.value = data.data.pagination.total;
            totalPages.value = data.data.pagination.totalPages;
            page.value = data.data.pagination.page;
            limit.value = data.data.pagination.limit;
          } else {
            totalElements.value = data.data.cotations.length;
            totalPages.value = Math.ceil(data.data.cotations.length / limitNum);
            page.value = pageNum;
            limit.value = limitNum;
          }
        } else {
          contrats.value = [];
          totalPages.value = 0;
          totalElements.value = 0;
        }
      } catch (err: any) {
        console.error("❌ Erreur lors de la récupération:", err);
        error(err?.response?.data?.message || "Erreur lors de la récupération des contrats");
        contrats.value = [];
        totalPages.value = 0;
        totalElements.value = 0;
      } finally {
        loading.value = false;
      }
    }
    
    // Fonction pour convertir une cotation en contrat
    function convertirEnContrat(cotation: Contrat) {
      closeDetailsModal();
      const identifier = cotation.uuid || cotation.id;
      router.push({
        path: '/ajouter-cotation',
        query: {
          cotationId: identifier.toString(),
          action: 'convert'
        }
      });
    }

    // Fonction modifier corrigée
    function modifier(editContrat: Contrat) {
      closeDetailsModal();
      const identifier = editContrat.uuid || editContrat.id;
      router.push({
        path: '/ajouter-cotation',
        query: {
          cotationId: identifier.toString(),
          action: 'edit'
        }
      });
    }

    async function voirDetails(contrat: Contrat) {
      const identifier = (contrat as any).uuid || contrat.id;
      if (identifier) {
        router.push(`/details-cotation/${identifier}`);
      }
    }

    function closeDetailsModal() {
      showDetailsModal.value = false;
      contratDetails.value = null;
    }


    async function confirmerSuppression(cotationToDelete: Contrat) {
      if (!cotationToDelete.id) {
        console.error('ID de cotation manquant');
        return;
      }
      
      try {
        const result = await Swal.fire({
          title: 'Êtes-vous sûr?',
          text: `Voulez-vous vraiment supprimer définitivement la cotation ${cotationToDelete.reference}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Oui, supprimer',
          cancelButtonText: 'Annuler',
          heightAuto: false
        });

        if (result.isConfirmed) {
          await deleteContrat(cotationToDelete.id);
        }
      } catch (err) {
        console.error('Erreur lors de la confirmation:', err);
      }
    }

    async function deleteContrat(id: number) {
      try {
        const { data } = await ApiService.delete(`/cotations/${id}`);
        
        // Supprimer de la liste locale
        contrats.value = contrats.value.filter(c => c.id !== id);
        totalElements.value = Math.max(0, totalElements.value - 1);
        
        // Afficher message de succès
        await Swal.fire({
          text: data.message || 'Cotation supprimée avec succès',
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
        if (contrats.value.length === 0 && page.value > 1) {
          page.value--;
          await getAllContrats(page.value, limit.value, searchTerm.value);
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

    async function genererPDFCotation(cotation: Contrat) {
      const identifier = cotation.uuid || cotation.id;
      if (!identifier) return;
      try {
        const response = await ApiService.vueInstance.axios.get(`/contracts/cotation/${identifier}/pdf`, {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf',
          }
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `cotation_${cotation.reference || cotation.id}.pdf`;
        link.click();
        
        await Swal.fire({
          toast: true,
          icon: 'success',
          title: 'PDF téléchargé',
          text: 'Le PDF de la cotation a été généré avec succès.',
          position: 'top-right',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          heightAuto: false
        });
      } catch (err) {
        console.error('Erreur PDF cotation:', err);
        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de télécharger le PDF de la cotation.',
          heightAuto: false
        });
      }
    }

    // Utilitaires de formatage
    function formatDate(dateString: string | null | undefined): string {
      if (!dateString) return '-';
      try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) {
          return dateString;
        }
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
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

    function parseAnyDate(dateStr: any): Date | null {
      if (!dateStr) return null;
      if (dateStr instanceof Date) {
        return isNaN(dateStr.getTime()) ? null : dateStr;
      }
      if (typeof dateStr !== 'string') {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
      }

      const str = dateStr.trim();
      if (!str) return null;

      if (str.includes('/')) {
        const [datePart] = str.split(' ');
        const parts = datePart.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const d = new Date(year, month, day);
            if (!isNaN(d.getTime())) return d;
          }
        }
      }

      if (str.includes('-') && !str.includes('T')) {
        const parts = str.split(' ')[0].split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const d = new Date(year, month, day);
            if (!isNaN(d.getTime())) return d;
          } else if (parts[2].length === 4) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const d = new Date(year, month, day);
            if (!isNaN(d.getTime())) return d;
          }
        }
      }

      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    }

    function calculateAgeBetweenDates(birthDateInput: any, referenceDateInput: any): number | null {
      const birth = parseAnyDate(birthDateInput);
      if (!birth) return null;

      const ref = parseAnyDate(referenceDateInput) || new Date();

      let age = ref.getFullYear() - birth.getFullYear();
      const monthDiff = ref.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
        age--;
      }

      return (age >= 0 && age <= 125) ? age : null;
    }

    function getClientBirthdate(contrat: any): string | null {
      if (!contrat) return null;
      return (
        contrat.customer?.birthdate ||
        contrat.birthdate ||
        contrat.customer?.dateNaissance ||
        contrat.dateNaissance ||
        null
      );
    }

    function getCotationDate(contrat: any): string | null {
      if (!contrat) return null;
      return (
        contrat.dateSaisie ||
        contrat.createdAt ||
        contrat.dateCreation ||
        contrat.created_at ||
        null
      );
    }

    function getClientFullName(contrat: any): string | null {
      if (!contrat) return null;
      if (contrat.customer) {
        const last = (contrat.customer.lastname || contrat.customer.nom || '').trim();
        const first = (contrat.customer.firstname || contrat.customer.prenom || '').trim();
        if (last || first) {
          return `${last.toUpperCase()} ${first}`.trim();
        }
      }
      const last = (contrat.lastname || contrat.nom || '').trim();
      const first = (contrat.firstname || contrat.prenom || '').trim();
      if (last || first) {
        return `${last.toUpperCase()} ${first}`.trim();
      }
      return null;
    }

    function getAgeAtCotation(contrat: any): number | null {
      const birthdate = getClientBirthdate(contrat);
      const cotationDate = getCotationDate(contrat);
      return calculateAgeBetweenDates(birthdate, cotationDate);
    }

    function formatBirthdate(dateString: string | null | undefined): string {
      if (!dateString) return '';
      try {
        const d = parseAnyDate(dateString);
        if (!d) return dateString;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      } catch {
        return dateString;
      }
    }


    // Fonction pour ouvrir automatiquement le modal d'un contrat
    async function ouvrirContratAutomatiquement(contractCode: string) {
      try {
        
        // Chercher la cotation dans la liste actuelle
        let contratTrouve = contrats.value.find(c => c.reference === contractCode);
        
        if (!contratTrouve) {
          // Si la cotation n'est pas dans la liste actuelle, la chercher via l'API
          const { data } = await ApiService.get(`/cotations/${contractCode}`);
          
          if (data && data.data && data.data.cotation) {
            contratTrouve = data.data.cotation;
          } else {
            error(`Cotation ${contractCode} non trouvée`);
            return;
          }
        }
        
        // Vérification de sécurité TypeScript
        if (!contratTrouve) {
          error(`Impossible de charger le contrat ${contractCode}`);
          return;
        }
        
        // Ouvrir le modal avec les détails du contrat
        await voirDetails(contratTrouve);
        
        
      } catch (err: any) {
        console.error('❌ Erreur lors de l\'ouverture automatique:', err);
        error(`Erreur lors de l'ouverture du contrat ${contractCode}`);
      }
    }

    // Watcher pour détecter les paramètres de requête
    watch(() => route.query, async (newQuery) => {
      const openContract = newQuery.openContract as string;
      const autoOpen = newQuery.autoOpen as string;
      
      if (openContract && autoOpen === 'true') {
        
        // Attendre que les contrats soient chargés
        if (contrats.value.length === 0) {
          await getAllContrats();
        }
        
        // Ouvrir le modal automatiquement
        await ouvrirContratAutomatiquement(openContract);
        
        // Nettoyer les paramètres de requête pour éviter les réouvertures
        router.replace({ 
          path: route.path,
          query: { ...route.query, openContract: undefined, autoOpen: undefined }
        });
      }
    }, { immediate: true });

    watch(() => route.query.my, () => {
      page.value = 1;
      getAllContrats(1, limit.value, searchTerm.value);
    });

    // Lifecycle
    onMounted(async () => {
      await getAllContrats();
      
      // Vérifier les paramètres de requête après le montage
      const openContract = route.query.openContract as string;
      const autoOpen = route.query.autoOpen as string;
      
      if (openContract && autoOpen === 'true') {
        await ouvrirContratAutomatiquement(openContract);
        
        // Nettoyer les paramètres de requête
        router.replace({ 
          path: route.path,
          query: { ...route.query, openContract: undefined, autoOpen: undefined }
        });
      }
    });

    return {
      // Refs
      contrats,
      contratDetails,
      loading,
      showDetailsModal,
      searchTerm,
      page, 
      totalPages,
      limit,
      totalElements,
      
      // Methods
      getAllContrats,
      deleteContrat,
      confirmerSuppression,
      voirDetails,
      modifier,
      convertirEnContrat,
      closeDetailsModal,
      handlePaginate,
      rechercher,
      formatDate,
      formatMontant,
      formatBirthdate,
      genererPDFCotation,
      getClientFullName,
      getClientBirthdate,
      getAgeAtCotation,
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

  /* Optimisations pour le modal mobile */
  .modal-body {
    padding: 15px !important;
  }

  .modal-body .nav-tabs {
    margin-bottom: 15px !important;
  }

  .modal-body .nav-link {
    padding: 6px 10px !important;
    font-size: 0.75rem !important;
    border-radius: 4px !important;
  }

  .modal-body .nav-tabs .nav-link.active {
    background-color: #33b04a !important;
    border-color: #33b04a !important;
    color: white !important;
  }

  .modal-body .nav-tabs .nav-link:hover {
    border-color: #33b04a !important;
    color: #33b04a !important;
  }

  .modal-body .card {
    margin-bottom: 15px !important;
  }

  .modal-body .card-header {
    padding: 10px 15px !important;
  }

  .modal-body .card-body {
    padding: 15px !important;
  }

  .modal-body .info-item {
    margin-bottom: 0.75rem !important;
  }

  .modal-body .info-item label {
    font-size: 0.7rem !important;
    margin-bottom: 0.2rem !important;
  }

  .modal-body .h3, .modal-body .h4, .modal-body .h5, .modal-body .h6 {
    font-size: 1rem !important;
    margin-bottom: 0.25rem !important;
  }

  .modal-body .badge {
    font-size: 0.7rem !important;
    padding: 4px 8px !important;
  }

  .modal-body .row.g-4 {
    --bs-gutter-x: 0.75rem !important;
    --bs-gutter-y: 0.75rem !important;
  }

  .modal-body .col-md-4, .modal-body .col-md-6, .modal-body .col-md-8 {
    margin-bottom: 0.5rem !important;
  }

  /* Optimisation des colonnes sur mobile */
  .modal-body .col-md-4 {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }

  .modal-body .col-md-6 {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }

  .modal-body .col-md-8 {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }

  /* Tableau responsive dans le modal */
  .modal-body .table-responsive {
    font-size: 0.8rem !important;
  }

  .modal-body .table th,
  .modal-body .table td {
    padding: 6px 8px !important;
    font-size: 0.75rem !important;
  }

  /* Optimisation des boutons du modal */
  .modal-footer .btn {
    font-size: 0.8rem !important;
    padding: 6px 12px !important;
    min-height: 32px !important;
  }

  .modal-footer .btn i {
    font-size: 0.75rem !important;
  }

  /* Espacement entre les boutons */
  .modal-footer {
    gap: 6px !important;
  }

  /* Optimisation des icônes et textes */
  .modal-body i {
    font-size: 0.8rem !important;
  }

  .modal-body .flaticon {
    font-size: 0.75rem !important;
  }

  /* Amélioration de la lisibilité */
  .modal-body .text-muted {
    font-size: 0.7rem !important;
  }

  .modal-body .text-primary,
  .modal-body .text-success,
  .modal-body .text-warning,
  .modal-body .text-danger,
  .modal-body .text-info {
    font-weight: 600 !important;
  }

  /* Optimisation des liens */
  .modal-body a {
    font-size: 0.8rem !important;
    word-break: break-all !important;
  }
}

/* Optimisations pour très petits écrans */
@media (max-width: 480px) {
  .modal-body {
    padding: 10px !important;
  }

  .modal-body .nav-tabs {
    margin-bottom: 10px !important;
  }

  .modal-body .nav-link {
    padding: 4px 8px !important;
    font-size: 0.7rem !important;
  }

  .modal-body .card-header {
    padding: 8px 12px !important;
  }

  .modal-body .card-body {
    padding: 12px !important;
  }

  .modal-body .info-item {
    margin-bottom: 0.5rem !important;
  }

  .modal-body .info-item label {
    font-size: 0.65rem !important;
  }

  .modal-body .h3, .modal-body .h4, .modal-body .h5, .modal-body .h6 {
    font-size: 0.9rem !important;
  }

  .modal-body .badge {
    font-size: 0.65rem !important;
    padding: 3px 6px !important;
  }

  .modal-footer .btn {
    font-size: 0.75rem !important;
    padding: 5px 10px !important;
    min-height: 28px !important;
  }

  .modal-footer {
    padding: 8px 12px !important;
    gap: 4px !important;
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

/* Custom company colors for specific elements */
.default-btn.bg-success {
  background-color: #33b04a !important;
  border-color: #33b04a !important;
  color: #231f20 !important;
  font-weight: 500;
  transition: all 0.3s ease;
}

.default-btn.bg-success:hover {
  background-color: #2d9a41 !important;
  border-color: #2d9a41 !important;
  color: #231f20 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(51, 176, 74, 0.3);
  text-decoration: none;
}

.default-btn.bg-success:focus {
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.5) !important;
}

/* Actions badge styling */
.badge.bg-primary {
  background-color: #33b04a !important;
  border-color: #33b04a !important;
  color: #231f20 !important;
  font-weight: 500;
  transition: all 0.3s ease;
}

.badge.bg-primary:hover {
  background-color: #2d9a41 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(51, 176, 74, 0.3);
}

/* Styles pour le composant PDF dans le dropdown */
.dropdown-item.p-0 {
  padding: 0 !important;
}

.dropdown-item .pdf-generator {
  width: 100%;
}

.dropdown-item .pdf-generator .btn {
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  color: inherit;
  padding: 8px 16px;
  border-radius: 0;
}

.dropdown-item .pdf-generator .btn:hover {
  background-color: #f8f9fa;
  color: #dc3545;
}

.dropdown-item .pdf-generator .btn:disabled {
  background-color: transparent;
  color: #6c757d;
}

/* Style spécial pour les informations du compte dans le tableau */
.table td small {
  display: block;
  margin-top: 2px;
}

.table td .badge {
  font-size: 0.75rem;
  margin-top: 2px;
}
</style>