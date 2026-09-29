<template>
  <div class="login-form-wrapper">
    <div class="login-card">
        <div class="login-card-body">
          <div class="text-center mb-4">
            <div class="logo-container">
              <img src="../../../assets/images/logo-guda-dark.png" alt="logo-icon" class="logo-img"/>
            </div>
          </div>
          
          <!-- Étape 1: Connexion normale -->
          <div v-if="!showTwoFactorStep">
            <h4 class="login-title fw-bold mb-1 text-center">Connexion</h4>
            <p class="text-center login-subtitle mb-4">Connectez-vous à votre compte !</p>

            <Form ref="loginForm" @submit="onSubmitLogin" :validation-schema="loginSchema">
              <div class="form-group mb-4">
                <label class="form-label fw-semibold mb-2">Email ou Téléphone</label>
                <Field name="identifier" type="text" 
                  class="form-control form-control-modern" placeholder="Entrer votre email ou téléphone"/>
                  <ErrorMessage name="identifier" class="text-danger small mt-1"/>
              </div>
              <div class="form-group mb-4">
                <label class="form-label fw-semibold mb-2">Mot de passe</label>
                <Field name="password" type="password" class="form-control form-control-modern" placeholder="Entrer votre mot de passe"/>
                <div class="text-end mt-2">
                  <router-link to="/forgot-password" class="forgot-password-link text-decoration-none fw-medium fs-13">
                    Mot de passe oublié ?
                  </router-link>
                </div>
                <ErrorMessage name="password" class="text-danger small mt-1"/>
              </div>
              <button ref="submitButton"
                class="btn-login w-100 fw-semibold"
                type="submit"
                :disabled="isLoading">
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                {{ isLoading ? 'Connexion...' : 'Se connecter' }}
              </button>
            </Form>
          </div>

          <!-- Étape 2: Vérification OTP -->
          <div v-else>
            <h4 class="login-title fw-bold mb-2 text-center">Vérification de sécurité</h4>
            <p class="text-center login-subtitle mb-4">
              Un code de vérification a été envoyé {{ userEmail ? 'à votre adresse email' : 'par SMS' }}
            </p>
            
            <div class="otp-info-box mb-4">
              <i :class="userEmail ? 'ph-bold ph-envelope me-2' : 'ph-bold ph-phone me-2'"></i>
              <strong>{{ userEmail || 'SMS' }}</strong>
            </div>
            
            <Form ref="otpForm" @submit="onSubmitOTP" :validation-schema="otpSchema">
              <div class="form-group mb-4">
                <label class="form-label fw-semibold mb-2">Code de vérification</label>
                <Field name="otpCode" type="text" 
                  class="form-control form-control-modern text-center otp-input"
                  placeholder="000000"
                  maxlength="6"
                  ref="otpInput"/>
                <ErrorMessage name="otpCode" class="text-danger small mt-1"/>
                <small class="text-muted d-block mt-2 text-center">
                  Entrez le code à 6 chiffres reçu
                </small>
              </div>
              
              <button 
                class="btn-login w-100 fw-semibold mb-3"
                type="submit"
                :disabled="isVerifying">
                <span v-if="isVerifying" class="spinner-border spinner-border-sm me-2" role="status"></span>
                {{ isVerifying ? 'Vérification...' : 'Vérifier le code' }}
              </button>
              
              <button 
                type="button"
                @click="resendOTP"
                :disabled="isResending"
                class="btn-resend w-100 mb-3">
                <span v-if="isResending" class="spinner-border spinner-border-sm me-2" role="status"></span>
                {{ isResending ? 'Envoi...' : 'Renvoyer le code' }}
              </button>
              
              <button 
                type="button"
                @click="goBackToLogin"
                class="btn-back w-100">
                ← Retour à la connexion
              </button>
            </Form>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, nextTick, onMounted } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as Yup from 'yup';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../../services/auth';
import Swal from 'sweetalert2';

export default defineComponent({
    name: "LoginForm",
    components: { Form, Field, ErrorMessage },
  setup: () => {
    const loginSchema = Yup.object().shape({
      identifier: Yup.string().required('L\'email ou téléphone est obligatoire'),
      password: Yup.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').required('Le mot de passe est obligatoire'),
    });

    const otpSchema = Yup.object().shape({
      otpCode: Yup.string()
        .required('Code de vérification requis')
        .matches(/^\d{6}$/, 'Le code doit contenir exactement 6 chiffres'),
    });

    const router = useRouter();
    const route = useRoute();
    const store = useAuthStore();
    const submitButton = ref<HTMLButtonElement | null>(null);
    const otpInput = ref<HTMLInputElement | null>(null);
    const loginForm = ref(null);
    const otpForm = ref(null);
    
    const showTwoFactorStep = ref(false);
    const tempUserId = ref<number | null>(null);
    const userEmail = ref<string>('');
    const userIdentifier = ref<string>('');
    const isLoading = ref(false);
    const isVerifying = ref(false);
    const isResending = ref(false);

    onMounted(() => {
      if (store.isAuthenticated) {
        router.push({ name: "tableauBordPage" });
      } else if (route.query.sessionExpired === '1') {
        Swal.fire({
          text: "Votre session a expiré ou est invalide. Veuillez vous reconnecter.",
          icon: "warning",
          buttonsStyling: false,
          confirmButtonText: "OK",
          heightAuto: false,
          customClass: { confirmButton: "btn fw-semibold btn-light-warning" },
        });
        
        // Nettoyer la requête d'URL après affichage de l'alerte
        router.replace({ query: {} });
      }
    });

    const onSubmitLogin = async (values: any) => {
      isLoading.value = true;
      try {
        const result = await store.login(values);
        
        if (result && result.requiresTwoFactor) {
          tempUserId.value = result.userId;
          userIdentifier.value = values.identifier;
          const isEmail = values.identifier.includes('@');
          userEmail.value = isEmail ? values.identifier : '';
          showTwoFactorStep.value = true;
          Swal.fire({
            text: `Code de vérification envoyé ${isEmail ? 'à votre email' : 'par SMS'}`,
            icon: "success",
            buttonsStyling: false,
            confirmButtonText: "OK",
            heightAuto: false,
            customClass: { confirmButton: "btn fw-semibold btn-light-success" },
          });
          return;
        }
        
        if (store.isAuthenticated) {
          setTimeout(() => { router.push({ name: "tableauBordPage" }); }, 100);
          return;
        }
      } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Erreur de connexion au serveur';
        Swal.fire({
          text: message,
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "OK",
          heightAuto: false,
          customClass: { confirmButton: "btn fw-semibold btn-light-danger" },
        });
      } finally {
        isLoading.value = false;
      }
    };

    const onSubmitOTP = async (values: any) => {
      if (!tempUserId.value || !userIdentifier.value) return;
      isVerifying.value = true;
      try {
        const result = await store.verifyOTP(userIdentifier.value, values.otpCode);
        if (result.success) {
          Swal.fire({
            text: 'Connexion réussie !',
            icon: "success",
            buttonsStyling: false,
            confirmButtonText: "OK",
            heightAuto: false,
            customClass: { confirmButton: "btn fw-semibold btn-light-success" },
          });
          setTimeout(() => { router.push({ name: "tableauBordPage" }); }, 100);
        } else {
          throw new Error(result.message);
        }
      } catch (error: any) {
        const message = error?.message || 'Code de vérification invalide';
        Swal.fire({
          text: message,
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "OK",
          heightAuto: false,
          customClass: { confirmButton: "btn fw-semibold btn-light-danger" },
        });
      } finally {
        isVerifying.value = false;
      }
    };

    const goBackToLogin = () => {
      showTwoFactorStep.value = false;
      tempUserId.value = null;
      userEmail.value = '';
      userIdentifier.value = '';
      if (loginForm.value) (loginForm.value as any).resetForm();
      if (otpForm.value) (otpForm.value as any).resetForm();
    };

    const resendOTP = async () => {
      if (!tempUserId.value || !userIdentifier.value) return;
      isResending.value = true;
      try {
        const isEmail = userIdentifier.value.includes('@');
        let result;
        if (isEmail) {
          result = await store.sendOTPEmail(userIdentifier.value);
        } else {
          result = await store.sendOTPSMS(userIdentifier.value);
        }
        if (result.success) {
          Swal.fire({
            text: `Code de vérification renvoyé ${isEmail ? 'par email' : 'par SMS'}`,
            icon: "success",
            buttonsStyling: false,
            confirmButtonText: "OK",
            heightAuto: false,
            customClass: { confirmButton: "btn fw-semibold btn-light-success" },
          });
        } else {
          throw new Error(result.message);
        }
      } catch (error: any) {
        const message = error?.message || 'Erreur lors du renvoi du code';
        Swal.fire({
          text: message,
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "OK",
          heightAuto: false,
          customClass: { confirmButton: "btn fw-semibold btn-light-danger" },
        });
      } finally {
        isResending.value = false;
      }
    };

    return { 
      loginSchema, otpSchema, loginForm, otpForm, submitButton, otpInput,
      showTwoFactorStep, tempUserId, userEmail, isLoading, isVerifying, isResending,
      onSubmitLogin, onSubmitOTP, goBackToLogin, resendOTP
    };
  },
});
</script>

<style scoped>
.login-form-wrapper {
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
}

.login-card {
  background: rgba(255, 255, 255, 0.97);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 80, 40, 0.15);
  border: none;
  overflow: hidden;
  backdrop-filter: blur(10px);
  animation: slideInUp 0.4s ease-out;
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.login-card-body {
  padding: 2.5rem 2.25rem;
}

.logo-container {
  display: inline-block;
  margin-bottom: 0.5rem;
}

.logo-img {
  height: 85px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.08));
}

.login-title {
  color: #111827;
  font-size: 1.65rem;
}

.login-subtitle {
  color: #6b7280;
  font-size: 0.92rem;
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

.forgot-password-link {
  color: #6b7280;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.forgot-password-link:hover { color: #33b04a; }

.btn-login {
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

.btn-login:hover:not(:disabled) {
  background: linear-gradient(135deg, #2a9540 0%, #1f7a33 100%);
  box-shadow: 0 6px 18px rgba(51, 176, 74, 0.35);
  transform: translateY(-1px);
}

.btn-login:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-resend {
  border: 1.5px solid #33b04a;
  color: #33b04a;
  background-color: transparent;
  border-radius: 10px;
  padding: 0.78rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-resend:hover:not(:disabled) {
  background-color: #33b04a;
  color: white;
}

.btn-resend:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-back {
  border: 1.5px solid #e5e7eb;
  color: #6b7280;
  background-color: transparent;
  border-radius: 10px;
  padding: 0.78rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-back:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.otp-info-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  color: #1e40af;
  padding: 0.75rem 1rem;
  text-align: center;
  font-size: 0.9rem;
}

.otp-input {
  letter-spacing: 0.5em;
  font-size: 1.3em;
  font-weight: 600;
  text-align: center;
}
</style>