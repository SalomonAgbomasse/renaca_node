<template>
  <div>
    <!-- Breadcrumb -->
    <BreadCrumb PageTitle="Paramètres Système" />

    <!-- Section 1: Paramètres Généraux -->
    <div class="card border-0 rounded-0 bg-white mb-25 shadow-sm">
      <div class="card-body p-4">
        <!-- Alert Status -->
        <div v-if="alert.show" :class="['alert alert-dismissible fade show', alert.typeClass]" role="alert">
          <i :class="['ph-bold me-2', alert.iconClass]"></i>
          {{ alert.message }}
          <button type="button" class="btn-close shadow-none" @click="alert.show = false" aria-label="Close"></button>
        </div>

        <div class="d-flex align-items-center justify-content-between mb-25 border-bottom border-light-subtle pb-3">
          <div class="d-flex align-items-center gap-2">
            <div class="icon-box bg-success-subtle text-success p-2 rounded-2">
              <i class="ph-bold ph-gear-six fs-5"></i>
            </div>
            <h5 class="text-dark fw-semibold mb-0">Paramètres Généraux</h5>
          </div>
          <button 
            @click="saveSettings" 
            class="btn btn-success d-flex align-items-center gap-2 px-4"
            :disabled="saving"
          >
            <span v-if="saving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <i v-else class="ph-bold ph-floppy-disk"></i>
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>

        <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center py-4">
          <div class="spinner-border text-success mb-2" role="status"></div>
          <span class="text-muted">Chargement des paramètres...</span>
        </div>

        <div v-else class="settings-list">
          <!-- Welcome Email Item -->
          <div class="setting-item d-flex align-items-start justify-content-between py-3 border-bottom border-light-subtle">
            <div class="me-4">
              <h6 class="text-dark fw-semibold mb-1">Emails de bienvenue automatiques</h6>
              <p class="text-muted small mb-0">
                Envoyer automatiquement un email de bienvenue contenant le mot de passe généré et les instructions de connexion lors de la création d'un nouvel utilisateur.
              </p>
              <span class="badge bg-success-subtle text-success mt-2">
                Clé système : SEND_WELCOME_EMAIL
              </span>
            </div>
            <div class="form-check form-switch ps-0 mt-1">
              <input 
                class="form-check-input custom-switch" 
                type="checkbox" 
                role="switch" 
                id="sendWelcomeEmailSwitch"
                v-model="settings.sendWelcomeEmail"
              >
            </div>
          </div>

          <!-- SMS 2FA Setting -->
          <div class="setting-item d-flex align-items-start justify-content-between py-3">
            <div class="me-4">
              <h6 class="text-dark fw-semibold mb-1">Vérification de connexion par SMS (2FA)</h6>
              <p class="text-muted small mb-0">
                Activer l'envoi d'un code de vérification SMS pour la double authentification lors de la connexion.
              </p>
              <span class="badge bg-success-subtle text-success mt-2">
                Clé système : ENABLE_SMS_2FA
              </span>
            </div>
            <div class="form-check form-switch ps-0 mt-1">
              <input 
                class="form-check-input custom-switch" 
                type="checkbox" 
                role="switch" 
                id="smsTwoFactorSwitch"
                v-model="settings.enableSMS2FA"
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Le Souscripteur -->
    <div class="card border-0 rounded-0 bg-white mb-25 shadow-sm">
      <div class="card-header bg-white border-bottom p-4">
        <div class="d-flex align-items-center gap-2">
          <div class="icon-box bg-primary-subtle text-primary p-2 rounded-2">
            <i class="ph-bold ph-identification-card fs-5"></i>
          </div>
          <h5 class="text-dark fw-semibold mb-0">Le Souscripteur</h5>
        </div>
      </div>
      <div class="card-body p-4">
        <ListeSubscriber />
      </div>
    </div>

    <!-- Section 3: Rôles & Permissions -->
    <div class="card border-0 rounded-0 bg-white mb-25 shadow-sm">
      <div class="card-header bg-white border-bottom p-4">
        <div class="d-flex align-items-center gap-2">
          <div class="icon-box bg-warning-subtle text-warning p-2 rounded-2">
            <i class="ph-bold ph-shield-check fs-5"></i>
          </div>
          <h5 class="text-dark fw-semibold mb-0">Rôles & Habilitations</h5>
        </div>
      </div>
      <div class="card-body p-4">
        <RoleManagement />
      </div>
    </div>

    <!-- Section 4: Notifications -->
    <div class="card border-0 rounded-0 bg-white mb-25 shadow-sm">
      <div class="card-body p-4">
        <DailyReportNotification />
      </div>
    </div>

    <!-- Section 6: Liens de Parenté -->
    <div class="card border-0 rounded-0 bg-white mb-25 shadow-sm">
      <div class="card-body p-4">
        <LienParenteManagement />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import ApiService from '../../services/ApiService';
import BreadCrumb from '../../components/Common/BreadCrumb.vue';
import RoleManagement from '../../components/User/RoleManagement.vue';
import DailyReportNotification from '../../components/Notification/DailyReportNotification.vue';
import ListeSubscriber from '../../components/Subscriber/ListeSubscriber.vue';
import LienParenteManagement from '../../components/Admin/LienParenteManagement.vue';

export default defineComponent({
  name: 'ParametresSystemePage',
  components: {
    BreadCrumb,
    RoleManagement,
    DailyReportNotification,
    ListeSubscriber,
    LienParenteManagement
  },
  setup() {
    const loading = ref(true);
    const saving = ref(false);
    
    // Paramètres locaux
    const settings = ref({
      sendWelcomeEmail: true,
      enableSMS2FA: true
    });

    // Alertes
    const alert = ref({
      show: false,
      message: '',
      typeClass: 'alert-success',
      iconClass: 'ph-check-circle'
    });

    const triggerAlert = (message: string, type: 'success' | 'danger') => {
      alert.value = {
        show: true,
        message,
        typeClass: type === 'success' ? 'alert-success' : 'alert-danger',
        iconClass: type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'
      };
      
      // Auto-hide après 5 secondes si succès
      if (type === 'success') {
        setTimeout(() => {
          alert.value.show = false;
        }, 5000);
      }
    };

    // Charger les paramètres depuis le backend
    const loadSettings = async () => {
      loading.value = true;
      try {
        const response = await ApiService.get('system-settings');
        const list = response.data.data.settings || [];
        
        // Mapper les valeurs vers notre modèle réactif
        const emailSetting = list.find((s: any) => s.key === 'SEND_WELCOME_EMAIL');
        if (emailSetting) {
          settings.value.sendWelcomeEmail = emailSetting.value !== 'false';
        }

        const smsSetting = list.find((s: any) => s.key === 'ENABLE_SMS_2FA');
        if (smsSetting) {
          settings.value.enableSMS2FA = smsSetting.value !== 'false';
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement des paramètres:', error);
        triggerAlert('Impossible de charger les paramètres système.', 'danger');
      } finally {
        loading.value = false;
      }
    };

    // Sauvegarder les paramètres
    const saveSettings = async () => {
      saving.value = true;
      try {
        const payload = [
          {
            key: 'SEND_WELCOME_EMAIL',
            value: settings.value.sendWelcomeEmail ? 'true' : 'false'
          },
          {
            key: 'ENABLE_SMS_2FA',
            value: settings.value.enableSMS2FA ? 'true' : 'false'
          }
        ];

        await ApiService.put('system-settings', payload);
        triggerAlert('Les paramètres système ont été mis à jour avec succès.', 'success');
      } catch (error: any) {
        console.error('Erreur lors de la sauvegarde des paramètres:', error);
        triggerAlert('Une erreur est survenue lors de l\'enregistrement.', 'danger');
      } finally {
        saving.value = false;
      }
    };

    onMounted(() => {
      loadSettings();
    });

    return {
      loading,
      saving,
      settings,
      alert,
      saveSettings
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

.setting-item {
  transition: background-color 0.2s ease;
}

.setting-item:hover {
  background-color: rgba(0, 0, 0, 0.005);
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
