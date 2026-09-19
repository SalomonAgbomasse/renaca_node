<template>
  <div>
    <!-- En-tête de page -->
    <div class="card mb-25 border-0 rounded-0 bg-white letter-spacing">
      <div class="card-head box-shadow bg-white d-lg-flex align-items-center justify-content-between p-15 p-sm-20 p-md-25">
        <div class="d-sm-flex align-items-center">
          <h4 class="fw-bold text-dark mb-0">
            <i class="flaticon-shield me-2 text-primary"></i>
            Sécurité du compte
          </h4>
        </div>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-0">
            <li class="breadcrumb-item">
              <router-link to="/dashboard" class="text-decoration-none">Tableau de bord</router-link>
            </li>
            <li class="breadcrumb-item active" aria-current="page">Sécurité</li>
          </ol>
        </nav>
      </div>
    </div>

    <div class="row">
      <!-- Configuration 2FA -->
      <div class="col-lg-8">
        <TwoFactorSetup />
      </div>
      
      <!-- Informations de sécurité -->
      <div class="col-lg-4">
        <!-- Statut de sécurité -->
        <div class="card mb-4">
          <div class="card-header" style="background-color: #f8f9fa; border-bottom: 1px solid #dee2e6;">
            <h6 class="card-title mb-0">
              <i class="flaticon-info me-2 text-info"></i>
              Statut de sécurité
            </h6>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <span class="text-muted">Authentification 2FA</span>
              <span :class="twoFactorEnabled ? 'badge bg-success' : 'badge bg-warning text-dark'">
                {{ twoFactorEnabled ? 'Activée' : 'Désactivée' }}
              </span>
            </div>
            <div class="d-flex align-items-center justify-content-between mb-3">
              <span class="text-muted">Mot de passe fort</span>
              <span class="badge bg-success">Oui</span>
            </div>
            <div class="d-flex align-items-center justify-content-between">
              <span class="text-muted">Sessions actives</span>
              <span class="badge bg-info">{{ activeSessions }}</span>
            </div>
          </div>
        </div>

        <!-- Conseils de sécurité -->
        <div class="card mb-4">
          <div class="card-header" style="background-color: #f8f9fa; border-bottom: 1px solid #dee2e6;">
            <h6 class="card-title mb-0">
              <i class="flaticon-bulb me-2 text-warning"></i>
              Conseils de sécurité
            </h6>
          </div>
          <div class="card-body">
            <div class="security-tip mb-3">
              <div class="d-flex align-items-start">
                <i class="flaticon-check-circle text-success me-2 mt-1"></i>
                <small class="text-muted">
                  Utilisez un mot de passe unique et complexe
                </small>
              </div>
            </div>
            <div class="security-tip mb-3">
              <div class="d-flex align-items-start">
                <i class="flaticon-check-circle text-success me-2 mt-1"></i>
                <small class="text-muted">
                  Activez l'authentification à deux facteurs
                </small>
              </div>
            </div>
            <div class="security-tip mb-3">
              <div class="d-flex align-items-start">
                <i class="flaticon-check-circle text-success me-2 mt-1"></i>
                <small class="text-muted">
                  Surveillez vos sessions actives régulièrement
                </small>
              </div>
            </div>
            <div class="security-tip">
              <div class="d-flex align-items-start">
                <i class="flaticon-check-circle text-success me-2 mt-1"></i>
                <small class="text-muted">
                  Ne partagez jamais vos codes de récupération
                </small>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="card">
          <div class="card-header" style="background-color: #f8f9fa; border-bottom: 1px solid #dee2e6;">
            <h6 class="card-title mb-0">
              <i class="flaticon-settings me-2 text-secondary"></i>
              Actions rapides
            </h6>
          </div>
          <div class="card-body">
            <div class="d-grid gap-2">
              <button 
                class="btn btn-outline-primary btn-sm"
                @click="changePassword">
                <i class="flaticon-key me-2"></i>
                Changer le mot de passe
              </button>
              <button 
                class="btn btn-outline-info btn-sm"
                @click="viewSessions">
                <i class="flaticon-monitor me-2"></i>
                Voir les sessions actives
              </button>
              <button 
                class="btn btn-outline-warning btn-sm"
                @click="downloadSecurityReport">
                <i class="flaticon-download me-2"></i>
                Rapport de sécurité
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import TwoFactorSetup from '../../components/Authentication/TwoFactor/TwoFactorSetup.vue';
import ApiService from '../../services/ApiService';

export default defineComponent({
  name: "SecurityPage",
  components: {
    TwoFactorSetup,
  },
  setup() {
    const router = useRouter();
    
    // État
    const twoFactorEnabled = ref(false);
    const activeSessions = ref(1);

    // Charger les informations de sécurité
    const loadSecurityInfo = async () => {
      try {
        // Charger le statut 2FA
        const response = await ApiService.get('auth/2fa/status');
        if (response.data.code === 200) {
          twoFactorEnabled.value = response.data.data.enabled;
        }
        
        // Ici, vous pouvez ajouter d'autres appels API pour récupérer:
        // - Le nombre de sessions actives
        // - L'historique de sécurité
        // - etc.
        
      } catch (error) {
        console.error('Erreur lors du chargement des infos de sécurité:', error);
      }
    };

    // Changer le mot de passe
    const changePassword = async () => {
      const { value: formValues } = await Swal.fire({
        title: 'Changer le mot de passe',
        html: `
          <div class="text-start">
            <div class="mb-3">
              <label class="form-label">Mot de passe actuel</label>
              <input id="currentPassword" type="password" class="form-control" placeholder="Mot de passe actuel">
            </div>
            <div class="mb-3">
              <label class="form-label">Nouveau mot de passe</label>
              <input id="newPassword" type="password" class="form-control" placeholder="Nouveau mot de passe">
            </div>
            <div class="mb-3">
              <label class="form-label">Confirmer le nouveau mot de passe</label>
              <input id="confirmPassword" type="password" class="form-control" placeholder="Confirmer le mot de passe">
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Changer',
        cancelButtonText: 'Annuler',
        preConfirm: () => {
          const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement).value;
          const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
          const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;
          
          if (!currentPassword || !newPassword || !confirmPassword) {
            Swal.showValidationMessage('Tous les champs sont requis');
            return false;
          }
          
          if (newPassword !== confirmPassword) {
            Swal.showValidationMessage('Les mots de passe ne correspondent pas');
            return false;
          }
          
          if (newPassword.length < 8) {
            Swal.showValidationMessage('Le nouveau mot de passe doit contenir au moins 8 caractères');
            return false;
          }
          
          return { currentPassword, newPassword };
        }
      });

      if (formValues) {
        try {
          // Ici, vous feriez l'appel API pour changer le mot de passe
          // await ApiService.put('auth/change-password', formValues);
          
          Swal.fire({
            title: 'Mot de passe changé',
            text: 'Votre mot de passe a été changé avec succès.',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } catch (error: any) {
          Swal.fire({
            title: 'Erreur',
            text: error.response?.data?.message || 'Erreur lors du changement de mot de passe',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      }
    };

    // Voir les sessions actives
    const viewSessions = () => {
      // Rediriger vers une page de gestion des sessions ou afficher un modal
      Swal.fire({
        title: 'Sessions actives',
        html: `
          <div class="text-start">
            <div class="d-flex align-items-center justify-content-between p-3 border rounded mb-2">
              <div>
                <strong>Session actuelle</strong><br>
                <small class="text-muted">Chrome - Windows 10</small>
              </div>
              <span class="badge bg-success">Actuelle</span>
            </div>
          </div>
        `,
        confirmButtonText: 'Fermer'
      });
    };

    // Télécharger un rapport de sécurité
    const downloadSecurityReport = () => {
      const report = `
RAPPORT DE SÉCURITÉ - L'Africaine Vie SA
===============================
Date: ${new Date().toLocaleString()}

STATUT DE SÉCURITÉ:
- Authentification 2FA: ${twoFactorEnabled.value ? 'Activée' : 'Désactivée'}
- Sessions actives: ${activeSessions.value}
- Dernière connexion: ${new Date().toLocaleString()}

RECOMMANDATIONS:
${!twoFactorEnabled.value ? '- Activez l\'authentification à deux facteurs\n' : ''}
- Changez votre mot de passe régulièrement
- Surveillez vos sessions actives
- Ne partagez jamais vos informations de connexion

Ce rapport a été généré automatiquement.
      `.trim();

      const blob = new Blob([report], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lafricaine-vie-security-report-${Date.now()}.txt`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    };

    // Charger les infos au montage
    onMounted(() => {
      loadSecurityInfo();
    });

    return {
      // État
      twoFactorEnabled,
      activeSessions,
      
      // Méthodes
      changePassword,
      viewSessions,
      downloadSecurityReport,
    };
  },
});
</script>

<style scoped>
.security-tip {
  transition: all 0.2s ease;
}

.security-tip:hover {
  transform: translateX(5px);
}

/* Couleurs de l'entreprise */
.btn-outline-primary:hover {
  background-color: #33b04a;
  border-color: #33b04a;
}

.text-primary {
  color: #33b04a !important;
}

.card {
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style> 