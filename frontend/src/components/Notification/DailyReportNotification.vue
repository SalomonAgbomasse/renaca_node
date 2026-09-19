<template>
  <div class="daily-report-notification-container">
    <!-- En-tête de section avec Titre à gauche et Bouton à droite -->
    <div class="d-flex align-items-center justify-content-between pb-3 mb-20 border-bottom border-light-subtle flex-wrap gap-3">
      <div class="d-flex align-items-center gap-2">
        <div class="icon-box bg-info-subtle text-info p-2 rounded-2">
          <i class="ph-bold ph-envelope fs-5"></i>
        </div>
        <h5 class="text-dark fw-semibold mb-0">Destinataires du Rapport Quotidien</h5>
      </div>
      <div>
        <button 
          class="btn btn-sm btn-success d-flex align-items-center gap-1 px-3 py-2 fw-medium"
          @click="showAddModal = true">
          <i class="ph-bold ph-plus"></i>
          <span>Ajouter un destinataire</span>
        </button>
      </div>
    </div>

      <!-- Indicateur de chargement -->
      <div v-if="loading" class="text-center p-4">
        <div class="spinner-border text-fnda" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
      </div>

      <div v-else>
        <div v-if="notifications.length === 0" class="text-center text-muted py-5">
          <i class="ph-bold ph-envelope-simple fs-1 mb-3 d-block"></i>
          <p>Aucun destinataire configuré pour le rapport quotidien.</p>
          <button class="btn btn-fnda btn-sm mt-2" @click="showAddModal = true">
            Ajouter le premier destinataire
          </button>
        </div>

        <div v-else class="table-responsive">
          <table class="table text-nowrap align-middle mb-0 table-striped">
            <thead>
              <tr>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">Destinataire</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">Email</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">Statut</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">Description</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="notification in notifications" :key="notification.id">
                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <div v-if="notification.user" class="d-flex align-items-center">
                    <div class="me-3">
                      <div class="avatar-circle" :style="{ background: getAvatarColor(notification.user.lastname + notification.user.firstname) }">
                        <span class="avatar-initials">{{ getInitials(notification.user) }}</span>
                      </div>
                    </div>
                    <div>
                      <strong class="text-dark">{{ notification.user.lastname }} {{ notification.user.firstname }}</strong>
                      <br>
                      <small class="text-muted">{{ notification.user.role?.libelle || '-' }}</small>
                    </div>
                  </div>
                  <span v-else class="text-muted">{{ notification.name || 'Email direct' }}</span>
                </td>
                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <span class="text-info">
                    <i class="ph-bold ph-envelope me-1"></i>
                    {{ notification.user?.email || notification.email }}
                  </span>
                </td>
                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <span :class="notification.isActive ? 'badge bg-success' : 'badge bg-secondary'">
                    <i :class="notification.isActive ? 'ph-bold ph-check' : 'ph-bold ph-x'" class="me-1"></i>
                    {{ notification.isActive ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <span class="text-muted">{{ notification.description || '-' }}</span>
                </td>
                <td class="shadow-none lh-1 fw-medium text-body-tertiary text-end">
                  <div class="action-buttons-group">
                    <button
                      class="btn btn-sm btn-outline-primary me-2"
                      @click="toggleNotification(notification.id)"
                      :title="notification.isActive ? 'Désactiver' : 'Activer'">
                      <i :class="notification.isActive ? 'ph-bold ph-pause' : 'ph-bold ph-play'"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      @click="deleteNotification(notification.id)"
                      title="Supprimer">
                      <i class="ph-bold ph-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    <!-- Modal pour ajouter une notification -->
    <div v-if="showAddModal" class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5); z-index: 10000;" @click.self="showAddModal = false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header">
            <h4 class="modal-title fw-bold d-flex align-items-center gap-2">
              <img src="@/assets/images/logo-guda-with.png" alt="L'Africaine Vie" class="modal-inline-logo" />
              <span>Ajouter un destinataire</span>
            </h4>
            <button type="button" class="btn-close btn-close-white" @click="showAddModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="addNotification">
              <!-- Choix du type de notification -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Type de destinataire <span class="text-danger">*</span></label>
                <div class="btn-group w-100" role="group">
                  <input 
                    type="radio" 
                    class="btn-check" 
                    id="type-user" 
                    value="user"
                    v-model="formData.notificationType"
                    @change="formData.idUser = null; formData.email = ''">
                  <label class="btn btn-outline-fnda w-50" for="type-user">
                    <i class="ph-bold ph-user me-2"></i>Utilisateur système
                  </label>
                  
                  <input 
                    type="radio" 
                    class="btn-check" 
                    id="type-email" 
                    value="email"
                    v-model="formData.notificationType"
                    @change="formData.idUser = null; formData.email = ''">
                  <label class="btn btn-outline-fnda w-50" for="type-email">
                    <i class="ph-bold ph-envelope me-2"></i>Email direct
                  </label>
                </div>
              </div>

              <!-- Champ utilisateur -->
              <div v-if="formData.notificationType === 'user'" class="mb-3">
                <label class="form-label fw-semibold text-dark">Sélectionner un utilisateur <span class="text-danger">*</span></label>
                <select 
                  v-model="formData.idUser" 
                  class="form-select shadow-none border-gray text-black"
                  :required="formData.notificationType === 'user'">
                  <option :value="null">Sélectionner un utilisateur</option>
                  <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                    {{ user.lastname }} {{ user.firstname }} ({{ user.email }})
                  </option>
                </select>
                <small class="text-muted">Seuls les utilisateurs avec une adresse email sont affichés.</small>
              </div>

              <!-- Champ email direct -->
              <div v-if="formData.notificationType === 'email'" class="mb-3">
                <label class="form-label fw-semibold text-dark">Adresse email <span class="text-danger">*</span></label>
                <input 
                  type="email" 
                  v-model="formData.email"
                  class="form-control shadow-none border-gray text-black"
                  placeholder="exemple@email.com"
                  :required="formData.notificationType === 'email'">
              </div>

              <div v-if="formData.notificationType === 'email'" class="mb-3">
                <label class="form-label fw-semibold text-dark">Nom du destinataire (optionnel)</label>
                <input 
                  type="text" 
                  v-model="formData.name"
                  class="form-control shadow-none border-gray text-black"
                  placeholder="Nom ou service destinataire">
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Description / Note (optionnel)</label>
                <textarea 
                  v-model="formData.description"
                  class="form-control shadow-none border-gray text-black"
                  rows="3"
                  placeholder="Note explicative..."></textarea>
              </div>

              <div class="d-flex justify-content-end gap-2 border-top pt-3 mt-3">
                <button type="button" class="btn btn-light" @click="showAddModal = false">
                  Annuler
                </button>
                <button type="submit" class="btn btn-fnda px-4" :disabled="saving">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                  Ajouter
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
import { defineComponent, ref, onMounted } from 'vue';
import ApiService from '../../services/ApiService';
import Swal from 'sweetalert2';

export default defineComponent({
  name: 'DailyReportNotification',
  setup() {
    const loading = ref(false);
    const saving = ref(false);
    const notifications = ref<any[]>([]);
    const availableUsers = ref<any[]>([]);
    const showAddModal = ref(false);
    const formData = ref({
      notificationType: 'user' as 'user' | 'email',
      idUser: null as number | null,
      email: '' as string,
      name: '' as string,
      description: '',
    });

    const loadNotifications = async () => {
      loading.value = true;
      try {
        const response = await ApiService.get('email-notifications/daily-report/list');
        if (response.data.code === 200) {
          notifications.value = response.data.data.notifications || [];
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les notifications',
        });
      } finally {
        loading.value = false;
      }
    };

    const loadAvailableUsers = async () => {
      try {
        const response = await ApiService.get('email-notifications/users/available');
        if (response.data.code === 200) {
          availableUsers.value = response.data.data.users || [];
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    };

    const addNotification = async () => {
      if (formData.value.notificationType === 'user' && !formData.value.idUser) {
        Swal.fire({
          icon: 'warning',
          title: 'Attention',
          text: 'Veuillez sélectionner un utilisateur',
        });
        return;
      }

      if (formData.value.notificationType === 'email' && !formData.value.email) {
        Swal.fire({
          icon: 'warning',
          title: 'Attention',
          text: 'Veuillez entrer une adresse email',
        });
        return;
      }

      if (formData.value.notificationType === 'email' && formData.value.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.value.email)) {
          Swal.fire({
            icon: 'warning',
            title: 'Attention',
            text: 'Veuillez entrer une adresse email valide',
          });
          return;
        }
      }

      saving.value = true;
      try {
        const payload: any = {
          notificationType: 'daily_report',
          description: formData.value.description || null,
          isActive: true,
        };

        if (formData.value.notificationType === 'user') {
          const selectedUser = availableUsers.value.find(u => u.id === formData.value.idUser);
          if (selectedUser) {
            payload.email = selectedUser.email;
            payload.name = `${selectedUser.lastname} ${selectedUser.firstname}`;
          }
        } else {
          payload.email = formData.value.email;
          payload.name = formData.value.name || null;
        }

        const response = await ApiService.post('email-notifications', payload);

        if (response.data.code === 200 || response.data.code === 201) {
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Destinataire ajouté avec succès',
            timer: 2000,
            showConfirmButton: false
          });
          showAddModal.value = false;
          formData.value = {
            notificationType: 'user',
            idUser: null,
            email: '',
            name: '',
            description: '',
          };
          await loadNotifications();
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.response?.data?.message || 'Impossible d\'ajouter la notification',
        });
      } finally {
        saving.value = false;
      }
    };

    const toggleNotification = async (id: number) => {
      try {
        const response = await ApiService.put(`email-notifications/${id}/toggle`);
        if (response.data.code === 200) {
          await loadNotifications();
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de changer le statut',
        });
      }
    };

    const deleteNotification = async (id: number) => {
      const result = await Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: 'Ce destinataire sera supprimé définitivement de la liste.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#dc3545',
      });

      if (result.isConfirmed) {
        try {
          const response = await ApiService.delete(`email-notifications/${id}`);
          if (response.data.code === 200) {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé',
              text: 'Destinataire supprimé avec succès',
              timer: 1500,
              showConfirmButton: false
            });
            await loadNotifications();
          }
        } catch (error: any) {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Impossible de supprimer la notification',
          });
        }
      }
    };

    const getInitials = (user: any) => {
      if (!user) return '?';
      const first = user.firstname?.charAt(0)?.toUpperCase() || '';
      const last = user.lastname?.charAt(0)?.toUpperCase() || '';
      return (first + last) || '?';
    };

    function getAvatarColor(name: string): string {
      const colors = ['#33b04a','#17a2b8','#6f42c1','#fd7e14','#dc3545','#007bff','#20c997','#e83e8c'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
    }

    onMounted(async () => {
      await Promise.all([loadNotifications(), loadAvailableUsers()]);
    });

    return {
      loading,
      saving,
      notifications,
      availableUsers,
      showAddModal,
      formData,
      addNotification,
      toggleNotification,
      deleteNotification,
      getInitials,
      getAvatarColor,
    };
  },
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
}

.avatar-initials {
  font-size: 14px;
}

.action-buttons-group {
  display: flex;
  gap: 5px;
  justify-content: flex-end;
}
</style>
