<template>
  <div
    :class="[
      'sidebar-area position-fixed start-0 top-0 bg-dark h-100vh transition',
      { active: stateStoreInstance.open },
    ]"
    id="sidebar-area"
  >
    <div class="logo position-absolute start-0 end-0 top-0" style="background-color: black;">
      <router-link to="/tableau_bord" class="d-flex align-items-center text-white text-decoration-none ">
        <img src="../../assets/images/logo-guda-with.png" alt="logo-icon" class="logo-img ps-4" />
      </router-link>
      <button
        class="sidebar-burger-menu position-absolute lh-1 bg-transparent p-0 border-0"
        @click="stateStoreInstance.onChange"
      >
        <i class="ph-duotone ph-caret-double-right"></i>
      </button>
    </div>
    <div class="sidebar-menu">
      <ul class="sidebar-navbar-nav ps-0 mb-0 list-unstyled accordion" id="sidebarNavAccordion">
        
        <!-- ===== SECTION PRINCIPALE ===== -->
        <li class="sub-title sidebar-nav-item">
          <span class="d-block text-uppercase fw-medium">Menu Principal</span>
        </li>
        
        <li class="sidebar-nav-item">
          <router-link to="/tableau_bord" class="sidebar-nav-link d-block">
            <i class="flaticon-more-1"></i>
            <span class="title">Tableau de bord</span>
          </router-link>
        </li>

        <!-- ===== GESTION MÉTIER ===== -->
        <li class="sub-title sidebar-nav-item mt-4">
          <span class="d-block text-uppercase fw-medium">Gestion Métier</span>
        </li>

        <li class="sidebar-nav-item accordion-item bg-transparent border-0 rounded-0">
          <a
            href="#"
            class="accordion-button rounded-0 shadow-none bg-transparent d-block"
            data-bs-toggle="collapse"
            data-bs-target="#cotations"
            aria-expanded="false"
            aria-controls="cotations"
          >
            <i class="flaticon-express-delivery"></i>
            <span class="title">Cotations</span>
          </a>
          <div
            id="cotations"
            class="accordion-collapse collapse"
            data-bs-parent="#sidebarNavAccordion"
          >
            <div class="accordion-body">
              <ul class="sidebar-sub-menu ps-0 mb-0 list-unstyled">
                <li class="sidebar-sub-menu-item">
                  <router-link to="/ajouter-cotation" class="sidebar-sub-menu-link">
                    Faire une cotation
                  </router-link>
                </li>
                <li class="sidebar-sub-menu-item">
                  <router-link to="/liste-cotations" class="sidebar-sub-menu-link">
                    Liste des cotations
                  </router-link>
                </li>

              </ul>
            </div>
          </div>
        </li>

        <li class="sidebar-nav-item accordion-item bg-transparent border-0 rounded-0">
          <a
            href="#"
            class="accordion-button rounded-0 shadow-none bg-transparent d-block"
            data-bs-toggle="collapse"
            data-bs-target="#contrats"
            aria-expanded="false"
            aria-controls="contrats"
          >
            <i class="flaticon-file"></i>
            <span class="title">Contrats</span>
          </a>
          <div
            id="contrats"
            class="accordion-collapse collapse"
            data-bs-parent="#sidebarNavAccordion"
          >
            <div class="accordion-body">
              <ul class="sidebar-sub-menu ps-0 mb-0 list-unstyled">
                <li class="sidebar-sub-menu-item">
                  <router-link to="/liste-contrats" class="sidebar-sub-menu-link">
                    Liste des Contrats
                  </router-link>
                </li>

                <li class="sidebar-sub-menu-item">
                  <router-link to="/liste-contrats-hors-convention" class="sidebar-sub-menu-link">
                    Contrats Hors Convention
                  </router-link>
                </li>
                <li class="sidebar-sub-menu-item">
                  <router-link to="/liste-contrats-echus" class="sidebar-sub-menu-link">
                    Contrats Échus
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
        </li>

        <li class="sidebar-nav-item">
          <router-link to="/liste-clients" class="sidebar-nav-link d-block">
            <i class="flaticon-user-1"></i>
            <span class="title">Liste des Clients</span>
          </router-link>
        </li>

        <li class="sidebar-nav-item accordion-item bg-transparent border-0 rounded-0">
          <a
            href="#"
            class="accordion-button rounded-0 shadow-none bg-transparent d-block"
            data-bs-toggle="collapse"
            data-bs-target="#production"
            aria-expanded="false"
            aria-controls="production"
          >
            <i class="flaticon-menu-1"></i>
            <span class="title">États de production</span>
          </a>
          <div
            id="production"
            class="accordion-collapse collapse"
            data-bs-parent="#sidebarNavAccordion"
          >
            <div class="accordion-body">
              <ul class="sidebar-sub-menu ps-0 mb-0 list-unstyled">
                <li class="sidebar-sub-menu-item">
                  <router-link to="/generer-etat-production" class="sidebar-sub-menu-link">
                    Générer un état
                  </router-link>
                </li>
                <li class="sidebar-sub-menu-item">
                  <router-link to="/liste-etats-production" class="sidebar-sub-menu-link">
                    Liste des états
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
        </li>

        <!-- ===== ANALYSE & PILOTAGE BI ===== -->
        <li v-if="checkPermission('bi:read')" class="my-1">
          <hr class="border-secondary opacity-25 m-0 mx-3">
        </li>

        <li v-if="checkPermission('bi:read')" class="sub-title sidebar-nav-item">
          <span 
            class="d-block text-uppercase fw-medium d-flex align-items-center"
            style="margin-top: 12px !important; margin-bottom: 12px !important;"
          >
            <i class="ph-bold ph-chart-line-up me-2"></i>Analyse & Pilotage
            <i class="pulse-dot-gold ms-2"></i>
          </span>
        </li>

        <li v-if="checkPermission('bi:read')" class="sidebar-nav-item">
          <router-link to="/bi/vue-ensemble" class="sidebar-nav-link d-block">
            <i class="ph-bold ph-squares-four"></i>
            <span class="title">Vue d'ensemble</span>
          </router-link>
        </li>

        <li v-if="checkPermission('bi:read')" class="sidebar-nav-item">
          <router-link to="/bi/clients" class="sidebar-nav-link d-block">
            <i class="ph-bold ph-users-three"></i>
            <span class="title">Analyse Clients</span>
          </router-link>
        </li>

        <li v-if="checkPermission('bi:read')" class="sidebar-nav-item">
          <router-link to="/bi/commercial" class="sidebar-nav-link d-block">
            <i class="ph-bold ph-chart-bar"></i>
            <span class="title">Analyse Commerciale</span>
          </router-link>
        </li>

        <li v-if="checkPermission('bi:read')" class="sidebar-nav-item">
          <router-link to="/bi/alertes" class="sidebar-nav-link d-block">
            <i class="ph-bold ph-bell-ringing"></i>
            <span class="title">Alertes & Insights</span>
          </router-link>
        </li>

        <!-- ===== SÉPARATEUR VISUEL ===== -->
        <li v-if="checkPermission('roles:manage') || checkPermission('users:read') || checkPermission('agency:read') || checkPermission('agencies:read')" class="my-1">
          <hr class="border-secondary opacity-25 m-0 mx-3">
        </li>

        <!-- ===== ADMINISTRATION ===== -->
        <li v-if="checkPermission('roles:manage') || checkPermission('users:read') || checkPermission('agency:read') || checkPermission('agencies:read')" class="sub-title sidebar-nav-item">
          <span class="d-block text-uppercase fw-medium">
            <i class="flaticon-shield me-2"></i>Administration
          </span>
        </li>

        <li v-if="checkPermission('users:read') || checkPermission('users:create')" class="sidebar-nav-item accordion-item bg-transparent border-0 rounded-0">
          <a
            href="#"
            class="accordion-button rounded-0 shadow-none bg-transparent d-block"
            data-bs-toggle="collapse"
            data-bs-target="#utilisateurs"
            aria-expanded="false"
            aria-controls="utilisateurs"
          >
            <i class="flaticon-user-1"></i>
            <span class="title">Utilisateurs</span>
          </a>
          <div
            id="utilisateurs"
            class="accordion-collapse collapse"
            data-bs-parent="#sidebarNavAccordion"
          >
            <div class="accordion-body">
              <ul class="sidebar-sub-menu ps-0 mb-0 list-unstyled">
                <li v-if="checkPermission('users:create')" class="sidebar-sub-menu-item">
                  <router-link :to="{ name: 'AddUserPage' }" class="sidebar-sub-menu-link">
                    Enregistrer
                  </router-link>
                </li>
                <li v-if="checkPermission('users:read')" class="sidebar-sub-menu-item">
                  <router-link :to="{ name: 'ListeUserPage' }" class="sidebar-sub-menu-link">
                    Liste
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
        </li>

        <li v-if="checkPermission('agency:manage') || checkPermission('agency:read') || checkPermission('agencies:read')" class="sidebar-nav-item accordion-item bg-transparent border-0 rounded-0">
          <router-link to="/liste-agences" class="sidebar-nav-link d-block">
            <i class="flaticon-home"></i>
            <span class="title">Gestion des Agences</span>
          </router-link>
        </li>

        <li v-if="checkPermission('roles:manage') || checkPermission('roles:read')" class="sidebar-nav-item accordion-item bg-transparent border-0 rounded-0">
          <router-link to="/audit-logs" class="sidebar-nav-link d-block">
            <i class="flaticon-shield-1"></i>
            <span class="title">Logs d'audit</span>
          </router-link>
        </li>

        <li v-if="checkPermission('roles:manage')" class="sidebar-nav-item accordion-item bg-transparent border-0 rounded-0">
          <router-link to="/parametres-systeme" class="sidebar-nav-link d-block">
            <i class="flaticon-settings"></i>
            <span class="title">Paramètres Système</span>
          </router-link>
        </li>


        <!-- ===== AIDE & DOCUMENTATION ===== -->
        <li class="sub-title sidebar-nav-item mt-4">
          <span class="d-block text-uppercase fw-medium">
            <i class="ph-bold ph-question me-2"></i>Aide &amp; Support
          </span>
        </li>
        <li class="sidebar-nav-item">
          <router-link :to="{ name: 'UserGuidePage' }" class="sidebar-nav-link d-block">
            <i class="flaticon-menu-1"></i>
            <span class="title d-flex align-items-center">
              <span>Guide d'Utilisation</span>
              <i class="pulse-dot-gold ms-2"></i>
            </span>
          </router-link>
        </li>

        <li class="sidebar-nav-item">
          <router-link :to="{ name: 'ContactPage' }" class="sidebar-nav-link d-block">
            <i class="flaticon-envelope"></i>
            <span class="title">Assistance Technique</span>
          </router-link>
        </li>

        <li class="sidebar-nav-item">
          <router-link :to="{ name: 'InformationsPage' }" class="sidebar-nav-link d-block">
            <i class="flaticon-info"></i>
            <span class="title">Informations</span>
          </router-link>
        </li>

        <!-- ===== PROFIL UTILISATEUR ===== -->
        <li class="sub-title sidebar-nav-item">
          <span class="d-block text-uppercase fw-medium">
            <i class="flaticon-user me-2"></i>Mon Compte
          </span>
        </li>

        <li class="sidebar-nav-item">
          <router-link 
            :to="{ name: 'ProfilePage' }" 
            class="sidebar-nav-link d-block border-info border-start border-3 ps-3"
            style="background: linear-gradient(135deg, rgba(13, 202, 240, 0.1) 0%, rgba(13, 202, 240, 0.05) 100%);"
          >
            <i class="flaticon-user-settings text-info"></i>
            <span class="title text-info fw-semibold">Mon Profil</span>
            <small class="d-block text-muted mt-1" style="font-size: 0.75rem;">
              Gérer mes informations
            </small>
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import stateStore from "../../utils/store";
import JwtService from "../../services/JwtService";
import ApiService from "../../services/ApiService";
import { useAuthStore } from "../../services/auth";

export default defineComponent({
  name: "MainSidebar",
  setup() {
    const stateStoreInstance = stateStore;

    const oneExist = ref(false);
    const userRole = ref<number | null>(null);
    const userRoleLibelle = ref<string | null>(null);

    const privileges = ref<Array<string>>(JwtService.getPrivilege());
    const authStore = useAuthStore();

    // Récupérer les informations de l'utilisateur connecté
    const fetchUserInfo = async () => {
      if (!authStore.isAuthenticated) {
        userRole.value = null;
        return;
      }
      try {
        const response = await ApiService.get('auth/profile');
        const data = response.data.data.user;
        
        // 1. Stocker les permissions (les noms des permissions ex: 'users:read')
        if (data && data.permissions) {
          privileges.value = data.permissions;
        } else if (data && data.role?.permissions) {
          privileges.value = data.role.permissions.map((p: any) => p.name);
        }
        
        // 2. Stocker les infos de rôle dynamiquement
        if (data && data.role) {
          userRole.value = data.role.id; // L'ID réel de la base
          userRoleLibelle.value = data.role.libelle; // Pour le check "ADMIN"
        } else {
          console.warn("⚠️ Aucun rôle trouvé pour l'utilisateur");
        }
      } catch (error: any) {
        if (error?.response?.status === 401) {
          // Non authentifié: on ignore silencieusement et on efface le token invalide
          userRole.value = null;
          authStore.purgeAuth(); // Nettoie les données d'auth obsolètes
          return;
        }
        console.error("Erreur lors de la récupération des informations utilisateur:", error);
        userRole.value = null;
      }
    };

    const checkPermission = (name: string) => {
      // Analyse & Pilotage (BI) est accessible à tous les utilisateurs
      if (name === "bi:read") return true;

      const user = (authStore.user as any)?.value || (authStore.user as any);
      const storeRole = user?.role?.libelle || user?.role?.name || '';
      const libelle = (userRoleLibelle.value || storeRole || "").toString().toUpperCase();
      const userRoleId = user?.idRole || userRole.value;

      // Admins et Super Admins (ID 1 & 5) ont toutes les autorisations
      if (libelle === "ADMIN" || libelle === "SUPER ADMIN" || libelle === "ADMINISTRATEUR" || userRoleId === 1 || userRoleId === 5) return true;

      // Managers (ID 2 ou libellé contenant MANAGER / AGENCY MANAGER) : accès en lecture seule aux utilisateurs et agences
      const isManagerRole = libelle.includes("MANAGER") || libelle.includes("RESPONSABLE") || libelle.includes("CHEF") || userRoleId === 2;
      if (isManagerRole) {
        if (["users:read", "agencies:read", "agency:read"].includes(name)) return true;
        if (["users:create", "agency:manage", "roles:manage"].includes(name)) return false;
      }

      return privileges.value.includes(name);
    };

    const checkParentPermission = (permissions: Array<string>) => {
      for (const permission of permissions) {
        if (checkPermission(permission)) {
          return true;
        }
      }
      return false;
    };

    // Charger les informations utilisateur au montage du composant
    onMounted(() => {
      fetchUserInfo();
    });

    return {
      stateStoreInstance,
      checkPermission,
      checkParentPermission,
      oneExist,
      userRole,
      userRoleLibelle,
    };
  },
});
</script>

<style scoped>
.pulse-dot-gold {
  display: inline-block;
  width: 8px;
  height: 8px;
  min-width: 8px;
  min-height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background-color: #f1b434; /* Brand gold */
  box-shadow: 0 0 0 0 rgba(241, 180, 52, 0.7);
  animation: pulse-gold 1.6s infinite;
  vertical-align: middle;
}

@keyframes pulse-gold {
  0% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(241, 180, 52, 0.7);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 5px rgba(241, 180, 52, 0);
  }
  100% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(241, 180, 52, 0);
  }
}
</style>