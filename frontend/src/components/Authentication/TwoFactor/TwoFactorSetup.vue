<template>
  <div class="card">
    <div class="card-header" style="background-color: #f8f9fa; border-bottom: 1px solid #dee2e6;">
      <h5 class="card-title mb-0 text-dark">
        <i class="flaticon-shield me-2 text-primary"></i>
        Authentification à double facteur (2FA)
      </h5>
    </div>
    
    <div class="card-body">
      <!-- État: 2FA non configurée -->
      <div v-if="!isEnabled && !showSetup" class="text-center py-4">
        <i class="flaticon-shield fs-1 text-muted opacity-50 mb-3"></i>
        <h5 class="text-dark mb-3">Sécurisez votre compte</h5>
        <p class="text-muted mb-4">
          L'authentification à double facteur ajoute une couche de sécurité supplémentaire à votre compte.
        </p>
        <button 
          class="btn btn-primary"
          @click="startSetup"
          :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
          <i class="flaticon-plus me-2"></i>
          Activer la 2FA
        </button>
      </div>

      <!-- Configuration de la 2FA -->
      <div v-else-if="showSetup" class="setup-container">
        <div class="row">
          <!-- Étape 1: Instructions -->
          <div class="col-md-6">
            <h6 class="text-dark mb-3">
              <span class="badge bg-primary me-2">1</span>
              Installez une application d'authentification
            </h6>
            <p class="text-muted mb-3">
              Installez une application comme Google Authenticator ou Authy sur votre téléphone.
            </p>
            
            <h6 class="text-dark mb-3">
              <span class="badge bg-primary me-2">2</span>
              Scannez le code QR
            </h6>
            <p class="text-muted mb-4">
              Utilisez votre application pour scanner le code QR ci-contre ou entrez manuellement la clé secrète.
            </p>
          </div>
          
          <!-- Étape 2: QR Code -->
          <div class="col-md-6 text-center">
            <div v-if="qrCode" class="qr-container mb-3">
              <img :src="qrCode" alt="QR Code 2FA" class="img-fluid border rounded" style="max-width: 200px;">
            </div>
            <div v-else class="qr-placeholder mb-3">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Génération du QR code...</span>
              </div>
            </div>
            
            <!-- Clé secrète (en cas de problème avec le QR) -->
            <div v-if="secret" class="mt-3">
              <small class="text-muted d-block mb-2">
                Ou entrez cette clé manuellement :
              </small>
              <div class="input-group input-group-sm">
                <input 
                  type="text" 
                  class="form-control text-center font-monospace" 
                  :value="secret" 
                  readonly>
                <button 
                  class="btn btn-outline-secondary" 
                  type="button"
                  @click="copySecret"
                  title="Copier la clé">
                  <i class="flaticon-copy"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <hr class="my-4">
        
        <!-- Étape 3: Vérification -->
        <div class="row">
          <div class="col-md-8 mx-auto">
            <h6 class="text-dark mb-3">
              <span class="badge bg-primary me-2">3</span>
              Vérifiez votre configuration
            </h6>
            <p class="text-muted mb-3">
              Entrez le code à 6 chiffres généré par votre application pour vérifier la configuration.
            </p>
            
            <Form @submit="verifyAndEnable" :validation-schema="verificationSchema">
              <div class="form-group mb-3">
                <label class="form-label">Code de vérification</label>
                <Field 
                  name="verificationCode" 
                  type="text" 
                  class="form-control text-center"
                  placeholder="000000"
                  maxlength="6"
                  style="letter-spacing: 0.5em; font-size: 1.2em;"
                  ref="verificationInput" />
                <ErrorMessage name="verificationCode" class="text-danger"/>
              </div>
              
              <div class="d-flex gap-2">
                <button 
                  type="submit" 
                  class="btn btn-success flex-fill"
                  :disabled="isVerifying">
                  <span v-if="isVerifying" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  <i class="flaticon-check me-2"></i>
                  {{ isVerifying ? 'Vérification...' : 'Activer la 2FA' }}
                </button>
                <button 
                  type="button" 
                  class="btn btn-outline-secondary"
                  @click="cancelSetup">
                  Annuler
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>

      <!-- État: 2FA activée -->
      <div v-else-if="isEnabled" class="enabled-container">
        <div class="row align-items-center">
          <div class="col-md-8">
            <div class="d-flex align-items-center mb-3">
              <i class="flaticon-check-circle fs-2 text-success me-3"></i>
              <div>
                <h6 class="text-dark mb-1">Authentification à double facteur activée</h6>
                <small class="text-muted">
                  Activée le {{ formatDate(enabledAt) }}
                </small>
              </div>
            </div>
            <p class="text-muted mb-0">
              Votre compte est protégé par l'authentification à double facteur. 
              Il vous reste {{ backupCodesCount }} code(s) de récupération.
            </p>
          </div>
          <div class="col-md-4 text-end">
            <div class="btn-group-vertical w-100">
              <button 
                class="btn btn-outline-warning btn-sm mb-2"
                @click="regenerateBackupCodes"
                :disabled="isLoading">
                <i class="flaticon-refresh me-2"></i>
                Nouveaux codes de récupération
              </button>
              <button 
                class="btn btn-outline-danger btn-sm"
                @click="confirmDisable2FA"
                :disabled="isLoading">
                <i class="flaticon-delete me-2"></i>
                Désactiver la 2FA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal des codes de récupération -->
    <div class="modal fade" id="backupCodesModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="flaticon-shield me-2 text-warning"></i>
              Codes de récupération 2FA
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <h6 class="alert-heading">
                <i class="flaticon-warning me-2"></i>
                Important !
              </h6>
              <p class="mb-0">
                Sauvegardez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une seule fois 
                pour vous connecter si vous perdez l'accès à votre application d'authentification.
              </p>
            </div>
            
            <div v-if="newBackupCodes.length > 0" class="backup-codes">
              <div class="row">
                <div class="col-6" v-for="(code, index) in newBackupCodes" :key="index">
                  <div class="card mb-2">
                    <div class="card-body p-2 text-center">
                      <code class="fs-5">{{ code }}</code>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mt-3 text-center">
                <button 
                  class="btn btn-outline-secondary"
                  @click="downloadBackupCodes">
                  <i class="flaticon-download me-2"></i>
                  Télécharger les codes
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
              J'ai sauvegardé mes codes
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, nextTick } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';
import ApiService from '../../../services/ApiService';

export default defineComponent({
  name: "TwoFactorSetup",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  setup() {
    // État
    const isEnabled = ref(false);
    const enabledAt = ref<Date | null>(null);
    const backupCodesCount = ref(0);
    const showSetup = ref(false);
    const isLoading = ref(false);
    const isVerifying = ref(false);
    
    // Configuration
    const qrCode = ref<string>('');
    const secret = ref<string>('');
    const newBackupCodes = ref<string[]>([]);
    
    // Refs
    const verificationInput = ref<HTMLInputElement | null>(null);
    
    // Schema de validation
    const verificationSchema = Yup.object().shape({
      verificationCode: Yup.string()
        .required('Code de vérification requis')
        .matches(/^\d{6}$/, 'Le code doit contenir exactement 6 chiffres'),
    });

    // Charger le statut 2FA
    const load2FAStatus = async () => {
      try {
        const response = await ApiService.get('auth/2fa/status');
        const result = response.data;
        
        if (result.code === 200) {
          isEnabled.value = result.data.enabled;
          enabledAt.value = result.data.enabledAt ? new Date(result.data.enabledAt) : null;
          backupCodesCount.value = result.data.backupCodesCount;
        }
      } catch (error) {
        console.error('Erreur lors du chargement du statut 2FA:', error);
      }
    };

    // Démarrer la configuration
    const startSetup = async () => {
      isLoading.value = true;
      
      try {
        const response = await ApiService.get('auth/2fa/setup');
        const result = response.data;
        
        if (result.code === 200) {
          qrCode.value = result.data.qrCode;
          secret.value = result.data.secret;
          showSetup.value = true;
          
          // Focus sur le champ de vérification après la transition
          await nextTick();
          setTimeout(() => {
            if (verificationInput.value) {
              verificationInput.value.focus();
            }
          }, 500);
        } else {
          throw new Error(result.message);
        }
      } catch (error: any) {
        console.error('Erreur lors de la configuration 2FA:', error);
        Swal.fire({
          title: 'Erreur',
          text: error.response?.data?.message || 'Erreur lors de la génération du QR code',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        isLoading.value = false;
      }
    };

    // Vérifier et activer la 2FA
    const verifyAndEnable = async (values: any) => {
      isVerifying.value = true;
      
      try {
        const response = await ApiService.post('auth/2fa/enable', {
          secret: secret.value,
          code: values.verificationCode
        });
        
        const result = response.data;
        
        if (result.code === 200) {
          newBackupCodes.value = result.data.backupCodes;
          
          // Afficher les codes de récupération
          const modal = new Modal(document.getElementById('backupCodesModal')!);
          modal.show();
          
          // Mettre à jour l'état
          await load2FAStatus();
          showSetup.value = false;
          
          Swal.fire({
            title: '2FA activée !',
            text: 'L\'authentification à double facteur a été activée avec succès.',
            icon: 'success',
            confirmButtonText: 'Parfait'
          });
          
        } else {
          throw new Error(result.message);
        }
      } catch (error: any) {
        console.error('Erreur lors de l\'activation 2FA:', error);
        Swal.fire({
          title: 'Erreur',
          text: error.response?.data?.message || 'Code de vérification incorrect',
          icon: 'error',
          confirmButtonText: 'Réessayer'
        });
      } finally {
        isVerifying.value = false;
      }
    };

    // Annuler la configuration
    const cancelSetup = () => {
      showSetup.value = false;
      qrCode.value = '';
      secret.value = '';
    };

    // Confirmer la désactivation
    const confirmDisable2FA = async () => {
      const { value: password } = await Swal.fire({
        title: 'Désactiver la 2FA',
        text: 'Entrez votre mot de passe pour confirmer la désactivation de la 2FA',
        input: 'password',
        inputPlaceholder: 'Votre mot de passe',
        showCancelButton: true,
        confirmButtonText: 'Désactiver',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#dc3545',
        inputValidator: (value) => {
          if (!value) {
            return 'Le mot de passe est requis';
          }
        }
      });

      if (password) {
        await disable2FA(password);
      }
    };

    // Désactiver la 2FA
    const disable2FA = async (password: string) => {
      isLoading.value = true;
      
      try {
        const response = await ApiService.post('auth/2fa/disable', { password });
        const result = response.data;
        
        if (result.code === 200) {
          await load2FAStatus();
          
          Swal.fire({
            title: '2FA désactivée',
            text: 'L\'authentification à double facteur a été désactivée.',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } else {
          throw new Error(result.message);
        }
      } catch (error: any) {
        console.error('Erreur lors de la désactivation 2FA:', error);
        Swal.fire({
          title: 'Erreur',
          text: error.response?.data?.message || 'Erreur lors de la désactivation',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        isLoading.value = false;
      }
    };

    // Régénérer les codes de récupération
    const regenerateBackupCodes = async () => {
      const result = await Swal.fire({
        title: 'Régénérer les codes de récupération ?',
        text: 'Cela invalidera tous vos codes de récupération actuels.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Régénérer',
        cancelButtonText: 'Annuler'
      });

      if (result.isConfirmed) {
        isLoading.value = true;
        
        try {
          const response = await ApiService.post('auth/2fa/regenerate-backup-codes', {});
          const apiResult = response.data;
          
          if (apiResult.code === 200) {
            newBackupCodes.value = apiResult.data.backupCodes;
            
            // Afficher les nouveaux codes
            const modal = new Modal(document.getElementById('backupCodesModal')!);
            modal.show();
            
            await load2FAStatus();
          } else {
            throw new Error(apiResult.message);
          }
        } catch (error: any) {
          console.error('Erreur lors de la régénération:', error);
          Swal.fire({
            title: 'Erreur',
            text: error.response?.data?.message || 'Erreur lors de la régénération des codes',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        } finally {
          isLoading.value = false;
        }
      }
    };

    // Copier la clé secrète
    const copySecret = async () => {
      try {
        await navigator.clipboard.writeText(secret.value);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Clé copiée !',
          showConfirmButton: false,
          timer: 2000
        });
      } catch (error) {
        console.error('Erreur lors de la copie:', error);
      }
    };

    // Télécharger les codes de récupération
    const downloadBackupCodes = () => {
      const content = newBackupCodes.value.map((code, index) => 
        `${index + 1}. ${code}`
      ).join('\n');
      
      const blob = new Blob([
        `Codes de récupération 2FA - L'Africaine Vie SA\n`,
        `Générés le: ${new Date().toLocaleString()}\n\n`,
        `IMPORTANT: Gardez ces codes en sécurité !\n`,
        `Chaque code ne peut être utilisé qu'une seule fois.\n\n`,
        content
      ], { type: 'text/plain' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lafricaine-vie-2fa-backup-codes-${Date.now()}.txt`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    };

    // Formater une date
    const formatDate = (date: Date | null): string => {
      if (!date) return '';
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Charger le statut au montage
    onMounted(() => {
      load2FAStatus();
    });

    return {
      // État
      isEnabled,
      enabledAt,
      backupCodesCount,
      showSetup,
      isLoading,
      isVerifying,
      
      // Configuration
      qrCode,
      secret,
      newBackupCodes,
      
      // Refs
      verificationInput,
      
      // Schema
      verificationSchema,
      
      // Méthodes
      startSetup,
      verifyAndEnable,
      cancelSetup,
      confirmDisable2FA,
      regenerateBackupCodes,
      copySecret,
      downloadBackupCodes,
      formatDate,
    };
  },
});
</script>

<style scoped>
.setup-container {
  animation: fadeIn 0.3s ease-in-out;
}

.enabled-container {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.qr-container {
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
}

.qr-placeholder {
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 2rem;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.backup-codes .card {
  background: #f8f9fa;
  transition: all 0.2s ease;
}

.backup-codes .card:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.font-monospace {
  font-family: 'Courier New', monospace;
}

/* Style pour les boutons au survol avec les couleurs de l'entreprise */
.btn-primary {
  background-color: #33b04a;
  border-color: #33b04a;
}

.btn-primary:hover {
  background-color: #2a9540;
  border-color: #2a9540;
}

.btn-success {
  background-color: #33b04a;
  border-color: #33b04a;
}

.btn-success:hover {
  background-color: #2a9540;
  border-color: #2a9540;
}
</style> 