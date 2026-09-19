<template>
  <div class="auth-form-wrapper">
    <div class="auth-card">
      <div class="auth-card-body">
        <div class="text-center mb-4">
          <div class="logo-container">
            <img src="../../../assets/images/logo-guda-dark.png" alt="logo-icon" class="logo-img"/>
          </div>
        </div>
        <h4 class="auth-title fw-bold mb-1 text-center">Réinitialiser le mot de passe</h4>
        <p class="auth-subtitle text-center mb-4">
          Entrez le code reçu et choisissez un nouveau mot de passe
        </p>
        <Form ref="resetForm" @submit="addReset" :validation-schema="resetSchema">
          <!-- Champ caché pour l'identifiant -->
          <Field name="identifier" type="hidden" :value="identifierFromUrl"/>
          
          <div class="form-group mb-4">
            <label class="form-label fw-semibold mb-2">Code de réinitialisation</label>
            <div class="d-flex gap-2">
              <Field name="code" type="text" 
                class="form-control form-control-modern text-center code-input"
                placeholder="000000"
                maxlength="6"
                pattern="[0-9]{6}"
                inputmode="numeric"
                oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6)"/>
              <button type="button" 
                class="btn-resend-code"
                :disabled="isResending"
                @click="resendResetCode">
                <span v-if="isResending" class="spinner-border spinner-border-sm" role="status"></span>
                <span v-else>{{ isResending ? 'Envoi...' : 'Renvoyer' }}</span>
              </button>
            </div>
            <ErrorMessage name="code" class="text-danger small mt-1"/>
          </div>
          
          <div class="form-group mb-4">
            <label class="form-label fw-semibold mb-2">Nouveau mot de passe</label>
            <Field name="password" type="password" 
              class="form-control form-control-modern"
              placeholder="Entrer le nouveau mot de passe"/>
            <ErrorMessage name="password" class="text-danger small mt-1"/>
          </div>
          
          <div class="form-group mb-4">
            <label class="form-label fw-semibold mb-2">Confirmer le mot de passe</label>
            <Field name="password_confirm" type="password" 
              class="form-control form-control-modern"
              placeholder="Confirmer le nouveau mot de passe"/>
            <ErrorMessage name="password_confirm" class="text-danger small mt-1"/>
          </div>

          <button
            class="btn-auth w-100 fw-semibold mb-4"
            type="submit"
            :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe' }}
          </button>
          
          <div class="text-center">
            <router-link to="/login" class="back-link text-decoration-none fw-medium">
              ← Revenir à la page de connexion
            </router-link>
          </div>
        </Form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as Yup from 'yup';
import { useAuthStore } from '../../../services/auth';
import Swal from 'sweetalert2';

export default defineComponent({
    name: "ResetPassword",
    components: { Form, Field, ErrorMessage },
  setup: () => {
    const isLoading = ref(false);
    const isResending = ref(false);
    
    const urlParams = new URLSearchParams(window.location.search);
    const identifierFromUrl = urlParams.get('identifier') || '';

    const resetSchema = Yup.object().shape({
      identifier: Yup.string()
        .required('L\'email ou le téléphone est obligatoire')
        .test('email-or-phone', 'Veuillez entrer un email valide ou un numéro de téléphone', function(value) {
          if (!value) return false;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const phoneRegex = /^[0-9]{8,}$/;
          return emailRegex.test(value) || phoneRegex.test(value);
        }),
      code: Yup.string()
        .required('Le code de réinitialisation est obligatoire')
        .matches(/^[0-9]{6}$/, 'Le code doit contenir exactement 6 chiffres'),
      password: Yup.string()
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
          'Doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial'
        ).required('Le mot de passe est obligatoire'),
      password_confirm: Yup.string()
        .required('La confirmation est obligatoire')
        .oneOf([Yup.ref('password')], 'Les mots de passe ne correspondent pas'),
    });

    const resetForm = ref(null);
    const authStore = useAuthStore();
    
    const resendResetCode = async () => {
      if (!identifierFromUrl) return;
      isResending.value = true;
      try {
        const isEmail = identifierFromUrl.includes('@');
        const requestData = isEmail 
          ? { email: identifierFromUrl }
          : { phone: identifierFromUrl };
        
        const result = await authStore.requestPasswordReset(requestData);
        
        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: 'Code renvoyé !',
            text: `Un nouveau code a été envoyé ${isEmail ? 'par email' : 'par SMS'}`,
            confirmButtonText: 'OK',
            confirmButtonColor: '#33b04a'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur !',
            text: result.message || 'Erreur lors du renvoi du code',
            confirmButtonText: 'Réessayer',
            confirmButtonColor: '#dc3545'
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur !',
          text: 'Erreur lors du renvoi du code. Veuillez réessayer.',
          confirmButtonText: 'Réessayer',
          confirmButtonColor: '#dc3545'
        });
      } finally {
        isResending.value = false;
      }
    };
    
    const addReset = async (values) => {
      try {
        isLoading.value = true;
        const isEmail = values.identifier.includes('@');
        const requestData = {
          code: values.code,
          newPassword: values.password,
          ...(isEmail ? { email: values.identifier } : { phone: values.identifier })
        };
        
        const result = await authStore.resetPasswordWithCode(requestData);
        
        if (result.success) {
          localStorage.setItem('migration_warning_dismissed', 'true');
          await Swal.fire({
            icon: 'success',
            title: 'Succès !',
            text: 'Votre mot de passe a été réinitialisé avec succès.',
            confirmButtonText: 'Se connecter',
            confirmButtonColor: '#33b04a'
          });
          window.location.href = '/login';
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur !',
            text: result.message || 'Erreur lors de la réinitialisation',
            confirmButtonText: 'Réessayer',
            confirmButtonColor: '#dc3545'
          });
        }
        
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur !',
          text: 'Erreur lors de la réinitialisation. Veuillez réessayer.',
          confirmButtonText: 'Réessayer',
          confirmButtonColor: '#dc3545'
        });
      } finally {
        isLoading.value = false;
      }
    };

    return { resetSchema, addReset, resendResetCode, resetForm, identifierFromUrl, isLoading, isResending };
  },
});
</script>

<style scoped>
.auth-form-wrapper {
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
}

.auth-card {
  background: rgba(255, 255, 255, 0.97);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 80, 40, 0.15);
  border: none;
  overflow: hidden;
  animation: slideInUp 0.4s ease-out;
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.auth-card-body { padding: 2.5rem 2.25rem; }

.logo-container { display: inline-block; margin-bottom: 0.5rem; }

.logo-img {
  height: 85px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.08));
}

.auth-title {
  color: #111827;
  font-size: 1.5rem;
}

.auth-subtitle {
  color: #6b7280;
  font-size: 0.88rem;
  line-height: 1.6;
}

.form-label {
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
}

.form-control-modern {
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.78rem 1rem;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: #fafafa;
}

.form-control-modern:focus {
  border-color: #33b04a;
  box-shadow: 0 0 0 3px rgba(51, 176, 74, 0.12);
  background: #fff;
  outline: none;
}

.code-input {
  letter-spacing: 0.4em;
  font-size: 1.2em;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.btn-resend-code {
  background: transparent;
  border: 1.5px solid #33b04a;
  color: #33b04a;
  border-radius: 10px;
  padding: 0 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  min-width: 90px;
}

.btn-resend-code:hover:not(:disabled) {
  background: #33b04a;
  color: white;
}

.btn-resend-code:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-auth {
  background: linear-gradient(135deg, #33b04a 0%, #2a9540 100%);
  border: none;
  border-radius: 10px;
  padding: 0.9rem 1.5rem;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-auth:hover:not(:disabled) {
  background: linear-gradient(135deg, #2a9540 0%, #1f7a33 100%);
  box-shadow: 0 6px 18px rgba(51, 176, 74, 0.35);
  transform: translateY(-1px);
}

.btn-auth:disabled { opacity: 0.65; cursor: not-allowed; }

.back-link {
  color: #6b7280;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.back-link:hover { color: #33b04a; }
</style>