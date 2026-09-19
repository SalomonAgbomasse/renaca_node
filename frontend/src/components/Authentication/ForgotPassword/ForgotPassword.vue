<template>
  <div class="auth-form-wrapper">
    <div class="auth-card">
      <div class="auth-card-body">
        <div class="text-center mb-4">
          <div class="logo-container">
            <img src="../../../assets/images/logo-guda-dark.png" alt="logo-icon" class="logo-img"/>
          </div>
        </div>
        <h4 class="auth-title fw-bold mb-1 text-center">Mot de passe oublié ?</h4>
        <p class="auth-subtitle text-center mb-4">
          Entrez votre email ou téléphone et nous vous enverrons un code de réinitialisation
        </p>
        <Form ref="forgotPasswordForm" @submit="addForgotPassword" :validation-schema="forgotPasswordSchema">
          <div class="form-group mb-4">
            <label class="form-label fw-semibold mb-2">Email ou Téléphone</label>
            <Field name="identifier" type="text" 
              class="form-control form-control-modern" placeholder="Entrer votre email ou numéro de téléphone"/>
              <ErrorMessage name="identifier" class="text-danger small mt-1"/>
          </div>
          <button class="btn-auth w-100 fw-semibold mb-4" 
            type="submit"
            :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ isLoading ? 'Envoi en cours...' : 'Envoyer le code' }}
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
import { defineComponent, ref} from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as Yup from 'yup';
import { useAuthStore } from '../../../services/auth';
import Swal from 'sweetalert2';

export default defineComponent({
    name: "ForgotPassword",
    components: { Form, Field, ErrorMessage },
  setup: () => {
    const isLoading = ref(false);
    
    const forgotPasswordSchema = Yup.object().shape({
      identifier: Yup.string()
        .required('L\'email ou le téléphone est obligatoire')
        .test('email-or-phone', 'Veuillez entrer un email valide ou un numéro de téléphone', function(value) {
          if (!value) return false;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const phoneRegex = /^[0-9]{8,}$/;
          return emailRegex.test(value) || phoneRegex.test(value);
        }),
    });

    const forgotPassordForm = ref(null);

    const addForgotPassword = async (values) => {
      try {
        isLoading.value = true;
        const authStore = useAuthStore();
        const isEmail = values.identifier.includes('@');
        const requestData = isEmail 
          ? { email: values.identifier }
          : { phone: values.identifier };
        
        const result = await authStore.requestPasswordReset(requestData);
        
        const message = isEmail 
          ? `Un email avec le code de réinitialisation a été envoyé à ${values.identifier}`
          : `Un SMS avec le code de réinitialisation a été envoyé au ${values.identifier}`;
        
        await Swal.fire({
          icon: 'success',
          title: 'Code envoyé !',
          text: message,
          confirmButtonText: 'Continuer',
          confirmButtonColor: '#33b04a'
        });
        
        window.location.href = `/reset-password?identifier=${encodeURIComponent(values.identifier)}`;
        
      } catch (error) {
        console.error('Erreur lors de la demande de réinitialisation:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur !',
          text: 'Erreur lors de l\'envoi du code. Veuillez réessayer.',
          confirmButtonText: 'Réessayer',
          confirmButtonColor: '#dc3545'
        });
      } finally {
        isLoading.value = false;
      }
    };

    return { forgotPasswordSchema, addForgotPassword, forgotPassordForm, isLoading };
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

.auth-card-body {
  padding: 2.5rem 2.25rem;
}

.logo-container { display: inline-block; margin-bottom: 0.5rem; }

.logo-img {
  height: 85px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.08));
}

.auth-title {
  color: #111827;
  font-size: 1.55rem;
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