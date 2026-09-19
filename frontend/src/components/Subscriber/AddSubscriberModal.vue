<template>
  <div
    class="modal fade createNewModal"
    id="AddSubscriberModal"
    tabindex="-1"
    ref="addSubscriberModalRef"
    aria-hidden="true"
    data-bs-backdrop="true"
    data-bs-keyboard="true"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content shadow-lg border-0">
        <div class="modal-header">
          <h4 class="modal-title fw-bold d-flex align-items-center gap-2">
            <img src="@/assets/images/logo-guda-with.png" alt="L'Africaine Vie" class="modal-inline-logo" />
            <span>{{ title }}</span>
          </h4>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body ps-0 pe-0 pb-0 pt-15 pt-md-25">
          <Form ref="subscriberForm" @submit="addSubscriber" :validation-schema="subscriberSchema">
            <div class="row">
              <div class="col-md-12">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Nom du souscripteur <span class="text-danger">*</span>
                  </label>
                  <Field name="name" type="text" 
                  class="form-control shadow-none fs-md-15 text-black" placeholder="Entrer le nom du souscripteur"/>
                  <ErrorMessage name="name" class="text-danger"/>
                </div>
              </div>
              <div class="col-md-12">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Adresse <span class="text-danger">*</span>
                  </label>
                  <Field name="address" type="text" 
                  class="form-control shadow-none fs-md-15 text-black" placeholder="Entrer l'adresse"/>
                  <ErrorMessage name="address" class="text-danger"/>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Téléphone <span class="text-danger">*</span>
                  </label>
                  <Field name="phone" type="tel" 
                  class="form-control shadow-none fs-md-15 text-black" placeholder="Entrer le numéro de téléphone"/>
                  <ErrorMessage name="phone" class="text-danger"/>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Téléphone 2
                  </label>
                  <Field name="phone2" type="tel" 
                  class="form-control shadow-none fs-md-15 text-black" placeholder="Entrer un deuxième numéro (optionnel)"/>
                  <ErrorMessage name="phone2" class="text-danger"/>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Email <span class="text-danger">*</span>
                  </label>
                  <Field name="email" type="email" 
                  class="form-control shadow-none fs-md-15 text-black" placeholder="Entrer l'adresse email"/>
                  <ErrorMessage name="email" class="text-danger"/>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Fax <span class="text-danger">*</span>
                  </label>
                  <Field name="fax" type="text" 
                  class="form-control shadow-none fs-md-15 text-black" placeholder="Entrer le numéro de fax"/>
                  <ErrorMessage name="fax" class="text-danger"/>
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
import { error, success } from '../../utils/utils';

export default defineComponent({
    name: "AddSubscriberModal",
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
    subscriberId: {
      type: [Number, String],
      default: null
    }
  },
  emits: ['subscriber-saved', 'modal-closed'],
  setup(props, { emit }){
    const subscriberSchema = Yup.object().shape({
      name: Yup.string()
        .required("Le nom du souscripteur est obligatoire")
        .min(1, "Le nom doit contenir au moins 1 caractère")
        .max(100, "Le nom ne peut pas dépasser 100 caractères"),
      address: Yup.string()
        .required("L'adresse est obligatoire")
        .min(1, "L'adresse doit contenir au moins 1 caractère")
        .max(255, "L'adresse ne peut pas dépasser 255 caractères"),
      phone: Yup.string()
        .required("Le téléphone est obligatoire")
        .max(30, "Le téléphone ne peut pas dépasser 30 caractères"),
      phone2: Yup.string()
        .nullable()
        .max(30, "Le téléphone 2 ne peut pas dépasser 30 caractères"),
      email: Yup.string()
        .required("L'email est obligatoire")
        .email("L'email doit être au format valide")
        .max(60, "L'email ne peut pas dépasser 60 caractères"),
      fax: Yup.string()
        .required("Le fax est obligatoire")
        .max(30, "Le fax ne peut pas dépasser 30 caractères"),
    });

    const subscriberForm = ref<any>(null);
    const addSubscriberModalRef = ref<null | HTMLElement>(null);
    const localItem = ref(props.subscriberId);
    const isUPDATE = ref(false);
    const title = ref("Ajouter un souscripteur");
    const btntext = ref('Ajouter');

    watch(() => props.subscriberId, (newValue) => {
      localItem.value = newValue || 0;
      if (newValue && Number(newValue) > 0) {
        getSubscriber(newValue);
        isUPDATE.value = true;
      } else {
        isUPDATE.value = false;
        if (subscriberForm.value) {
          subscriberForm.value.resetForm();
        }
      }
      btnTitle();
    });

    watch(() => props.show, (newValue) => {
      if (newValue) {
        if (props.subscriberId && Number(props.subscriberId) > 0) {
          isUPDATE.value = true;
          btnTitle();
          getSubscriber(props.subscriberId);
        } else {
          isUPDATE.value = false;
          btnTitle();
          if (subscriberForm.value) {
            subscriberForm.value.resetForm();
          }
        }
        
        try {
          if (typeof (window as any).bootstrap !== 'undefined' && (window as any).bootstrap.Modal) {
            const modal = new (window as any).bootstrap.Modal(addSubscriberModalRef.value);
            modal.show();
          } else {
            if (typeof (window as any).$ !== 'undefined') {
              (window as any).$(addSubscriberModalRef.value).modal('show');
            } else {
              if (addSubscriberModalRef.value) {
                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                backdrop.addEventListener('click', closeModal);
                document.body.appendChild(backdrop);
                
                addSubscriberModalRef.value.style.display = 'block';
                addSubscriberModalRef.value.classList.add('show');
                document.body.classList.add('modal-open');
              }
            }
          }
        } catch (err) {
          console.error('Erreur lors de l\'ouverture du modal:', err);
          if (addSubscriberModalRef.value) {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            backdrop.addEventListener('click', closeModal);
            document.body.appendChild(backdrop);
            
            addSubscriberModalRef.value.style.display = 'block';
            addSubscriberModalRef.value.classList.add('show');
            document.body.classList.add('modal-open');
          }
        }
      }
    });

    const btnTitle = async () => {
      if (isUPDATE.value) {
         title.value = "Modifier le souscripteur";
         btntext.value = "Modifier";
      }else{
         title.value = "Ajouter un souscripteur";
         btntext.value = "Ajouter";
      }
    }

    const getSubscriber = async (id: string | number) => {
      if (!id || id === 0) return;
      
      try {
        const { data } = await ApiService.get("/subscribers/"+id);
       // console.log('🔄 Réponse API getSubscriber complète:', data);
        
        let donnees = null;
        
        if (data?.data?.subscriber) {
          donnees = data.data.subscriber;
         // console.log('✅ Données trouvées dans data.data.subscriber');
        } else if (data?.data && typeof data.data === 'object' && 'id' in data.data) {
          donnees = data.data;
         // console.log('✅ Données trouvées dans data.data');
        } else if (data && typeof data === 'object' && 'id' in data) {
          donnees = data;
         // console.log('✅ Données trouvées directement dans data');
        }
        
        if (!donnees) {
          console.error('❌ Aucune donnée reçue de l\'API');
          error('Impossible de charger les données du souscripteur');
          return;
        }
        
        // console.log('📋 Données du souscripteur extraites:', donnees);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (subscriberForm.value && typeof subscriberForm.value.setFieldValue === 'function') {
          const formFields = ['name', 'address', 'phone', 'phone2', 'email', 'fax'];
          
          for (const formField of formFields) {
            let value: any = donnees[formField] || null;
            
            if (typeof value === 'object' && value !== null && 'id' in value) {
              value = (value as { id: any }).id;
            }
            
            if (value === null || value === undefined) {
              value = '';
            }
            
            // console.log(`🔧 Mapping field ${formField} = ${value}`);
            subscriberForm.value.setFieldValue(formField, value);
          }
          
         // console.log('✅ Tous les champs ont été mappés');
        } else {
          console.warn('⚠️ Formulaire VeeValidate pas encore prêt, retry dans 200ms');
          setTimeout(() => {
            if (subscriberForm.value && typeof subscriberForm.value.setFieldValue === 'function') {
              const formFields = ['name', 'address', 'phone', 'phone2', 'email', 'fax'];
              
              for (const formField of formFields) {
                let value: any = donnees[formField] || null;
                
                if (typeof value === 'object' && value !== null && 'id' in value) {
                  value = (value as { id: any }).id;
                }
                
                if (value === null || value === undefined) {
                  value = '';
                }
                
                subscriberForm.value.setFieldValue(formField, value);
              }
             // console.log('✅ Formulaire VeeValidate mis à jour avec les nouvelles valeurs (retry)');
            }
          }, 200);
        }
      } catch (err: any) {
        // console.error('❌ Erreur lors du chargement du souscripteur:', err);
        const message = err?.response?.data?.message || 'Erreur lors du chargement du souscripteur';
        error(message);
      }
    }

    const addSubscriber = async (values: any, { resetForm }) => {
      if(isUPDATE.value){
        ApiService.put("/subscribers/"+localItem.value, values)
        .then(({ data }) => {
            if(data.code == 200) { 
              success(data.message);
              resetForm();
              closeModal();
              emit('subscriber-saved');
            }
        })
        .catch(({ response }) => {
            error(response.data.message);
        });
      }else{
        ApiService.post("/subscribers", values)
        .then(({ data }) => {
            if(data.code == 201) { 
              success(data.message);
              resetForm();
              closeModal();
              emit('subscriber-saved');
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
      
      if (subscriberForm.value) {
        subscriberForm.value.resetForm();
      }
      
      btnTitle();
    };

    const closeModal = () => {
      try {
        if (typeof (window as any).bootstrap !== 'undefined' && (window as any).bootstrap.Modal) {
          const modal = (window as any).bootstrap.Modal.getInstance(addSubscriberModalRef.value);
          if (modal) {
            modal.hide();
          }
        } else {
          if (typeof (window as any).$ !== 'undefined') {
            (window as any).$(addSubscriberModalRef.value).modal('hide');
          } else {
            if (addSubscriberModalRef.value) {
              addSubscriberModalRef.value.style.display = 'none';
              addSubscriberModalRef.value.classList.remove('show');
              document.body.classList.remove('modal-open');
              const backdrop = document.querySelector('.modal-backdrop');
              if (backdrop) {
                backdrop.remove();
              }
            }
          }
        }
      } catch (err) {
        console.error('Erreur lors de la fermeture du modal:', err);
        if (addSubscriberModalRef.value) {
          addSubscriberModalRef.value.style.display = 'none';
          addSubscriberModalRef.value.classList.remove('show');
          document.body.classList.remove('modal-open');
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
      if (subscriberForm.value) {
        try {
          const formValues = subscriberForm.value.values;
         // console.log('📝 Valeurs du formulaire:', formValues);
          
          const { valid, errors } = await subscriberForm.value.validate();
         // console.log('🔍 Validation résultat:', { valid, errors });
          
          if (valid && formValues) {
            const resetForm = () => {
              if (subscriberForm.value) {
                subscriberForm.value.resetForm();
              }
            };
            await addSubscriber(formValues, { resetForm });
          } else {
            // console.log('❌ Formulaire non valide ou valeurs manquantes:', { valid, formValues, errors });
          }
        } catch (err) {
          console.error('Erreur lors de la validation:', err);
        }
      }
    };

    return { 
      subscriberSchema,
      addSubscriberModalRef,
      addSubscriber,
      subscriberForm,
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

