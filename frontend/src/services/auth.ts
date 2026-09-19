import { ref } from "vue";
import { defineStore } from "pinia";
import ApiService from "@/services/ApiService";

export interface LoginCredentials {
  identifier: string; // email ou téléphone
  password: string;
}

export interface TwoFactorResponse {
  message: string;
  requiresTwoFactor: boolean;
  userId: number;
  twoFactorEnabled: boolean;
}

// Interface pour la réponse du backend
export interface ApiResponse {
  code: number;
  message: string;
  data: {
    user: User;
  };
}

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  address: string;
  birthdate: string;
  gender: "M" | "F";
  status: string;
  idRole: number;
  idAgency: number;
  createdAt: string;
  updatedAt: string;
  role?: Role;
  agency?: Agency;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  level: number;
  isSystemRole: boolean;
  color: string;
  icon: string;
  isActive: boolean;
  libelle?: string;
  permissions?: any[];
}

export interface Agency {
  id: number;
  name: string;
  location?: string;
  phone?: string;
  email?: string;
}

export const useAuthStore = defineStore("auth", () => {
  const errors = ref({});
  const user = ref<User>({} as User);
  const isAuthenticated = ref(false); // Sera défini après vérification avec le backend

  function setAuth(authData: { user: User }) {
    isAuthenticated.value = true;
    user.value = authData.user;
    errors.value = {};
    
    // Démarrer le heartbeat pour maintenir la session active
    ApiService.startHeartbeat();
    
    // Plus de localStorage avec les cookies HttpOnly
    // L'authentification est gérée uniquement via les cookies
  }

  function setError(error: any) {
    errors.value = { ...error };
  }

  function purgeAuth() {
    isAuthenticated.value = false;
    user.value = {} as User;
    errors.value = {};
    
    // Arrêter le heartbeat
    ApiService.stopHeartbeat();
    
    // Plus de localStorage avec les cookies HttpOnly
    // La déconnexion est gérée uniquement via les cookies
  }

  function login(credentials: LoginCredentials) {
    return ApiService.post("auth/login", credentials)
      .then((response) => {
        
        // Le ResponseTransformInterceptor transforme en { code, message, data, timestamp }
        const responseData = response.data;
        
        if (responseData && (responseData.code === 200 || responseData.code === 201) && responseData.data) {
          const actualData = responseData.data;
          
          //console.log('🔍 Données reçues du backend:', actualData);
          
          // Vérifier si c'est une réponse de 2FA requise
          if (actualData.requiresTwoFactor) {
            //console.log('🔐 Double authentification requise');
            // Retourner une réponse spéciale pour indiquer que la 2FA est nécessaire
            return Promise.resolve({
              requiresTwoFactor: true,
              userId: actualData.userId,
              twoFactorEnabled: actualData.twoFactorEnabled,
              message: actualData.message
            });
          }
          
          if (actualData.user) {
            // Le token est maintenant dans un cookie HttpOnly, pas besoin de le gérer manuellement
            // Le cookie sera automatiquement envoyé avec les requêtes suivantes
            setAuth({ user: actualData.user });
          } else {
            //console.log('❌ Pas d\'utilisateur dans les données:', actualData);
            setError({ message: responseData.message || "Connexion refusée" });
            return Promise.reject(new Error(responseData.message || "Connexion refusée"));
          }
        } else {
         // console.log('❌ Structure de réponse inattendue:', responseData);
          setError({ message: responseData?.message || "Connexion refusée" });
          return Promise.reject(new Error(responseData?.message || "Connexion refusée"));
        }
      })
      .catch(({ response }) => {
        if (response && response.data) {
          setError(response.data);
        } else {
          setError({ message: "Erreur de connexion au serveur" });
        }
        return Promise.reject(response?.data || new Error("Erreur de connexion au serveur"));
      });
  }

  function logout() {
    // Appeler l'API backend pour fermer les sessions
    return ApiService.post("auth/logout", {})
      .then((response) => {
        purgeAuth();
      })
      .catch((error) => {
        // Même en cas d'erreur, on nettoie l'état local
        purgeAuth();
      });
  }

  function register(credentials: any) {
    return ApiService.post("auth/register", credentials)
      .then((response) => {
        const apiResponse = response.data as ApiResponse;
        if (apiResponse.code === 201 || apiResponse.code === 200) {
          setAuth({ user: apiResponse.data.user });
        } else {
          setError({ message: apiResponse.message });
        }
      })
      .catch(({ response }) => {
        if (response && response.data) {
          setError(response.data.errors || response.data);
        } else {
          setError({ message: "Erreur lors de l'inscription" });
        }
      });
  }

  function forgotPassword(email: string) {
    return ApiService.post("auth/forgot_password", { email })
      .then(() => {
        setError({});
      })
      .catch(({ response }) => {
        if (response && response.data) {
          setError(response.data.errors || response.data);
        } else {
          setError({ message: "Erreur lors de la récupération du mot de passe" });
        }
      });
  }

  // Nouvelle méthode pour la réinitialisation de mot de passe (email ou téléphone)
  function requestPasswordReset(data: { email?: string; phone?: string }) {
    return ApiService.post("auth/security/forgot-password", data)
      .then((response) => {
        setError({});
        return response.data; // Retourner la réponse pour traitement
      })
      .catch(({ response }) => {
        const errorData = response?.data || { message: "Erreur lors de la demande de réinitialisation" };
        setError(errorData);
        throw errorData; // Re-throw pour traitement dans le composant
      });
  }

  function resetPassword(token: string, password: string, passwordConfirm: string) {
    return ApiService.post("auth/reset_password", { 
      token, 
      password, 
      password_confirm: passwordConfirm 
    })
      .then(() => {
        setError({});
      })
      .catch(({ response }) => {
        if (response && response.data) {
          setError(response.data.errors || response.data);
        } else {
          setError({ message: "Erreur lors de la réinitialisation du mot de passe" });
        }
      });
  }

  // Nouvelle méthode pour la réinitialisation avec code (email ou téléphone)
  function resetPasswordWithCode(data: { email?: string; phone?: string; code: string; newPassword: string }) {
    return ApiService.post("auth/security/reset-password", data)
      .then((response) => {
        setError({});
        return response.data; // Retourner la réponse pour traitement
      })
      .catch(({ response }) => {
        const errorData = response?.data || { message: "Erreur lors de la réinitialisation" };
        setError(errorData);
        throw errorData; // Re-throw pour traitement dans le composant
      });
  }

  // Fonctions pour la 2FA
  function sendOTPEmail(login: string) {
    return ApiService.post("auth/login/send-otp", { login })
      .then((response) => {
        const responseData = response.data;
        //console.log('🔍 Réponse sendOTPEmail:', responseData);
        
        // Le backend retourne directement { success, message, code, user }
        if (responseData && responseData.success) {
          return {
            success: true,
            message: responseData.message,
            code: responseData.code,
            user: responseData.user
          };
        }
        return { success: false, message: responseData?.message || "Erreur lors de l'envoi du code" };
      })
      .catch(({ response }) => {
        //console.log('❌ Erreur sendOTPEmail:', response);
        return { 
          success: false, 
          message: response?.data?.message || "Erreur lors de l'envoi du code" 
        };
      });
  }

  function sendOTPSMS(login: string) {
    return ApiService.post("auth/login/send-otp-sms", { login })
      .then((response) => {
        const responseData = response.data;
        //console.log('🔍 Réponse sendOTPSMS:', responseData);
        
        // Le backend retourne directement { success, message, code, user }
        if (responseData && responseData.success) {
          return {
            success: true,
            message: responseData.message,
            code: responseData.code,
            user: responseData.user
          };
        }
        return { success: false, message: responseData?.message || "Erreur lors de l'envoi du SMS" };
      })
      .catch(({ response }) => {
        //console.log('❌ Erreur sendOTPSMS:', response);
        return { 
          success: false, 
          message: response?.data?.message || "Erreur lors de l'envoi du SMS" 
        };
      });
  }

  function verifyOTP(login: string, otpCode: string) {
    return ApiService.post("auth/login/verify-otp", { login, otpCode })
      .then((response) => {
        const responseData = response.data;
        
        // L'endpoint verify-otp retourne directement {success, message, user, token}
        // sans passer par le ResponseTransformInterceptor
        if (responseData && responseData.success && responseData.user) {
          //console.log('✅ Vérification OTP réussie:', responseData.user);
          
          // Plus de token avec les cookies HttpOnly
          setAuth({ user: responseData.user });
          return { success: true, user: responseData.user };
        }
        
        return { success: false, message: responseData?.message || "Code de vérification invalide" };
      })
      .catch((error) => {
        //console.log('❌ Erreur verifyOTP:', error);
        return { 
          success: false, 
          message: error?.response?.data?.message || "Erreur lors de la vérification du code" 
        };
      });
  }


  function verifyAuth() {
  // Avec les cookies HttpOnly, on fait directement la requête
  // Le cookie sera automatiquement envoyé par le navigateur
  return ApiService.get("auth/verify-token")
    .then((response) => {
      
      // Le ResponseTransformInterceptor transforme en { code, message, data, timestamp }
      const responseData = response.data;
      
      if (responseData && responseData.code === 200 && responseData.data) {
        const actualData = responseData.data;
        
        if (actualData.user && actualData.tokenValid) {
          setAuth({ user: actualData.user });
          return true;
        }
      }
      
      purgeAuth();
      return false;
    })
    .catch((error) => {
      // Gérer les erreurs 500 et autres gracieusement
      
      // Si c'est une erreur 500, ne pas considérer comme une déconnexion
      if (error.response?.status === 500) {
        purgeAuth();
        return false;
      }
      
      // Pour les autres erreurs, nettoyer l'état
      purgeAuth();
      return false;
    });
  }

  return {
    errors,
    user,
    isAuthenticated,
    setAuth,
    setError,
    purgeAuth,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    verifyAuth,
    // Nouvelles fonctions 2FA
    sendOTPEmail,
    sendOTPSMS,
    verifyOTP,
    requestPasswordReset,
    resetPasswordWithCode,
  };
});