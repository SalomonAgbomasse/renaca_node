import { createWebHistory, createRouter, createWebHashHistory } from "vue-router";

import DashboardPage from "../pages/Dashboard/DashboardPage.vue";
import LMSCoursesPage from "../pages/Dashboard/LMSCoursesPage.vue";
import LoginPage from "../pages/Authentication/LoginPage.vue";
import ForgotPasswordPage from "../pages/Authentication/ForgotPasswordPage.vue";
import ResetPasswordPage from "../pages/Authentication/ResetPasswordPage.vue";
import EmailConfirmationPage from "../pages/Authentication/EmailConfirmationPage.vue";
import ErrorPage from "../pages/ErrorPage.vue";

import MaintenancePage from "../pages/PagesInner/MaintenancePage.vue";
import ConnectedAccountsPage from "../pages/PagesInner/ConnectedAccountsPage.vue";
import LogoutPage from "../pages/LogoutPage.vue";

import ListeContratPage from "../pages/Contract/ListeContratPage.vue";
import DetailsContratPage from "../pages/Contract/DetailsContratPage.vue";


import ListeCustomerPage from "../pages/Customer/ListeCustomerPage.vue";
import DetailsCustomerPage from "../pages/Customer/DetailsCustomerPage.vue";

import ListeEtatsProductionPage from "../pages/Production/ListeEtatsProductionPage.vue";
import GenerateProductionStatePage from "../pages/Production/GenerateProductionStatePage.vue";
import EditProductionPage from "../pages/Production/EditProductionPage.vue";

import ListeAgencePage from "../pages/Agence/ListeAgencePage.vue";
import AgencyDetailPage from "../pages/Agence/AgencyDetailPage.vue";

import AddUserPage from "../pages/User/AddUserPage.vue";
import ListeUserPage from "../pages/User/ListeUserPage.vue";
import EditUserPage from "../pages/User/EditUserPage.vue";
import ProfilePage from "../pages/User/ProfilePage.vue";
import UserDetailPage from "../pages/User/UserDetailPage.vue";
import ParametresSystemePage from "../pages/Admin/ParametresSystemePage.vue";

import AddCotationPage from "../pages/Cotation/AddCotationPage.vue";
import ListeCotationPage from "../pages/Cotation/ListeCotationPage.vue";
import EditCotationPage from "../pages/Cotation/EditCotationPage.vue";
import DetailsCotationPage from "../pages/Cotation/DetailsCotationPage.vue";

import EcommercePage from "../pages/Dashboard/EcommercePage.vue";
import ListeContratHorsConventionPage from "../pages/Contract/ListeContratHorsConventionPage.vue";
import ListeContratEchusPage from "../pages/Contract/ListeContratEchusPage.vue";
import UserGuidePage from "../pages/Help/UserGuidePage.vue";
import AdminAuditLogsPage from "../pages/AdminAuditLogsPage.vue";

import BiOverviewPage from "../pages/BI/BiOverviewPage.vue";
import BiClientsPage from "../pages/BI/BiClientsPage.vue";
import BiCommercialPage from "../pages/BI/BiCommercialPage.vue";
import BiAlertsPage from "../pages/BI/BiAlertsPage.vue";
import ContactPage from "../pages/Contact/ContactPage.vue";
import InformationsRoutePage from "../pages/Informations/InformationsRoutePage.vue";

import { useAuthStore } from "@/services/auth";
import ApiService from "@/services/ApiService";


const routes = [
  {
    path: "/",
    redirect: "/login",
    component: () => import("@/layouts/MainLayout.vue"),
    children: [
      {
        path: "/tableau_bord",
        name: "tableauBordPage",
        component: EcommercePage,
        meta: {
          middleware: "auth",
          title: "Tableau de bord",
        },
      },
        {
          path: "/liste-contrats",
          name: "ListeContratPage",
          component: ListeContratPage,
          meta: {
            middleware: "auth",
            title: "Liste des contrats",
          },
        },
        {
          path: "/liste-contrats-echus",
          name: "ListeContratEchusPage",
          component: ListeContratEchusPage,
          meta: {
            middleware: "auth",
            title: "Liste des contrats échus",
          },
        },
        {
          path: "/details-contrat/:id",
          name: "DetailsContratPage",
          component: DetailsContratPage,
          meta: {
            middleware: "auth",
            title: "Détails du contrat",
          },
        },




      // ===== GESTION DES COTATIONS =====
      
      {
        path: "/ajouter-cotation",
        name: "AddCotationPage",
        component: AddCotationPage,
        meta: {
          middleware: "auth",
          title: "Faire une cotation",
        },
      },

      {
        path: "/liste-contrats-hors-convention",
        name: "ListeContratHorsConventionPage",
        component: ListeContratHorsConventionPage,
        meta: {
          middleware: "auth",
          title: "Liste des contrats hors convention",
        },
      },

      {
        path: "/liste-cotations",
        name: "ListeCotationPage",
        component: ListeCotationPage,
        meta: {
          middleware: "auth",
          title: "Liste de mes cotations",
        },
      },

      {
        path: "/editer-cotation/:code",
        name: "EditCotationPage",
        component: EditCotationPage,
        meta: {
          middleware: "auth",
          title: "Editer une cotation",
        },
      },
      {
        path: "/details-cotation/:id",
        name: "DetailsCotationPage",
        component: DetailsCotationPage,
        meta: {
          middleware: "auth",
          title: "Détails de la cotation",
        },
      },


      // ===== GESTION DES UTILISATEURS =====

      {
        path: "/ajouter-utilisateur",
        name: "AddUserPage",
        component: AddUserPage,
        meta: {
          middleware: "auth",
          title: "Enregistrer un utilisateur",
        },
      },

      {
        path: "/liste-utilisateurs",
        name: "ListeUserPage",
        component: ListeUserPage,
        meta: {
          middleware: "auth",
          title: "Liste des utilisateurs",
        },
      },

      {
        path: "/editer-utilisateur/:id",
        name: "EditUserPage",
        component: EditUserPage,
        meta: {
          middleware: "auth",
          title: "Editer un utilisateur",
        },
      },

      {
        path: "/detail-utilisateur/:id",
        name: "UserDetailPage",
        component: UserDetailPage,
        meta: {
          middleware: "auth",
          title: "Détail utilisateur",
        },
      },

      {
        path: "/profile",
        name: "ProfilePage",
        component: ProfilePage,
        meta: {
          middleware: "auth",
          title: "Mon Compte",
          requiresAuth: true,
        },
      },
      // ===== GESTION DES CLIENTS =====
      {
        path: "/liste-clients",
        name: "ListeCustomerPage",
        component: ListeCustomerPage,
        meta: {
          middleware: "auth",
          title: "Liste des clients",
        },
      },
      {
        path: "/details-client/:uuid",
        name: "DetailsCustomerPage",
        component: DetailsCustomerPage,
        meta: {
          middleware: "auth",
          title: "Détails du client",
        },
      },

      // ===== GESTION DES AGENCES =====

      {
        path: "/liste-agences",
        name: "ListeAgencePage",
        component: ListeAgencePage,
        meta: {
          middleware: "auth",
          title: "Liste des agences",
        },
      },

      {
        path: "/detail-agence/:id",
        name: "AgencyDetailPage",
        component: AgencyDetailPage,
        meta: {
          middleware: "auth",
          title: "Détails de l'agence",
        },
      },

      // ===== GESTION DES ÉTATS DE PRODUCTION =====

      {
        path: '/liste-etats-production',
        name: 'ListeEtatsProductionPage',
        component: ListeEtatsProductionPage,
        meta: {
          middleware: "auth",
          title: 'États de Production'
        }
      },

      {
        path: '/edit-production-state/:code',
        name: 'EditProductionPage',
        component: EditProductionPage,
        meta: {
          middleware: "auth",
          title: 'Editer État de Production'
        }
      },
      {
        path: '/generer-etat-production',
        name: 'GenerateProductionStatePage',
        component: GenerateProductionStatePage,
        meta: {
          middleware: "auth",
          title: 'Générer État de Production'
        }
      },
      {
        path: '/generer-etat-production/:id',
        name: 'EditProductionStatePage',
        component: GenerateProductionStatePage,
        meta: {
          middleware: "auth",
          title: 'Modifier État de Production'
        }
      },

      {
        path: "/guide-utilisation",
        name: "UserGuidePage",
        component: UserGuidePage,
        meta: {
          middleware: "auth",
          title: "Guide d'Utilisation",
        },
      },
      {
        path: "/contact",
        name: "ContactPage",
        component: ContactPage,
        meta: {
          middleware: "auth",
          title: "Contact / Signaler un problème",
        },
      },
      {
        path: "/informations",
        name: "InformationsPage",
        component: InformationsRoutePage,
        meta: {
          middleware: "auth",
          title: "Informations",
        },
      },
      {
        path: "/audit-logs",
        name: "AdminAuditLogsPage",
        component: AdminAuditLogsPage,
        meta: { middleware: "auth", title: "Logs d'audit" },
      },
      {
        path: "/parametres-systeme",
        name: "ParametresSystemePage",
        component: ParametresSystemePage,
        meta: { middleware: "auth", title: "Paramètres Système" },
      },
      {
        path: '/bi/vue-ensemble',
        name: 'BiOverviewPage',
        component: BiOverviewPage,
        meta: { middleware: 'auth', title: 'BI — Vue d\'ensemble', permission: 'bi:read' }
      },
      {
        path: '/bi/clients',
        name: 'BiClientsPage',
        component: BiClientsPage,
        meta: { middleware: 'auth', title: 'BI — Analyse Clients', permission: 'bi:read' }
      },
      {
        path: '/bi/commercial',
        name: 'BiCommercialPage',
        component: BiCommercialPage,
        meta: { middleware: 'auth', title: 'BI — Analyse Commerciale', permission: 'bi:read' }
      },
      {
        path: '/bi/alertes',
        name: 'BiAlertsPage',
        component: BiAlertsPage,
        meta: { middleware: 'auth', title: 'BI — Alertes & Insights', permission: 'bi:read' }
      },
      {
        path: "/tableau_bord1",
        name: "tableauBordPage1",
        component: LMSCoursesPage,
      },
      {
        path:"/ediiter-demande/:code",
        name: "EditDemandePage",
        component: LMSCoursesPage,
      },
    ]
  },
  {
    path: "/",
    redirect: "/login",
    component: () => import("@/layouts/AuthLayout.vue"),
    children: [
      {
        path: "/login",
        name: "LoginPage",
        component: LoginPage,
      },
      {
        path: "/register",
        name: "RegisterPage",
        redirect: "/login",
      },
      {
        path: "/forgot-password",
        name: "ForgotPasswordPage",
        component: ForgotPasswordPage,
      },
      {
        path: "/reset-password",
        name: "ResetPasswordPage",
        component: ResetPasswordPage,
      },
      {
        path: "/email-confirmation",
        name: "EmailConfirmationPage",
        component: EmailConfirmationPage,
      },
      {
        path: "/connected-accounts",
        name: "ConnectedAccountsPage",
        component: ConnectedAccountsPage,
      },
      {
        path: "/maintenance",
        name: "MaintenancePage",
        component: MaintenancePage,
      },
      {
        path: "/logout",
        name: "LogoutPage",
        component: LogoutPage,
      },
    ],
  },
  { path: "/:pathMatch(.*)*", name: "ErrorPage", component: ErrorPage },
];

const router = createRouter({
  history: createWebHistory(),
  linkExactActiveClass: "active",
  routes: routes,
  scrollBehavior() {
    return { top: 0, behavior: "smooth" };
  },
});

router.beforeEach(async (to, from, next) => {
  // Rediriger toute URL contenant index.html ou se terminant par .html vers le tableau de bord (ou login si non connecté)
  if (to.path.toLowerCase().includes('index.html') || to.path.toLowerCase().endsWith('.html')) {
    console.log('🔄 Redirection URL héritée .html ou index.html vers le tableau de bord:', to.path);
    next({ name: "tableauBordPage" });
    return;
  }

  // Nettoyage préventif du scroll bloqué par SweetAlert2 ou des modaux lors des changements de page
  document.body.classList.remove('swal2-shown', 'swal2-height-auto', 'modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  document.documentElement.classList.remove('swal2-shown', 'swal2-height-auto');
  document.documentElement.style.overflow = '';

  const authStore = useAuthStore();

  // Pour les pages qui nécessitent une authentification
  if(to.meta.middleware == "auth") {
    try {
      // Vérifier l'authentification avec le backend (cookies HttpOnly)
      const isAuthenticated = await authStore.verifyAuth();
      
      if (isAuthenticated) {
        if (to.meta.permission) {
          const user = authStore.user;
          const roleObj = user?.role;
          const userRoleLibelle = (typeof roleObj === 'object' && roleObj !== null ? (roleObj as any).libelle : roleObj || '').toString().toUpperCase();
          const privileges: string[] = (user as any)?.permissions || (typeof roleObj === 'object' && roleObj !== null && (roleObj as any).permissions ? (roleObj as any).permissions.map((p: any) => p.name) : []);
          
          let hasPermission = userRoleLibelle === 'ADMIN' || userRoleLibelle === 'SUPER ADMIN' || userRoleLibelle === 'ADMINISTRATEUR' || privileges.includes(to.meta.permission as string);
          if (!hasPermission && to.meta.permission === 'bi:read') {
            hasPermission = true;
          }
          const isManagerRole = userRoleLibelle.includes('MANAGER') || userRoleLibelle.includes('RESPONSABLE') || userRoleLibelle.includes('CHEF') || user?.idRole === 2;
          if (!hasPermission && isManagerRole && ['users:read', 'agencies:read', 'agency:read'].includes(to.meta.permission as string)) {
            hasPermission = true;
          }
          
          if (hasPermission) {
            next();
          } else {
            console.warn(`🚫 Navigation bloquée vers ${to.path}. Rôle: ${userRoleLibelle}, Permission requise: ${to.meta.permission}`);
            next({ name: "tableauBordPage" });
          }
        } else {
          next();
        }
      } else {
        console.log('🔒 Redirection vers login - utilisateur non authentifié');
        next({ name: "LoginPage", query: { sessionExpired: "1" } });
      }
    } catch (error) {
      console.log('🔒 Erreur de vérification auth, redirection vers login');
      next({ name: "LoginPage", query: { sessionExpired: "1" } });
    }
  } 
  // Si l'utilisateur est connecté et essaie d'accéder aux pages d'authentification
  else if (authStore.isAuthenticated && (to.name === "LoginPage" || to.name === "RegisterPage" || to.name === "ForgotPasswordPage")) {
    console.log('🔄 Utilisateur connecté redirigé vers le tableau de bord');
    next({ name: "tableauBordPage" });
  } 
  else {
    next();
  }

  // Scroll page to top on every route change
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "smooth",
  });
});
// window.scrollTo({
//   top: 0,
//   left: 0,
//   behavior: "smooth",
// });

export default router;