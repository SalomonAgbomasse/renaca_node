<template>
  <Modal
    :isVisible="visible"
    title="Modifier les Informations Personnelles de l'Assuré"
    icon="flaticon-user"
    size="large"
    @close="closeModal"
  >
    <div class="row">
      <!-- Nom -->
      <div class="col-md-6 mb-3">
        <label class="form-label fw-bold"><i class="fas fa-user text-secondary me-2"></i>Nom <span class="text-danger">*</span></label>
        <input type="text" v-model="form.lastname" class="form-control" required @input="uppercaseNom" />
      </div>

      <!-- Prénoms -->
      <div class="col-md-6 mb-3">
        <label class="form-label fw-bold"><i class="fas fa-user text-secondary me-2"></i>Prénoms <span class="text-danger">*</span></label>
        <input type="text" v-model="form.firstname" class="form-control" required />
      </div>

      <!-- Genre -->
      <div class="col-md-6 mb-3">
        <label class="form-label fw-bold"><i class="fas fa-venus-mars text-secondary me-2"></i>Genre <span class="text-danger">*</span></label>
        <select v-model="form.gender" class="form-select" required>
          <option value="M">Masculin</option>
          <option value="F">Féminin</option>
        </select>
      </div>

      <!-- Date de naissance -->
      <div class="col-md-6 mb-3">
        <label class="form-label fw-bold"><i class="fas fa-calendar-alt text-secondary me-2"></i>Date de Naissance <span class="text-danger">*</span></label>
        <input type="date" v-model="form.birthdate" class="form-control" required />
      </div>

      <!-- Téléphone -->
      <div class="col-md-6 mb-3">
        <label class="form-label fw-bold"><i class="fas fa-phone text-secondary me-2"></i>Téléphone</label>
        <input type="text" v-model="form.phone" class="form-control" />
      </div>

      <!-- Email -->
      <div class="col-md-6 mb-3">
        <label class="form-label fw-bold"><i class="fas fa-envelope text-secondary me-2"></i>Email</label>
        <input type="email" v-model="form.email" class="form-control" />
      </div>

      <!-- Lieu de naissance -->
      <div class="col-md-6 mb-3">
        <label class="form-label fw-bold"><i class="fas fa-map-marker-alt text-secondary me-2"></i>Lieu de Naissance</label>
        <input type="text" v-model="form.placeOfBirth" class="form-control" />
      </div>

      <!-- Profession -->
      <div class="col-md-6 mb-3">
        <label class="form-label fw-bold"><i class="fas fa-briefcase text-secondary me-2"></i>Profession</label>
        <input type="text" v-model="form.occupation" class="form-control" />
      </div>

      <!-- Adresse -->
      <div class="col-md-12 mb-3">
        <label class="form-label fw-bold"><i class="fas fa-home text-secondary me-2"></i>Adresse</label>
        <input type="text" v-model="form.address" class="form-control" />
      </div>
    </div>

    <!-- FOOTER -->
    <template #footer>
      <button type="button" class="btn btn-outline-secondary px-4 me-2" @click="closeModal">
        Annuler
      </button>
      <button 
        type="button" 
        class="btn btn-success px-4" 
        @click="submitForm"
        :disabled="isSubmitting || !isFormValid"
      >
        <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
        Enregistrer
      </button>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType } from 'vue';
import Modal from '../Common/Modal.vue';
import ApiService from '../../services/ApiService';
import { success, error } from '../../utils/utils';

export default defineComponent({
  name: 'EditAssureModal',
  components: {
    Modal
  },
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    contratDetails: {
      type: Object as PropType<any>,
      required: false,
      default: null
    }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const isSubmitting = ref(false);

    const form = ref({
      lastname: '',
      firstname: '',
      gender: 'M',
      birthdate: '',
      phone: '',
      email: '',
      placeOfBirth: '',
      occupation: '',
      address: ''
    });

    // Charger les informations du client à l'ouverture du modal
    const initForm = () => {
      const client = props.contratDetails?.customer || {};
      form.value = {
        lastname: client.lastname || '',
        firstname: client.firstname || '',
        gender: client.gender || 'M',
        birthdate: client.birthdate || '',
        phone: client.phone || '',
        email: client.email || '',
        placeOfBirth: client.placeOfBirth || '',
        occupation: client.occupation || '',
        address: client.address || ''
      };
    };

    watch(() => props.visible, (newVal) => {
      if (newVal) {
        initForm();
      }
    });

    const uppercaseNom = () => {
      if (form.value.lastname) {
        form.value.lastname = form.value.lastname.toUpperCase();
      }
    };

    const isFormValid = computed(() => {
      return form.value.lastname.trim() !== '' && 
             form.value.firstname.trim() !== '' && 
             form.value.birthdate !== '';
    });

    const closeModal = () => {
      emit('close');
    };

    const submitForm = async () => {
      if (!props.contratDetails?.id || !isFormValid.value) return;
      isSubmitting.value = true;
      try {
        const payload = {
          clientData: {
            ...form.value
          }
        };
        const res = await ApiService.put(`/contracts/${props.contratDetails.id}`, payload);
        success(res?.data?.message || 'Informations de l\'assuré mises à jour avec succès !');
        emit('saved');
        closeModal();
      } catch (err: any) {
        console.error('Erreur modif client:', err);
        error(err?.response?.data?.message || err?.message || 'Erreur lors de la mise à jour');
      } finally {
        isSubmitting.value = false;
      }
    };

    return {
      isSubmitting,
      form,
      isFormValid,
      uppercaseNom,
      closeModal,
      submitForm
    };
  }
});
</script>

<style scoped>
</style>
