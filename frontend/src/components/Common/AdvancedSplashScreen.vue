<template>
  <div v-if="show" class="splash-screen">
    <!-- Étoiles animées en arrière-plan -->
    <div class="stars-container">
      <div v-for="i in 25" :key="i" class="star" :style="getStarStyle(i)"></div>
    </div>
    
    <div class="splash-content">
      <!-- Logos des partenaires -->
      <div class="partners-container">
        <div class="partner-logo left-partner">
          <img src="@/assets/images/padme.png" alt="PADME" class="logo" />
          <p class="partner-name">PADME</p>
          <p class="partner-slogan">Système Financier Décentralisé</p>
        </div>
        
        <div class="fusion-symbol">
          <div class="plus-sign">+</div>
        </div>
        
        <div class="partner-logo right-partner">
          <img src="@/assets/images/logoguda.png" alt="L'Africaine Vie Bénin SA" class="logo" />
          <p class="partner-name">L'Africaine Vie Bénin SA</p>
          <p class="partner-slogan">Le sens de l'engagement</p>
        </div>
      </div>
      
      <!-- Animation de fusion -->
      <div class="fusion-animation">
        <div class="fusion-circle"></div>
        <div class="fusion-text">Partenariat Stratégique</div>
      </div>
      
      <!-- Loading -->
      <div class="loading-container">
        <div class="spinner"></div>
        <p class="loading-text">{{ loadingText }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../services/auth';

export default defineComponent({
  name: 'AdvancedSplashScreen',
  props: {
    duration: {
      type: Number,
      default: 4000, // 4 seconds minimum display
    },
    loadingText: {
      type: String,
      default: 'Vérification de la session...',
    },
  },
  setup(props) {
    const show = ref(false);
    const router = useRouter();
    const authStore = useAuthStore();

    // Générer des styles aléatoires pour les étoiles
    const getStarStyle = (index: number) => {
      const size = Math.random() * 3 + 1; // Taille entre 1px et 4px
      const left = Math.random() * 100; // Position horizontale
      const top = Math.random() * 100; // Position verticale
      const animationDelay = Math.random() * 3; // Délai d'animation
      const animationDuration = Math.random() * 2 + 2; // Durée entre 2s et 4s
      
      return {
        width: `${size}px`,
        height: `${size}px`,
        left: `${left}%`,
        top: `${top}%`,
        animationDelay: `${animationDelay}s`,
        animationDuration: `${animationDuration}s`,
      };
    };

    onMounted(async () => {
      const startTime = Date.now();

      // Vérifier si l'utilisateur est déjà connecté
      if (authStore.isAuthenticated) {
        show.value = false;
        
        // Vérifier si on est sur une page de connexion et rediriger si nécessaire
        const currentRoute = router.currentRoute.value;
        const isOnLoginPage = currentRoute.name === 'LoginPage';
        const isOnSplashPage = currentRoute.name === 'SplashPage';
        const isOnPublicPage = currentRoute.meta?.public === true;
        
        if (isOnLoginPage || isOnSplashPage) {
          router.push({ name: 'tableauBordPage' });
        } else if (isOnPublicPage) {
          // Ne pas rediriger, rester sur la page publique
        } else {
          // Rester sur la page actuelle
        }
        return;
      }

      // Afficher le splash screen pendant la vérification
      show.value = true;

      // Vérifier l'authentification
      const isAuth = await authStore.verifyAuth();

      const elapsedTime = Date.now() - startTime;
      const remainingTime = props.duration - elapsedTime;

      // Si pas authentifié, afficher le splash screen pour la durée minimale
      if (!isAuth) {
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } else {
        // Afficher au moins 2 secondes même si connecté
        const minDisplayTime = 2000;
        if (elapsedTime < minDisplayTime) {
          await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsedTime));
        }
      }

      show.value = false;

      // Redirection basée sur l'état d'authentification
      if (isAuth) {
        // Vérifier si on est déjà sur une page valide (pas de redirection nécessaire)
        const currentRoute = router.currentRoute.value;
        const isOnLoginPage = currentRoute.name === 'LoginPage';
        const isOnSplashPage = currentRoute.name === 'SplashPage';
        const isOnPublicPage = currentRoute.meta?.public === true;
        
        if (isOnLoginPage || isOnSplashPage) {
          router.push({ name: 'tableauBordPage' });
        } else if (isOnPublicPage) {
          // Ne pas rediriger, rester sur la page publique
        } else {
          // Ne pas rediriger, rester sur la page actuelle
        }
      } else {
        // Vérifier si on est sur une page publique
        const currentRoute = router.currentRoute.value;
        const isOnPublicPage = currentRoute.meta?.public === true;
        
        if (isOnPublicPage) {
          // Ne pas rediriger, rester sur la page publique
        } else {
          router.push({ name: 'LoginPage' });
        }
      }
    });

    return {
      show,
      getStarStyle,
    };
  },
});
</script>

<style scoped>
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #3b82f6 50%, #10b981 75%, #1e40af 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  transition: opacity 0.8s ease-out;
  overflow: hidden;
}

/* Étoiles animées */
.stars-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation: twinkle infinite linear;
  box-shadow: 0 0 3px rgba(255, 255, 255, 0.4);
}

@keyframes twinkle {
  0%, 100% { 
    opacity: 0.2; 
    transform: scale(0.8);
  }
  50% { 
    opacity: 0.6; 
    transform: scale(1);
  }
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  z-index: 10;
}

/* Container des partenaires */
.partners-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  margin-bottom: 40px;
  animation: slideInUp 1s ease-out;
}

.partner-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: float 4s ease-in-out infinite;
}

.left-partner {
  animation-delay: 0s;
}

.right-partner {
  animation-delay: 0.5s;
}

.logo {
  width: 100px;
  height: auto;
  border-radius: 15px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.partner-name {
  color: white;
  font-size: 16px;
  font-weight: 700;
  margin-top: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  background: rgba(255, 255, 255, 0.15);
  padding: 8px 20px;
  border-radius: 25px;
  backdrop-filter: blur(10px);
  margin-bottom: 5px;
}

.partner-slogan {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-style: italic;
  font-weight: 400;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  background: rgba(255, 255, 255, 0.08);
  padding: 4px 12px;
  border-radius: 15px;
  backdrop-filter: blur(5px);
  margin: 0;
}

/* Symbole de fusion */
.fusion-symbol {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s ease-in-out infinite;
}

.plus-sign {
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: bold;
  color: white;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  animation: rotate 6s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Animation de fusion */
.fusion-animation {
  margin-bottom: 30px;
  animation: fadeIn 1.5s ease-out;
}

.fusion-circle {
  width: 200px;
  height: 200px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  position: relative;
  margin: 0 auto 20px;
  animation: expand 3s ease-in-out infinite;
}

.fusion-circle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 1.5s ease-in-out infinite;
}

.fusion-text {
  color: white;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 25px;
  border-radius: 25px;
  backdrop-filter: blur(10px);
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 2s ease-out;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: white;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Animations */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes expand {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Responsive */
@media (max-width: 768px) {
  .partners-container {
    flex-direction: column;
    gap: 20px;
  }
  
  .fusion-symbol {
    transform: rotate(90deg);
  }
  
  .logo {
    width: 80px;
  }
  
  .fusion-circle {
    width: 150px;
    height: 150px;
  }
}
</style>