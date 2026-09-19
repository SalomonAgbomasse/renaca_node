<template>
  <div
    class="modal fade createNewModal"
    id="AddAgencyModal"
    tabindex="-1"
    ref="addAgencyModalRef"
    aria-hidden="true"
    data-bs-backdrop="true"
    data-bs-keyboard="true"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content p-15 p-md-40">
        <div class="modal-header d-block ps-0 pe-0 pt-0 pb-15 pb-md-25">
          <h5 class="modal-title fw-bold text-black">{{ title }}</h5>
        </div>
        <div class="modal-body ps-0 pe-0 pb-0 pt-15 pt-md-25">
          <Form ref="agencyForm" @submit="addAgency" :validation-schema="agencySchema">
            <div class="row">
              <div class="col-md-12">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Nom de l'agence <span class="text-danger">*</span>
                  </label>
                  <Field name="name" type="text" 
                  class="form-control shadow-none fs-md-15 text-black" placeholder="Entrer le nom de l'agence"/>
                  <ErrorMessage name="name" class="text-danger"/>
                </div>
              </div>
              <div class="col-md-12">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Adresse de l'agence  <span class="text-danger">*</span>
                  </label>
                  <Field name="location" type="text" 
                  class="form-control shadow-none fs-md-15 text-black" placeholder="Entrer l'adresse"/>
                  <ErrorMessage name="location" class="text-danger"/>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Téléphone
                  </label>
                  <Field name="phone" type="tel" 
                  class="form-control shadow-none fs-md-15 text-black" placeholder="Entrer le numéro de téléphone"/>
                  <ErrorMessage name="phone" class="text-danger"/>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Email
                  </label>
                  <Field name="email" type="email" 
                  class="form-control shadow-none fs-md-15 text-black" placeholder="Entrer l'adresse email"/>
                  <ErrorMessage name="email" class="text-danger"/>
                </div>
              </div>
            </div>
          </Form>
        </div>
        
        <!-- Footer du modal -->
        <div class="modal-footer d-flex justify-content-between">
          <button
            type="button"
            class="btn btn-secondary"
            @click="closeModal()"
          >
            <i class="flaticon-cancel me-2"></i>
            Fermer
          </button>
          
          <button
            type="button"
            class="default-btn transition border-0 fw-medium text-white pt-10 pb-10 ps-25 pe-25 pt-md-11 pb-md-11 ps-md-35 pe-md-35 rounded-1 fs-md-15 fs-lg-16"
            @click="submitForm()"
          >
            {{ btntext }}
          </button>
        </div>
        <button
          type="button"
          class="btn-close shadow-none"
          data-bs-dismiss="modal"
          aria-label="Close"
          @click="closeModal()"
        ></button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import ApiService from '../../services/ApiService';
import * as Yup from 'yup';
import { Agency } from '../../models/Agency';
import { error, success } from '../../utils/utils';

export default defineComponent({
    name: "AddAgencyModal",
    components: {
    Form,
    Field,
    ErrorMessage
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    agencyId: {
      type: [Number, String],
      default: null
    }
  },
  emits: ['agency-saved', 'modal-closed'],
  setup(props, { emit }){
    const agencySchema = Yup.object().shape({
      name: Yup.string()
        .required("Le nom de l'agence est obligatoire")
        .min(1, "Le nom doit contenir au moins 1 caractère")
        .max(300, "Le nom ne peut pas dépasser 300 caractères"),
      location: Yup.string()
        .required("L'adresse de l'agence est obligatoire")
        .min(1, "L'adresse doit contenir au moins 1 caractère")
        .max(300, "L'adresse ne peut pas dépasser 300 caractères"),
      phone: Yup.string()
        .nullable()
        .max(50, "Le téléphone ne peut pas dépasser 50 caractères"),
      email: Yup.string()
        .nullable()
        .email("L'email doit être au format valide")
        .max(50, "L'email ne peut pas dépasser 50 caractères"),
    });

    const agencyForm = ref<any>(null);
    const addAgencyModalRef = ref<null | HTMLElement>(null);
    const localItem = ref(props.agencyId);
    const isUPDATE = ref(false);
    const title = ref("Ajouter une agence");
    const btntext = ref('Ajouter');

    watch(() => props.agencyId, (newValue) => {
      localItem.value = newValue || 0;
      if (newValue && Number(newValue) > 0) {
        getAgency(newValue);
        isUPDATE.value = true;
      } else {
        isUPDATE.value = false;
        // Réinitialiser le formulaire pour un nouvel ajout
        if (agencyForm.value) {
          agencyForm.value.resetForm();
        }
      }
      btnTitle();
    });

    watch(() => props.show, (newValue) => {
      if (newValue) {
        try {
          // Vérifier si Bootstrap est disponible
          if (typeof (window as any).bootstrap !== 'undefined' && (window as any).bootstrap.Modal) {
            const modal = new (window as any).bootstrap.Modal(addAgencyModalRef.value);
            modal.show();
          } else {
            // Fallback : utiliser jQuery si disponible
            if (typeof (window as any).$ !== 'undefined') {
              (window as any).$(addAgencyModalRef.value).modal('show');
                         } else {
               // Fallback final : manipulation manuelle
               if (addAgencyModalRef.value) {
                 // Créer le backdrop
                 const backdrop = document.createElement('div');
                 backdrop.className = 'modal-backdrop fade show';
                 backdrop.addEventListener('click', closeModal);
                 document.body.appendChild(backdrop);
                 
                 addAgencyModalRef.value.style.display = 'block';
                 addAgencyModalRef.value.classList.add('show');
                 document.body.classList.add('modal-open');
               }
             }
          }
        } catch (err) {
          console.error('Erreur lors de l\'ouverture du modal:', err);
                     // Fallback final en cas d'erreur
           if (addAgencyModalRef.value) {
             // Créer le backdrop
             const backdrop = document.createElement('div');
             backdrop.className = 'modal-backdrop fade show';
             backdrop.addEventListener('click', closeModal);
             document.body.appendChild(backdrop);
             
             addAgencyModalRef.value.style.display = 'block';
             addAgencyModalRef.value.classList.add('show');
             document.body.classList.add('modal-open');
           }
        }
      }
    });

    const btnTitle = async () => {
      if (isUPDATE.value) {
         title.value = "Modifier l'agence";
         btntext.value = "Modifier";
      }else{
         title.value = "Ajouter une agence";
         btntext.value = "Ajouter";
      }
    }

    const getAgency = async (id: string | number) => {
      if (!id || id === 0) return;
      
      return ApiService.get("/agencies/"+id)
      .then(({ data }) => {
        // Vérifier la structure de la réponse
        const donnees = data?.data || data;
        
        if (!donnees) {
          console.error('❌ Aucune donnée reçue de l\'API');
          return;
        }
        
        // map data in form
        for (const key in donnees) {
          if (agencyForm.value && typeof agencyForm.value.setFieldValue === 'function') {
            const value = (typeof donnees[key] === 'object' && donnees[key] !== null) ? donnees[key].id : donnees[key];
            agencyForm.value.setFieldValue(key, value);
          }
        }
      })
      .catch((err) => {
        console.error('❌ Erreur lors du chargement de l\'agence:', err);
        const message = err?.response?.data?.message || 'Erreur lors du chargement de l\'agence';
        error(message);
      });
    }

    const addAgency = async (values: any, { resetForm }) => {
      values = values as Agency;
      if(isUPDATE.value){
        ApiService.put("/agencies/"+localItem.value, values)
        .then(({ data }) => {
            if(data.code == 200) { 
              success(data.message);
              resetForm();
              closeModal();
              emit('agency-saved');
            }
        })
        .catch(({ response }) => {
            error(response.data.message);
        });
      }else{
        ApiService.post("/agencies", values)
        .then(({ data }) => {
            if(data.code == 201) { 
              success(data.message);
              resetForm();
              closeModal();
              emit('agency-saved');
            }
        })
        .catch(({ response }) => {
            error(response.data.message);
        });
      }
    };

    const resetValue = () => {
      const formFields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
      isUPDATE.value = false;
      localItem.value = 0;
      formFields.forEach(field => {
        field.value = '';
      });
      
      // Réinitialiser le formulaire VeeValidate
      if (agencyForm.value) {
        agencyForm.value.resetForm();
      }
      
      btnTitle();
    };

    const closeModal = () => {
      try {
        // Vérifier si Bootstrap est disponible
        if (typeof (window as any).bootstrap !== 'undefined' && (window as any).bootstrap.Modal) {
          const modal = (window as any).bootstrap.Modal.getInstance(addAgencyModalRef.value);
          if (modal) {
            modal.hide();
          }
        } else {
          // Fallback : utiliser jQuery si disponible
          if (typeof (window as any).$ !== 'undefined') {
            (window as any).$(addAgencyModalRef.value).modal('hide');
          } else {
            // Fallback final : manipulation manuelle
            if (addAgencyModalRef.value) {
              addAgencyModalRef.value.style.display = 'none';
              addAgencyModalRef.value.classList.remove('show');
              document.body.classList.remove('modal-open');
              // Supprimer le backdrop s'il existe
              const backdrop = document.querySelector('.modal-backdrop');
              if (backdrop) {
                backdrop.remove();
              }
            }
          }
        }
      } catch (err) {
        console.error('Erreur lors de la fermeture du modal:', err);
        // Fallback final en cas d'erreur
        if (addAgencyModalRef.value) {
          addAgencyModalRef.value.style.display = 'none';
          addAgencyModalRef.value.classList.remove('show');
          document.body.classList.remove('modal-open');
          // Supprimer le backdrop s'il existe
          const backdrop = document.querySelector('.modal-backdrop');
          if (backdrop) {
            backdrop.remove();
          }
        }
      }
      
      resetValue();
      emit('modal-closed');
    };

    const submitForm = async () => {
      if (agencyForm.value) {
        try {
          // Récupérer les valeurs du formulaire
          const formValues = agencyForm.value.values;
          
          // Valider le formulaire
          const { valid, errors } = await agencyForm.value.validate();
          
          if (valid && formValues) {
            // Créer un objet resetForm fictif pour compatibilité
            const resetForm = () => {
              if (agencyForm.value) {
                agencyForm.value.resetForm();
              }
            };
            // Appeler addAgency avec les valeurs du formulaire
            await addAgency(formValues, { resetForm });
          }
        } catch (err) {
          console.error('Erreur lors de la validation:', err);
        }
      }
    };

    return { 
      agencySchema,
      addAgencyModalRef,
      addAgency,
      agencyForm,
      title,
      btntext,
      resetValue,
      closeModal,
      submitForm
    };
  },
});
</script>

<style>
@import '@vueform/multiselect/themes/default.css';
</style>