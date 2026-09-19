<template>
  <div class="card mb-25 border-0 rounded-0 bg-white">
    <div class="card-body p-15 p-sm-20 p-md-25 p-lg-30 letter-spacing">
      
      <!-- Indicateur de chargement pour l'édition -->
      <div v-if="loadingData" class="text-center p-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement des données...</span>
        </div>
        <p class="mt-2">Chargement des informations de l'utilisateur...</p>
      </div>

      <Form v-else ref="userForm" @submit="saveUser" :validation-schema="userSchema" :initial-values="initialValues">
        <div class="row">
          <!-- Nom -->
          <div class="col-md-6">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">
                Nom <span class="text-danger">*</span>
              </label>
              <Field name="lastname" v-slot="{ field }">
                <input
                  v-bind="field"
                  type="text"
                  class="form-control shadow-none fs-md-15 text-black text-uppercase"
                  placeholder="Nom de l'utilisateur"
                  @input="isFormDirty = true"
                />
              </Field>
              <ErrorMessage name="lastname" class="text-danger"/>
            </div>
          </div>

          <!-- Prénoms -->
          <div class="col-md-6">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">
                Prénoms <span class="text-danger">*</span>
              </label>
              <Field name="firstname" v-slot="{ field }">
                <input
                  v-bind="field"
                  type="text"
                  class="form-control shadow-none fs-md-15 text-black text-uppercase"
                  placeholder="Prenoms de l'utilisateur"
                  @input="isFormDirty = true"
                />
              </Field>
              <ErrorMessage name="firstname" class="text-danger"/>
            </div>
          </div>
        </div>

        <div class="row">
          <!-- Sexe -->
          <div class="col-md-6">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">
                Sexe <span class="text-danger">*</span>
              </label>
              <Field name="gender" v-slot="{ field }">
                <select
                  v-bind="field"
                  class="form-control shadow-none fs-md-15 text-black"
                  @change="isFormDirty = true"
                >
                  <option value="">Sélectionnez</option>
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                </select>
              </Field>
              <ErrorMessage name="gender" class="text-danger"/>
            </div>
          </div>

          <!-- Date de naissance -->
          <div class="col-md-6">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">
                Date de naissance
              </label>
              <Field name="birthdate" v-slot="{ field }">
                <input
                  v-bind="field"
                  type="date"
                  class="form-control shadow-none fs-md-15 text-black"
                  @input="isFormDirty = true"
                />
              </Field>
              <ErrorMessage name="birthdate" class="text-danger"/>
            </div>
          </div>
        </div>

        <div class="row">
          <!-- Téléphone -->
          <div class="col-md-6">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">
                Téléphone <span class="text-danger">*</span>
              </label>
              <Field name="phone" v-slot="{ field }">
                <input
                  v-bind="field"
                  type="tel"
                  class="form-control shadow-none fs-md-15 text-black"
                  placeholder="+229XXXXXXXX"
                  maxlength="14"
                  @input="isFormDirty = true"
                />
              </Field>
              <ErrorMessage name="phone" class="text-danger"/>
            </div>
          </div>

          <!-- Email -->
          <div class="col-md-6">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">
                Adresse Email <span class="text-danger">*</span>
              </label>
              <Field name="email" v-slot="{ field }">
                <input
                  v-bind="field"
                  type="email"
                  class="form-control shadow-none fs-md-15 text-black"
                  placeholder="jean.dupont@entreprise.com"
                  @input="isFormDirty = true"
                />
              </Field>
              <ErrorMessage name="email" class="text-danger"/>
            </div>
          </div>
        </div>

        <div class="row">
          <!-- Adresse -->
          <div class="col-md-8">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">
                Adresse <span class="text-danger">*</span>
              </label>
              <Field name="address" v-slot="{ field }">
                <textarea
                  v-bind="field"
                  class="form-control shadow-none fs-md-15 text-black text-uppercase"
                  placeholder="QUARTIER, RUE, VILLE"
                  rows="3"
                  @input="isFormDirty = true"
                ></textarea>
              </Field>
              <ErrorMessage name="address" class="text-danger"/>
            </div>
          </div>

          <!-- Mot de passe -->
          <div class="col-md-4">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">
                Mot de passe <span class="text-danger">*</span>
              </label>
              <Field name="password" v-slot="{ field }">
                <input
                  v-bind="field"
                  type="password"
                  class="form-control shadow-none fs-md-15 text-black"
                  placeholder="••••••••"
                  minlength="8"
                  @input="isFormDirty = true"
                />
              </Field>
              <ErrorMessage name="password" class="text-danger"/>
              <small class="text-muted">Par défaut: P@55WORD</small>
            </div>
          </div>
        </div>

        <div class="row">
          <!-- Fonction -->
          <div class="col-md-6">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">
                Fonction
              </label>
              <Field name="fonction" v-slot="{ field }">
                <input
                  v-bind="field"
                  type="text"
                  class="form-control shadow-none fs-md-15 text-black"
                  placeholder="Gestionnaire de contrats"
                  @input="isFormDirty = true"
                />
              </Field>
              <ErrorMessage name="fonction" class="text-danger"/>
            </div>
          </div>

          <!-- Rôle -->
          <div class="col-md-6">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">
                Rôle <span class="text-danger">*</span>
              </label>
              <Field name="idRole" v-slot="{ field }">
                <select
                  v-bind="field"
                  class="form-control shadow-none fs-md-15 text-black"
                  @change="isFormDirty = true"
                >
                  <option value="">Sélectionnez un rôle</option>
                  <option v-for="role in roles" :key="role.id" :value="role.id">
                    {{ role.name }}
                  </option>
                </select>
              </Field>
              <ErrorMessage name="idRole" class="text-danger"/>
              <!-- Debug: Affichage du nombre de rôles chargés -->
              <small class="text-muted" v-if="roles.length === 0">
                ⚠️ Aucun rôle chargé
              </small>
              <small class="text-success" v-else>
                ✅ {{ roles.length }} rôle(s) disponible(s)
              </small>
            </div>
          </div>
        </div>

        <div class="row">
          <!-- Agence -->
          <div class="col-md-6">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">
                Agence <span class="text-danger">*</span>
              </label>
              <Field name="idAgency" v-slot="{ field }">
                <select
                  v-bind="field"
                  class="form-control shadow-none fs-md-15 text-black"
                  @change="onAgencyChange($event, field.onChange)"
                >
                  <option value="">Sélectionnez une agence</option>
                  <option v-for="agency in agencies" :key="agency.id" :value="agency.id">
                    {{ agency.name }}
                  </option>
                </select>
              </Field>
              <ErrorMessage name="idAgency" class="text-danger"/>
              <!-- Debug: Affichage du nombre d'agences chargées -->
              <small class="text-muted" v-if="agencies.length === 0">
                ⚠️ Aucune agence chargée
              </small>
              <small class="text-success" v-else>
                ✅ {{ agencies.length }} agence(s) disponible(s)
              </small>
            </div>
          </div>

          <!-- Bureau -->
          <div class="col-md-6">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">
                Bureau (Optionnel)
              </label>
              <Field name="idOffice" v-slot="{ field }">
                <select
                  v-bind="field"
                  class="form-control shadow-none fs-md-15 text-black"
                  @change="isFormDirty = true"
                  :disabled="loadingOffices || !selectedAgencyId"
                >
                  <option value="">Sélectionnez un bureau</option>
                  <option v-for="office in offices" :key="office.id" :value="office.id">
                    {{ office.name }}
                  </option>
                </select>
              </Field>
              <ErrorMessage name="idOffice" class="text-danger"/>
              <!-- Loader/Info -->
              <small class="text-muted" v-if="loadingOffices">
                <i class="spinner-border spinner-border-sm me-1"></i> Chargement des bureaux...
              </small>
              <small class="text-muted" v-else-if="!selectedAgencyId">
                Sélectionnez d'abord une agence
              </small>
              <small class="text-muted" v-else-if="offices.length === 0">
                Aucun bureau pour cette agence
              </small>
              <small class="text-success" v-else>
                ✅ {{ offices.length }} bureau(x) disponible(s)
              </small>
            </div>
          </div>
        </div>

        <div class="row align-items-center">
          <!-- Statut -->
          <div class="col-md-6">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">
                Statut <span class="text-danger">*</span>
              </label>
              <Field name="status" v-slot="{ field }">
                <select
                  v-bind="field"
                  class="form-control shadow-none fs-md-15 text-black"
                  @change="isFormDirty = true"
                >
                  <option value="">Sélectionnez un statut</option>
                  <option value="ACTIVE">Actif</option>
                  <option value="INACTIVE">Inactif</option>
                  <option value="SUSPENDED">Suspendu</option>
                </select>
              </Field>
              <ErrorMessage name="status" class="text-danger"/>
            </div>
          </div>

          <!-- Double Authentification (2FA) -->
          <div class="col-md-6">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">
                Double Authentification (SMS 2FA)
              </label>
              <div class="form-check form-switch ps-0 mt-2">
                <Field name="twoFactorEnabled" v-slot="{ field }">
                  <input
                    class="form-check-input custom-switch ms-0"
                    type="checkbox"
                    role="switch"
                    id="twoFactorEnabledSwitch"
                    v-bind="field"
                    :checked="field.value"
                    @change="isFormDirty = true"
                  />
                </Field>
                <label class="form-check-label ms-2 fw-medium text-black" for="twoFactorEnabledSwitch">
                  Activer la 2FA par SMS pour ce compte
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="row mt-5">
          <div class="col-12 d-flex justify-content-between">
            <button
              type="button"
              class="btn btn-secondary"
              @click="handleCancel"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="btn btn-success"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">
                <i class="spinner-border spinner-border-sm me-2"></i>
                Enregistrement en cours...
              </span>
              <span v-else>
                {{ isEditMode ? 'Modifier l\'utilisateur' : 'Enregistrer l\'utilisateur' }}
              </span>
            </button>
          </div>
        </div>
      </Form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import { error, success } from '../../utils/utils';
import { useRouter, useRoute } from "vue-router";
import ApiService from '../../services/ApiService';
import * as Yup from 'yup';

interface UserData {
  // Données personnelles
  lastname: string;
  firstname: string;
  gender: string;
  birthdate: string;

  // Contact & Adresse
  phone: string;
  email: string;
  address: string;
  password: string;

  // Informations professionnelles
  fonction?: string;
  idRole: number;
  idAgency: number;
  idOffice?: number;
  status: string;
  twoFactorEnabled?: boolean;
}

interface Role {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  level?: number;
  isSystemRole?: boolean;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

interface Agency {
  id: number;
  name: string;
  address?: string;
}

interface Office {
  id: number;
  name: string;
}

export default defineComponent({
  name: "AddEditUser",
  components: {
    Form,
    Field,
    ErrorMessage
  },
  props: {
    userId: {
      type: [String, Number],
      default: null
    }
  },

  setup(props) {
    // Composables
    const router = useRouter();
    const route = useRoute();

    // Refs
    const userForm = ref<any>(null);
    const isSubmitting = ref(false);
    const isFormDirty = ref(false);
    const loadingData = ref(false);
    const initialValues = ref({});
    const roles = ref<Role[]>([]);
    const agencies = ref<Agency[]>([]);
    const offices = ref<Office[]>([]);
    const selectedAgencyId = ref<string | number>('');
    const loadingOffices = ref(false);

    // Computed
    const isEditMode = computed(() => !!route.params.id);

    // Schema de validation simplifié
    const userSchema = computed(() => {
      return Yup.object().shape({
        // Informations personnelles
        lastname: Yup.string().required('Le nom est obligatoire'),
        firstname: Yup.string().required('Le prénom est obligatoire'),
        gender: Yup.string().required('Le sexe est obligatoire'),
        birthdate: Yup.string()
          .nullable()
          .optional()
          .test('age', 'L\'utilisateur doit avoir au moins 18 ans', function(value) {
            if (!value || value.trim() === '') return true;
            const birthDate = new Date(value);
            if (isNaN(birthDate.getTime())) return true;
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
              ? age - 1 
              : age;
            return actualAge >= 18;
          }),
        
        // Contact & Adresse
        phone: Yup.string().required('Le téléphone est obligatoire'),
        email: Yup.string().email('Email invalide').required('L\'email est obligatoire'),
        address: Yup.string().required('L\'adresse est obligatoire'),
        password: Yup.string()
          .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
          .required('Le mot de passe est obligatoire'),
        
        // Informations professionnelles
        fonction: Yup.string().optional(),
        idRole: Yup.number().required('Le rôle est obligatoire'),
        idAgency: Yup.number().required('L\'agence est obligatoire'),
        idOffice: Yup.mixed().nullable().optional(),
        status: Yup.string().required('Le statut est obligatoire'),
        twoFactorEnabled: Yup.boolean().optional()
      });
    });

    // Fonctions utilitaires
    const formatDate = (dateString: string): string => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toLocaleDateString('fr-FR');
      } catch {
        return dateString;
      }
    };

    const formatDateForInput = (dateString: string): string => {
      if (!dateString) return '';
      try {
        if (dateString.includes('/')) {
          const [day, month, year] = dateString.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        if (dateString.includes('T')) {
          return dateString.split('T')[0];
        }
        return dateString;
      } catch {
        return '';
      }
    };

    // Fonction pour charger les rôles et agences
    const loadRolesAndAgencies = async () => {
      try {
        const [rolesResponse, agenciesResponse] = await Promise.all([
          ApiService.get('/roles'),
          ApiService.get('/agencies?limit=-1')
        ]);

        // Traitement des rôles
        if (rolesResponse.data?.data?.roles) {
          const rolesData = rolesResponse.data.data.roles;
          
          if (Array.isArray(rolesData)) {
            // Mapper les données pour correspondre à l'interface Role
            roles.value = rolesData.map(role => ({
              id: role.id,
              name: role.libelle, // Le backend envoie 'libelle' au lieu de 'name'
              description: role.desc,
              slug: role.libelle?.toLowerCase(),
              isActive: true
            }));
          } else {
            console.error('❌ Les données des rôles ne sont pas un tableau:', rolesData);
            roles.value = [];
          }
        } else {
          console.error('❌ Structure de réponse inattendue pour les rôles:', rolesResponse.data);
          roles.value = [];
        }
        
        // Traitement des agences
        if (agenciesResponse.data?.data?.agencies) {
          const agenciesData = agenciesResponse.data.data.agencies;
          
          if (Array.isArray(agenciesData)) {
            // Mapper les données pour correspondre à l'interface Agency
            agencies.value = agenciesData.map(agency => ({
              id: agency.id,
              name: agency.name,
              address: agency.address
            }));
          } else {
            console.error('❌ Les données des agences ne sont pas un tableau:', agenciesData);
            agencies.value = [];
          }
        } else {
          console.error('❌ Structure de réponse inattendue pour les agences:', agenciesResponse.data);
          agencies.value = [];
        }
        
        
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des rôles/agences:', err);
        console.error('❌ Détails de l\'erreur:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        error('Erreur lors du chargement des données de référence: ' + (err.response?.data?.message || err.message));
      }
    };

    // Fonction pour charger les bureaux
    const loadOffices = async (agencyId: number | string) => {
      try {
        loadingOffices.value = true;
        const response = await ApiService.get(`/agencies/${agencyId}/offices`);
        if (response.data?.data?.offices) {
          const officesData = response.data.data.offices;
          if (Array.isArray(officesData)) {
            offices.value = officesData.map((office: any) => ({
              id: office.id,
              name: office.officeName || office.name
            }));
          } else {
            offices.value = [];
          }
        } else if (response.data?.offices) {
          const officesData = response.data.offices;
          if (Array.isArray(officesData)) {
            offices.value = officesData.map((office: any) => ({
              id: office.id,
              name: office.officeName || office.name
            }));
          } else {
            offices.value = [];
          }
        } else {
          offices.value = [];
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des bureaux:', err);
        offices.value = [];
      } finally {
        loadingOffices.value = false;
      }
    };

    // Gestion du changement d'agence
    const onAgencyChange = async (event: any, veeChange: Function) => {
      isFormDirty.value = true;
      if (veeChange) veeChange(event);
      
      const agencyId = event.target.value;
      selectedAgencyId.value = agencyId;
      
      if (userForm.value && userForm.value.setFieldValue) {
        userForm.value.setFieldValue('idOffice', '');
      }
      
      if (agencyId) {
        await loadOffices(agencyId);
      } else {
        offices.value = [];
      }
    };

    // Fonction pour récupérer les données de l'utilisateur en mode édition
    const loadUserData = async (id: string | number) => {
      try {
        loadingData.value = true;
        
        const response = await ApiService.get(`/users/${id}`);
        
        
        if (response.data && response.data.data) {
          const userData = response.data.data.user || response.data.data;
          
          if (userData.idAgency) {
            selectedAgencyId.value = userData.idAgency;
            await loadOffices(userData.idAgency);
          }
          
          // Préparer les valeurs initiales
          const initValues = {
            // Informations personnelles
            lastname: userData.lastname || '',
            firstname: userData.firstname || '',
            gender: userData.gender || '',
            birthdate: formatDateForInput(userData.birthdate || ''),
            
            // Contact & Adresse
            phone: userData.phone || '',
            email: userData.email || '',
            address: userData.address || '',
            password: 'P@55WORD', // Mot de passe par défaut
            
            // Informations professionnelles
            fonction: userData.fonction || '',
            idRole: userData.idRole || '',
            idAgency: userData.idAgency || '',
            idOffice: userData.idOffice || '',
            status: userData.status || 'ACTIVE',
            twoFactorEnabled: userData.twoFactorEnabled || false
          };
          
          
          // Mettre à jour les valeurs initiales
          initialValues.value = initValues;
          
          // Mettre à jour le formulaire VeeValidate après le prochain tick
          await nextTick();
          if (userForm.value && userForm.value.setValues) {
            userForm.value.setValues(initValues);
          } else {
            setTimeout(() => {
              if (userForm.value && userForm.value.setValues) {
                userForm.value.setValues(initValues);
              }
            }, 100);
          }
          
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement:', err);
        error(err?.response?.data?.message || 'Erreur lors du chargement de l\'utilisateur');
        router.push('/liste-utilisateurs');
      } finally {
        loadingData.value = false;
      }
    };

    const saveUser = async (values: any): Promise<void> => {
      
      try {
        isSubmitting.value = true;

        // Préparer les données pour l'API
        const formData: any = {
          // Informations personnelles
          lastname: values.lastname?.toUpperCase(),
          firstname: values.firstname?.toUpperCase(),
          gender: values.gender,
          birthdate: values.birthdate,
          
          // Contact & Adresse
          phone: values.phone,
          email: values.email.toLowerCase(),
          address: values.address?.toUpperCase(),
          password: values.password,
          
          // Informations professionnelles
          fonction: values.fonction || null,
          idRole: parseInt(values.idRole),
          idAgency: parseInt(values.idAgency),
          idOffice: values.idOffice ? parseInt(values.idOffice) : undefined,
          status: values.status,
          twoFactorEnabled: !!values.twoFactorEnabled
        };


        if (isEditMode.value && route.params.id) {
          const { data } = await ApiService.put(`/users/${route.params.id}`, formData);
          success(`Utilisateur ${formData.firstname} ${formData.lastname} mis à jour avec succès!`);
        } else {
          const { data } = await ApiService.post('/users', formData);
          success(`Utilisateur ${formData.firstname} ${formData.lastname} créé avec succès! ID: ${data.data?.id || 'N/A'}`);
        }

        // Réinitialiser le formulaire
        isFormDirty.value = false;

        // Rediriger vers la liste
        setTimeout(() => {
          router.push('/liste-utilisateurs');
        }, 1500);

      } catch (err: any) {
        console.error('❌ Erreur lors de l\'enregistrement:', err);

        if (err.response?.status === 422 || err.response?.status === 400) {
          const errors = err.response.data.errors;
          if (errors && Array.isArray(errors)) {
            errors.forEach((errorMsg: any) => {
              error(typeof errorMsg === 'string' ? errorMsg : errorMsg.message || 'Erreur de validation');
            });
          } else if (errors && typeof errors === 'object') {
            Object.keys(errors).forEach(key => {
              const fieldErrors = Array.isArray(errors[key]) ? errors[key] : [errors[key]];
              fieldErrors.forEach((errorMsg: string) => {
                error(`${key}: ${errorMsg}`);
              });
            });
          } else {
            error(err.response.data.message || 'Données invalides. Veuillez vérifier le formulaire.');
          }
        } else if (err.response?.status === 409) {
          error('Cet utilisateur existe déjà. Veuillez vérifier les informations saisies (email, téléphone).');
        } else {
          error(err.response?.data?.message || 'Erreur lors de l\'enregistrement. Veuillez réessayer.');
        }
      } finally {
        isSubmitting.value = false;
      }
    };

    const handleCancel = (): void => {
      if (isFormDirty.value) {
        const confirmLeave = confirm(
          'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir annuler ?'
        );
        
        if (confirmLeave) {
          router.push('/liste-utilisateurs');
        }
      } else {
        router.push('/liste-utilisateurs');
      }
    };


    // Protection contre la navigation non sauvegardée
    const beforeWindowUnload = (e: BeforeUnloadEvent): void => {
      if (isFormDirty.value) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Watcher pour détecter les changements de route
    watch(() => route.params.id, (newId) => {
      if (newId) {
        loadUserData(newId as string);
      }
    }, { immediate: true });

    // Watcher pour détecter les changements de prop userId
    watch(() => props.userId, (newId) => {
      if (newId) {
        loadUserData(newId);
      }
    }, { immediate: true });

    // Lifecycle hooks
    onMounted(async () => {
      window.addEventListener('beforeunload', beforeWindowUnload);
      
      // Charger d'abord les rôles et agences
      await loadRolesAndAgencies();
      
      // Si on a un ID dans les paramètres, charger les données
      if (route.params.id) {
        await loadUserData(route.params.id as string);
      }
      // Si on a un userId passé en prop, charger les données
      else if (props.userId) {
        await loadUserData(props.userId);
      }
      // Sinon, définir des valeurs par défaut pour la création
      else {
        initialValues.value = {
          lastname: '',
          firstname: '',
          gender: '',
          birthdate: '',
          phone: '',
          email: '',
          address: '',
          password: 'P@55WORD', // Mot de passe par défaut
          fonction: '',
          idRole: '',
          idAgency: '',
          idOffice: '',
          status: 'ACTIVE'
        };
      }
    });

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', beforeWindowUnload);
    });

    return {
      // Refs
      userForm,
      isSubmitting,
      isFormDirty,
      loadingData,
      initialValues,
      roles,
      agencies,
      offices,
      selectedAgencyId,
      loadingOffices,
      
      // Computed
      isEditMode,
      userSchema,
      
      // Methods
      saveUser,
      handleCancel,
      loadUserData,
      loadRolesAndAgencies,
      formatDate,
      onAgencyChange
    };
  }
});
</script>

<style scoped>
.text-uppercase {
  text-transform: uppercase !important;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

/* Styles pour les formulaires */
.form-control:focus {
  border-color: #33b04a;
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.25);
}

.text-danger {
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.text-success {
  font-size: 0.875rem;
  margin-top: 0.25rem;
  color: #33b04a !important;
}

.text-muted {
  font-size: 0.875rem;
  margin-top: 0.25rem;
  color: #231f20 !important;
  opacity: 0.7;
}

/* Animation pour les champs obligatoires */
.form-group label .text-danger {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* Style pour les sélecteurs */
select.form-control {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

/* Animation pour les boutons */
.btn {
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
}

/* Style standard pour les boutons */
.btn-success {
  background-color: #33b04a;
  border-color: #33b04a;
  color: #231f20;
}

.btn-success:hover {
  background-color: #2a8f3c;
  border-color: #2a8f3c;
  color: #231f20;
}

.btn-secondary {
  background-color: #231f20;
  border-color: #231f20;
  color: #ede947;
}

.btn-secondary:hover {
  background-color: #3a3638;
  border-color: #3a3638;
  color: #ede947;
}

/* Amélioration de l'accessibilité */
.form-control:focus {
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.25);
}

/* Style pour les étiquettes obligatoires */
label .text-danger {
  font-weight: bold;
}

/* Animation de chargement */
.spinner-border {
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .card-body {
    padding: 1rem !important;
  }
  
  .btn {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
  }
  
  .form-control {
    font-size: 0.875rem;
  }
}

/* Style pour la validation en temps réel */
.form-control.is-invalid {
  border-color: #dc3545;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23dc3545' viewBox='0 0 12 12'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 3.6.4.4.4-.4M5.8 8.4l.4-.4.4.4M8.4 5.8l-.4.4.4.4M3.6 5.8l.4.4-.4.4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.form-control.is-valid {
  border-color: #33b04a;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3e%3cpath fill='%2333b04a' d='m2.3 6.73.4.4 4-4.04-.4-.4L2.7 6.29l-1.4-1.4-.4.4z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

/* Style pour les champs de mot de passe */
input[type="password"] {
  font-family: caption;
  letter-spacing: 0.1em;
}

/* Style pour les textarea */
textarea.form-control {
  resize: vertical;
  min-height: 80px;
}

/* Effet de focus amélioré */
.form-control:focus {
  border-color: #33b04a;
  box-shadow: 0 0 0 0.25rem rgba(51, 176, 74, 0.25);
  transform: translateY(-1px);
  transition: all 0.3s ease;
}

/* Style pour le loader */
.spinner-border {
  width: 1.5rem;
  height: 1.5rem;
  border-width: 0.2em;
}

/* Amélioration de l'espacement */
.form-group {
  margin-bottom: 1rem;
}

/* Style pour le conteneur principal */
.card {
  border-radius: 1rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

/* Animation d'entrée */
.card {
  animation: slideInDown 0.6s ease-out;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom switch styling */
.custom-switch {
  width: 3.2em !important;
  height: 1.7em !important;
  margin-left: 0;
  cursor: pointer;
  background-color: #dee2e6;
  border-color: #dee2e6;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.custom-switch:focus {
  box-shadow: none;
  border-color: #dee2e6;
}

.custom-switch:checked {
  background-color: #33b04a !important; /* Brand green */
  border-color: #33b04a !important;
}

.form-switch .form-check-input {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -2 8 8'%3e%3ccircle cx='2' cy='2' r='2.5' fill='%23fff'/%3e%3c/svg%3e") !important;
}

.form-switch .form-check-input:checked {
  background-position: right center !important;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -2 8 8'%3e%3ccircle cx='6' cy='2' r='2.5' fill='%23fff'/%3e%3c/svg%3e") !important;
}
</style>
