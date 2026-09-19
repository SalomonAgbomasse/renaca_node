<template>
  <div>
    <div class="card mb-25 border-0 rounded-0 bg-white letter-spacing">
      <div class="card-head box-shadow bg-white d-flex align-items-center justify-content-between p-15 p-sm-20 p-md-25">
        <div class="d-flex align-items-center">
          <button
            class="default-btn position-relative transition border-0 fw-medium pt-11 pb-11 ps-15 pe-15 ps-md-25 pe-md-25 pt-md-12 pb-md-12 ps-md-30 pe-md-30 rounded-1 fs-14 fs-md-15 fs-lg-16 d-inline-block me-10 mb-0"
            style="background-color: #f1b434; color: #231f20; border-color: #f1b434;"
            @click="openAddModal">
            <i class="flaticon-plus position-relative ms-2 ms-md-5 fs-12"></i>
            <span class="d-none d-sm-inline">Ajouter un rôle</span>
            <span class="d-sm-none">Rôle</span>
          </button>
        </div>
        <div class="d-flex align-items-center">
          <form class="search-box position-relative me-15" @submit.prevent="fetchData">
            <input
              type="text"
              v-model="searchTerm"
              class="form-control shadow-none text-black rounded-0 border-0"
              placeholder="Rechercher un rôle..."
            />
            <button type="submit" class="bg-transparent text-primary transition p-0 border-0">
              <i class="flaticon-search-interface-symbol"></i>
            </button>
          </form>
        </div>
      </div>

      <!-- Indicateur de chargement -->
      <div v-if="loading" class="text-center p-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
      </div>

      <div v-else class="card-body p-15 p-sm-20 p-md-25">
        <div class="table-responsive">
          <table class="table text-nowrap align-middle mb-0">
            <thead>
              <tr>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">RÔLE</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">DESCRIPTION</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">PERMISSIONS</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3 text-end pe-0">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredRoles.length === 0">
                <td colspan="4" class="text-center text-muted py-4">
                  Aucun rôle trouvé
                </td>
              </tr>
              <tr v-for="role in filteredRoles" :key="role.id">
                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <div class="d-flex align-items-center">
                    <div class="me-3">
                      <div class="avatar-circle">
                        <span class="avatar-initials">{{ role.libelle.charAt(0) }}</span>
                      </div>
                    </div>
                    <div>
                      <strong class="text-dark">{{ role.libelle }}</strong>
                      <br>
                      <small class="text-muted">#{{ role.id }}</small>
                    </div>
                  </div>
                </td>
                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  {{ role.desc || 'Pas de description' }}
                </td>
                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <div class="d-flex flex-wrap gap-1">
                    <span v-for="perm in (role.permissions || []).slice(0, 3)" :key="perm.id" class="badge bg-light-primary text-primary fs-11">
                      {{ perm.name }}
                    </span>
                    <span v-if="role.permissions?.length > 3" class="badge bg-light-secondary text-secondary fs-11">
                      +{{ role.permissions.length - 3 }}
                    </span>
                  </div>
                </td>
                <td class="shadow-none lh-1 fw-medium text-body-tertiary text-end pe-0">
                  <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-outline-primary btn-sm" @click="openEditModal(role)" title="Modifier">
                      <i class="flaticon-pen"></i>
                    </button>
                    <button 
                      class="btn btn-outline-danger btn-sm" 
                      @click="deleteRole(role)"
                      :disabled="role.libelle === 'ADMIN' || role.libelle === 'SUPER ADMIN'"
                      title="Supprimer">
                      <i class="flaticon-delete"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal pour ajout/modification -->
    <div class="modal fade" id="roleModal" tabindex="-1" aria-hidden="true" ref="roleModalRef">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content overflow-hidden border-0 shadow-lg">
          <div class="modal-header">
            <h4 class="modal-title fw-bold d-flex align-items-center gap-2">
              <img src="@/assets/images/logo-guda-with.png" alt="L'Africaine Vie" class="modal-inline-logo" />
              <span>{{ isEditing ? 'Modifier le rôle' : 'Nouveau rôle' }}</span>
            </h4>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-25">
            <form @submit.prevent="saveRole">
              <div class="row">
                <div class="col-md-6 mb-4">
                  <label class="form-label fw-semibold">Libellé du rôle</label>
                  <input type="text" v-model="form.title" class="form-control" placeholder="ex: COMPTABLE" required />
                </div>
                <div class="col-md-6 mb-4">
                  <label class="form-label fw-semibold">Description</label>
                  <input type="text" v-model="form.desc" class="form-control" placeholder="Description courte..." required />
                </div>
              </div>

              <div class="permissions-section mt-4">
                <h6 class="fw-bold mb-3 border-bottom pb-2">Attribution des permissions</h6>
                <div v-for="(group, category) in groupedPermissions" :key="category" class="mb-4">
                  <div class="d-flex align-items-center mb-2">
                    <i class="flaticon-shield me-2 text-primary"></i>
                    <span class="fw-bold text-uppercase fs-12">{{ category }}</span>
                  </div>
                  <div class="row g-2">
                    <div v-for="perm in group" :key="perm" class="col-md-4">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" v-model="form.permissions" :value="perm" :id="perm" />
                        <label class="form-check-label fs-13" :for="perm">
                          {{ formatPermissionLabel(perm) }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="text-end mt-4">
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="isSaving" style="background-color: #f1b434; border-color: #f1b434;">
                  <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isEditing ? 'Mettre à jour' : 'Créer le rôle' }}
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
import { defineComponent, ref, onMounted, computed, reactive } from 'vue';
import ApiService from '@/services/ApiService';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

export default defineComponent({
  name: 'RoleManagement',
  setup() {
    const roles = ref<any[]>([]);
    const availablePermissions = ref<string[]>([]);
    const loading = ref(true);
    const isSaving = ref(false);
    const searchTerm = ref('');
    const isEditing = ref(false);
    const currentId = ref<number | null>(null);
    const roleModalRef = ref<HTMLElement | null>(null);
    let modalInstance: Modal | null = null;

    const form = reactive({
      title: '',
      desc: '',
      permissions: [] as string[]
    });

    const categories = {
      'Contrats': ['contract:read', 'contract:create', 'contract:update', 'contract:delete', 'contract:free-update'],
      'Utilisateurs': ['users:read', 'users:create', 'users:update', 'users:delete'],
      'Système': ['roles:read', 'roles:manage', 'agency:manage', 'customer:manage'],
      'Décisionnel / BI': ['bi:read']
    };

    const groupedPermissions = computed(() => {
      const groups: Record<string, string[]> = {
        'Contrats': [],
        'Utilisateurs': [],
        'Système': [],
        'Décisionnel / BI': [],
        'Autres': []
      };

      availablePermissions.value.forEach(p => {
        if (categories['Contrats'].includes(p)) groups['Contrats'].push(p);
        else if (categories['Utilisateurs'].includes(p)) groups['Utilisateurs'].push(p);
        else if (categories['Système'].includes(p)) groups['Système'].push(p);
        else if (categories['Décisionnel / BI'].includes(p)) groups['Décisionnel / BI'].push(p);
        else groups['Autres'].push(p);
      });

      return groups;
    });

    const fetchData = async () => {
      try {
        loading.value = true;
        const [rolesRes, permsRes] = await Promise.all([
          ApiService.get('/roles'),
          ApiService.get('/roles/permissions/available')
        ]);
        
        // Adaptation à la structure de réponse du projet (data.data)
        roles.value = rolesRes.data.data?.roles || rolesRes.data.roles || [];
        availablePermissions.value = permsRes.data.data?.permissions || permsRes.data.permissions || [];
        
      } catch (err) {
        console.error('Erreur fetchData:', err);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchData();
      if (roleModalRef.value) {
        modalInstance = new Modal(roleModalRef.value);
      }
    });

    const filteredRoles = computed(() => {
      if (!searchTerm.value) return roles.value;
      const s = searchTerm.value.toLowerCase();
      return roles.value.filter(r => 
        r.libelle.toLowerCase().includes(s) || 
        r.desc?.toLowerCase().includes(s)
      );
    });

    const openAddModal = () => {
      isEditing.value = false;
      currentId.value = null;
      form.title = '';
      form.desc = '';
      form.permissions = [];
      modalInstance?.show();
    };

    const openEditModal = (role: any) => {
      isEditing.value = true;
      currentId.value = role.id;
      form.title = role.libelle;
      form.desc = role.desc;
      form.permissions = role.permissions?.map((p: any) => p.name) || [];
      modalInstance?.show();
    };

    const saveRole = async () => {
      try {
        isSaving.value = true;
        const payload = {
          title: form.title,
          desc: form.desc,
          permissions: form.permissions
        };

        if (isEditing.value && currentId.value) {
          await ApiService.put(`/roles/${currentId.value}`, payload);
        } else {
          await ApiService.post('/roles', payload);
        }
        
        modalInstance?.hide();
        fetchData();
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: isEditing.value ? 'Rôle mis à jour' : 'Rôle créé',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err: any) {
        Swal.fire('Erreur', err.response?.data?.message || 'Une erreur est survenue', 'error');
      } finally {
        isSaving.value = false;
      }
    };

    const deleteRole = async (role: any) => {
      const result = await Swal.fire({
        title: 'Êtes-vous sûr?',
        text: `Le rôle "${role.libelle}" sera définitivement supprimé.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f1b434',
        cancelButtonColor: '#ff0000',
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler'
      });

      if (result.isConfirmed) {
        try {
          await ApiService.delete(`/roles/${role.id}`);
          fetchData();
          Swal.fire('Supprimé!', 'Le rôle a été retiré.', 'success');
        } catch (err: any) {
          Swal.fire('Erreur', err.response?.data?.message || 'Erreur lors de la suppression', 'error');
        }
      }
    };

    const formatPermissionLabel = (name: string) => {
      if (name === 'bi:read') return 'Accès au menu BI (Analyse & Pilotage)';
      return name.split(':').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    };

    return {
      roles,
      loading,
      isSaving,
      searchTerm,
      filteredRoles,
      availablePermissions,
      groupedPermissions,
      isEditing,
      form,
      roleModalRef,
      openAddModal,
      openEditModal,
      saveRole,
      deleteRole,
      formatPermissionLabel,
      fetchData
    };
  }
});
</script>

<style scoped>
.avatar-circle {
  width: 40px;
  height: 40px;
  background-color: #f1b434;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-initials {
  font-weight: bold;
  font-size: 18px;
}
.bg-light-primary {
  background-color: rgba(241, 180, 52, 0.1) !important;
}
.text-primary {
  color: #f1b434 !important;
}
.fs-11 { font-size: 0.68rem; }
.fs-12 { font-size: 0.75rem; }
.fs-13 { font-size: 0.81rem; }
.fs-18 { font-size: 1.125rem; }
.p-20 { padding: 20px; }
.p-25 { padding: 25px; }
</style>
