<template>
  <div class="dashboard-wrapper">
    <!-- Row 1: Section de bienvenue avec métriques du jour -->
    <div class="row welcome-row mb-4">
      <div class="col-12">
        <div class="card mb-25 border-0 rounded-0 bg-white welcome-support-desk-box">
          <!-- Top bar avec Date, Onglets des Natures de crédit et Heure bien ordonnés -->
          <div class="d-flex flex-wrap align-items-center justify-content-between px-3 py-2 border-bottom bg-light">
            <div class="d-flex align-items-center flex-wrap gap-2">
              <span class="badge bg-white text-dark border px-2.5 py-1.5 fs-12 fw-bold shadow-none">
                <i class="flaticon-calendar text-success me-1"></i> {{ currentDate }}
              </span>
              <!-- Onglets des Natures de crédit (changement fluide au clic ou automatique) -->
              <div class="d-flex align-items-center flex-wrap gap-1 ms-1">
                <button 
                  v-for="(nature, idx) in activeNatureList" 
                  :key="idx" 
                  type="button" 
                  :class="['btn btn-sm rounded-pill fw-semibold px-2.5 py-1 fs-12 transition-all', selectedNatureIndex === idx ? 'btn-success text-white shadow-sm' : 'btn-white border text-muted']"
                  @click="selectNature(idx)"
                >
                  {{ nature.libelle }}
                </button>
              </div>
            </div>
            <div>
              <span class="badge bg-white text-dark border px-2.5 py-1.5 fs-12 fw-bold shadow-none">
                <i class="flaticon-time text-primary me-1"></i> {{ currentTime }}
              </span>
            </div>
          </div>
          
          <div class="card-body p-15 p-sm-20 p-md-25 p-lg-30 letter-spacing">
            <!-- Welcome Content Statique (l'image et le conteneur ne bougent pas) -->
            <div class="row align-items-center welcome-content-row">
              <div class="col-lg-8 col-md-8">
                <div class="content">
                  <h2 class="fw-semibold mb-8 welcome-title">{{ greetingMessage }}</h2>
                  <p class="text-black-emphasis fs-md-15 fs-lg-16">
                    Synthèse financière : <strong class="text-success">{{ currentNature.libelle }}</strong>
                  </p>
                  <div class="row list justify-content-center">
                    <div class="col-lg-6 col-sm-6 mb-2 mb-sm-0">
                      <div class="p-15 bg-f2f1f9 rounded-3">
                        <span class="d-block mb-6 fw-medium text-black-emphasis fs-13 text-uppercase">{{ currentNature.capitalLabel }}</span>
                        <h4 class="mb-0 fw-black text-primary">{{ formatNumber(currentNature.totalCapital) }}</h4>
                      </div>
                    </div>
                    <div class="col-lg-6 col-sm-6">
                      <div class="p-15 bg-ecf3f2 rounded-3">
                        <span class="d-block mb-6 fw-medium text-black-emphasis fs-13 text-uppercase">PRIME ENCAISSÉE</span>
                        <h4 class="mb-0 fw-black text-success">{{ formatNumber(currentNature.totalPrime) }}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-lg-4 col-md-4 text-center mt-15 mt-md-0">
                <img src="@/assets/images/welcome/welcome2.png" alt="welcome-image">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 2: Section des métriques détaillées -->
    <div class="row metrics-row" v-if="!loading">
      <div class="col-xl-3 col-sm-6">
        <div class="card mb-25 border-0 rounded-0 bg-white stats-box">
          <div class="card-body pe-20 ps-20 pe-md-25 ps-md-25 pe-lg-15 ps-lg-15">
            <div class="d-flex align-items-center">
              <div class="icon position-relative rounded-circle text-center text-primary">
                <i class="flaticon-sterile-box"></i>
              </div>
              <div class="title ms-15">
                <span class="d-block mb-7 fs-13 text-uppercase fw-medium text-dark-emphasis">NOMBRE DE CONTRAT</span>
                <h4 class="fw-black mb-8 lh-1">{{ formatNumber(dashboardData.nombreContrats.current) }}</h4>
                <span class="fw-medium text-dark-emphasis">{{ formatNumber(dashboardData.nombreContrats.previous) }}</span>
                <span :class="['fw-bold ms-8', dashboardData.nombreContrats.percentage >= 0 ? 'text-success' : 'text-danger']">
                  {{ Math.abs(dashboardData.nombreContrats.percentage) }}% 
                  <i :class="['flaticon-' + (dashboardData.nombreContrats.percentage >= 0 ? 'up' : 'down') + '-arrow', 'fs-12 lh-1 position-relative top-1']"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-sm-6">
        <div class="card mb-25 border-0 rounded-0 bg-white stats-box">
          <div class="card-body pe-20 ps-20 pe-md-25 ps-md-25 pe-lg-15 ps-lg-15">
            <div class="d-flex align-items-center">
              <div class="icon position-relative rounded-circle text-center text-success">
                <i class="flaticon-sugar-cubes"></i>
              </div>
              <div class="title ms-15">
                <span class="d-block mb-7 fs-13 text-uppercase fw-medium text-dark-emphasis">NOMBRE DE CLIENTS</span>
                <h4 class="fw-black mb-8 lh-1">{{ formatNumber(dashboardData.nombreClients.current) }}</h4>
                <span class="fw-medium text-dark-emphasis">{{ formatNumber(dashboardData.nombreClients.previous) }}</span>
                <span :class="['fw-bold ms-8', dashboardData.nombreClients.percentage >= 0 ? 'text-success' : 'text-danger']">
                  {{ Math.abs(dashboardData.nombreClients.percentage) }}% 
                  <i :class="['flaticon-' + (dashboardData.nombreClients.percentage >= 0 ? 'up' : 'down') + '-arrow', 'fs-12 lh-1 position-relative top-1']"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-sm-6">
        <div class="card mb-25 border-0 rounded-0 bg-white stats-box">
          <div class="card-body pe-20 ps-20 pe-md-25 ps-md-25 pe-lg-15 ps-lg-15">
            <div class="d-flex align-items-center">
              <div class="icon position-relative rounded-circle text-center text-primary">
                <i class="flaticon-express-delivery"></i>
              </div>
              <div class="title ms-15">
                <span class="d-block mb-7 fs-13 text-uppercase fw-medium text-dark-emphasis">NOMBRE D'AGENCES</span>
                <h4 class="fw-black mb-8 lh-1">{{ formatNumber(dashboardData.nombreAgences.current) }}</h4>
                <span class="fw-medium text-dark-emphasis">{{ formatNumber(dashboardData.nombreAgences.previous) }}</span>
                <span :class="['fw-bold ms-8', dashboardData.nombreAgences.percentage >= 0 ? 'text-success' : 'text-danger']">
                  {{ Math.abs(dashboardData.nombreAgences.percentage) }}% 
                  <i :class="['flaticon-' + (dashboardData.nombreAgences.percentage >= 0 ? 'up' : 'down') + '-arrow', 'fs-12 lh-1 position-relative top-1']"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-sm-6">
        <div class="card mb-25 border-0 rounded-0 bg-white stats-box">
          <div class="card-body pe-20 ps-20 pe-md-25 ps-md-25 pe-lg-15 ps-lg-15">
            <div class="d-flex align-items-center">
              <div class="icon position-relative rounded-circle text-center text-success">
                <i class="flaticon-compare"></i>
              </div>
              <div class="title ms-15">
                <span class="d-block mb-7 fs-13 text-uppercase fw-medium text-dark-emphasis">NOMBRE D'UTILISATEURS</span>
                <h4 class="fw-black mb-8 lh-1">{{ formatNumber(dashboardData.nombreUtilisateurs.current) }}</h4>
                <span class="fw-medium text-dark-emphasis">{{ formatNumber(dashboardData.nombreUtilisateurs.previous) }}</span>
                <span :class="['fw-bold ms-8', dashboardData.nombreUtilisateurs.percentage >= 0 ? 'text-success' : 'text-danger']">
                  {{ Math.abs(dashboardData.nombreUtilisateurs.percentage) }}% 
                  <i :class="['flaticon-' + (dashboardData.nombreUtilisateurs.percentage >= 0 ? 'up' : 'down') + '-arrow', 'fs-12 lh-1 position-relative top-1']"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 3: Tableau Récapitulatif par Nature de Crédit (Design Épuré & Professionnel) -->
    <div class="row mb-25" v-if="!loading && activeNatureList && activeNatureList.length > 0">
      <div class="col-12">
        <div class="card border-0 rounded-0 bg-white">
          <div class="card-body p-15 p-sm-20 p-md-25 p-lg-30 letter-spacing">
            <div class="mb-20 d-sm-flex align-items-center justify-content-between">
              <h6 class="card-title fw-bold mb-0 fs-16 text-dark">
                Statistiques par Nature de Crédit
              </h6>
            </div>

            <div class="table-responsive">
              <table class="table text-nowrap align-middle mb-0">
                <thead>
                  <tr class="border-bottom">
                    <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-12 ps-0">Nature de Crédit</th>
                    <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-12 text-center">Total Contrats</th>
                    <th scope="col" class="text-uppercase fw-semibold shadow-none text-success fs-12 text-end">En Cours (Nombre)</th>
                    <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-12 text-end">Capital en Cours</th>
                    <th scope="col" class="text-uppercase fw-semibold shadow-none text-success fs-12 text-end">Prime en Cours</th>
                    <th scope="col" class="text-uppercase fw-semibold shadow-none text-secondary fs-12 text-end">Échus (Nombre)</th>
                    <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-12 text-end">Capital Échu</th>
                    <th scope="col" class="text-uppercase fw-semibold shadow-none text-secondary fs-12 text-end pe-0">Prime Échue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(nature, idx) in activeNatureList" :key="idx" class="border-bottom">
                    <!-- Nature -->
                    <td class="shadow-none py-3 ps-0">
                      <span class="fw-bold text-dark fs-14">{{ nature.libelle }}</span>
                    </td>

                    <!-- Total Contrats -->
                    <td class="shadow-none py-3 text-center">
                      <span class="badge bg-light text-dark border fw-bold fs-12 px-2.5 py-1">
                        {{ formatNumber((nature.nombreEnCours || 0) + (nature.nombreEchu || 0)) }}
                      </span>
                    </td>

                    <!-- En Cours : Nombre -->
                    <td class="shadow-none py-3 text-end fw-bold text-success fs-13">
                      {{ formatNumber(nature.nombreEnCours || 0) }}
                    </td>

                    <!-- En Cours : Capital -->
                    <td class="shadow-none py-3 text-end fw-bold text-dark fs-13">
                      {{ formatCurrency(nature.capitalEnCours || 0) }} <small class="text-muted fw-normal">F</small>
                    </td>

                    <!-- En Cours : Prime -->
                    <td class="shadow-none py-3 text-end fw-bold text-success fs-13">
                      {{ formatCurrency(nature.primeEnCours || 0) }} <small class="text-muted fw-normal">F</small>
                    </td>

                    <!-- Échus : Nombre -->
                    <td class="shadow-none py-3 text-end fw-medium text-secondary fs-13">
                      {{ formatNumber(nature.nombreEchu || 0) }}
                    </td>

                    <!-- Échus : Capital -->
                    <td class="shadow-none py-3 text-end fw-medium text-body-tertiary fs-13">
                      {{ formatCurrency(nature.capitalEchu || 0) }} <small class="text-muted fw-normal">F</small>
                    </td>

                    <!-- Échus : Prime -->
                    <td class="shadow-none py-3 text-end fw-medium text-secondary fs-13 pe-0">
                      {{ formatCurrency(nature.primeEchu || 0) }} <small class="text-muted fw-normal">F</small>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>


    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
      <p>Chargement des données...</p>
    </div>
  </div>
</template>

<script>
import ApiService from "@/services/ApiService";
import { useAuthStore } from "@/services/auth";

export default {
  name: "WelcomeDashboard",
  data() {
    return {
      userName: "Utilisateur",
      userInfo: null,
      loading: true,
      error: null,
      currentTime: "",
      currentDate: "",
      timeInterval: null,
      dashboardData: {
        nombreContrats: { current: 0, previous: 0, percentage: 0 },
        primeEncaisee: { current: 0, previous: 0, percentage: 0 },
        capitalPrete: { current: 0, previous: 0, percentage: 0 },
        nombreClients: { current: 0, previous: 0, percentage: 0 },
        nombreAgences: { current: 0, previous: 0, percentage: 0 },
        nombreUtilisateurs: { current: 0, previous: 0, percentage: 0 }
      },
      welcomeTotals: {
        totalCapital: 0,
        totalPrime: 0,
        byNature: []
      },
      selectedNatureIndex: 0,
      natureRotationInterval: null
    };
  },
  async mounted() {
    await this.loadUserProfile();
    await this.loadDashboardData();
    await this.loadWelcomeTotals();
    this.updateTime();
    this.timeInterval = setInterval(this.updateTime, 1000);
    this.startNatureRotation();
    // Mettre à jour la date une fois par jour
    setInterval(() => {
      const now = new Date();
      this.currentDate = now.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }, 60000); // Vérifier chaque minute
  },
  beforeUnmount() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    if (this.natureRotationInterval) {
      clearInterval(this.natureRotationInterval);
    }
  },
  computed: {
    activeNatureList() {
      const byNature = this.welcomeTotals.byNature || [];
      if (Array.isArray(byNature) && byNature.length > 0) {
        return byNature;
      }
      return [
        {
          idNatureCredit: 1,
          code: 'AMORT',
          libelle: 'Crédit Amortissable',
          capitalLabel: 'CAPITAL PRÊTÉ',
          totalCapital: this.welcomeTotals.totalCapital || 0,
          totalPrime: this.welcomeTotals.totalPrime || 0,
          nombreEnCours: 0,
          nombreEchu: 0,
          capitalEnCours: 0,
          capitalEchu: 0,
          primeEnCours: 0,
          primeEchu: 0
        },
        {
          idNatureCredit: 2,
          code: 'CONST',
          libelle: 'Capital Constant',
          capitalLabel: 'CAPITAL GARANTI',
          totalCapital: 0,
          totalPrime: 0,
          nombreEnCours: 0,
          nombreEchu: 0,
          capitalEnCours: 0,
          capitalEchu: 0,
          primeEnCours: 0,
          primeEchu: 0
        }
      ];
    },
    currentNature() {
      const list = this.activeNatureList;
      if (!list || list.length === 0) {
        return {
          libelle: 'Toutes les Natures',
          capitalLabel: 'CAPITAL PRÊTÉ',
          totalCapital: 0,
          totalPrime: 0
        };
      }
      const safeIndex = this.selectedNatureIndex % list.length;
      return list[safeIndex];
    },
    greetingMessage() {
      const hour = new Date().getHours();
      const name = this.userName.toUpperCase();
      const emojis = {
        morning: '☀️',
        afternoon: '🌤️',
        evening: '🌙',
        night: '🌃'
      };

      let greeting = '';
      let emoji = '';
      
      if (hour >= 5 && hour < 12) {
        greeting = `Bonjour ${name} !`;
        emoji = emojis.morning;
      } else if (hour >= 12 && hour < 17) {
        greeting = `Bon après-midi ${name} !`;
        emoji = emojis.afternoon;
      } else if (hour >= 17 && hour < 21) {
        greeting = `Bonsoir ${name} !`;
        emoji = emojis.evening;
      } else {
        greeting = `Bonne soirée ${name} !`;
        emoji = emojis.night;
      }
      
      return `${greeting} ${emoji}`;
    }
  },
  methods: {
    startNatureRotation() {
      if (this.natureRotationInterval) {
        clearInterval(this.natureRotationInterval);
      }
      this.natureRotationInterval = setInterval(() => {
        if (this.activeNatureList && this.activeNatureList.length > 0) {
          this.selectedNatureIndex = (this.selectedNatureIndex + 1) % this.activeNatureList.length;
        }
      }, 7000);
    },
    selectNature(idx) {
      this.selectedNatureIndex = idx;
      this.startNatureRotation(); // Relancer le timer pour une meilleure expérience
    },
    updateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      this.currentDate = now.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    },
    async loadDashboardData() {
      try {
        this.loading = true;
        //console.log('📊 Chargement des données du dashboard...');
        
        // Ajouter un timeout pour éviter le chargement infini
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        );
        
        console.log('📡 Appel API /dashboard/widgets...');
        
        const apiPromise = ApiService.get('/dashboard/widgets')
          .then(response => {
            console.log('✅ Promesse résolue avec succès');
            console.log('📊 Réponse complète:', response);
            console.log('📊 response.data:', response.data);
            console.log('📊 response.status:', response.status);
            return response;
          })
          .catch(error => {
            console.error('❌ Erreur dans la promesse API:', error);
            throw error;
          });
        
        const response = await Promise.race([apiPromise, timeoutPromise]);
        console.log('✅ Réponse après Promise.race:', response);
        console.log('📊 response.data:', response.data);
        console.log('📊 response.data.data:', response.data?.data);
        console.log('📊 response.status:', response.status);
        
        // Gérer différentes structures de réponse
        let data = null;
        console.log('🔍 Analyse de la structure de réponse...');
        console.log('🔍 response.data:', response.data);
        console.log('🔍 response.data?.data:', response.data?.data);
        console.log('🔍 response.data?.data?.data:', response.data?.data?.data);
        
        // Structure: { code: 200, message: '...', data: { message: '...', data: {...} } }
        if (response.data?.data?.data) {
          // Les vraies données sont dans response.data.data.data
          data = response.data.data.data;
          console.log('✅ Structure détectée: { data: { data: { data: {...} } } }');
        } else if (response.data?.data && typeof response.data.data === 'object' && !response.data.data.message) {
          // Structure: { data: { ... } } (sans message)
          data = response.data.data;
          console.log('✅ Structure détectée: { data: {...} }');
        } else if (response.data && typeof response.data === 'object' && !response.data.message) {
          // Structure: { ... } (données directement)
          data = response.data;
          console.log('✅ Structure détectée: { ... }');
        } else {
          console.warn('⚠️ Aucune structure de données reconnue');
        }
        
        console.log('🔍 Données extraites:', data);
        console.log('🔍 Type de data:', typeof data);
        console.log('🔍 data est null/undefined?', data === null || data === undefined);
        if (data) {
          console.log('🔍 Clés de data:', Object.keys(data));
          console.log('🔍 data.nombreContrats:', data.nombreContrats);
        }
        
        if (data && typeof data === 'object') {
          // Fusionner les données avec les valeurs par défaut pour éviter les erreurs
          this.dashboardData = {
            nombreContrats: {
              current: data.nombreContrats?.current ?? 0,
              previous: data.nombreContrats?.previous ?? 0,
              percentage: data.nombreContrats?.percentage ?? 0
            },
            primeEncaisee: {
              current: data.primeEncaisee?.current ?? 0,
              previous: data.primeEncaisee?.previous ?? 0,
              percentage: data.primeEncaisee?.percentage ?? 0
            },
            capitalPrete: {
              current: data.capitalPrete?.current ?? 0,
              previous: data.capitalPrete?.previous ?? 0,
              percentage: data.capitalPrete?.percentage ?? 0
            },
            nombreClients: {
              current: data.nombreClients?.current ?? 0,
              previous: data.nombreClients?.previous ?? 0,
              percentage: data.nombreClients?.percentage ?? 0
            },
            nombreAgences: {
              current: data.nombreAgences?.current ?? 0,
              previous: data.nombreAgences?.previous ?? 0,
              percentage: data.nombreAgences?.percentage ?? 0
            },
            nombreUtilisateurs: {
              current: data.nombreUtilisateurs?.current ?? 0,
              previous: data.nombreUtilisateurs?.previous ?? 0,
              percentage: data.nombreUtilisateurs?.percentage ?? 0
            }
          };
          //console.log('✅ Données du dashboard chargées:', this.dashboardData);
          
          // Forcer la mise à jour de l'interface
          this.$nextTick(() => {
            //console.log('🔄 Interface mise à jour avec les nouvelles données');
          });
        } else {
          //console.warn('⚠️ Aucune donnée trouvée dans la réponse');
          // Utiliser des données de démonstration en cas d'échec
          this.loadDemoData();
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données du dashboard:', error);
        console.error('❌ Détails de l\'erreur:', {
          message: error?.message,
          response: error?.response,
          status: error?.response?.status,
          data: error?.response?.data,
          stack: error?.stack
        });
        this.error = error?.response?.data?.message || error?.message || 'Erreur lors du chargement des données';
        // Charger des données de démonstration en cas d'erreur
        this.loadDemoData();
      } finally {
        this.loading = false;
      }
    },
    async loadWelcomeTotals() {
      try {
        console.log('📡 Appel API /dashboard/welcome-totals...');
        const response = await ApiService.get('/dashboard/welcome-totals');
        console.log('✅ Réponse welcome-totals:', response);
        console.log('📊 response.data:', response.data);
        console.log('📊 response.data?.data:', response.data?.data);
        console.log('📊 response.data?.data?.data:', response.data?.data?.data);
        
        // Gérer différentes structures de réponse
        // Structure attendue: { code: 200, message: '...', data: { message: '...', data: {...} } }
        let data = null;
        
        if (response.data?.data?.data) {
          // Les vraies données sont dans response.data.data.data
          data = response.data.data.data;
          console.log('✅ Structure détectée: { data: { data: { data: {...} } } }');
        } else if (response.data?.data && typeof response.data.data === 'object') {
          // Vérifier si c'est directement les données ou encore un wrapper
          if (response.data.data.totalCapital !== undefined || response.data.data.totalPrime !== undefined) {
            // C'est directement les données
            data = response.data.data;
            console.log('✅ Structure détectée: { data: {...} } (données directes)');
          } else if (response.data.data.data) {
            // Encore un niveau d'imbrication
            data = response.data.data.data;
            console.log('✅ Structure détectée: { data: { data: {...} } }');
          }
        } else if (response.data && typeof response.data === 'object') {
          // Structure: { ... } (données directement)
          data = response.data;
          console.log('✅ Structure détectée: { ... }');
        }
        
        console.log('🔍 Données extraites pour welcome-totals:', data);
        if (data) {
          console.log('🔍 data.totalCapital:', data.totalCapital);
          console.log('🔍 data.totalPrime:', data.totalPrime);
        }
        
        if (data && typeof data === 'object') {
          this.welcomeTotals = {
            totalCapital: data.totalCapital ?? 0,
            totalPrime: data.totalPrime ?? 0,
            byNature: Array.isArray(data.byNature) ? data.byNature : []
          };
          console.log('✅ welcomeTotals mis à jour:', this.welcomeTotals);
        } else {
          console.warn('⚠️ Aucune donnée valide trouvée pour welcome-totals');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des totaux welcome:', error);
        console.error('❌ Détails de l\'erreur:', {
          message: error?.message,
          response: error?.response,
          status: error?.response?.status,
          data: error?.response?.data
        });
        // En cas d'erreur, on garde les valeurs par défaut (0)
      }
    },
    loadDemoData() {
      //console.log('🔄 Chargement des données de démonstration...');
      this.dashboardData = {
        nombreContrats: { current: 10, previous: 0, percentage: 100 },
        primeEncaisee: { current: 1018505, previous: 0, percentage: 100 },
        capitalPrete: { current: 78825000, previous: 0, percentage: 100 },
        nombreClients: { current: 16, previous: 0, percentage: 100 },
        nombreAgences: { current: 2, previous: 2, percentage: 0 },
        nombreUtilisateurs: { current: 3, previous: 0, percentage: 100 }
      };
      //console.log('✅ Données de démonstration chargées:', this.dashboardData);
    },
    formatNumber(value) {
      if (value === null || value === undefined || isNaN(value)) {
        return '0';
      }
      return new Intl.NumberFormat('fr-FR').format(value).replace(/[\u00A0\u202F]/g, ' ');
    },
    formatCurrency(value) {
      if (value === null || value === undefined || isNaN(value)) {
        return '0';
      }
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0
      }).format(value).replace(/[\u00A0\u202F]/g, ' ');
    },
    getChangeClass(percentage) {
      if (percentage > 0) return 'positive';
      if (percentage < 0) return 'negative';
      return 'neutral';
    },
    async loadUserProfile() {
      try {
        this.loading = true;
        
        // Utiliser le store d'authentification au lieu du localStorage
        const authStore = useAuthStore();
        
        // Si l'utilisateur est déjà dans le store, l'utiliser
        if (authStore.user && authStore.user.firstname) {
          this.userName = authStore.user.firstname;
          this.userInfo = authStore.user;
          this.loading = false;
          return;
        }
        
        // Sinon, récupérer depuis l'API
        if (!ApiService || typeof ApiService.get !== 'function') {
          console.error('ApiService n\'est pas disponible');
          this.userName = 'Utilisateur';
          this.loading = false;
          return;
        }
        
        // Utiliser la méthode get existante
        const response = await ApiService.get('/auth/profile');
        
        // Adapter à la structure de réponse de l'API
        if (response && response.data && response.data.data && response.data.data.user) {
          this.userInfo = response.data.data.user;
          // Utiliser seulement le prénom
          this.userName = this.userInfo.firstname || 'Utilisateur';
          // Le store sera mis à jour automatiquement par verifyAuth()
        } else {
          console.warn('⚠️ Aucune donnée utilisateur dans la réponse');
          this.userName = 'Utilisateur';
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement du profil utilisateur:', error);
        this.error = 'Impossible de charger les informations utilisateur';
        this.userName = 'Utilisateur';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.dashboard-wrapper {
  margin-bottom: 1.5rem;
}

.welcome-row {
  margin-bottom: 1.5rem;
}

.metrics-row {
  margin-bottom: 0;
}

/* Styles pour les widgets de bienvenue */
.bg-f2f1f9 {
  background-color: #f2f1f9;
}

.bg-faf7f7 {
  background-color: #faf7f7;
}

.bg-ecf3f2 {
  background-color: #ecf3f2;
}

.welcome-support-desk-box {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.welcome-support-desk-box .card-body {
  padding-top: 3rem !important;
}

@media (min-width: 576px) {
  .welcome-support-desk-box .card-body {
    padding-top: 2.5rem !important;
  }
}

@media (min-width: 768px) {
  .welcome-support-desk-box .card-body {
    padding-top: 2rem !important;
  }
}

@media (min-width: 992px) {
  .welcome-support-desk-box .card-body {
    padding-top: 1.5rem !important;
  }
}

@media (min-width: 1200px) {
  .welcome-support-desk-box .card-body {
    padding-top: 1rem !important;
  }
}

.welcome-support-desk-box img {
  max-width: 100%;
  height: 180px !important;
  object-fit: contain;
}

/* Styles de la rangée de bienvenue */
.welcome-content-row {
  margin-top: 0;
  padding-top: 0;
}

.welcome-title {
  margin-top: 0;
  padding-top: 0;
}

/* Ajustement pour petits écrans */
@media (max-width: 768px) {
  .welcome-content-row {
    margin-top: 2.5rem !important;
  }
  
  .welcome-title {
    margin-top: 0.5rem;
    font-size: 1.5rem;
  }
  
  .welcome-date,
  .welcome-time {
    font-size: 0.85rem;
    padding: 0.4rem 0.8rem;
  }
}

/* Ajustement pour écrans moyens */
@media (min-width: 769px) and (max-width: 1024px) {
  .welcome-content-row {
    margin-top: 2rem;
  }
}

/* Ajustement pour grands écrans */
@media (min-width: 1025px) {
  .welcome-content-row {
    margin-top: 0;
  }
}


/* Indicateur de chargement */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #33b04a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.carousel-indicators-dots {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 15;
}

.carousel-indicators-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #dee2e6;
  cursor: pointer;
  transition: all 0.3s ease;
}

.carousel-indicators-dots .dot.active {
  background-color: #33b04a;
  width: 24px;
  border-radius: 4px;
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-in-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

</style>
