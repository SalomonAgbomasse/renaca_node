<template>
  <header
    :class="[
      'header-area bg-white text-center text-md-start pt-15 pb-15 ps-15 pe-15 ps-md-20 pe-md-20 pe-lg-30 transition mb-25 position-fixed',
      { sticky: isSticky },
    ]"
    id="header"
  >
    <div class="row align-items-center">
      <!-- Toggle menu - toujours visible à gauche -->
      <div class="col-auto">
        <button
          class="header-burger-menu transition position-relative lh-1 bg-transparent p-0 border-0"
          id="header-burger-menu"
          @click="stateStoreInstance.onChange"
        >
          <i class="flaticon-menu-3"></i>
        </button>
      </div>
      
      <!-- Logo et mode switcher - à droite -->
      <div class="col d-flex align-items-center justify-content-end">
        <div class="d-flex align-items-center gap-3">
          <!-- Logo RENACA -->
          <div class="d-flex align-items-center">
            <img
              src="../../assets/images/logo-renaca.jpeg"
              class="rectangle"
              width="50"
              height="50"
              alt="RENACA"
            />
            <span class="ms-2 d-none d-sm-block fw-bold text-dark">RENACA</span>
          </div>
          
          <!-- Sélecteur de taille de police -->
          <FontSizeSelector />
          
          <!-- Mode switcher -->
          <LightDarkSwtichBtn />
          
          <!-- Profil utilisateur -->
          <div class="dropdown profile-dropdown">
            <button
              class="dropdown-toggle text-start fs-14 text-black-emphasis d-flex align-items-center p-0 position-relative bg-transparent border-0 transition lh-1"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div class="d-flex align-items-center">
                <div class="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold" 
                     style="width: 35px; height: 35px; font-size: 14px;">
                  {{ userName ? userName.charAt(0).toUpperCase() : 'U' }}
                </div>
                <span class="title d-none d-lg-block ms-2">
                  <span class="d-block fw-bold mb-0">{{ userName || "Utilisateur" }}</span>
                  <span class="text-body-emphasis fw-semibold fs-12">{{ userEmail || "" }}</span>
                </span>
              </div>
            </button>
            <div class="dropdown-menu rounded-0 bg-white border-0 start-auto end-0">
              <ul class="ps-0 mb-0 list-unstyled dropdown-body">
                <li class="text-body-secondary fw-semibold transition position-relative">
                  <i class="flaticon-user-settings me-2 text-info"></i>
                  <span class="text-dark">Mon Profil</span>
                  <small class="d-block text-muted mt-1" style="font-size: 0.75rem; margin-left: 1.5rem;">
                    Gérer mes informations
                  </small>
                  <router-link 
                    :to="{ name: 'ProfilePage' }" 
                    class="d-block position-absolute start-0 top-0 end-0 bottom-0 text-decoration-none">
                  </router-link>
                </li>
                <li class="dropdown-divider my-2"></li>
              </ul>
              <div class="dropdown-footer pt-2">
                <button @click="logout()" class="btn btn-sm btn-danger w-100">
                  <i class="flaticon-logout me-2"></i>
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";
import LightDarkSwtichBtn from "./LightDarkSwtichBtn.vue";
import FontSizeSelector from "./FontSizeSelector.vue";
import stateStore from "../../utils/store";
import { useRouter } from "vue-router";
import { useAuthStore, User } from "../../services/auth";

export default defineComponent({
  name: "MainHeader",
  components: {
    LightDarkSwtichBtn,
    FontSizeSelector,
  },
  setup() {
    const stateStoreInstance = stateStore;
    const isSticky = ref(false);
    const router = useRouter();
    const store = useAuthStore();
    
    // Utiliser des computed pour réagir aux changements du store
    const userName = computed(() => {
      const u = store.user as any;
      return u?.value?.firstname || u?.firstname || "";
    });
    
    const userEmail = computed(() => {
      const u = store.user as any;
      return u?.value?.email || u?.email || "";
    });
    
    const userPhone = computed(() => {
      const u = store.user as any;
      return u?.value?.phone || u?.phone || "";
    });
    
    onMounted(async () => {
      window.addEventListener("scroll", () => {
        let scrollPos = window.scrollY;
        isSticky.value = scrollPos >= 100;
      });
      
      // Vérifier l'authentification si pas déjà fait
      if (!store.isAuthenticated) {
        console.log('🔍 MainHeader: Vérification de l\'authentification...');
        await store.verifyAuth();
      }
    });

    function logout() {
      store.logout().then(() => {
        if (!store.isAuthenticated) {
          router.push({name:'LoginPage'})
        }
      }).catch((error) => {
        console.error("Erreur lors de la déconnexion:", error);
        // Rediriger vers la page de connexion même en cas d'erreur
        router.push({name:'LoginPage'})
      });
    }


    return {
      isSticky,
      userEmail,
      userName,
      userPhone,
      stateStoreInstance,
      logout
    };
  },
});
</script>

<style scoped>
/* Logo RENACA */
.rectangle {
  border-radius: 30%;
  object-fit: cover;
}

/* Styles pour l'en-tête mobile */
@media (max-width: 768px) {
  .header-area {
    padding: 0.75rem 1rem !important;
  }
  
  /* Toggle menu */
  .header-burger-menu {
    font-size: 1.6rem;
    padding: 0.9rem;
    min-width: 50px;
    min-height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Logo et mode switcher */
  .d-flex.align-items-center.gap-3 {
    gap: 0.75rem !important;
  }
  
  /* Logo RENACA */
  .d-flex.align-items-center img {
    width: 32px !important;
    height: 32px !important;
  }
  
  /* Mode switcher */
  .light-dark-switch {
    font-size: 1.1rem;
  }
  
  /* Profil utilisateur */
  .profile-dropdown .dropdown-toggle {
    padding: 0.25rem;
  }
  
  .profile-dropdown .rounded-circle {
    width: 32px !important;
    height: 32px !important;
    font-size: 12px !important;
  }
  
  /* Espacement général */
  .row {
    margin: 0;
  }
  
  .col-auto {
    padding: 0;
  }
  
  .col {
    padding: 0;
  }
}

/* Styles pour très petits écrans */
@media (max-width: 480px) {
  .header-area {
    padding: 0.5rem 0.75rem !important;
  }
  
  .d-flex.align-items-center.gap-3 {
    gap: 0.5rem !important;
  }
  
  .d-flex.align-items-center img {
    width: 28px !important;
    height: 28px !important;
  }
  
  .profile-dropdown .rounded-circle {
    width: 28px !important;
    height: 28px !important;
    font-size: 11px !important;
  }
  
  .header-burger-menu {
    font-size: 1.5rem;
    padding: 0.8rem;
    min-width: 46px;
    min-height: 46px;
  }
}

/* Taille de base du toggle */
.header-burger-menu {
  font-size: 1.4rem;
  padding: 0.8rem;
  min-width: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Amélioration de l'accessibilité */
.header-burger-menu:focus,
.profile-dropdown .dropdown-toggle:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Animation pour le toggle */
.header-burger-menu i {
  transition: transform 0.3s ease;
}

.header-burger-menu:hover i {
  transform: scale(1.1);
}

/* Amélioration du dropdown */
.profile-dropdown .dropdown-menu {
  min-width: 200px;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.profile-dropdown .dropdown-item {
  padding: 0.5rem 1rem;
  transition: background-color 0.2s ease;
}

.profile-dropdown .dropdown-item:hover {
  background-color: #f8f9fa;
}
</style>