<template>
  <div>
    <div class="card mb-25 border-0 rounded-0 bg-white letter-spacing">
      <!-- En-tête de la carte -->

      <!-- Indicateur de chargement -->
      <div v-if="loading" class="text-center p-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
      </div>

      <div v-if="!loading" class="card-body p-15 p-sm-20 p-md-25">
        <!-- Navigation des onglets -->
        <ul class="nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-6 mb-4">
          <li class="nav-item">
            <a 
              class="nav-link text-active-primary pb-4"
              :class="{ active: activeTab === 'infos' }"
              @click="activeTab = 'infos'">
              <i class="flaticon-user me-2"></i>
              Informations
            </a>
          </li>
          <li class="nav-item">
            <a 
              class="nav-link text-active-primary pb-4"
              :class="{ active: activeTab === 'securite' }"
              @click="activeTab = 'securite'">
              <i class="flaticon-lock me-2"></i>
              Sécurité
            </a>
          </li>
          <li class="nav-item">
            <a 
              class="nav-link text-active-primary pb-4"
              :class="{ active: activeTab === 'statistiques' }"
              @click="activeTab = 'statistiques'">
              <i class="flaticon-chart me-2"></i>
              Statistiques
            </a>
          </li>
          <li class="nav-item">
            <a 
              class="nav-link text-active-primary pb-4"
              :class="{ active: activeTab === 'contrats' }"
              @click="activeTab = 'contrats'; loadUserContrats()">
              <i class="flaticon-file me-2"></i>
              Contrats &amp; Cotations
              <span v-if="userContratsTotal > 0" class="badge bg-primary ms-1" style="font-size:0.7rem;">{{ userContratsTotal }}</span>
            </a>
          </li>
        </ul>
  
              <!-- Contenu des onglets -->
              
        <!-- Contenu des onglets -->
        
        <!-- Onglet Informations -->
        <div v-if="activeTab === 'infos'" class="px-3">
          <!-- Photo de profil et informations de base -->
          <div class="row mb-4">
            <div class="col-md-4 text-center">
              <div class="position-relative d-inline-block mb-4">
                <div 
                  v-if="!user.avatar || user.avatar === '/assets/images/admin.jpg'"
                  class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                  style="width: 140px; height: 140px; background: linear-gradient(135deg, #33b04a 0%, #28a745 100%); font-size: 3rem;">
                  {{ getInitials(user.prenom, user.nom) }}
                </div>
                <img 
                  v-else
                  :src="user.avatar" 
                  alt="Photo"
                  class="rounded-circle shadow-sm"
                  style="width: 140px; height: 140px; object-fit: cover;">
              </div>
              <h4 class="fw-bold mb-2 text-dark">{{ user.prenom }} {{ user.nom }}</h4>
              <p class="text-muted mb-2 fs-6">{{ user.email }}</p>
              <p class="text-primary mb-3 fs-6 fw-semibold">
                <i class="flaticon-office me-1"></i>
                {{ userAgency.name || 'Agence non définie' }}
              </p>
              <span class="badge bg-warning text-dark px-3 py-2 fs-6">
                {{ user.role }}
              </span>
            </div>
            <div class="col-md-8">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="mb-0 text-dark">
                  <i class="flaticon-user text-primary me-2"></i>
                  Informations personnelles
                </h5>
                <button 
                  class="btn btn-warning fw-medium px-4 py-2"
                  @click="editMode.personal = !editMode.personal">
                  <i class="flaticon-edit me-2"></i>
                  {{ editMode.personal ? 'Annuler' : 'Modifier' }}
                </button>
              </div>
  
                    <form v-if="editMode.personal" @submit.prevent="updateProfile">
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label class="form-label fw-bold">Prénom</label>
                          <input 
                            type="text" 
                            class="form-control" 
                            v-model="profileForm.prenom"
                            required>
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label fw-bold">Nom</label>
                          <input 
                            type="text" 
                            class="form-control" 
                            v-model="profileForm.nom"
                            required>
                        </div>
                      </div>
  
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label class="form-label fw-bold">Email</label>
                          <input 
                            type="email" 
                            class="form-control" 
                            v-model="profileForm.email"
                            required>
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label fw-bold">Téléphone</label>
                          <input 
                            type="tel" 
                            class="form-control" 
                            v-model="profileForm.telephone">
                        </div>
                      </div>
  
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label class="form-label fw-bold">Date de naissance</label>
                          <input 
                            type="date" 
                            class="form-control" 
                            v-model="profileForm.dateNaissance">
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label fw-bold">Genre</label>
                          <select class="form-select" v-model="profileForm.genre">
                            <option value="">Sélectionner...</option>
                            <option value="M">Masculin</option>
                            <option value="F">Féminin</option>
                          </select>
                        </div>
                      </div>
  
                      <div class="mb-3">
                        <label class="form-label fw-bold">Adresse</label>
                        <textarea 
                          class="form-control" 
                          rows="2" 
                          v-model="profileForm.adresse"></textarea>
                      </div>
  
                      <div class="mb-3">
                        <label class="form-label fw-bold">Fonction</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          v-model="profileForm.fonction">
                      </div>
  
                      <div class="d-flex gap-2">
                        <button 
                          type="submit" 
                          class="btn"
                          style="background-color: #33b04a; color: #231f20;"
                          :disabled="loading">
                          <i class="flaticon-save me-2"></i>
                          {{ loading ? 'Sauvegarde...' : 'Sauvegarder' }}
                        </button>
                        <button 
                          type="button" 
                          class="btn btn-secondary"
                          @click="editMode.personal = false">
                          Annuler
                        </button>
                      </div>
                    </form>
  
                    <div v-else class="row g-3">
                      <div class="col-md-6">
                        <div class="card border-0 bg-light h-100">
                          <div class="card-body p-3">
                            <label class="form-label fw-bold text-muted small mb-1">Prénom</label>
                            <p class="mb-0 fw-semibold text-dark">{{ user.prenom || 'Non renseigné' }}</p>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="card border-0 bg-light h-100">
                          <div class="card-body p-3">
                            <label class="form-label fw-bold text-muted small mb-1">Nom</label>
                            <p class="mb-0 fw-semibold text-dark">{{ user.nom || 'Non renseigné' }}</p>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="card border-0 bg-light h-100">
                          <div class="card-body p-3">
                            <label class="form-label fw-bold text-muted small mb-1">Email</label>
                            <p class="mb-0 fw-semibold text-dark">{{ user.email || 'Non renseigné' }}</p>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="card border-0 bg-light h-100">
                          <div class="card-body p-3">
                            <label class="form-label fw-bold text-muted small mb-1">Téléphone</label>
                            <p class="mb-0 fw-semibold text-dark">{{ user.telephone || 'Non renseigné' }}</p>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="card border-0 bg-light h-100">
                          <div class="card-body p-3">
                            <label class="form-label fw-bold text-muted small mb-1">Date de naissance</label>
                            <p class="mb-0 fw-semibold text-dark">{{ formatDate(user.dateNaissance) || 'Non renseigné' }}</p>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="card border-0 bg-light h-100">
                          <div class="card-body p-3">
                            <label class="form-label fw-bold text-muted small mb-1">Genre</label>
                            <p class="mb-0 fw-semibold text-dark">{{ user.genre === 'M' ? 'Masculin' : user.genre === 'F' ? 'Féminin' : 'Non renseigné' }}</p>
                          </div>
                        </div>
                      </div>
                      <div class="col-12">
                        <div class="card border-0 bg-light h-100">
                          <div class="card-body p-3">
                            <label class="form-label fw-bold text-muted small mb-1">Adresse</label>
                            <p class="mb-0 fw-semibold text-dark">{{ user.adresse || 'Non renseigné' }}</p>
                          </div>
                        </div>
                      </div>
                      <div class="col-12">
                        <div class="card border-0 bg-light h-100">
                          <div class="card-body p-3">
                            <label class="form-label fw-bold text-muted small mb-1">Fonction</label>
                            <p class="mb-0 fw-semibold text-dark">{{ user.fonction || 'Non renseigné' }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
  
              <!-- Informations de base -->
              <div class="row mt-4">
                <div class="col-md-6">
                  <div class="card border-0 bg-light h-100">
                    <div class="card-body p-3 text-center">
                      <label class="form-label fw-bold text-muted small mb-2">Statut du compte</label>
                      <div class="d-flex justify-content-center">
                        <span class="badge px-3 py-2 fs-6" :class="getStatusBadgeClass(user.status)">
                          {{ getStatusText(user.status) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card border-0 bg-light h-100">
                    <div class="card-body p-3 text-center">
                      <label class="form-label fw-bold text-muted small mb-2">Dernière connexion</label>
                      <p class="mb-0 fw-semibold text-dark">{{ lastLoginFormatted }}</p>
                    </div>
                  </div>
                </div>
              </div>
              </div>
        </div>

        <!-- Onglet Sécurité -->
        <div v-if="activeTab === 'securite'" class="px-3">
          <!-- Changement de mot de passe -->
          <div class="card shadow-sm mb-4">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="mb-0">
                  <i class="flaticon-lock text-warning me-2"></i>
                  Changement de mot de passe
                </h5>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge" :class="passwordStrength.color ? `bg-${passwordStrength.color}` : 'bg-secondary'">
                    {{ passwordStrength.text || 'Aucun mot de passe' }}
                  </span>
                </div>
              </div>

                    <form @submit.prevent="updatePassword">
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label class="form-label fw-bold">Mot de passe actuel</label>
                          <div class="input-group">
                            <input 
                              :type="showCurrentPassword ? 'text' : 'password'" 
                              class="form-control" 
                              v-model="passwordForm.current_password"
                              placeholder="Saisissez votre mot de passe actuel"
                              required>
                            <button 
                              type="button" 
                              class="btn btn-outline-secondary"
                              @click="showCurrentPassword = !showCurrentPassword">
                              <i :class="showCurrentPassword ? 'flaticon-eye-slash' : 'flaticon-eye'"></i>
                            </button>
                          </div>
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label fw-bold">Nouveau mot de passe</label>
                          <div class="input-group">
                            <input 
                              :type="showNewPassword ? 'text' : 'password'" 
                              class="form-control" 
                              v-model="passwordForm.new_password"
                              placeholder="Nouveau mot de passe"
                              @input="checkPasswordStrength"
                              required>
                            <button 
                              type="button" 
                              class="btn btn-outline-secondary"
                              @click="showNewPassword = !showNewPassword">
                              <i :class="showNewPassword ? 'flaticon-eye-slash' : 'flaticon-eye'"></i>
                            </button>
                          </div>
                          
                          <!-- Indicateur de force du mot de passe -->
                          <div v-if="passwordForm.new_password" class="mt-2">
                            <div class="progress" style="height: 8px;">
                              <div 
                                class="progress-bar"
                                :class="`bg-${passwordStrength.color}`"
                                :style="{ width: (passwordStrength.score * 20) + '%' }">
                              </div>
                            </div>
                            <small class="text-muted mt-1">
                              Force: {{ passwordStrength.text }}
                            </small>
                          </div>
                        </div>
                      </div>

                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label class="form-label fw-bold">Confirmer le nouveau mot de passe</label>
                          <div class="input-group">
                            <input 
                              :type="showConfirmPassword ? 'text' : 'password'" 
                              class="form-control" 
                              v-model="passwordForm.confirm_password"
                              placeholder="Confirmez le nouveau mot de passe"
                              :class="{ 'is-invalid': passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password }"
                              required>
                            <button 
                              type="button" 
                              class="btn btn-outline-secondary"
                              @click="showConfirmPassword = !showConfirmPassword">
                              <i :class="showConfirmPassword ? 'flaticon-eye-slash' : 'flaticon-eye'"></i>
                            </button>
                          </div>
                          <div v-if="passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password" 
                               class="invalid-feedback">
                            Les mots de passe ne correspondent pas
                          </div>
                        </div>
                        <div class="col-md-6 mb-3">
                          <!-- Critères de sécurité -->
                          <label class="form-label fw-bold">Critères de sécurité</label>
                          <div class="small">
                            <div class="d-flex align-items-center mb-1">
                              <i :class="passwordCriteria.length ? 'flaticon-check text-success' : 'flaticon-close text-danger'" class="me-2"></i>
                              <span :class="passwordCriteria.length ? 'text-success' : 'text-muted'">
                                Au moins 8 caractères
                              </span>
                            </div>
                            <div class="d-flex align-items-center mb-1">
                              <i :class="passwordCriteria.lowercase ? 'flaticon-check text-success' : 'flaticon-close text-danger'" class="me-2"></i>
                              <span :class="passwordCriteria.lowercase ? 'text-success' : 'text-muted'">
                                Une lettre minuscule
                              </span>
                            </div>
                            <div class="d-flex align-items-center mb-1">
                              <i :class="passwordCriteria.uppercase ? 'flaticon-check text-success' : 'flaticon-close text-danger'" class="me-2"></i>
                              <span :class="passwordCriteria.uppercase ? 'text-success' : 'text-muted'">
                                Une lettre majuscule
                              </span>
                            </div>
                            <div class="d-flex align-items-center mb-1">
                              <i :class="passwordCriteria.number ? 'flaticon-check text-success' : 'flaticon-close text-danger'" class="me-2"></i>
                              <span :class="passwordCriteria.number ? 'text-success' : 'text-muted'">
                                Un chiffre
                              </span>
                            </div>
                            <div class="d-flex align-items-center">
                              <i :class="passwordCriteria.special ? 'flaticon-check text-success' : 'flaticon-close text-danger'" class="me-2"></i>
                              <span :class="passwordCriteria.special ? 'text-success' : 'text-muted'">
                                Un caractère spécial
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="d-flex gap-2">
                        <button 
                          type="submit" 
                          class="btn"
                          style="background-color: #33b04a; color: #231f20;"
                          :disabled="!isPasswordFormValid || loading">
                          <i class="flaticon-key me-2"></i>
                          {{ loading ? 'Changement...' : 'Changer le mot de passe' }}
                        </button>
                        <button 
                          type="button" 
                          class="btn btn-secondary"
                          @click="resetPasswordForm">
                          <i class="flaticon-refresh me-2"></i>
                          Réinitialiser
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

        </div>

        <!-- Onglet Statistiques -->
        <div v-if="activeTab === 'statistiques'" class="px-3">
          <!-- Statistiques générales -->
          <div class="row mb-4">
            <div class="col-md-3 mb-3">
              <div class="card bg-primary text-white">
                <div class="card-body text-center">
                  <i class="flaticon-file flaticon-2x mb-2"></i>
                  <h4 class="mb-1">{{ userStats.totalContracts || 0 }}</h4>
                  <p class="mb-0">Contrats totaux</p>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card bg-success text-white">
                <div class="card-body text-center">
                  <i class="flaticon-money flaticon-2x mb-2"></i>
                  <h4 class="mb-1">{{ formatCurrency(userStats.totalPrimes || 0) }}</h4>
                  <p class="mb-0">Total des primes</p>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card bg-warning text-white">
                <div class="card-body text-center">
                  <i class="flaticon-bank flaticon-2x mb-2"></i>
                  <h4 class="mb-1">{{ formatCurrency(userStats.totalCapital || 0) }}</h4>
                  <p class="mb-0">Capital prêté</p>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card bg-info text-white">
                <div class="card-body text-center">
                  <i class="flaticon-calculator flaticon-2x mb-2"></i>
                  <h4 class="mb-1">{{ userStats.totalCotations || 0 }}</h4>
                  <p class="mb-0">Cotations effectuées</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistiques détaillées -->
          <div class="row">
            <!-- Contrats par statut -->
            <div class="col-md-6 mb-4">
              <div class="card">
                <div class="card-header">
                  <h5 class="mb-0">
                    <i class="flaticon-chart me-2"></i>
                    Répartition des contrats
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-6 mb-3">
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted">Actifs</span>
                        <span class="badge bg-success">{{ userStats.activeContracts || 0 }}</span>
                      </div>
                    </div>
                    <div class="col-6 mb-3">
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted">En attente</span>
                        <span class="badge bg-warning">{{ userStats.pendingContracts || 0 }}</span>
                      </div>
                    </div>
                    <div class="col-6 mb-3">
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted">Suspendus</span>
                        <span class="badge bg-danger">{{ userStats.suspendedContracts || 0 }}</span>
                      </div>
                    </div>
                    <div class="col-6 mb-3">
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted">Annulés</span>
                        <span class="badge bg-secondary">{{ userStats.cancelledContracts || 0 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Performance mensuelle -->
            <div class="col-md-6 mb-4">
              <div class="card">
                <div class="card-header">
                  <h5 class="mb-0">
                    <i class="flaticon-calendar me-2"></i>
                    Performance du mois
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-12 mb-3">
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted">Contrats ce mois</span>
                        <span class="fw-bold">{{ userStats.monthlyContracts || 0 }}</span>
                      </div>
                      <div class="progress mt-1" style="height: 8px;">
                        <div class="progress-bar bg-primary" :style="{ width: getProgressPercentage(userStats.monthlyContracts || 0, userStats.monthlyTarget || 20) + '%' }"></div>
                      </div>
                    </div>
                    <div class="col-12 mb-3">
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted">Primes ce mois</span>
                        <span class="fw-bold">{{ formatCurrency(userStats.monthlyPrimes || 0) }}</span>
                      </div>
                      <div class="progress mt-1" style="height: 8px;">
                        <div class="progress-bar bg-success" :style="{ width: getProgressPercentage(userStats.monthlyPrimes || 0, userStats.monthlyPrimesTarget || 100000) + '%' }"></div>
                      </div>
                    </div>
                    <div class="col-12 mb-3">
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted">Capital prêté ce mois</span>
                        <span class="fw-bold">{{ formatCurrency(userStats.monthlyCapital || 0) }}</span>
                      </div>
                      <div class="progress mt-1" style="height: 8px;">
                        <div class="progress-bar bg-warning" :style="{ width: getProgressPercentage(userStats.monthlyCapital || 0, userStats.monthlyCapitalTarget || 500000) + '%' }"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistiques avancées -->
          <div class="row">
            <!-- Clients et commissions -->
            <div class="col-md-6 mb-4">
              <div class="card">
                <div class="card-header">
                  <h5 class="mb-0">
                    <i class="flaticon-users me-2"></i>
                    Clients et commissions
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-6 mb-3">
                      <div class="text-center">
                        <h4 class="text-primary mb-1">{{ userStats.totalClients || 0 }}</h4>
                        <p class="text-muted mb-0">Clients totaux</p>
                      </div>
                    </div>
                    <div class="col-6 mb-3">
                      <div class="text-center">
                        <h4 class="text-success mb-1">{{ formatCurrency(userStats.totalCommissions || 0) }}</h4>
                        <p class="text-muted mb-0">Commissions totales</p>
                      </div>
                    </div>
                    <div class="col-6 mb-3">
                      <div class="text-center">
                        <h4 class="text-info mb-1">{{ userStats.newClientsThisMonth || 0 }}</h4>
                        <p class="text-muted mb-0">Nouveaux clients</p>
                      </div>
                    </div>
                    <div class="col-6 mb-3">
                      <div class="text-center">
                        <h4 class="text-warning mb-1">{{ formatCurrency(userStats.monthlyCommissions || 0) }}</h4>
                        <p class="text-muted mb-0">Commissions ce mois</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Activité et performance -->
            <div class="col-md-6 mb-4">
              <div class="card">
                <div class="card-header">
                  <h5 class="mb-0">
                    <i class="flaticon-graph me-2"></i>
                    Activité et performance
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-6 mb-3">
                      <div class="text-center">
                        <h4 class="text-primary mb-1">{{ userStats.contractsThisWeek || 0 }}</h4>
                        <p class="text-muted mb-0">Contrats cette semaine</p>
                      </div>
                    </div>
                    <div class="col-6 mb-3">
                      <div class="text-center">
                        <h4 class="text-success mb-1">{{ userStats.averageContractValue || 0 }}</h4>
                        <p class="text-muted mb-0">Valeur moyenne contrat</p>
                      </div>
                    </div>
                    <div class="col-6 mb-3">
                      <div class="text-center">
                        <h4 class="text-info mb-1">{{ userStats.successRate || 0 }}%</h4>
                        <p class="text-muted mb-0">Taux de réussite</p>
                      </div>
                    </div>
                    <div class="col-6 mb-3">
                      <div class="text-center">
                        <h4 class="text-warning mb-1">{{ userStats.rank || 'N/A' }}</h4>
                        <p class="text-muted mb-0">Classement</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Graphique de performance -->
          <div class="row">
            <div class="col-12">
              <div class="card border-0 shadow-sm rounded-3 bg-white">
                <div class="card-header bg-transparent border-0 pt-4 pb-0 px-4">
                  <h5 class="mb-0 text-dark fw-bold">
                    <i class="flaticon-chart me-2 text-success"></i>
                    Évolution des performances (6 derniers mois)
                  </h5>
                </div>
                <div class="card-body px-4">
                  <apexchart
                    type="line"
                    height="320"
                    :options="performanceChartOptions"
                    :series="performanceSeries"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== ONGLET CONTRATS & COTATIONS ===== -->
        <div v-if="activeTab === 'contrats'" class="px-2">

          <!-- Résumé rapide -->
          <div class="row g-3 mb-4">
            <div class="col-6 col-md-3">
              <div class="rounded-3 p-3 text-center" style="background:linear-gradient(135deg,#007bff22,#007bff11);border:1px solid #007bff33">
                <div class="fw-bold fs-3 text-primary">{{ userContratsTotal }}</div>
                <div class="text-muted small">Contrats</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="rounded-3 p-3 text-center" style="background:linear-gradient(135deg,#28a74522,#28a74511);border:1px solid #28a74533">
                <div class="fw-bold fs-3 text-success">{{ userCotationsTotal }}</div>
                <div class="text-muted small">Cotations</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="rounded-3 p-3 text-center" style="background:linear-gradient(135deg,#ffc10722,#ffc10711);border:1px solid #ffc10733">
                <div class="fw-bold fs-3 text-warning">{{ formatCurrency(userStats.totalPrimes || 0) }}</div>
                <div class="text-muted small">Primes totales</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="rounded-3 p-3 text-center" style="background:linear-gradient(135deg,#6f42c122,#6f42c111);border:1px solid #6f42c133">
                <div class="fw-bold fs-3" style="color:#6f42c1">{{ userStats.successRate || 0 }}%</div>
                <div class="text-muted small">Taux de réussite</div>
              </div>
            </div>
          </div>

          <!-- ---- Tableau des Contrats ---- -->
          <div class="card border-0 shadow-sm rounded-3 mb-4">
            <div class="card-header bg-transparent border-0 pt-4 pb-0 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h5 class="mb-0 fw-bold text-dark">
                <i class="flaticon-file text-primary me-2"></i>
                Mes Contrats
              </h5>
              <div class="d-flex gap-2 flex-wrap">
                <input
                  v-model="contratsSearch"
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="Rechercher…"
                  style="width:180px"
                  @input="contratsPage = 1"
                />
                <select v-model="contratsStatusFilter" class="form-select form-select-sm" style="width:150px" @change="contratsPage = 1">
                  <option value="">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="pending">En attente</option>
                  <option value="suspended">Suspendus</option>
                  <option value="cancelled">Annulés</option>
                </select>
              </div>
            </div>
            <div class="card-body px-2 px-md-4 pb-4">
              <div v-if="contratsLoading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement…</span></div>
              </div>
              <div v-else-if="filteredContrats.length === 0" class="text-center text-muted py-5">
                <i class="flaticon-file" style="font-size:2.5rem;opacity:0.3"></i>
                <p class="mt-2 mb-0">Aucun contrat trouvé</p>
              </div>
              <div v-else class="table-responsive">
                <table class="table table-hover align-middle mb-0" style="font-size:0.875rem">
                  <thead style="background:#f8f9fa">
                    <tr>
                      <th class="ps-3">#</th>
                      <th>Client</th>
                      <th>Nature</th>
                      <th>Agence</th>
                      <th class="text-end">Prime</th>
                      <th class="text-end">Capital</th>
                      <th>Statut</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in pagedContrats" :key="c.id">
                      <td class="ps-3 text-muted" style="font-size:0.8rem">{{ c.police || c.reference || c.id }}</td>
                      <td>
                        <div class="fw-semibold">{{ c.customer && (c.customer.firstname + ' ' + c.customer.lastname) || '—' }}</div>
                        <div class="text-muted" style="font-size:0.75rem">{{ c.customer && c.customer.phone || '' }}</div>
                      </td>
                      <td class="text-muted">{{ (c.natureCredit && c.natureCredit.name) || '—' }}</td>
                      <td class="text-muted" style="font-size:0.8rem">{{ (c.agency && c.agency.name) || '—' }}</td>
                      <td class="text-end fw-semibold text-success">{{ formatCurrency(c.puttc || 0) }}</td>
                      <td class="text-end text-muted">{{ formatCurrency(c.capital || 0) }}</td>
                      <td>
                        <span :class="getContratStatusClass(c.contractState)" class="badge rounded-pill px-2 py-1">
                          {{ getContratStatusLabel(c.contractState) }}
                        </span>
                      </td>
                      <td class="text-muted" style="font-size:0.8rem">{{ formatDate(c.createdAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- Pagination contrats -->
              <div v-if="filteredContrats.length > contratsPageSize" class="d-flex justify-content-between align-items-center mt-3 px-2">
                <span class="text-muted small">{{ filteredContrats.length }} contrats · Page {{ contratsPage }}/{{ Math.ceil(filteredContrats.length / contratsPageSize) }}</span>
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline-secondary" :disabled="contratsPage === 1" @click="contratsPage--">&laquo;</button>
                  <button class="btn btn-sm btn-outline-secondary" :disabled="contratsPage >= Math.ceil(filteredContrats.length / contratsPageSize)" @click="contratsPage++">&raquo;</button>
                </div>
              </div>
            </div>
          </div>

          <!-- ---- Tableau des Cotations ---- -->
          <div class="card border-0 shadow-sm rounded-3 mb-2">
            <div class="card-header bg-transparent border-0 pt-4 pb-0 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h5 class="mb-0 fw-bold text-dark">
                <i class="flaticon-edit text-success me-2"></i>
                Mes Cotations
              </h5>
              <div class="d-flex gap-2 flex-wrap">
                <input
                  v-model="cotationsSearch"
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="Rechercher…"
                  style="width:180px"
                  @input="cotationsPage = 1"
                />
                <select v-model="cotationsStatusFilter" class="form-select form-select-sm" style="width:150px" @change="cotationsPage = 1">
                  <option value="">Tous les statuts</option>
                  <option value="accepted">Acceptées</option>
                  <option value="pending">En attente</option>
                  <option value="rejected">Refusées</option>
                </select>
              </div>
            </div>
            <div class="card-body px-2 px-md-4 pb-4">
              <div v-if="contratsLoading" class="text-center py-4">
                <div class="spinner-border text-success" role="status"><span class="visually-hidden">Chargement…</span></div>
              </div>
              <div v-else-if="filteredCotations.length === 0" class="text-center text-muted py-5">
                <i class="flaticon-edit" style="font-size:2.5rem;opacity:0.3"></i>
                <p class="mt-2 mb-0">Aucune cotation trouvée</p>
              </div>
              <div v-else class="table-responsive">
                <table class="table table-hover align-middle mb-0" style="font-size:0.875rem">
                  <thead style="background:#f8f9fa">
                    <tr>
                      <th class="ps-3">#</th>
                      <th>Client</th>
                      <th>Nature</th>
                      <th class="text-end">Prime</th>
                      <th class="text-end">Capital</th>
                      <th>Statut</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="q in pagedCotations" :key="q.id">
                      <td class="ps-3 text-muted" style="font-size:0.8rem">{{ q.reference || q.id }}</td>
                      <td>
                        <div class="fw-semibold">{{ q.customer && (q.customer.firstname + ' ' + q.customer.lastname) || (q.firstname && (q.firstname + ' ' + q.lastname)) || '—' }}</div>
                      </td>
                      <td class="text-muted">{{ q.typeAss || '—' }}</td>
                      <td class="text-end fw-semibold text-success">{{ formatCurrency(q.puttc || 0) }}</td>
                      <td class="text-end text-muted">{{ formatCurrency(q.capital || 0) }}</td>
                      <td>
                        <span :class="getCotationStatusClass(q.status)" class="badge rounded-pill px-2 py-1">
                          {{ getCotationStatusLabel(q.status) }}
                        </span>
                      </td>
                      <td class="text-muted" style="font-size:0.8rem">{{ formatDate(q.createdAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- Pagination cotations -->
              <div v-if="filteredCotations.length > cotationsPageSize" class="d-flex justify-content-between align-items-center mt-3 px-2">
                <span class="text-muted small">{{ filteredCotations.length }} cotations · Page {{ cotationsPage }}/{{ Math.ceil(filteredCotations.length / cotationsPageSize) }}</span>
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline-secondary" :disabled="cotationsPage === 1" @click="cotationsPage--">&laquo;</button>
                  <button class="btn btn-sm btn-outline-secondary" :disabled="cotationsPage >= Math.ceil(filteredCotations.length / cotationsPageSize)" @click="cotationsPage++">&raquo;</button>
                </div>
              </div>
            </div>
          </div>

        </div>
        <!-- ===== /ONGLET CONTRATS & COTATIONS ===== -->

      </div>
    </div>
</template>
  <script lang="ts">
  import { defineComponent, ref, onMounted, computed, watch } from 'vue';
  import ApiService from '../../services/ApiService';
  import { success, error } from '../../utils/utils';
  const defaultAvatar = '/assets/images/admin.jpg';
  
  export default defineComponent({
    name: 'UserProfile',
    
    setup() {
      const loading = ref(false);
      const activeTab = ref('infos');
      const showPhotoModal = ref(false);
      const photoFile = ref<File | null>(null);
      const photoPreview = ref('');
      
      const user = ref({
        id: 0,
        prenom: '',
        nom: '',
        email: '',
        role: '',
        avatar: '',
        telephone: '',
        adresse: '',
        dateNaissance: '',
        genre: '',
        fonction: '',
        status: '',
        lastLogin: null as Date | null,
        createdAt: null as Date | null
      });

      const profileForm = ref({
        prenom: '',
        nom: '',
        email: '',
        telephone: '',
        adresse: '',
        dateNaissance: '',
        genre: '',
        fonction: ''
      });

      const passwordForm = ref({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

      // Supprimé les préférences - remplacé par les statistiques

      // États pour le suivi des modifications
      const hasUnsavedChanges = ref({
        infos: false
      });

      // Mode d'édition
      const editMode = ref({
        personal: false
      });

      // Données utilisateur étendues
      const userPermissions = ref<any[]>([]);
      const selectedModule = ref('all');
      const userAgency = ref({
        name: '',
        location: '',
        phone: '',
        email: ''
      });

      // Statistiques de production
      const productionStats = ref({
        totalContracts: 0,
        totalClients: 0,
        totalPrimes: 0,
        totalCommissions: 0,
        activeContracts: 0,
        pendingContracts: 0,
        suspendedContracts: 0,
        cancelledContracts: 0,
        monthlyContracts: 0,
        monthlyClients: 0,
        monthlyRevenue: 0,
        monthlyCapital: 0,
        contractsTarget: 20,
        clientsTarget: 15,
        revenueTarget: 500000,
        averagePrime: 0,
        period: null as any
      });

      const userStats = ref({
        // Statistiques générales
        totalContracts: 0,
        totalPrimes: 0,
        totalCapital: 0,
        totalCotations: 0,
        totalClients: 0,
        totalCommissions: 0,
        
        // Contrats par statut
        activeContracts: 0,
        pendingContracts: 0,
        suspendedContracts: 0,
        cancelledContracts: 0,
        
        // Performance mensuelle
        monthlyContracts: 0,
        monthlyPrimes: 0,
        monthlyCapital: 0,
        monthlyCommissions: 0,
        monthlyTarget: 20,
        monthlyPrimesTarget: 100000,
        monthlyCapitalTarget: 500000,
        
        // Clients
        newClientsThisMonth: 0,
        
        // Performance et activité
        contractsThisWeek: 0,
        averageContractValue: 0,
        successRate: 0,
        rank: 'N/A',
        
        // Anciennes statistiques (gardées pour compatibilité)
        totalLogins: 0,
        totalActivities: 0,
        documentsCreated: 0,
        avgSessionTime: '0h',
        achievementCount: 0,
        failedLogins: 0,
        uniqueDevices: 1,
        uniqueIPs: 1,
        suspiciousActivities: 0,
        period: null as any
      });

      const performanceChartOptions = ref({
        chart: {
          id: 'performance-evolution',
          type: 'line',
          height: 320,
          toolbar: {
            show: false
          },
          zoom: {
            enabled: false
          }
        },
        colors: ['#007bff', '#33b04a', '#ffc107'],
        stroke: {
          width: [0, 3, 3], // 0 pour les colonnes pour ne pas avoir de bordure de ligne, ou 3 si on veut
          curve: 'smooth'
        },
        fill: {
          type: ['solid', 'gradient', 'solid'],
          opacity: [0.85, 0.25, 0.85],
          gradient: {
            inverseColors: false,
            shade: 'light',
            type: "vertical",
            opacityFrom: 0.85,
            opacityTo: 0.55,
            stops: [0, 100]
          }
        },
        xaxis: {
          categories: [] as string[],
          labels: {
            style: {
              colors: '#6c757d',
              fontSize: '12px'
            }
          }
        },
        yaxis: [
          {
            seriesName: 'Contrats',
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
              color: '#007bff'
            },
            labels: {
              style: {
                colors: '#007bff',
              }
            },
            title: {
              text: "Nombre de contrats",
              style: {
                color: '#007bff',
              }
            },
            min: 0
          },
          {
            seriesName: 'Primes',
            opposite: true,
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
              color: '#33b04a'
            },
            labels: {
              style: {
                colors: '#33b04a',
              },
              formatter: function (val: number) {
                return new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(val);
              }
            },
            title: {
              text: "Montants (FCFA)",
              style: {
                color: '#33b04a',
              }
            },
            min: 0
          },
          {
            seriesName: 'Capital',
            opposite: true,
            show: false // Partager l'axe de droite avec Primes
          }
        ],
        tooltip: {
          shared: true,
          intersect: false,
          theme: 'light',
          y: {
            formatter: function (y: number, { seriesIndex }: any) {
              if (typeof y !== "undefined") {
                if (seriesIndex === 0) {
                  return y + " contrats";
                }
                return new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  minimumFractionDigits: 0
                }).format(y);
              }
              return y;
            }
          }
        },
        legend: {
          horizontalAlign: 'left',
          offsetX: 40
        }
      });

      const performanceSeries = ref([
        {
          name: 'Contrats',
          type: 'column',
          data: [] as number[]
        },
        {
          name: 'Primes',
          type: 'area',
          data: [] as number[]
        },
        {
          name: 'Capital',
          type: 'line',
          data: [] as number[]
        }
      ]);

      const recentActivities = ref<any[]>([]);
      const activeSessions = ref<any[]>([]);

      // ---- Données onglet Contrats & Cotations ----
      const userContrats = ref<any[]>([]);
      const userCotations = ref<any[]>([]);
      const userContratsTotal = ref(0);
      const userCotationsTotal = ref(0);
      const contratsLoading = ref(false);
      const contratsSearch = ref('');
      const contratsStatusFilter = ref('');
      const contratsPage = ref(1);
      const contratsPageSize = 10;
      const cotationsSearch = ref('');
      const cotationsStatusFilter = ref('');
      const cotationsPage = ref(1);
      const cotationsPageSize = 10;

      // Nouvelles variables pour l'onglet Sécurité
      const showCurrentPassword = ref(false);
      const showNewPassword = ref(false);
      const showConfirmPassword = ref(false);

      const securitySettings = ref({
        twoFactorEnabled: false,
        loginAlerts: true,
        passwordChangeAlerts: true,
        newDeviceAlerts: true,
        sessionTimeout: 120, // minutes
        requirePasswordForSensitive: true,
        logoutAllDevicesOnPasswordChange: false
      });

      const securityStats = ref({
        passwordChanges: 3,
        failedLogins: 0,
        devicesCount: 2
      });

      const securityHistory = ref([
        {
          id: 1,
          action: 'Connexion réussie',
          description: 'Connexion depuis un nouvel appareil',
          location: 'Cotonou, Bénin',
          device: 'Chrome sur Windows',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2 heures
          type: 'success',
          icon: 'flaticon-login'
        },
        {
          id: 2,
          action: 'Changement de mot de passe',
          description: 'Mot de passe modifié avec succès',
          location: 'Cotonou, Bénin',
          device: 'Chrome sur Windows',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Il y a 1 jour
          type: 'success',
          icon: 'flaticon-key'
        },
        {
          id: 3,
          action: 'Tentative de connexion échouée',
          description: 'Mot de passe incorrect',
          location: 'Lagos, Nigeria',
          device: 'Firefox sur Android',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
          type: 'warning',
          icon: 'flaticon-warning'
        }
      ]);

      // Propriétés calculées
      const profileCompleteness = computed(() => {
        const fields = [
          user.value.prenom, user.value.nom, user.value.email, 
          user.value.telephone, user.value.adresse, user.value.dateNaissance,
          user.value.genre, user.value.fonction
        ];
        const filledFields = fields.filter(field => field && field.toString().trim() !== '').length;
        return Math.round((filledFields / fields.length) * 100);
      });

      const lastLoginFormatted = computed(() => {
        if (!user.value.lastLogin) return 'Jamais connecté';
        return formatDate(user.value.lastLogin);
      });

      const passwordStrength = computed(() => {
        const password = passwordForm.value.new_password;
        if (!password) return { score: 0, text: '', color: '' };
        
        let score = 0;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const levels = [
          { score: 0, text: 'Très faible', color: 'danger' },
          { score: 1, text: 'Faible', color: 'danger' },
          { score: 2, text: 'Moyen', color: 'warning' },
          { score: 3, text: 'Fort', color: 'info' },
          { score: 4, text: 'Très fort', color: 'success' },
          { score: 5, text: 'Excellent', color: 'success' }
        ];

        return levels[score] || levels[0];
      });

      // Propriétés calculées pour les permissions
      const grantedPermissions = computed(() => {
        return userPermissions.value.filter(p => p.granted);
      });

      const deniedPermissions = computed(() => {
        return userPermissions.value.filter(p => !p.granted);
      });

      const specialPermissions = computed(() => {
        return userPermissions.value.filter(p => p.source === 'user_override');
      });

      const availableModules = computed(() => {
        const modules = [...new Set(userPermissions.value.map(p => p.module))];
        return modules.sort();
      });

      const filteredPermissions = computed(() => {
        if (selectedModule.value === 'all') {
          return userPermissions.value;
        }
        return userPermissions.value.filter(p => p.module === selectedModule.value);
      });

      // Nouvelles propriétés calculées pour l'onglet Sécurité
      const passwordCriteria = computed(() => {
        const password = passwordForm.value.new_password;
        return {
          length: password.length >= 8,
          lowercase: /[a-z]/.test(password),
          uppercase: /[A-Z]/.test(password),
          number: /[0-9]/.test(password),
          special: /[^A-Za-z0-9]/.test(password)
        };
      });

      const isPasswordFormValid = computed(() => {
        return passwordForm.value.current_password &&
               passwordForm.value.new_password &&
               passwordForm.value.confirm_password &&
               passwordForm.value.new_password === passwordForm.value.confirm_password &&
               passwordStrength.value.score >= 3;
      });

      // Watchers pour détecter les modifications
      watch(profileForm, () => {
        hasUnsavedChanges.value.infos = true;
      }, { deep: true });

      // Fonctions utilitaires
      const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
      };

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'XAF',
          minimumFractionDigits: 0
        }).format(amount);
      };

      const getStatusBadgeClass = (status: string) => {
        switch (status) {
          case 'ACTIVE': return 'bg-success';
          case 'INACTIVE': return 'bg-warning';
          case 'SUSPENDED': return 'bg-danger';
          default: return 'bg-secondary';
        }
      };

      const getStatusText = (status: string) => {
        switch (status) {
          case 'ACTIVE': return 'Actif';
          case 'INACTIVE': return 'Inactif';
          case 'SUSPENDED': return 'Suspendu';
          default: return 'Inconnu';
        }
      };

      const getProgressPercentage = (current: number, target: number) => {
        if (target === 0) return 0;
        return Math.min(Math.round((current / target) * 100), 100);
      };

      // Nouvelles fonctions pour l'onglet Production
      const getPercentage = (value: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
      };

      const getPerformanceBadgeClass = () => {
        const contractsPercentage = getProgressPercentage(productionStats.value.monthlyContracts, productionStats.value.contractsTarget);
        const clientsPercentage = getProgressPercentage(productionStats.value.monthlyClients, productionStats.value.clientsTarget);
        const revenuePercentage = getProgressPercentage(productionStats.value.monthlyRevenue, productionStats.value.revenueTarget);
        
        const averagePerformance = (contractsPercentage + clientsPercentage + revenuePercentage) / 3;
        
        if (averagePerformance >= 90) return 'bg-success';
        if (averagePerformance >= 70) return 'bg-primary';
        if (averagePerformance >= 50) return 'bg-warning';
        return 'bg-danger';
      };

      const getPerformanceText = () => {
        const contractsPercentage = getProgressPercentage(productionStats.value.monthlyContracts, productionStats.value.contractsTarget);
        const clientsPercentage = getProgressPercentage(productionStats.value.monthlyClients, productionStats.value.clientsTarget);
        const revenuePercentage = getProgressPercentage(productionStats.value.monthlyRevenue, productionStats.value.revenueTarget);
        
        const averagePerformance = (contractsPercentage + clientsPercentage + revenuePercentage) / 3;
        
        if (averagePerformance >= 90) return 'Excellent';
        if (averagePerformance >= 70) return 'Bon';
        if (averagePerformance >= 50) return 'Moyen';
        return 'À améliorer';
      };

      // Fonctions pour les permissions
      const getModulePermissionCount = (module: string) => {
        return userPermissions.value.filter(p => p.module === module).length;
      };

      const getSourceBadgeStyle = (source: string) => {
        switch (source) {
          case 'role':
            return 'background-color: #007bff; color: white;';
          case 'user_override':
            return 'background-color: #fd7e14; color: white;';
          default:
            return 'background-color: #6c757d; color: white;';
        }
      };

      const getSourceIcon = (source: string) => {
        switch (source) {
          case 'role':
            return 'flaticon-users';
          case 'user_override':
            return 'flaticon-user-settings';
          default:
            return 'flaticon-question';
        }
      };

      const getSourceText = (source: string) => {
        switch (source) {
          case 'role':
            return 'Rôle';
          case 'user_override':
            return 'Spéciale';
          default:
            return 'Inconnue';
        }
      };

      // Fonctions de chargement des données
      const loadUserProfile = async () => {
        try {
          const response = await ApiService.get('/auth/profile');
          if (response.data && response.data.data && response.data.data.user) {
            const profileData = response.data.data.user;
            
            // Mapper les données du backend vers le format attendu par le composant
            user.value = {
              id: profileData.id,
              prenom: profileData.firstname || '',
              nom: profileData.lastname || '',
              email: profileData.email || '',
              role: profileData.role?.libelle || profileData.role || '',
              avatar: profileData.avatar || '',
              telephone: profileData.phone || '',
              adresse: profileData.address || '',
              dateNaissance: profileData.birthdate || '',
              genre: profileData.gender || '',
              fonction: profileData.fonction || '',
              status: profileData.status || '',
              lastLogin: profileData.lastLogin ? new Date(profileData.lastLogin) : null,
              createdAt: profileData.createdAt ? new Date(profileData.createdAt) : null
            };
            
            // Mapper aussi pour le formulaire
            profileForm.value = {
              prenom: profileData.firstname || '',
              nom: profileData.lastname || '',
              email: profileData.email || '',
              telephone: profileData.phone || '',
              adresse: profileData.address || '',
              dateNaissance: profileData.birthdate || '',
              genre: profileData.gender || '',
              fonction: profileData.fonction || ''
            };
            
            // Charger l'agence si disponible
            if (profileData.agency) {
              userAgency.value = {
                name: profileData.agency.name || '',
                location: profileData.agency.address || '',
                phone: profileData.agency.phone || '',
                email: profileData.agency.email || ''
              };
            }

          }
        } catch (err: any) {
          console.error('Erreur lors du chargement du profil:', err);
          error('Erreur lors du chargement du profil');
        }
      };


      const loadProductionStats = async () => {
        try {
          const response = await ApiService.get('/auth/profile/production-stats');
          
          // Gestion de différentes structures de réponse
          let statsData = null;
          
          if (response.data && response.data.data) {
            // Structure: { data: { data: {...} } }
            if (response.data.data.data) {
              statsData = response.data.data.data;
            } else {
              // Structure: { data: {...} }
              statsData = response.data.data;
            }
          } else if (response.data) {
            // Structure directe
            statsData = response.data;
          }
          
          if (statsData) {
            // Mise à jour complète de l'objet productionStats
            Object.assign(productionStats.value, statsData);
            
            // Forcer le redessin des graphiques après mise à jour
            setTimeout(() => {
              drawCharts();
            }, 100);
          } else {
            console.warn('📊 Aucune donnée de statistiques trouvée dans la réponse');
          }
        } catch (err: any) {
          console.error('Erreur lors du chargement des statistiques de production:', err);
          console.error('Réponse d\'erreur:', err.response?.data);
          error('Erreur lors du chargement des statistiques de production');
        }
      };

      const loadUserStats = async () => {
        try {
          const response = await ApiService.get('/auth/profile/stats?days=30');
          
          // Gérer différentes structures de réponse
          let stats = null;
          if (response.data && response.data.data && response.data.data.data) {
            // Structure: { data: { data: { data: {...} } } }
            stats = response.data.data.data;
          } else if (response.data && response.data.data) {
            // Structure: { data: { data: {...} } }
            stats = response.data.data;
          } else if (response.data && response.data.stats) {
            stats = response.data.stats;
          } else if (response.data) {
            stats = response.data;
          }

          if (stats) {
            
            // Mettre à jour avec les vraies données du backend
            const statsData = stats as any;
            userStats.value = {
              // Statistiques générales
              totalContracts: statsData.totalContracts || 0,
              totalPrimes: statsData.totalPrimes || 0,
              totalCapital: statsData.totalCapital || 0,
              totalCotations: statsData.totalCotations || 0,
              totalClients: statsData.totalClients || 0,
              totalCommissions: statsData.totalCommissions || 0,
              
              // Contrats par statut
              activeContracts: statsData.activeContracts || 0,
              pendingContracts: statsData.pendingContracts || 0,
              suspendedContracts: statsData.suspendedContracts || 0,
              cancelledContracts: statsData.cancelledContracts || 0,
              
              // Performance mensuelle
              monthlyContracts: statsData.monthlyContracts || 0,
              monthlyPrimes: statsData.monthlyPrimes || 0,
              monthlyCapital: statsData.monthlyCapital || 0,
              monthlyCommissions: statsData.monthlyCommissions || 0,
              monthlyTarget: statsData.monthlyTarget || 20,
              monthlyPrimesTarget: statsData.monthlyPrimesTarget || 500000,
              monthlyCapitalTarget: statsData.monthlyCapitalTarget || 2000000,
              
              // Clients
              newClientsThisMonth: statsData.newClientsThisMonth || 0,
              
              // Performance et activité
              contractsThisWeek: statsData.contractsThisWeek || 0,
              averageContractValue: statsData.averageContractValue || 0,
              successRate: statsData.successRate || 0,
              rank: statsData.rank || 'N/A',
              
              // Anciennes statistiques (gardées pour compatibilité)
              totalLogins: statsData.totalLogins || 0,
              totalActivities: statsData.totalActivities || 0,
              documentsCreated: statsData.documentsCreated || 0,
              avgSessionTime: statsData.avgSessionTime || '0h',
              achievementCount: statsData.achievementCount || 0,
              failedLogins: statsData.failedLogins || 0,
              uniqueDevices: statsData.uniqueDevices || 1,
              uniqueIPs: statsData.uniqueIPs || 1,
              suspiciousActivities: statsData.suspiciousActivities || 0,
              period: statsData.period || null
            };

            // Mettre à jour l'historique du graphique s'il existe
            if (statsData.history && Array.isArray(statsData.history)) {
              const categories = statsData.history.map((h: any) => h.month);
              const contracts = statsData.history.map((h: any) => h.contracts);
              const primes = statsData.history.map((h: any) => h.primes);
              const capital = statsData.history.map((h: any) => h.capital);

              performanceChartOptions.value = {
                ...performanceChartOptions.value,
                xaxis: {
                  ...performanceChartOptions.value.xaxis,
                  categories: categories
                }
              };

              performanceSeries.value = [
                {
                  name: 'Contrats',
                  type: 'column',
                  data: contracts
                },
                {
                  name: 'Primes',
                  type: 'area',
                  data: primes
                },
                {
                  name: 'Capital',
                  type: 'line',
                  data: capital
                }
              ];
            }
          } else {
            console.warn('⚠️ Aucune donnée de statistiques trouvée dans la réponse');
            // Garder les valeurs par défaut (0)
          }
        } catch (err: any) {
          console.error('❌ Erreur lors du chargement des statistiques:', err);
        }
      };

      // ---- Chargement contrats & cotations de l'utilisateur ----
      const loadUserContrats = async () => {
        if (contratsLoading.value) return;
        contratsLoading.value = true;
        try {
          const [rC, rQ] = await Promise.all([
            ApiService.get('/auth/profile/contracts?limit=200'),
            ApiService.get('/auth/profile/cotations?limit=200')
          ]);

          // Contrats
          const cData = rC.data?.data || rC.data || {};
          const cList = Array.isArray(cData) ? cData : (cData.contracts || cData.items || cData.data || []);
          userContrats.value = cList;
          userContratsTotal.value = (rC.data?.total ?? rC.data?.data?.total) || cList.length;

          // Cotations
          const qData = rQ.data?.data || rQ.data || {};
          const qList = Array.isArray(qData) ? qData : (qData.cotations || qData.items || qData.data || []);
          userCotations.value = qList;
          userCotationsTotal.value = (rQ.data?.total ?? rQ.data?.data?.total) || qList.length;
        } catch (err: any) {
          console.error('Erreur chargement contrats/cotations:', err);
        } finally {
          contratsLoading.value = false;
        }
      };

      const loadRecentActivities = async () => {
        try {
          const response = await ApiService.get('/auth/profile/activities?limit=10&page=1');
          
          if (response.data && response.data.data) {
            const activitiesData = response.data.data;
            
            // Gérer la structure de réponse (peut être directement les activités ou un objet avec activities)
            let activities: any[] = [];
            if (Array.isArray(activitiesData)) {
              activities = activitiesData;
            } else if (activitiesData.activities && Array.isArray(activitiesData.activities)) {
              activities = activitiesData.activities;
            }
            
            // Formater les activités pour l'affichage
            recentActivities.value = activities.map((activity: any) => ({
              id: activity.id,
              type: activity.type || 'Activité',
              description: activity.description || 'Aucune description',
              timestamp: activity.timestamp || activity.createdAt,
              icon: activity.icon || 'flaticon-info',
              activityType: activity.activityType,
              status: activity.status,
              riskLevel: activity.riskLevel,
              isSuspicious: activity.isSuspicious,
              ipAddress: activity.ipAddress,
              deviceType: activity.deviceType,
              browser: activity.browser,
              operatingSystem: activity.operatingSystem,
              locationCountry: activity.locationCountry,
              locationCity: activity.locationCity
            }));
            
          }
        } catch (err: any) {
          console.error('❌ Erreur lors du chargement des activités:', err);
          // En cas d'erreur, garder des données par défaut
          recentActivities.value = [
            {
              id: 1,
              type: 'Connexion',
              description: 'Connexion à l\'application',
              timestamp: new Date(),
              icon: 'flaticon-login'
            }
          ];
        }
      };

      const loadActiveSessions = async () => {
        try {
          const response = await ApiService.get('/auth/profile/sessions');
          if (response.data && response.data.data) {
            activeSessions.value = response.data.data;
          }
        } catch (err: any) {
          console.error('Erreur lors du chargement des sessions:', err);
        }
      };

      // Fonctions d'actions
      const updateProfile = async () => {
        try {
          loading.value = true;
          
          // Mapper les données du formulaire vers le format attendu par le backend
          const dataToSend = {
            firstname: profileForm.value.prenom,
            lastname: profileForm.value.nom,
            email: profileForm.value.email,
            phone: profileForm.value.telephone,
            address: profileForm.value.adresse,
            birthdate: profileForm.value.dateNaissance,
            gender: profileForm.value.genre,
            fonction: profileForm.value.fonction
          };
          
          await ApiService.put('/auth/profile', dataToSend);
          
          // Mettre à jour l'objet user local
          Object.assign(user.value, profileForm.value);
          hasUnsavedChanges.value.infos = false;
          editMode.value.personal = false;
          success('Profil mis à jour avec succès');
        } catch (err: any) {
          console.error('Erreur lors de la mise à jour du profil:', err);
          console.error('Réponse d\'erreur:', err.response?.data);
          error('Erreur lors de la mise à jour du profil');
        } finally {
          loading.value = false;
        }
      };

      const updatePassword = async () => {
        if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
          error('Les mots de passe ne correspondent pas');
          return;
        }

        try {
          await ApiService.put('/auth/change-password', passwordForm.value);
          passwordForm.value = { current_password: '', new_password: '', confirm_password: '' };
          success('Mot de passe mis à jour avec succès');
        } catch (err: any) {
          console.error('Erreur lors du changement de mot de passe:', err);
          if (err.response?.data?.message) {
            error(err.response.data.message);
          } else {
            error('Erreur lors du changement de mot de passe');
          }
        }
      };

      // Fonction supprimée - remplacée par les statistiques

      const openPhotoModal = () => {
        showPhotoModal.value = true;
      };

      const closePhotoModal = () => {
        showPhotoModal.value = false;
        photoFile.value = null;
        photoPreview.value = '';
      };

      const handlePhotoUpload = (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        
        if (file) {
          photoFile.value = file;
          const reader = new FileReader();
          reader.onload = (e) => {
            photoPreview.value = e.target?.result as string;
          };
          reader.readAsDataURL(file);
        }
      };

      const uploadPhoto = async () => {
        if (!photoFile.value) return;

        try {
          const formData = new FormData();
          formData.append('avatar', photoFile.value);
          
          const response = await ApiService.post('/profile/avatar', formData);
          
          if (response.data?.avatar_url) {
            user.value.avatar = response.data.avatar_url;
            success('Photo de profil mise à jour avec succès');
            closePhotoModal();
          }
        } catch (err: any) {
          error('Erreur lors de la mise à jour de la photo');
        }
      };

      const terminateSession = async (sessionId: string | number) => {
        try {
          await ApiService.delete(`/profile/sessions/${sessionId}`);
          activeSessions.value = activeSessions.value.filter(s => s.id !== sessionId);
          success('Session fermée');
        } catch (err: any) {
          error('Erreur lors de la fermeture de la session');
        }
      };

      const terminateAllSessions = async () => {
        try {
          await ApiService.delete('/profile/sessions/all');
          activeSessions.value = activeSessions.value.filter(s => s.isCurrent);
          success('Toutes les autres sessions ont été fermées');
        } catch (err: any) {
          error('Erreur lors de la fermeture des sessions');
        }
      };

      const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
        if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
        return 'À l\'instant';
      };

      // Nouvelles fonctions pour l'onglet Sécurité
      const checkPasswordStrength = () => {
        // Cette fonction est appelée automatiquement par le computed passwordStrength
        // mais on peut l'utiliser pour des actions supplémentaires si nécessaire
      };

      const resetPasswordForm = () => {
        passwordForm.value = {
          current_password: '',
          new_password: '',
          confirm_password: ''
        };
        showCurrentPassword.value = false;
        showNewPassword.value = false;
        showConfirmPassword.value = false;
      };

      const toggle2FA = async () => {
        try {
          loading.value = true;
          const endpoint = securitySettings.value.twoFactorEnabled ? '/profile/2fa/enable' : '/profile/2fa/disable';
          await ApiService.post(endpoint, {});
          
          if (securitySettings.value.twoFactorEnabled) {
            success('Authentification à deux facteurs activée');
          } else {
            success('Authentification à deux facteurs désactivée');
          }
        } catch (err: any) {
          // Réinitialiser l'état en cas d'erreur
          securitySettings.value.twoFactorEnabled = !securitySettings.value.twoFactorEnabled;
          error('Erreur lors de la modification de l\'authentification à deux facteurs');
        } finally {
          loading.value = false;
        }
      };

      const updateSecuritySettings = async () => {
        try {
          loading.value = true;
          await ApiService.put('/profile/security-settings', securitySettings.value);
          success('Paramètres de sécurité mis à jour avec succès');
        } catch (err: any) {
          error('Erreur lors de la mise à jour des paramètres de sécurité');
        } finally {
          loading.value = false;
        }
      };

      const resetSecuritySettings = () => {
        securitySettings.value = {
          twoFactorEnabled: false,
          loginAlerts: true,
          passwordChangeAlerts: true,
          newDeviceAlerts: true,
          sessionTimeout: 120,
          requirePasswordForSensitive: true,
          logoutAllDevicesOnPasswordChange: false
        };
      };

      const loadSecurityHistory = async () => {
        try {
          const response = await ApiService.get('/auth/profile/security-history');
          if (response.data && response.data.data) {
            securityHistory.value = response.data.data;
          }
        } catch (err: any) {
          console.error('Erreur lors du chargement de l\'historique de sécurité:', err);
        }
      };

      const loadSecurityStats = async () => {
        try {
          const response = await ApiService.get('/auth/profile/security-stats');
          if (response.data && response.data.data) {
            securityStats.value = response.data.data;
          }
        } catch (err: any) {
          console.error('Erreur lors du chargement des statistiques de sécurité:', err);
        }
      };

      const loadSecuritySettings = async () => {
        try {
          const response = await ApiService.get('/auth/profile/security-settings');
          
          if (response.data && response.data.data) {
            const settings = response.data.data;
            
            // Mettre à jour l'état local avec les paramètres de la base de données
            securitySettings.value = {
              twoFactorEnabled: settings.twoFactorEnabled || false,
              loginAlerts: settings.loginAlerts !== undefined ? settings.loginAlerts : true,
              passwordChangeAlerts: settings.passwordChangeAlerts !== undefined ? settings.passwordChangeAlerts : true,
              newDeviceAlerts: settings.newDeviceAlerts !== undefined ? settings.newDeviceAlerts : true,
              sessionTimeout: settings.sessionTimeout || 120,
              requirePasswordForSensitive: settings.requirePasswordForSensitive !== undefined ? settings.requirePasswordForSensitive : true,
              logoutAllDevicesOnPasswordChange: settings.logoutAllDevicesOnPasswordChange || false
            };
            
          }
        } catch (err: any) {
          console.error('❌ Erreur lors du chargement des paramètres de sécurité:', err);
          console.error('Détails de l\'erreur:', err.response?.data);
        }
      };

      // Fonction pour dessiner les graphiques Canvas
      const drawPieChart = (canvas: HTMLCanvasElement, data: number[], colors: string[], total: number) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        let currentAngle = -Math.PI / 2; // Commencer en haut

        // Effacer le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        data.forEach((value, index) => {
          const sliceAngle = (value / total) * 2 * Math.PI;

          // Dessiner la tranche
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
          ctx.closePath();
          ctx.fillStyle = colors[index];
          ctx.fill();

          // Bordure blanche
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();

          currentAngle += sliceAngle;
        });
      };

      const drawProgressCircle = (canvas: HTMLCanvasElement, percentage: number, color: string) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 5;
        const lineWidth = 6;

        // Effacer le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Cercle de fond
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Cercle de progression
        const angle = (percentage / 100) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + angle);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
      };

      // Fonction pour dessiner tous les graphiques après le rendu
      const drawCharts = () => {
        setTimeout(() => {
          // Graphique principal de répartition des contrats
          const contractsCanvas = document.querySelector('canvas[ref="contractsChart"]') as HTMLCanvasElement;
          if (contractsCanvas) {
            const data = [
              productionStats.value.activeContracts,
              productionStats.value.suspendedContracts,
              productionStats.value.cancelledContracts || 0
            ];
            const colors = ['#28a745', '#ffc107', '#dc3545'];
            const total = productionStats.value.totalContracts;
            
            if (total > 0) {
              drawPieChart(contractsCanvas, data, colors, total);
            }
          }

          // Graphiques de progression circulaires
          const contractProgressCanvas = document.getElementById('contractProgressChart') as HTMLCanvasElement;
          if (contractProgressCanvas) {
            const percentage = getProgressPercentage(productionStats.value.monthlyContracts, productionStats.value.contractsTarget);
            drawProgressCircle(contractProgressCanvas, percentage, '#007bff');
          }

          const clientProgressCanvas = document.getElementById('clientProgressChart') as HTMLCanvasElement;
          if (clientProgressCanvas) {
            const percentage = getProgressPercentage(productionStats.value.monthlyClients, productionStats.value.clientsTarget);
            drawProgressCircle(clientProgressCanvas, percentage, '#28a745');
          }

          const revenueProgressCanvas = document.getElementById('revenueProgressChart') as HTMLCanvasElement;
          if (revenueProgressCanvas) {
            const percentage = getProgressPercentage(productionStats.value.monthlyRevenue, productionStats.value.revenueTarget);
            drawProgressCircle(revenueProgressCanvas, percentage, '#ffc107');
          }
        }, 500);
      };

      // Initialisation
      onMounted(() => {
        loadUserProfile();
        loadUserStats();
        loadRecentActivities();
        loadActiveSessions();
        loadProductionStats();
        loadSecurityHistory();
        loadSecurityStats();
        loadSecuritySettings(); // Charger les paramètres de sécurité depuis la base
      });

      // Watcher pour redessiner les graphiques quand les données changent
      watch(productionStats, () => {
        drawCharts();
      }, { deep: true });

      // Watcher pour redessiner les graphiques quand on change d'onglet
      watch(activeTab, (newTab) => {
        if (newTab === 'production' || newTab === 'statistiques') {
          drawCharts();
        }
      });

      // Nouvelles fonctions pour l'onglet Activité
      const changePeriod = async (days: number) => {
        try {
          const response = await ApiService.get(`/auth/profile/stats?days=${days}`);
          
          if (response.data && response.data.data) {
            const stats = response.data.data;
            const statsData = stats as any;
            
            // Mettre à jour avec les vraies données du backend
            userStats.value = {
              // Statistiques générales
              totalContracts: statsData.totalContracts || 0,
              totalPrimes: statsData.totalPrimes || 0,
              totalCapital: statsData.totalCapital || 0,
              totalCotations: statsData.totalCotations || 0,
              totalClients: statsData.totalClients || 0,
              totalCommissions: statsData.totalCommissions || 0,
              
              // Contrats par statut
              activeContracts: statsData.activeContracts || 0,
              pendingContracts: statsData.pendingContracts || 0,
              suspendedContracts: statsData.suspendedContracts || 0,
              cancelledContracts: statsData.cancelledContracts || 0,
              
              // Performance mensuelle
              monthlyContracts: statsData.monthlyContracts || 0,
              monthlyPrimes: statsData.monthlyPrimes || 0,
              monthlyCapital: statsData.monthlyCapital || 0,
              monthlyCommissions: statsData.monthlyCommissions || 0,
              monthlyTarget: statsData.monthlyTarget || 20,
              monthlyPrimesTarget: statsData.monthlyPrimesTarget || 500000,
              monthlyCapitalTarget: statsData.monthlyCapitalTarget || 2000000,
              
              // Clients
              newClientsThisMonth: statsData.newClientsThisMonth || 0,
              
              // Performance et activité
              contractsThisWeek: statsData.contractsThisWeek || 0,
              averageContractValue: statsData.averageContractValue || 0,
              successRate: statsData.successRate || 0,
              rank: statsData.rank || 'N/A',
              
              // Anciennes statistiques (gardées pour compatibilité)
              totalLogins: statsData.totalLogins || 0,
              totalActivities: statsData.totalActivities || 0,
              documentsCreated: statsData.documentsCreated || 0,
              avgSessionTime: statsData.avgSessionTime || '0h',
              achievementCount: statsData.achievementCount || 0,
              failedLogins: statsData.failedLogins || 0,
              uniqueDevices: statsData.uniqueDevices || 1,
              uniqueIPs: statsData.uniqueIPs || 1,
              suspiciousActivities: statsData.suspiciousActivities || 0,
              period: statsData.period || null
            };
            
            // Mettre à jour l'historique du graphique s'il existe
            if (statsData.history && Array.isArray(statsData.history)) {
              const categories = statsData.history.map((h: any) => h.month);
              const contracts = statsData.history.map((h: any) => h.contracts);
              const primes = statsData.history.map((h: any) => h.primes);
              const capital = statsData.history.map((h: any) => h.capital);

              performanceChartOptions.value = {
                ...performanceChartOptions.value,
                xaxis: {
                  ...performanceChartOptions.value.xaxis,
                  categories: categories
                }
              };

              performanceSeries.value = [
                {
                  name: 'Contrats',
                  type: 'column',
                  data: contracts
                },
                {
                  name: 'Primes',
                  type: 'area',
                  data: primes
                },
                {
                  name: 'Capital',
                  type: 'line',
                  data: capital
                }
              ];
            }
            
            // Recharger aussi les activités pour la nouvelle période
            await loadRecentActivities();
            
            success(`Statistiques mises à jour pour les ${days} derniers jours`);
          }
        } catch (err: any) {
          console.error('❌ Erreur lors du changement de période:', err);
          error('Erreur lors du changement de période');
        }
      };

      const getActivityCardClass = (activity: any) => {
        if (activity.isSuspicious || activity.riskLevel === 'HIGH' || activity.riskLevel === 'CRITICAL') {
          return 'border-danger bg-light-danger';
        }
        if (activity.riskLevel === 'MEDIUM') {
          return 'border-warning bg-light-warning';
        }
        return 'border-light';
      };

      const getActivityIconStyle = (activity: any) => {
        if (activity.isSuspicious || activity.riskLevel === 'HIGH' || activity.riskLevel === 'CRITICAL') {
          return 'background-color: #dc3545; color: white;';
        }
        if (activity.riskLevel === 'MEDIUM') {
          return 'background-color: #ffc107; color: #212529;';
        }
        if (activity.activityType === 'LOGIN_SUCCESS') {
          return 'background-color: #28a745; color: white;';
        }
        if (activity.activityType === 'LOGIN_FAILED') {
          return 'background-color: #dc3545; color: white;';
        }
        if (activity.activityType?.includes('CONTRACT') || activity.activityType?.includes('CUSTOMER')) {
          return 'background-color: #007bff; color: white;';
        }
        return 'background-color: #6c757d; color: white;';
      };

      const getRiskLevelBadgeClass = (riskLevel: string) => {
        switch (riskLevel) {
          case 'LOW': return 'bg-success';
          case 'MEDIUM': return 'bg-warning';
          case 'HIGH': return 'bg-danger';
          case 'CRITICAL': return 'bg-dark';
          default: return 'bg-secondary';
        }
      };

      const getRiskLevelText = (riskLevel: string) => {
        switch (riskLevel) {
          case 'LOW': return 'Faible';
          case 'MEDIUM': return 'Moyen';
          case 'HIGH': return 'Élevé';
          case 'CRITICAL': return 'Critique';
          default: return 'Inconnu';
        }
      };

      const getInitials = (prenom: string, nom: string) => {
        const firstInitial = prenom ? prenom.charAt(0).toUpperCase() : '';
        const lastInitial = nom ? nom.charAt(0).toUpperCase() : '';
        return firstInitial + lastInitial;
      };

      // ---- Helpers statuts contrats ----
      const getContratStatusClass = (state: any) => {
        if (!state) return 'bg-secondary';
        // state est un objet ContractState { id, libelle }
        const id = typeof state === 'object' ? state?.id : state;
        const sid = String(id || '');
        if (sid === '1') return 'bg-success';        // Actif
        if (sid === '2') return 'bg-warning text-dark'; // En attente
        if (sid === '3') return 'bg-danger';         // Suspendu
        if (sid === '4') return 'bg-secondary';      // Annulé
        if (sid === '5') return 'bg-info';           // Terminé / Autre actif
        // Fallback sur libelle si disponible
        const lib = (typeof state === 'object' ? (state?.libelle || '') : String(state)).toLowerCase();
        if (lib.includes('actif') || lib.includes('active')) return 'bg-success';
        if (lib.includes('attente') || lib.includes('pending')) return 'bg-warning text-dark';
        if (lib.includes('suspendu') || lib.includes('suspend')) return 'bg-danger';
        if (lib.includes('annul') || lib.includes('cancel')) return 'bg-secondary';
        if (lib.includes('termin') || lib.includes('complet')) return 'bg-info';
        return 'bg-secondary';
      };

      const getContratStatusLabel = (state: any) => {
        if (!state) return 'Inconnu';
        // state est un objet ContractState { id, libelle }
        if (typeof state === 'object') {
          return state.libelle || state.name || String(state.id || 'Inconnu');
        }
        // state est un nombre ou string brut
        const s = String(state).toLowerCase();
        if (s === '1') return 'Actif';
        if (s === '2') return 'En attente';
        if (s === '3') return 'Suspendu';
        if (s === '4') return 'Annulé';
        if (s === '5') return 'Terminé';
        return String(state);
      };

      // ---- Helpers statuts cotations ----
      const getCotationStatusClass = (status: any) => {
        const s = String(status || '').toLowerCase();
        if (s === 'accepted' || s === 'accepté' || s === 'acceptee') return 'bg-success';
        if (s === 'pending' || s === 'en attente') return 'bg-warning text-dark';
        if (s === 'rejected' || s === 'refusé' || s === 'refused') return 'bg-danger';
        if (s === 'converted' || s === 'converti') return 'bg-primary';
        return 'bg-secondary';
      };

      const getCotationStatusLabel = (status: any) => {
        if (!status) return 'Inconnu';
        if (typeof status === 'object') return status.name || status.libelle || JSON.stringify(status);
        const s = String(status).toLowerCase();
        if (s === 'accepted' || s === 'acceptee') return 'Acceptée';
        if (s === 'pending') return 'En attente';
        if (s === 'rejected' || s === 'refused') return 'Refusée';
        if (s === 'converted') return 'Convertie';
        return String(status);
      };

      // ---- Computed filtres & pagination contrats ----
      const filteredContrats = computed(() => {
        let list = userContrats.value;
        const search = contratsSearch.value.trim().toLowerCase();
        if (search) {
          list = list.filter(c => {
            const name = ((c.customer && (c.customer.firstname + ' ' + c.customer.lastname)) || '').toLowerCase();
            const num = String(c.police || c.reference || c.id || '').toLowerCase();
            const nat = ((c.natureCredit && c.natureCredit.name) || '').toLowerCase();
            const agency = ((c.agency && c.agency.name) || '').toLowerCase();
            return name.includes(search) || num.includes(search) || nat.includes(search) || agency.includes(search);
          });
        }
        if (contratsStatusFilter.value) {
          const f = contratsStatusFilter.value;
          list = list.filter(c => {
            const label = getContratStatusLabel(c.contractState).toLowerCase();
            return label.includes(f);
          });
        }
        return list;
      });

      const pagedContrats = computed(() => {
        const start = (contratsPage.value - 1) * contratsPageSize;
        return filteredContrats.value.slice(start, start + contratsPageSize);
      });

      // ---- Computed filtres & pagination cotations ----
      const filteredCotations = computed(() => {
        let list = userCotations.value;
        const search = cotationsSearch.value.trim().toLowerCase();
        if (search) {
          list = list.filter(q => {
            const clientName = ((q.customer && (q.customer.firstname + ' ' + q.customer.lastname)) || (q.firstname && (q.firstname + ' ' + q.lastname)) || '').toLowerCase();
            const ref = String(q.reference || q.id || '').toLowerCase();
            const type = (q.typeAss || '').toLowerCase();
            return clientName.includes(search) || ref.includes(search) || type.includes(search);
          });
        }
        if (cotationsStatusFilter.value) {
          const f = cotationsStatusFilter.value;
          list = list.filter(q => {
            const label = getCotationStatusLabel(q.status).toLowerCase();
            return label.includes(f);
          });
        }
        return list;
      });

      const pagedCotations = computed(() => {
        const start = (cotationsPage.value - 1) * cotationsPageSize;
        return filteredCotations.value.slice(start, start + cotationsPageSize);
      });

      return {
        // États
        loading,
        activeTab,
        showPhotoModal,
        photoFile,
        photoPreview,
        
        // Données
        user,
        profileForm,
        passwordForm,
        userPermissions,
        selectedModule,
        userAgency,
        productionStats,
        userStats,
        performanceChartOptions,
        performanceSeries,
        recentActivities,
        activeSessions,
        
        // États de modification
        hasUnsavedChanges,
        editMode,
        
        // Propriétés calculées
        profileCompleteness,
        lastLoginFormatted,
        passwordStrength,
        
        // Propriétés calculées pour les permissions
        grantedPermissions,
        deniedPermissions,
        specialPermissions,
        availableModules,
        filteredPermissions,
        
        // Fonctions utilitaires
        formatDate,
        formatCurrency,
        getStatusBadgeClass,
        getStatusText,
        getProgressPercentage,
        
        // Nouvelles fonctions pour l'onglet Production
        getPercentage,
        getPerformanceBadgeClass,
        getPerformanceText,
        drawCharts,
        
        // Actions
        updateProfile,
        updatePassword,
        openPhotoModal,
        closePhotoModal,
        handlePhotoUpload,
        uploadPhoto,
        
        // Chargement des données
        loadProductionStats,
        loadUserStats,
        loadRecentActivities,
        loadActiveSessions,
        terminateSession,
        terminateAllSessions,
        formatTimeAgo,
        
        // Fonctions pour les permissions
        getModulePermissionCount,
        getSourceBadgeStyle,
        getSourceIcon,
        getSourceText,
        
        // Nouvelles variables pour l'onglet Sécurité
        showCurrentPassword,
        showNewPassword,
        showConfirmPassword,
        
        // Paramètres de sécurité avancés
        securitySettings,
        securityStats,
        securityHistory,
        
        // Nouvelles propriétés calculées
        passwordCriteria,
        isPasswordFormValid,
        
        // Nouvelles fonctions pour l'onglet Sécurité
        checkPasswordStrength,
        resetPasswordForm,
        toggle2FA,
        updateSecuritySettings,
        resetSecuritySettings,
        loadSecurityHistory,
        loadSecurityStats,
        loadSecuritySettings,
        
        // Nouvelles fonctions pour l'onglet Activité
        changePeriod,
        getActivityCardClass,
        getActivityIconStyle,
        getRiskLevelBadgeClass,
        getRiskLevelText,
        getInitials,
        
        // Images
        defaultAvatar: defaultAvatar,

        // Onglet Contrats & Cotations
        userContrats,
        userCotations,
        userContratsTotal,
        userCotationsTotal,
        contratsLoading,
        contratsSearch,
        contratsStatusFilter,
        contratsPage,
        cotationsSearch,
        cotationsStatusFilter,
        cotationsPage,
        filteredContrats,
        filteredCotations,
        pagedContrats,
        pagedCotations,
        loadUserContrats,
        getContratStatusClass,
        getContratStatusLabel,
        getCotationStatusClass,
        getCotationStatusLabel,
        contratsPageSize,
        cotationsPageSize
      };
    }
  });
  </script>

<style scoped>
/* Styles responsive pour mobile */
@media (max-width: 768px) {
  /* Navigation des onglets - garder horizontal sur mobile */
  .nav-tabs {
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-bottom: 1px solid #dee2e6;
    padding-bottom: 0;
  }
  
  .nav-item {
    flex: 1;
    min-width: 0;
    margin-bottom: 0;
  }
  
  .nav-link {
    text-align: center;
    border-radius: 0.375rem 0.375rem 0 0 !important;
    margin-bottom: 0;
    white-space: nowrap;
    font-size: 0.85rem;
    padding: 0.5rem 0.75rem;
  }
  
  /* Photo de profil - centrer et réduire la taille */
  .col-md-4 {
    margin-bottom: 2rem;
  }
  
  .rounded-circle {
    width: 100px !important;
    height: 100px !important;
    font-size: 2rem !important;
  }
  
  /* Informations personnelles - empiler les colonnes */
  .col-md-6 {
    margin-bottom: 1rem;
  }
  
  /* Boutons - pleine largeur sur mobile */
  .btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
  
  .d-flex.gap-2 {
    flex-direction: column;
    gap: 0.5rem !important;
  }
  
  /* Cartes d'informations - réduire le padding */
  .card-body {
    padding: 1rem !important;
  }
  
  /* Statistiques - empiler les cartes */
  .col-md-3 {
    margin-bottom: 1rem;
  }
  
  .col-md-6 {
    margin-bottom: 1rem;
  }
  
  /* Graphiques - ajuster la taille */
  canvas {
    max-width: 100%;
    height: auto;
  }
  
  /* Formulaires - améliorer l'espacement */
  .form-control, .form-select {
    font-size: 16px; /* Éviter le zoom sur iOS */
  }
  
  /* Critères de sécurité - réduire la taille de police */
  .small {
    font-size: 0.8rem;
  }
  
  /* Progress bars - ajuster la hauteur */
  .progress {
    height: 6px;
  }
  
  /* Badges - ajuster la taille */
  .badge {
    font-size: 0.75rem;
    padding: 0.5rem;
  }
  
  /* Espacement général */
  .mb-4 {
    margin-bottom: 1.5rem !important;
  }
  
  .mb-3 {
    margin-bottom: 1rem !important;
  }
  
  /* Texte - ajuster les tailles */
  h4 {
    font-size: 1.25rem;
  }
  
  h5 {
    font-size: 1.1rem;
  }
  
  .fs-6 {
    font-size: 0.9rem !important;
  }
  
  /* Input groups - garder horizontal mais optimiser */
  .input-group {
    flex-direction: row;
    display: flex;
    align-items: stretch;
  }
  
  .input-group .form-control {
    flex: 1;
    border-radius: 0.375rem 0 0 0.375rem !important;
    border-right: none;
    min-height: 44px;
  }
  
  .input-group .btn {
    width: auto;
    min-width: 44px;
    height: 44px;
    margin-top: 0;
    border-radius: 0 0.375rem 0.375rem 0 !important;
    border-left: 1px solid #ced4da;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
  }
  
  .input-group .btn:focus {
    box-shadow: none;
    border-color: #86b7fe;
  }
  
  /* Améliorer l'apparence des inputs de mot de passe */
  .input-group .form-control:focus {
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }
  
  /* Espacement entre les groupes d'inputs */
  .input-group {
    margin-bottom: 1rem;
  }
}

/* Styles pour très petits écrans */
@media (max-width: 480px) {
  .card-body {
    padding: 0.75rem !important;
  }
  
  .rounded-circle {
    width: 80px !important;
    height: 80px !important;
    font-size: 1.5rem !important;
  }
  
  .nav-link {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
  
  .btn {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
  
  h4 {
    font-size: 1.1rem;
  }
  
  h5 {
    font-size: 1rem;
  }
  
  .badge {
    font-size: 0.7rem;
    padding: 0.4rem 0.8rem;
  }
  
  /* Input groups sur très petits écrans */
  .input-group .form-control {
    font-size: 16px; /* Éviter le zoom sur iOS */
    min-height: 48px;
  }
  
  .input-group .btn {
    min-width: 48px;
    height: 48px;
  }
}

/* Amélioration de l'accessibilité mobile */
@media (max-width: 768px) {
  /* Augmenter la taille des zones cliquables */
  .nav-link, .btn {
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Améliorer la lisibilité */
  .text-muted {
    color: #6c757d !important;
  }
  
  /* Espacement entre les sections */
  .row {
    margin-bottom: 1rem;
  }
  
  /* Cartes - ajouter de l'ombre pour la profondeur */
  .card {
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    border: 1px solid rgba(0, 0, 0, 0.125);
  }
  
  /* Améliorer l'espacement des icônes */
  .me-2 {
    margin-right: 0.5rem !important;
  }
  
  .me-1 {
    margin-right: 0.25rem !important;
  }
}

/* Styles pour l'orientation paysage sur mobile */
@media (max-width: 768px) and (orientation: landscape) {
  .nav-link {
    font-size: 0.8rem;
    padding: 0.4rem 0.6rem;
  }
}
</style>

