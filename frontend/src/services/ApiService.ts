import type { App } from "vue";
import type { AxiosResponse, AxiosRequestConfig } from "axios";
import axios from "axios";
import VueAxios from "vue-axios";
import JwtService from "./JwtService";

// Créer une instance axios séparée pour éviter les conflits
const apiClient = axios.create();

/**
 * @description service to call HTTP request via Axios
 */
class ApiService {
  /**
   * @description property to share vue instance
   */
  public static vueInstance: any;
  private static isInitialized = false;

  /**
   * @description initialize vue axios
   */
  public static init(app: App<Element>) {
    // Éviter la réinitialisation multiple
    if (ApiService.isInitialized) {
      return;
    }

    ApiService.vueInstance = app;

    // Vérifier si VueAxios est déjà installé
    if (!app.config.globalProperties.$http && !app.config.globalProperties.axios) {
      try {
        const plugin = (VueAxios as any).default || VueAxios;
        if (typeof plugin === 'function' || (plugin && typeof plugin.install === 'function')) {
          ApiService.vueInstance.use(plugin, axios);
        }
      } catch (error) {
        console.warn('Erreur lors de l\'installation de VueAxios:', error);
      }
    }

    // Configuration dynamique de l'URL de base selon l'environnement
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // Utiliser l'URL relative pour que le proxy Vue s'en occupe
    const apiBaseUrl = isLocalhost ? '/api' : `${window.location.origin}/api`;
    
    // Configurer l'instance axios séparée
    apiClient.defaults.baseURL = apiBaseUrl;
    apiClient.defaults.headers.common["Accept"] = "application/json";
    apiClient.defaults.headers.common["Content-Type"] = "application/json";
    apiClient.defaults.withCredentials = true;
    
    // Configurer aussi l'instance Vue pour compatibilité
    ApiService.vueInstance.axios.defaults.baseURL = apiBaseUrl;
    ApiService.vueInstance.axios.defaults.headers.common["Accept"] = "application/json";
    ApiService.vueInstance.axios.defaults.headers.common["Content-Type"] = "application/json";
    ApiService.vueInstance.axios.defaults.withCredentials = true;
    
    ApiService.isInitialized = true;
    
    ApiService.vueInstance.axios.interceptors.request.use(
      (config) => {
        // Les tokens sont maintenant gérés via cookies HttpOnly
        // Plus besoin d'ajouter manuellement les headers Authorization
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    ApiService.vueInstance.axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  public static postWithConfig(resource: string, data: any, config: any): Promise<AxiosResponse> {
    return ApiService.vueInstance.axios.post(`${resource}`, data, config);
  }

  public static putWithConfig(resource: string, data: any, config: any): Promise<AxiosResponse> {
    return ApiService.vueInstance.axios.put(`${resource}`, data, config);
  }

  public static patchWithConfig(resource: string, data: any, config: any): Promise<AxiosResponse> {
    return ApiService.vueInstance.axios.patch(`${resource}`, data, config);
  }

  public static patch(resource: string, params: any): Promise<AxiosResponse> {
    return ApiService.vueInstance.axios.patch(`${resource}`, params);
  }

  public static setHeader(): void {
    // Les tokens sont maintenant gérés via cookies HttpOnly
    // Plus besoin de gérer manuellement les headers Authorization
    ApiService.vueInstance.axios.defaults.headers.common["Accept"] = "application/json";
  }

  public static query(resource: string, params: any): Promise<AxiosResponse> {
    ApiService.setHeader();
    return ApiService.vueInstance.axios.get(resource, params);
  }

  public static get(resource: string, slugOrConfig: any = ""): Promise<AxiosResponse> {
    ApiService.setHeader();
    if (typeof slugOrConfig === "object" && slugOrConfig !== null) {
      return ApiService.vueInstance.axios.get(resource, slugOrConfig);
    }
    const url = slugOrConfig ? `${resource.replace(/\/$/, '')}/${slugOrConfig}` : resource;
    
    return ApiService.vueInstance.axios.get(url);
  }

  /**
   * @description Récupérer le profil de l'utilisateur connecté
   */
  public static async getCurrentUserProfile(): Promise<AxiosResponse> {
    ApiService.setHeader();
    return ApiService.vueInstance.axios.get("/auth/profile");
  }

  public static getWithConfig(resource: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse> {
    ApiService.setHeader();
    if (config.responseType === 'blob') {
      let acceptHeader = 'application/octet-stream';
      if (resource.includes('pdf') || config.headers?.['Accept']?.includes('pdf')) {
        acceptHeader = 'application/pdf';
      } else if (resource.includes('excel') || resource.includes('xlsx') || resource.includes('production')) {
        acceptHeader = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream';
      }
      const blobConfig = {
        ...config,
        headers: {
          ...config.headers,
          'Authorization': `Bearer ${JwtService.getToken()}`,
          'Accept': acceptHeader,
        },
        timeout: 60000,
      };
      return ApiService.vueInstance.axios.get(resource, blobConfig);
    }
    return ApiService.vueInstance.axios.get(resource, config);
  }

  public static getPDF(resource: string): Promise<AxiosResponse<Blob>> {
    return ApiService.getWithConfig(resource, {
      responseType: 'blob',
      headers: { 'Accept': 'application/pdf' },
    });
  }

  public static post(resource: string, params: any): Promise<AxiosResponse> {
    // Configuration dynamique de l'URL de base
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // Utiliser l'URL relative pour que le proxy Vue s'en occupe
    const apiBaseUrl = isLocalhost ? '/api' : `${window.location.origin}/api`;
    
    // Forcer la mise à jour de l'URL de base de l'instance Vue
    ApiService.vueInstance.axios.defaults.baseURL = apiBaseUrl;
    
    // Utiliser l'instance Vue mais avec la bonne URL
    ApiService.setHeader();
    return ApiService.vueInstance.axios.post(resource, params);
  }

  public static update(resource: string, slug: string, params: any): Promise<AxiosResponse> {
    ApiService.setHeader();
    return ApiService.vueInstance.axios.put(`${resource}/${slug}`, params);
  }

  public static put(resource: string, params: any): Promise<AxiosResponse> {
    ApiService.setHeader();
    return ApiService.vueInstance.axios.put(`${resource}`, params);
  }

  public static delete(resource: string): Promise<AxiosResponse> {
    ApiService.setHeader();
    return ApiService.vueInstance.axios.delete(resource);
  }

  /**
   * @description Forcer la réinitialisation de l'URL de base
   */
  public static resetBaseURL() {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiBaseUrl = isLocalhost ? '/api' : `${window.location.origin}/api`;
    
    apiClient.defaults.baseURL = apiBaseUrl;
    ApiService.vueInstance.axios.defaults.baseURL = apiBaseUrl;
  }

  /**
   * @description Démarrer le heartbeat pour maintenir la session active (toutes les 15 minutes)
   */
  private static heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  public static startHeartbeat() {
    if (ApiService.heartbeatInterval) return; // Déjà démarré
    
    const HEARTBEAT_INTERVAL = 15 * 60 * 1000; // 15 minutes
    
    ApiService.heartbeatInterval = setInterval(async () => {
      try {
        await ApiService.vueInstance.axios.post('/auth/ping');
        console.log('💓 Heartbeat: Session maintenue active');
      } catch (error: any) {
        if (error?.response?.status === 401) {
          // Session expirée: rediriger vers la connexion
          console.warn('💔 Heartbeat: Session expirée, redirection vers la connexion');
          ApiService.stopHeartbeat();
          window.location.href = '/';
        }
      }
    }, HEARTBEAT_INTERVAL);
    
    console.log('💓 Heartbeat démarré (toutes les 15 minutes)');
  }

  public static stopHeartbeat() {
    if (ApiService.heartbeatInterval) {
      clearInterval(ApiService.heartbeatInterval);
      ApiService.heartbeatInterval = null;
      console.log('💔 Heartbeat arrêté');
    }
  }
}

export default ApiService;