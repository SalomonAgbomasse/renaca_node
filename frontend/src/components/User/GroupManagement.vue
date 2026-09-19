<template>
  <div>
    <!-- En-tête de section avec Recherche et Bouton Nouveau Groupe à droite -->
    <div class="d-flex align-items-center justify-content-between pb-3 mb-20 border-bottom border-light-subtle flex-wrap gap-3">
      <div class="d-flex align-items-center gap-2">
        <div class="icon-box bg-success-subtle text-success p-2 rounded-2">
          <i class="ph-bold ph-users-three fs-5"></i>
        </div>
        <h5 class="text-dark fw-semibold mb-0">Groupes & Habilitations par Nature de Crédit</h5>
      </div>
      <div class="d-flex align-items-center gap-2">
        <div class="search-box position-relative" style="min-width: 240px;">
          <input
            type="text"
            v-model="searchTerm"
            class="form-control form-control-sm shadow-none text-black bg-light border"
            placeholder="Rechercher un groupe..."
          />
        </div>
        <button
          class="btn btn-sm btn-success d-flex align-items-center gap-1 px-3 py-2 fw-medium"
          @click="openAddModal">
          <i class="ph-bold ph-plus-circle"></i>
          <span>Nouveau Groupe</span>
        </button>
      </div>
    </div>

    <!-- Indicateur de chargement -->
    <div v-if="loading" class="text-center p-4">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div v-else>
      <div class="table-responsive">
          <table class="table text-nowrap align-middle mb-0">
            <thead>
              <tr>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">GROUPE</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">DESCRIPTION</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">NATURES DE CRÉDIT AUTORISÉES</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">MEMBRES (USERS)</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3 text-end pe-0">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredGroups.length === 0">
                <td colspan="5" class="text-center text-muted py-4">
                  Aucun groupe trouvé
                </td>
              </tr>
              <tr v-for="group in filteredGroups" :key="group.id">
                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <div class="d-flex align-items-center">
                    <div class="avatar-circle me-3">
                      <span class="avatar-initials">{{ (group.libelle || 'G').charAt(0).toUpperCase() }}</span>
                    </div>
                    <div>
                      <span class="d-block fw-bold text-dark fs-14">{{ group.libelle }}</span>
                      <small class="text-muted" v-if="group.code">Code: {{ group.code }}</small>
                    </div>
                  </div>
                </td>
                <td class="shadow-none text-body">
                  {{ group.description || '—' }}
                </td>
                <td class="shadow-none">
                  <div class="d-flex flex-wrap gap-1">
                    <span v-if="!group.natureCredits || group.natureCredits.length === 0" class="badge bg-secondary-subtle text-secondary">
                      Aucune nature attribuée
                    </span>
                    <span
                      v-for="nature in group.natureCredits"
                      :key="nature.id"
                      class="badge bg-success-subtle text-success border border-success-subtle"
                    >
                      <i class="ph-bold ph-shield-check me-1"></i>
                      {{ nature.libelle }} ({{ nature.code }})
                    </span>
                  </div>
                </td>
                <td class="shadow-none">
                  <span class="badge bg-info-subtle text-info">
                    <i class="ph-bold ph-users me-1"></i>
                    {{ group.users?.length || 0 }} utilisateur(s)
                  </span>
                </td>
                <td class="shadow-none text-end pe-0">
                  <button class="btn btn-sm btn-outline-primary me-2" @click="openEditModal(group)">
                    <i class="ph-bold ph-pencil"></i> Modifier
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteGroup(group)">
                    <i class="ph-bold ph-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    <!-- Modal Ajouter / Éditer Groupe -->
    <div class="modal fade" id="groupModal" ref="groupModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-xl" style="max-width: 95vw; width: 95vw;">
        <div class="modal-content shadow-lg border-0">
          <div class="modal-header">
            <h4 class="modal-title fw-bold d-flex align-items-center gap-2">
              <img src="@/assets/images/logo-guda-with.png" alt="L'Africaine Vie" class="modal-inline-logo" />
              <span>{{ isEditing ? 'Modifier le Groupe' : 'Nouveau Groupe' }}</span>
            </h4>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4">
            <form @submit.prevent="saveGroup">
              <div class="row g-3">
                <div class="col-md-8">
                  <label class="form-label fw-medium">Nom du groupe <span class="text-danger">*</span></label>
                  <input type="text" v-model="form.libelle" class="form-control" placeholder="ex: Groupe Microfinance" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-medium">Code (optionnel)</label>
                  <input type="text" v-model="form.code" class="form-control" placeholder="ex: G_MICRO" />
                </div>
                <div class="col-12">
                  <label class="form-label fw-medium">Description</label>
                  <textarea v-model="form.description" class="form-control" rows="2" placeholder="Description de l'usage de ce groupe..."></textarea>
                </div>

                <!-- Natures de crédit autorisées -->
                <div class="col-12 mt-3">
                  <label class="form-label fw-semibold text-dark mb-2">
                    <i class="ph-bold ph-shield-check me-1 text-success"></i>
                    Natures de crédit autorisées pour ce groupe
                  </label>
                  <div class="p-3 bg-light rounded border">
                    <div v-if="allNatureCredits.length === 0" class="text-muted small">
                      Aucune nature de crédit trouvée dans le système.
                    </div>
                    <div class="row g-2">
                      <div class="col-md-4" v-for="nc in allNatureCredits" :key="nc.id">
                        <div class="form-check p-2 rounded border bg-white">
                          <input
                            class="form-check-input"
                            type="checkbox"
                            :id="'nc-' + nc.id"
                            :value="nc.id"
                            v-model="form.natureCreditIds"
                          />
                          <label class="form-check-label ms-2 fw-medium cursor-pointer" :for="'nc-' + nc.id">
                            {{ nc.libelle }} <span class="text-muted fs-12">({{ nc.code }})</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Affectation des Utilisateurs -->
                <div class="col-12 mt-3">
                  <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                    <label class="form-label fw-semibold text-dark mb-0">
                      <i class="ph-bold ph-users me-1 text-primary"></i>
                      Membres du groupe ({{ form.userIds.length }} sélectionné(s) sur {{ allUsers.length }})
                    </label>
                    <div class="d-flex align-items-center gap-2">
                      <button 
                        type="button" 
                        class="btn btn-sm btn-outline-success py-1 px-2 fs-12"
                        @click="selectAllFilteredUsers"
                      >
                        Tout sélectionner (filtrés)
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-outline-secondary py-1 px-2 fs-12"
                        @click="form.userIds = []"
                      >
                        Désélectionner tout
                      </button>
                    </div>
                  </div>

                  <!-- Zone de recherche d'utilisateurs -->
                  <div class="input-group input-group-sm mb-2">
                    <span class="input-group-text bg-white border-end-0">
                      <i class="ph-bold ph-magnifying-glass text-muted"></i>
                    </span>
                    <input 
                      type="text" 
                      v-model="userSearchTerm" 
                      class="form-control border-start-0 shadow-none" 
                      placeholder="Rechercher un utilisateur par nom, prénom, email ou rôle..."
                    />
                    <button 
                      v-if="userSearchTerm" 
                      type="button" 
                      class="btn btn-outline-secondary btn-sm" 
                      @click="userSearchTerm = ''"
                    >
                      Effacer
                    </button>
                  </div>

                  <div class="p-3 bg-light rounded border" style="max-height: 380px; overflow-y: auto;">
                    <div v-if="allUsers.length === 0" class="text-muted small text-center py-3">
                      Chargement des utilisateurs...
                    </div>
                    <div v-else-if="filteredUsersList.length === 0" class="text-muted small text-center py-3">
                      Aucun utilisateur trouvé pour "{{ userSearchTerm }}".
                    </div>
                    <div v-else class="row g-2">
                      <div class="col-md-6 col-lg-4" v-for="user in filteredUsersList" :key="user.id">
                        <div 
                          class="form-check p-2 rounded border bg-white d-flex align-items-center justify-content-between h-100"
                          :class="{ 'border-success bg-success-subtle': form.userIds.includes(user.id) }"
                        >
                          <div class="d-flex align-items-center text-truncate me-2">
                            <input
                              class="form-check-input me-2 flex-shrink-0"
                              type="checkbox"
                              :id="'usr-' + user.id"
                              :value="user.id"
                              v-model="form.userIds"
                            />
                            <label class="form-check-label fw-medium cursor-pointer mb-0 text-truncate" :for="'usr-' + user.id" :title="`${user.firstname || ''} ${user.lastname || ''}`">
                              {{ user.firstname }} {{ user.lastname }}
                            </label>
                          </div>
                          <small class="badge bg-secondary-subtle text-secondary flex-shrink-0 fs-11">
                            {{ user.role?.libelle || 'Utilisateur' }}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Annuler</button>
                <button type="submit" class="btn btn-success px-4" :disabled="isSaving">
                  <span v-if="isSaving" class="spinner-border spinner-border-sm me-1"></span>
                  {{ isSaving ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer le groupe') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, reactive } from 'vue';
import ApiService from '../../services/ApiService';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

export default defineComponent({
  name: 'GroupManagement',
  setup() {
    const groups = ref<any[]>([]);
    const allNatureCredits = ref<any[]>([]);
    const allUsers = ref<any[]>([]);
    const loading = ref(true);
    const isSaving = ref(false);
    const searchTerm = ref('');
    const isEditing = ref(false);
    const currentId = ref<number | null>(null);
    const groupModalRef = ref<HTMLElement | null>(null);
    let modalInstance: Modal | null = null;

    const form = reactive({
      libelle: '',
      code: '',
      description: '',
      isActive: true,
      natureCreditIds: [] as number[],
      userIds: [] as number[]
    });

    const filteredGroups = computed(() => {
      if (!searchTerm.value) return groups.value;
      const term = searchTerm.value.toLowerCase();
      return groups.value.filter(g =>
        g.libelle?.toLowerCase().includes(term) ||
        g.description?.toLowerCase().includes(term) ||
        g.code?.toLowerCase().includes(term)
      );
    });

    const fetchGroups = async () => {
      loading.value = true;
      try {
        const response = await ApiService.get('groups');
        const rawData = response.data?.data?.groups || response.data?.groups || response.data?.data;
        groups.value = Array.isArray(rawData) ? rawData : [];
      } catch (err: any) {
        console.error('Erreur lors du chargement des groupes:', err);
      } finally {
        loading.value = false;
      }
    };

    const fetchNatureCredits = async () => {
      try {
        const response = await ApiService.get('nature-credits');
        const resData = response.data?.data?.data || response.data?.data || response.data;
        allNatureCredits.value = Array.isArray(resData) ? resData : (Array.isArray(resData?.data) ? resData.data : []);
      } catch (err) {
        console.error('Erreur lors du chargement des natures de crédit:', err);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await ApiService.get('users?limit=-1');
        allUsers.value = response.data?.data?.users || response.data?.users || response.data?.data || [];
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
      }
    };

    const resetForm = () => {
      form.libelle = '';
      form.code = '';
      form.description = '';
      form.isActive = true;
      form.natureCreditIds = [];
      form.userIds = [];
      currentId.value = null;
      isEditing.value = false;
    };

    const getModal = (): Modal | null => {
      if (modalInstance) return modalInstance;
      if (groupModalRef.value) {
        modalInstance = new Modal(groupModalRef.value);
        return modalInstance;
      }
      return null;
    };

    const openAddModal = () => {
      resetForm();
      const modal = getModal();
      if (modal) {
        modal.show();
      }
    };

    const openEditModal = (group: any) => {
      isEditing.value = true;
      currentId.value = group.id;
      form.libelle = group.libelle || '';
      form.code = group.code || '';
      form.description = group.description || '';
      form.isActive = group.isActive !== false;
      form.natureCreditIds = group.natureCredits ? group.natureCredits.map((n: any) => n.id) : [];
      form.userIds = group.users ? group.users.map((u: any) => u.id) : [];

      const modal = getModal();
      if (modal) {
        modal.show();
      }
    };

    const saveGroup = async () => {
      if (!form.libelle.trim()) return;
      isSaving.value = true;

      try {
        const payload = {
          libelle: form.libelle,
          code: form.code,
          description: form.description,
          isActive: form.isActive,
          natureCreditIds: form.natureCreditIds,
          userIds: form.userIds
        };

        if (isEditing.value && currentId.value) {
          await ApiService.put(`groups/${currentId.value}`, payload);
        } else {
          await ApiService.post('groups', payload);
        }

        if (modalInstance) {
          modalInstance.hide();
        }

        fetchGroups();

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: isEditing.value ? 'Groupe mis à jour' : 'Groupe créé avec succès',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err: any) {
        console.error('Erreur lors de la sauvegarde du groupe:', err);
        Swal.fire('Erreur', err.response?.data?.message || 'Erreur lors de la sauvegarde', 'error');
      } finally {
        isSaving.value = false;
      }
    };

    const deleteGroup = async (group: any) => {
      const result = await Swal.fire({
        title: 'Supprimer ce groupe ?',
        text: `Le groupe "${group.libelle}" sera retiré.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler'
      });

      if (result.isConfirmed) {
        try {
          await ApiService.delete(`groups/${group.id}`);
          fetchGroups();
          Swal.fire('Supprimé !', 'Le groupe a été supprimé.', 'success');
        } catch (err: any) {
          Swal.fire('Erreur', err.response?.data?.message || 'Impossible de supprimer le groupe.', 'error');
        }
      }
    };

    onMounted(() => {
      fetchGroups();
      fetchNatureCredits();
      fetchUsers();
    });

    const userSearchTerm = ref('');

    const filteredUsersList = computed(() => {
      if (!userSearchTerm.value.trim()) return allUsers.value;
      const term = userSearchTerm.value.toLowerCase().trim();
      return allUsers.value.filter((u: any) => {
        const full = `${u.firstname || ''} ${u.lastname || ''} ${u.email || ''} ${u.role?.libelle || ''}`.toLowerCase();
        return full.includes(term);
      });
    });

    const selectAllFilteredUsers = () => {
      const filteredIds = filteredUsersList.value.map((u: any) => u.id);
      const newSet = new Set([...form.userIds, ...filteredIds]);
      form.userIds = Array.from(newSet);
    };

    return {
      groups,
      allNatureCredits,
      allUsers,
      loading,
      isSaving,
      searchTerm,
      filteredGroups,
      isEditing,
      form,
      groupModalRef,
      userSearchTerm,
      filteredUsersList,
      selectAllFilteredUsers,
      openAddModal,
      openEditModal,
      saveGroup,
      deleteGroup
    };
  }
});
</script>

<style scoped>
.icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}
.avatar-circle {
  width: 38px;
  height: 38px;
  background-color: #33b04a;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
