<template>
  <div>
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div class="d-flex align-items-center gap-2">
        <div class="icon-box bg-info-subtle text-info p-2 rounded-2">
          <i class="ph-bold ph-users-three fs-5"></i>
        </div>
        <div>
          <h6 class="text-dark fw-semibold mb-0">Liens de Parenté</h6>
          <small class="text-muted">Gérer les liens de parenté disponibles pour les bénéficiaires et ayant droits</small>
        </div>
      </div>
      <button @click="openModal()" class="btn btn-primary d-flex align-items-center gap-2 px-3">
        <i class="ph-bold ph-plus"></i> Ajouter un lien
      </button>
    </div>

    <!-- Table list -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
    <div v-else class="table-responsive">
      <table class="table align-middle table-hover border">
        <thead class="table-light">
          <tr>
            <th scope="col" style="width: 60px;">#</th>
            <th scope="col">Libellé</th>
            <th scope="col">Code</th>
            <th scope="col">Description</th>
            <th scope="col" style="width: 100px;">Statut</th>
            <th scope="col" class="text-end" style="width: 120px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in liens" :key="item.id">
            <td class="fw-bold text-muted">{{ index + 1 }}</td>
            <td class="fw-semibold text-dark">{{ item.libelle }}</td>
            <td><code class="text-primary bg-light px-2 py-1 rounded">{{ item.code || '-' }}</code></td>
            <td class="text-muted small">{{ item.description || '-' }}</td>
            <td>
              <span :class="item.isActive !== false ? 'badge bg-success-subtle text-success' : 'badge bg-secondary-subtle text-secondary'">
                {{ item.isActive !== false ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td class="text-end">
              <button @click="openModal(item)" class="btn btn-sm btn-light-warning me-1" title="Modifier">
                <i class="flaticon-pen"></i>
              </button>
              <button @click="deleteItem(item)" class="btn btn-sm btn-light-danger" title="Supprimer">
                <i class="flaticon-delete"></i>
              </button>
            </td>
          </tr>
          <tr v-if="liens.length === 0">
            <td colspan="6" class="text-center py-4 text-muted">
              Aucun lien de parenté configuré.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Creation/Edition -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header border-bottom">
            <h5 class="modal-title fw-bold text-dark">
              {{ isEditing ? 'Modifier le lien de parenté' : 'Ajouter un lien de parenté' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <form @submit.prevent="saveForm">
            <div class="modal-body p-4">
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Libellé <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  v-model="form.libelle" 
                  class="form-control" 
                  placeholder="Ex: Époux / Épouse, Fils, Père..." 
                  required 
                />
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Code système (Optionnel)</label>
                <input 
                  type="text" 
                  v-model="form.code" 
                  class="form-control text-uppercase" 
                  placeholder="Ex: CONJOINT, FILS, PERE..." 
                />
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Description</label>
                <textarea 
                  v-model="form.description" 
                  class="form-control" 
                  rows="2" 
                  placeholder="Informations ou précisions..."
                ></textarea>
              </div>
              <div class="form-check form-switch">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="activeSwitch" 
                  v-model="form.isActive" 
                />
                <label class="form-check-label fw-semibold text-dark" for="activeSwitch">Actif</label>
              </div>
            </div>
            <div class="modal-footer border-top">
              <button type="button" class="btn btn-light" @click="closeModal">Annuler</button>
              <button type="submit" class="btn btn-success px-4" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import ApiService from '../../services/ApiService';
import Swal from 'sweetalert2';

export default defineComponent({
  name: 'LienParenteManagement',
  setup() {
    const liens = ref<any[]>([]);
    const loading = ref(true);
    const saving = ref(false);
    const showModal = ref(false);
    const isEditing = ref(false);
    const currentId = ref<number | null>(null);

    const form = ref({
      libelle: '',
      code: '',
      description: '',
      isActive: true
    });

    const loadLiens = async () => {
      loading.value = true;
      try {
        const response = await ApiService.get('lien-parente');
        liens.value = response.data.liensParente || response.data.data?.liensParente || response.data.data || response.data || [];
      } catch (error) {
        console.error('Erreur chargement liens de parenté', error);
      } finally {
        loading.value = false;
      }
    };

    const openModal = (item: any = null) => {
      if (item) {
        isEditing.value = true;
        currentId.value = item.id;
        form.value = {
          libelle: item.libelle,
          code: item.code || '',
          description: item.description || '',
          isActive: item.isActive !== false
        };
      } else {
        isEditing.value = false;
        currentId.value = null;
        form.value = {
          libelle: '',
          code: '',
          description: '',
          isActive: true
        };
      }
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
    };

    const saveForm = async () => {
      if (!form.value.libelle.trim()) return;
      saving.value = true;
      try {
        if (isEditing.value && currentId.value) {
          await ApiService.put(`lien-parente/${currentId.value}`, form.value);
          Swal.fire('Succès', 'Lien de parenté mis à jour avec succès', 'success');
        } else {
          await ApiService.post('lien-parente', form.value);
          Swal.fire('Succès', 'Lien de parenté créé avec succès', 'success');
        }
        closeModal();
        await loadLiens();
      } catch (error: any) {
        console.error('Erreur enregistrement lien parente', error);
        Swal.fire('Erreur', error.response?.data?.message || 'Une erreur s\'est produite', 'error');
      } finally {
        saving.value = false;
      }
    };

    const deleteItem = async (item: any) => {
      const result = await Swal.fire({
        title: 'Confirmer la suppression',
        text: `Voulez-vous vraiment supprimer "${item.libelle}" ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#dc2626'
      });

      if (result.isConfirmed) {
        try {
          await ApiService.delete(`lien-parente/${item.id}`);
          Swal.fire('Supprimé', 'Le lien de parenté a été supprimé', 'success');
          await loadLiens();
        } catch (error: any) {
          Swal.fire('Erreur', error.response?.data?.message || 'Erreur lors de la suppression', 'error');
        }
      }
    };

    onMounted(() => {
      loadLiens();
    });

    return {
      liens,
      loading,
      saving,
      showModal,
      isEditing,
      form,
      openModal,
      closeModal,
      saveForm,
      deleteItem
    };
  }
});
</script>
