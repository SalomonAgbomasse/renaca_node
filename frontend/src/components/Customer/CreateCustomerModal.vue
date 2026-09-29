<template>
  <Modal
    :isVisible="isVisible"
    :title="mode === 'edit' ? 'Modifier le client' : 'Ajouter un nouveau client'"
    size="large"
    @close="handleClose"
    @update:isVisible="handleUpdateVisibility"
  >
    <form @submit.prevent="submitForm">
      <div class="row g-3 pb-3">
        <!-- Champ caché numCustomer -->
        <input type="hidden" v-model="numCustomer" v-bind="numCustomerAttrs" />

        <!-- Informations personnelles -->
        <div class="col-md-6">
          <label class="form-label fw-bold" :class="mode === 'edit' && !canEditIdentityFields ? 'text-muted' : ''">
            <i class="fas fa-user text-secondary me-2"></i>Prénoms <span v-if="mode !== 'edit' || canEditIdentityFields" class="text-danger">*</span>
          </label>
          <input 
            type="text" 
            class="form-control"
            :class="{ 'is-invalid': errors.firstname, 'bg-light': mode === 'edit' && !canEditIdentityFields }"
            v-model="firstname"
            v-bind="firstnameAttrs"
            :readonly="mode === 'edit' && !canEditIdentityFields"
            :disabled="mode === 'edit' && !canEditIdentityFields"
            placeholder="Prénom du client"
          />
          <div v-if="errors.firstname" class="invalid-feedback d-block">
            {{ errors.firstname }}
          </div>
          <div v-if="mode === 'edit' && !canEditIdentityFields && identityFieldsBlockedReason" class="form-text text-warning">
            <i class="fas fa-exclamation-triangle me-1"></i>
            {{ identityFieldsBlockedReason }}
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold" :class="mode === 'edit' && !canEditIdentityFields ? 'text-muted' : ''">
            <i class="fas fa-user text-secondary me-2"></i>Nom <span v-if="mode !== 'edit' || canEditIdentityFields" class="text-danger">*</span>
          </label>
          <input 
            type="text" 
            class="form-control"
            :class="{ 'is-invalid': errors.lastname, 'bg-light': mode === 'edit' && !canEditIdentityFields }"
            v-model="lastname"
            v-bind="lastnameAttrs"
            :readonly="mode === 'edit' && !canEditIdentityFields"
            :disabled="mode === 'edit' && !canEditIdentityFields"
            placeholder="Nom du client"
          />
          <div v-if="errors.lastname" class="invalid-feedback d-block">
            {{ errors.lastname }}
          </div>
        </div>

        <div class="col-md-6">
          <label class="form-label fw-bold"><i class="fas fa-phone text-secondary me-2"></i>Téléphone <span class="text-danger">*</span></label>
          <input 
            type="tel" 
            class="form-control"
            :class="{ 'is-invalid': errors.phone }"
            v-model="phone"
            v-bind="phoneAttrs"
            placeholder="Numéro de téléphone"
          />
          <div v-if="errors.phone" class="invalid-feedback d-block">
            {{ errors.phone }}
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold"><i class="fas fa-envelope text-secondary me-2"></i>Email</label>
          <input 
            type="email" 
            class="form-control"
            :class="{ 'is-invalid': errors.email }"
            v-model="email"
            v-bind="emailAttrs"
            placeholder="Adresse email"
          />
          <div v-if="errors.email" class="invalid-feedback d-block">
            {{ errors.email }}
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">
            <i class="fas fa-venus-mars text-secondary me-2"></i>Genre <span class="text-danger">*</span>
          </label>
          <select 
            class="form-select"
            :class="{ 'is-invalid': errors.gender }"
            v-model="gender"
            v-bind="genderAttrs"
          >
            <option value="">Sélectionner</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
          <div v-if="errors.gender" class="invalid-feedback d-block">
            {{ errors.gender }}
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold" :class="mode === 'edit' && !canEditIdentityFields ? 'text-muted' : ''">
            <i class="fas fa-calendar-alt text-secondary me-2"></i>Date de naissance <span v-if="mode !== 'edit' || canEditIdentityFields" class="text-danger">*</span>
          </label>
          <input 
            v-if="mode === 'edit' && !canEditIdentityFields"
            type="text" 
            class="form-control bg-light"
            :value="formatDate(birthdate)"
            readonly
            disabled
          />
          <input 
            v-else
            type="date" 
            class="form-control"
            :class="{ 'is-invalid': errors.birthdate }"
            v-model="birthdate"
            v-bind="birthdateAttrs"
          />
          <div v-if="errors.birthdate" class="invalid-feedback d-block">
            {{ errors.birthdate }}
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">
            <i class="fas fa-user-tag text-secondary me-2"></i>Type de client <span class="text-danger">*</span>
          </label>
          <select
            class="form-select"
            :class="{ 'is-invalid': errors.idTypeCustomer }"
            v-model="idTypeCustomer"
            v-bind="idTypeCustomerAttrs"
            :disabled="loadingTypeCustomers"
          >
            <option value="">{{ loadingTypeCustomers ? 'Chargement...' : 'Sélectionner' }}</option>
            <option v-for="tc in typeCustomers" :key="tc.id" :value="String(tc.id)">{{ tc.libelle }}</option>
          </select>
          <div v-if="errors.idTypeCustomer" class="invalid-feedback d-block">
            {{ errors.idTypeCustomer }}
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">
            <i class="fas fa-map-marker-alt text-secondary me-2"></i>Lieu de naissance <span v-if="mode !== 'edit'" class="text-danger">*</span>
          </label>
          <input 
            type="text" 
            class="form-control"
            :class="{ 'is-invalid': errors.placeOfBirth }"
            v-model="placeOfBirth"
            v-bind="placeOfBirthAttrs"
            placeholder="Lieu de naissance"
          />
          <div v-if="errors.placeOfBirth" class="invalid-feedback d-block">
            {{ errors.placeOfBirth }}
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">
            <i class="fas fa-briefcase text-secondary me-2"></i>Profession <span v-if="mode !== 'edit'" class="text-danger">*</span>
          </label>
          <input 
            type="text" 
            class="form-control"
            :class="{ 'is-invalid': errors.occupation }"
            v-model="occupation"
            v-bind="occupationAttrs"
            placeholder="Profession"
          />
          <div v-if="errors.occupation" class="invalid-feedback d-block">
            {{ errors.occupation }}
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">
            <i class="fas fa-home text-secondary me-2"></i>Adresse <span v-if="mode !== 'edit'" class="text-danger">*</span>
          </label>
          <textarea 
            class="form-control"
            :class="{ 'is-invalid': errors.address }"
            v-model="address"
            v-bind="addressAttrs"
            rows="2"
            placeholder="Adresse complète"
          ></textarea>
          <div v-if="errors.address" class="invalid-feedback d-block">
            {{ errors.address }}
          </div>
        </div>
      </div>
    </form>
    
    <template #footer>
      <div class="d-flex justify-content-between w-100">
        <button 
          type="button" 
          class="btn btn-secondary btn-sm" 
          @click="handleClose"
        >
          Annuler
        </button>
        <button 
          type="button" 
          class="btn btn-sm" 
          style="background-color: #33b04a; color: #231f20; border-color: #33b04a;"
          @click="submitForm"
          :disabled="loading || !meta.valid"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? (mode === 'edit' ? 'Modification...' : 'Ajout...') : (mode === 'edit' ? 'Modifier le client' : 'Ajouter le client') }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, onMounted } from "vue";
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import ApiService from "../../services/ApiService";
import { error, success } from "../../utils/utils";
import Modal from '../Common/Modal.vue';
import Swal from 'sweetalert2';

// Fonction utilitaire pour formater les dates
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

// Fonction utilitaire pour obtenir le texte du genre
function getGenderText(gender: string): string {
  if (!gender) return 'Non défini';
  const genderLower = gender.toLowerCase().trim();
  if (genderLower === 'm' || genderLower === 'masculin' || genderLower === 'homme' || genderLower === 'male') {
    return 'Masculin';
  } else if (genderLower === 'f' || genderLower === 'féminin' || genderLower === 'femme' || genderLower === 'female') {
    return 'Féminin';
  }
  return 'Non défini';
}

export default defineComponent({
  name: "CreateCustomerModal",
  components: {
    Modal
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String as () => 'create' | 'edit',
      default: 'create'
    },
    clientToEdit: {
      type: Object as () => any,
      default: null
    }
  },
  emits: ['close', 'update:isVisible', 'success'],
  setup(props, { emit }) {
    const loading = ref(false);
    const userRole = ref<number | null>(null);
    const userRoleLibelle = ref<string | null>(null);
    const userInfo = ref<any>(null);
    const clientContracts = ref<any[]>([]);
    const loadingContracts = ref(false);
    const canEditIdentityFields = ref(false);
    const identityFieldsBlockedReason = ref<string>('');
    const typeCustomers = ref<any[]>([]);
    const loadingTypeCustomers = ref(false);

    // Fonction pour charger les types de client
    async function loadTypeCustomers() {
      try {
        loadingTypeCustomers.value = true;
        const response = await ApiService.get('/type-customers');
        const raw = response.data?.data?.typeCustomers || response.data?.data?.data || response.data?.data || response.data;
        if (Array.isArray(raw)) {
          typeCustomers.value = raw;
        } else {
          typeCustomers.value = [{ id: 1, libelle: 'PARTICULIER' }, { id: 2, libelle: 'PERSONNEL RENACA' }];
        }
      } catch (err) {
        console.error('❌ Erreur lors du chargement des types de client:', err);
        typeCustomers.value = [{ id: 1, libelle: 'PARTICULIER' }, { id: 2, libelle: 'PERSONNEL RENACA' }];
      } finally {
        loadingTypeCustomers.value = false;
      }
    }

    // Fonction pour charger le rôle de l'utilisateur
    async function loadUserRole() {
      try {
        const response = await ApiService.get('auth/profile');
        
        if (response.data && response.data.data && response.data.data.user) {
          const user = response.data.data.user;
          userInfo.value = user;
          
          // Récupérer idRole et libellé
          if (user.idRole) {
            userRole.value = user.idRole;
          }
          if (user.role && user.role.libelle) {
            userRoleLibelle.value = user.role.libelle;
          }
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement du rôle utilisateur:', err);
        userRole.value = null;
        userRoleLibelle.value = null;
      }
    }

    // Fonction pour vérifier si l'utilisateur est admin ou super admin
    const isAdminOrSuperAdmin = computed(() => {
      if (!userRole.value && !userRoleLibelle.value) return false;
      
      // Vérifier par idRole (1, 2, 3 sont les rôles admin selon le backend)
      if (userRole.value === 1 || userRole.value === 2 || userRole.value === 3) {
        return true;
      }
      
      // Vérifier par libellé
      const roleLibelle = userRoleLibelle.value?.toUpperCase();
      return roleLibelle === 'ROOT' || 
             roleLibelle === 'ADMIN AAVIE' || 
             roleLibelle === 'ADMIN PADME' ||
             roleLibelle === 'ADMIN';
    });

    // Fonction pour charger les contrats du client
    async function loadClientContracts() {
      if (!props.clientToEdit?.id || props.mode !== 'edit') {
        return;
      }

      try {
        loadingContracts.value = true;
        const { data } = await ApiService.get(`/contracts/customer/${props.clientToEdit.id}`);
        
        if (data && data.contracts && Array.isArray(data.contracts)) {
          clientContracts.value = data.contracts;
        } else if (data && data.data && data.data.contracts && Array.isArray(data.data.contracts)) {
          clientContracts.value = data.data.contracts;
        } else {
          clientContracts.value = [];
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des contrats:', err);
        clientContracts.value = [];
      } finally {
        loadingContracts.value = false;
      }
    }

    // Fonction pour vérifier si le client a des contrats de plus d'un mois ET non échus
    function hasContractsOlderThanOneMonthAndNotExpired(): boolean {
      if (!clientContracts.value || clientContracts.value.length === 0) {
        return false;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(today.getMonth() - 1);
      oneMonthAgo.setHours(0, 0, 0, 0);

      return clientContracts.value.some((contract: any) => {
        // Vérifier que le contrat a une date d'effet
        const dateEffet = contract.dateEff || contract.dateEffet;
        if (!dateEffet) return false;
        
        const contractDateEffet = new Date(dateEffet);
        contractDateEffet.setHours(0, 0, 0, 0);
        
        // Vérifier que le contrat a au moins un mois
        const hasOneMonth = contractDateEffet <= oneMonthAgo;
        if (!hasOneMonth) return false;
        
        // Vérifier que le contrat n'est pas encore échu
        const dateEch = contract.dateEch;
        if (!dateEch) return true; // Si pas de date d'échéance, considérer comme non échu
        
        const contractDateEch = new Date(dateEch);
        contractDateEch.setHours(0, 0, 0, 0);
        
        // Le contrat doit être non échu (date d'échéance >= aujourd'hui)
        return contractDateEch >= today;
      });
    }

    // Fonction pour obtenir les contrats non échus
    function getNonExpiredContracts(): any[] {
      if (!clientContracts.value || clientContracts.value.length === 0) {
        return [];
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return clientContracts.value.filter((contract: any) => {
        if (!contract.dateEch) return false;
        
        const dateEch = new Date(contract.dateEch);
        dateEch.setHours(0, 0, 0, 0);
        
        return dateEch >= today;
      });
    }

    // Fonction pour vérifier les permissions de modification des champs d'identité
    async function checkIdentityFieldsPermissions() {
      if (props.mode !== 'edit') {
        canEditIdentityFields.value = false;
        return;
      }

      // Si admin/super admin, peut modifier mais on notifie les contrats non échus
      if (isAdminOrSuperAdmin.value) {
        canEditIdentityFields.value = true;
        identityFieldsBlockedReason.value = '';
        
        // Charger les contrats pour la notification
        await loadClientContracts();
        const nonExpiredContracts = getNonExpiredContracts();
        
        if (nonExpiredContracts.length > 0) {
          // Notification sera affichée lors de la soumission
        }
        return;
      }

      // Sinon, vérifier si le client a des contrats de plus d'un mois ET non échus
      await loadClientContracts();
      
      if (hasContractsOlderThanOneMonthAndNotExpired()) {
        canEditIdentityFields.value = false;
        identityFieldsBlockedReason.value = 'Ce client a au moins un contrat de plus d\'un mois et non échu. Veuillez contacter un administrateur pour modifier le prénom, le nom ou la date de naissance.';
      } else {
        canEditIdentityFields.value = true;
        identityFieldsBlockedReason.value = '';
      }
    }

    // Schéma de validation selon le mode
    const createClientSchema = yup.object({
      firstname: yup.string().required('Le prénom est obligatoire').min(2, 'Le prénom doit contenir au moins 2 caractères'),
      lastname: yup.string().required('Le nom est obligatoire').min(2, 'Le nom doit contenir au moins 2 caractères'),
      numCustomer: yup.string().nullable().optional(),
      phone: yup.string().required('Le téléphone est obligatoire').matches(/^[0-9+\-\s()]+$/, 'Format de téléphone invalide'),
      email: yup.string().email('Format d\'email invalide').nullable(),
      gender: yup.string().required('Le genre est obligatoire').oneOf(['M', 'F'], 'Genre invalide'),
      birthdate: yup.string()
        .required('La date de naissance est obligatoire')
        .test('age-range', 'L\'âge doit être entre 18 et 64 ans', function(value) {
          if (!value) return false;
          const today = new Date();
          const birthDate = new Date(value);
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          let actualAge = age;
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            actualAge--;
          }
          
          return actualAge >= 18 && actualAge <= 64;
        }),
      placeOfBirth: yup.string().required('Le lieu de naissance est obligatoire').min(2, 'Le lieu de naissance doit contenir au moins 2 caractères'),
      occupation: yup.string().required('La profession est obligatoire').min(2, 'La profession doit contenir au moins 2 caractères'),
      address: yup.string().required('L\'adresse est obligatoire').min(5, 'L\'adresse doit contenir au moins 5 caractères'),
      idTypeCustomer: yup.string().required('Le type de client est obligatoire')
    });

    // Schéma de validation pour la modification (champs modifiables seulement)
    const editClientSchema = computed(() => {
      const baseSchema: any = {
        phone: yup.string().required('Le téléphone est obligatoire').matches(/^[0-9+\-\s()]+$/, 'Format de téléphone invalide'),
        email: yup.string().email('Format d\'email invalide').nullable(),
        gender: yup.string().required('Le genre est obligatoire').oneOf(['M', 'F'], 'Genre invalide'),
        placeOfBirth: yup.string().nullable(),
        occupation: yup.string().nullable(),
        address: yup.string().nullable(),
        numCustomer: yup.string().nullable(),
        idTypeCustomer: yup.string().required('Le type de client est obligatoire')
      };

      // Si l'utilisateur peut modifier les champs d'identité, les ajouter au schéma
      if (canEditIdentityFields.value) {
        baseSchema.firstname = yup.string().required('Le prénom est obligatoire').min(2, 'Le prénom doit contenir au moins 2 caractères');
        baseSchema.lastname = yup.string().required('Le nom est obligatoire').min(2, 'Le nom doit contenir au moins 2 caractères');
        baseSchema.birthdate = yup.string()
          .required('La date de naissance est obligatoire')
          .test('age-range', 'L\'âge doit être entre 18 et 64 ans', function(value) {
            if (!value) return false;
            const today = new Date();
            const birthDate = new Date(value);
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            let actualAge = age;
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              actualAge--;
            }
            
            return actualAge >= 18 && actualAge <= 64;
          });
      }

      return yup.object(baseSchema);
    });

    const clientSchema = computed(() => {
      return props.mode === 'edit' ? editClientSchema.value : createClientSchema;
    });

    // Configuration vee-validate
    const { defineField, handleSubmit, errors, resetForm, meta, setValues, setFieldValue } = useForm({
      validationSchema: () => clientSchema.value,
      initialValues: {
        firstname: '',
        lastname: '',
        numCustomer: '',
        phone: '',
        email: '',
        gender: '',
        birthdate: '',
        placeOfBirth: '',
        occupation: '',
        address: '',
        idTypeCustomer: ''
      }
    });

    // Définir les champs avec vee-validate
    const [firstname, firstnameAttrs] = defineField('firstname');
    const [lastname, lastnameAttrs] = defineField('lastname');
    const [numCustomer, numCustomerAttrs] = defineField('numCustomer');
    const [phone, phoneAttrs] = defineField('phone');
    const [email, emailAttrs] = defineField('email');
    const [gender, genderAttrs] = defineField('gender');
    const [birthdate, birthdateAttrs] = defineField('birthdate');
    const [placeOfBirth, placeOfBirthAttrs] = defineField('placeOfBirth');
    const [occupation, occupationAttrs] = defineField('occupation');
    const [address, addressAttrs] = defineField('address');
    const [idTypeCustomer, idTypeCustomerAttrs] = defineField('idTypeCustomer');

    // Réinitialiser ou pré-remplir le formulaire quand le modal s'ouvre
    watch(() => props.isVisible, async (newValue) => {
      if (newValue) {
        // Charger le rôle utilisateur si pas encore chargé
        if (!userRole.value && !userRoleLibelle.value) {
          await loadUserRole();
        }

        if (props.mode === 'edit' && props.clientToEdit) {
          // Vérifier les permissions pour les champs d'identité
          await checkIdentityFieldsPermissions();

          // Pré-remplir avec les données du client à modifier
          setValues({
            firstname: props.clientToEdit.firstname || '',
            lastname: props.clientToEdit.lastname || '',
            numCustomer: props.clientToEdit.numCustomer || '',
            phone: props.clientToEdit.phone || '',
            email: props.clientToEdit.email || '',
            gender: props.clientToEdit.gender || '',
            birthdate: props.clientToEdit.birthdate || '',
            placeOfBirth: props.clientToEdit.placeOfBirth || '',
            occupation: props.clientToEdit.occupation || '',
            address: props.clientToEdit.address || '',
            idTypeCustomer: props.clientToEdit.idTypeCustomer?.toString() || ''
          });
        } else {
          resetForm();
        }
      }
    });

    // Watcher pour mettre à jour les valeurs si clientToEdit change
    watch(() => props.clientToEdit, (newClient) => {
      if (props.isVisible && props.mode === 'edit' && newClient) {
        setValues({
          firstname: newClient.firstname || '',
          lastname: newClient.lastname || '',
          numCustomer: newClient.numCustomer || '',
          phone: newClient.phone || '',
          email: newClient.email || '',
          gender: newClient.gender || '',
          birthdate: newClient.birthdate || '',
          placeOfBirth: newClient.placeOfBirth || '',
          occupation: newClient.occupation || '',
          address: newClient.address || '',
          idTypeCustomer: newClient.idTypeCustomer?.toString() || ''
        });
      }
    }, { deep: true });

    // Fonction de soumission avec vee-validate
    const submitForm = handleSubmit(async (values) => {
      try {
        loading.value = true;

        if (props.mode === 'edit') {
          // Mode modification : seulement les champs modifiables
          if (!props.clientToEdit?.id) {
            throw new Error('ID client manquant');
          }

          // Si admin/super admin et modification des champs d'identité, notifier les contrats non échus
          if (isAdminOrSuperAdmin.value && canEditIdentityFields.value) {
            const hasIdentityChanges = 
              (values.firstname && values.firstname.trim() !== (props.clientToEdit.firstname || '').trim()) ||
              (values.lastname && values.lastname.trim() !== (props.clientToEdit.lastname || '').trim()) ||
              (values.birthdate && values.birthdate !== props.clientToEdit.birthdate);

            if (hasIdentityChanges) {
              const nonExpiredContracts = getNonExpiredContracts();
              
              if (nonExpiredContracts.length > 0) {
                const contractRefs = nonExpiredContracts
                  .map(c => c.reference || c.police || `Contrat #${c.id}`)
                  .join(', ');
                
                await Swal.fire({
                  title: '⚠️ Attention',
                  html: `Vous êtes sur le point de modifier les informations d'identité du client.<br><br>
                         <strong>Contrats non échus concernés :</strong> ${contractRefs}<br><br>
                         Ces contrats portent les identités actuelles du client.`,
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Continuer',
                  cancelButtonText: 'Annuler',
                  confirmButtonColor: '#33b04a'
                }).then((result) => {
                  if (!result.isConfirmed) {
                    loading.value = false;
                    return;
                  }
                });
              }
            }
          }

          const updateData: any = {
            phone: values.phone.trim(),
            email: values.email?.trim().toLowerCase() || null,
            gender: values.gender,
            placeOfBirth: values.placeOfBirth?.trim().toUpperCase() || null,
            occupation: values.occupation?.trim().toUpperCase() || null,
            address: values.address?.trim().toUpperCase() || null,
            numCustomer: values.numCustomer?.trim() || null,
            idTypeCustomer: values.idTypeCustomer ? parseInt(values.idTypeCustomer) : null
          };

          // Ajouter les champs d'identité si l'utilisateur peut les modifier
          if (canEditIdentityFields.value) {
            if (values.firstname) {
              updateData.firstname = values.firstname.trim().toUpperCase();
            }
            if (values.lastname) {
              updateData.lastname = values.lastname.trim().toUpperCase();
            }
            if (values.birthdate) {
              updateData.birthdate = values.birthdate;
            }
          }

          const { data } = await ApiService.put(`/customers/${props.clientToEdit.id}`, updateData);

          if (data && data.data && data.data.customer) {
            success(data.data.message || 'Client modifié avec succès');
            handleClose();
            emit('success', data.data.customer);
          } else {
            throw new Error('Structure de réponse inattendue');
          }
        } else {
          // Mode création : tous les champs
          const clientData = {
            firstname: values.firstname.trim().toUpperCase(),
            lastname: values.lastname.trim().toUpperCase(),
            numCustomer: values.numCustomer?.trim() || null,
            phone: values.phone.trim(),
            email: values.email?.trim().toLowerCase() || null,
            gender: values.gender,
            birthdate: values.birthdate,
            placeOfBirth: values.placeOfBirth?.trim().toUpperCase() || null,
            occupation: values.occupation.trim().toUpperCase(),
            address: values.address?.trim().toUpperCase() || null,
            idTypeCustomer: parseInt(values.idTypeCustomer)
          };

          const { data } = await ApiService.post('/customers', clientData);

          if (data && data.data && data.data.customer) {
            success('Client ajouté avec succès');
            handleClose();
            emit('success', data.data.customer);
          } else {
            throw new Error('Structure de réponse inattendue');
          }
        }

      } catch (err: any) {
        console.error(`❌ Erreur lors de ${props.mode === 'edit' ? 'la modification' : 'l\'ajout'} du client:`, err);
        const errorMessage = err?.response?.data?.message || `Erreur lors de ${props.mode === 'edit' ? 'la modification' : 'l\'ajout'} du client`;
        error(errorMessage);
      } finally {
        loading.value = false;
      }
    });

    const handleClose = () => {
      resetForm();
      emit('close');
      emit('update:isVisible', false);
    };

    const handleUpdateVisibility = (value: boolean) => {
      if (!value) {
        resetForm();
      }
      emit('update:isVisible', value);
    };

    // Charger le rôle et les types de client au montage du composant
    onMounted(() => {
      loadUserRole();
      loadTypeCustomers();
    });

    return {
      loading,
      firstname,
      firstnameAttrs,
      lastname,
      lastnameAttrs,
      numCustomer,
      numCustomerAttrs,
      phone,
      phoneAttrs,
      email,
      emailAttrs,
      gender,
      genderAttrs,
      birthdate,
      birthdateAttrs,
      placeOfBirth,
      placeOfBirthAttrs,
      occupation,
      occupationAttrs,
      address,
      addressAttrs,
      idTypeCustomer,
      idTypeCustomerAttrs,
      errors,
      meta,
      submitForm,
      handleClose,
      handleUpdateVisibility,
      formatDate,
      getGenderText,
      canEditIdentityFields,
      identityFieldsBlockedReason,
      typeCustomers,
      loadingTypeCustomers
    };
  }
});
</script>

<style scoped>
/* Styles spécifiques au modal si nécessaire */
</style>

