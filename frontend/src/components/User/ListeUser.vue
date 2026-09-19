<template>
  <div>
    <div class="users-container">
    <div class="card mb-25 border-0 rounded-0 bg-white letter-spacing">
    <div
      class="card-head box-shadow bg-white d-flex align-items-center justify-content-between p-15 p-sm-20 p-md-25 flex-wrap gap-3">
      <div class="d-flex align-items-center">
        <router-link
          v-if="canManageUsers"
          class="default-btn position-relative transition border-0 fw-medium pt-11 pb-11 ps-15 pe-15 ps-md-25 pe-md-25 pt-md-12 pb-md-12 ps-md-30 pe-md-30 rounded-1 fs-14 fs-md-15 fs-lg-16 d-inline-block me-10 mb-0 text-decoration-none"
          style="background-color: #33b04a; color: #231f20; border-color: #33b04a;"
          :to="{ name: 'AddUserPage' }">
          <i class="flaticon-plus position-relative ms-2 ms-md-5 fs-12"></i>
          <span class="d-none d-sm-inline">Ajouter</span>
          <span class="d-sm-none">Ajouter</span>
        </router-link>
        
        <!-- Bouton import en masse -->
        <button 
          v-if="canManageUsers"
          class="default-btn position-relative transition border-0 fw-medium pt-11 pb-11 ps-15 pe-15 ps-md-25 pe-md-25 pt-md-12 pb-md-12 ps-md-30 pe-md-30 rounded-1 fs-14 fs-md-15 fs-lg-16 d-none d-md-inline-block me-10 mb-0"
          style="background-color: #17a2b8; color: #ffffff; border-color: #17a2b8;"
          @click="showImportModal = true">
          <i class="fas fa-upload position-relative ms-2 ms-md-5 fs-12"></i>
          <span class="d-none d-lg-inline">Importer</span>
          <span class="d-lg-none">Importer</span>
        </button>
      </div>
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <!-- Filtre Agence (Inline sur grand écran) -->
        <div class="d-none d-xxl-block" style="min-width: 180px;">
          <select 
            v-model="selectedAgence" 
            @change="filtrerUtilisateurs" 
            class="form-select border-gray rounded-1 fs-14 py-2 px-3 shadow-none text-black bg-white"
          >
            <option value="">Toutes les agences</option>
            <option v-for="agence in agences" :key="agence.id" :value="agence.id">{{ agence.name || agence.libelle }}</option>
          </select>
        </div>
        <!-- Filtre Rôle (Inline sur grand écran) -->
        <div class="d-none d-xxl-block" style="min-width: 150px;">
          <select 
            v-model="selectedRole" 
            @change="filtrerUtilisateurs" 
            class="form-select border-gray rounded-1 fs-14 py-2 px-3 shadow-none text-black bg-white"
          >
            <option value="">Tous les rôles</option>
            <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.libelle }}</option>
          </select>
        </div>
        <!-- Bouton Filtres Offcanvas (Écrans moyens & petits) -->
        <button 
          class="btn btn-outline-secondary d-xxl-none d-flex align-items-center gap-2 py-2 px-3 shadow-none rounded-1 fs-14 bg-white border-gray text-black"
          @click="showFiltersOffcanvas = true"
          type="button"
        >
          <i class="fas fa-filter text-success"></i>
          <span>Filtres</span>
          <span v-if="activeFiltersCount > 0" class="badge bg-success text-white ms-1 rounded-pill">
            {{ activeFiltersCount }}
          </span>
        </button>

        <form class="search-box position-relative" @submit.prevent="rechercher">
          <input
            type="text"
            v-model="searchTerm"
            @keyup="rechercher"
            class="form-control shadow-none text-black rounded-0 border-0"
            placeholder="Rechercher..."
          />
          <button
            type="submit"
            class="bg-transparent text-primary transition p-0 border-0"
          >
            <i class="flaticon-search-interface-symbol"></i>
          </button>
        </form>
      </div>
    </div>
    
    <!-- Skeleton loader -->
    <div v-if="loading" class="card-body p-15 p-sm-20 p-md-25">
      <div class="table-responsive">
        <table class="table text-nowrap align-middle mb-0 table-striped">
          <thead>
            <tr>
              <th class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3" style="width: 200px;">Utilisateur</th>
              <th class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">Contact</th>
              <th class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">Fonction</th>
              <th class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">Rôle</th>
              <th class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">Agence</th>
              <th class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">Naissance</th>
              <th class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">Statut</th>
              <th class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3 pe-0">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in 8" :key="i" class="skeleton-row">
              <td>
                <div class="d-flex align-items-center">
                  <div class="skeleton-circle me-3"></div>
                  <div>
                    <div class="skeleton-line" style="width: 130px;"></div>
                    <div class="skeleton-line mt-1" style="width: 70px; height: 10px;"></div>
                  </div>
                </div>
              </td>
              <td><div class="skeleton-line" style="width: 110px;"></div></td>
              <td><div class="skeleton-line" style="width: 90px;"></div></td>
              <td><div class="skeleton-badge"></div></td>
              <td><div class="skeleton-line" style="width: 110px;"></div></td>
              <td><div class="skeleton-line" style="width: 80px;"></div></td>
              <td><div class="skeleton-badge"></div></td>
              <td><div class="skeleton-btn"></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="card-body p-15 p-sm-20 p-md-25">
      <div class="table-responsive">
        <table class="table text-nowrap align-middle mb-0 table-striped">
          <thead>
            <tr>
              <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3" style="width: 200px;">Utilisateur</th>
              <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3" style="width: 180px;">Contact</th>
              <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3" style="width: 120px;">Fonction</th>
              <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3" style="width: 120px;">Rôle</th>
              <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3" style="width: 150px;">Agence</th>
              <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3" style="width: 100px;">Naissance</th>
              <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3" style="width: 100px;">Statut</th>
              <th key="actions" scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3 text pe-0" style="width: 120px;">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="8" class="text-center text-muted py-4">
                Aucun utilisateur trouvé
              </td>
            </tr>
            <tr v-for="(user, index) in filteredUsers" :key="`user-${user.id || index}`">
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <div class="d-flex align-items-center">
                  <div class="me-3">
                    <div 
                      class="avatar-circle"
                      :style="!user.avatar ? { background: getAvatarColor(user.lastname + user.firstname) } : {}"
                    >
                      <img v-if="user.avatar" :src="user.avatar" :alt="`${user.firstname} ${user.lastname}`" class="w-100 h-100 rounded-circle object-fit-cover">
                      <span v-else style="color:#fff;font-weight:700;font-size:13px;line-height:1;">{{ getInitials(user) }}</span>
                    </div>
                  </div>
                  <div>
                    <strong class="text-dark">{{ user.lastname }} {{ user.firstname }}</strong>
                    <br>
                    <small class="text-muted">
                      <i :class="user.gender === 'M' ? 'flaticon-male' : 'flaticon-female'" class="me-1"></i>
                      {{ user.gender === 'M' ? 'Masculin' : 'Féminin' }}
                    </small>
                  </div>
                </div>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <div>
                  <strong class="text-success">
                    <i class="flaticon-phone-call me-1"></i>
                    {{ user.phone }}
                  </strong>
                  <div class="mt-1">
                    <small class="text-info">
                      <i class="flaticon-email me-1"></i>
                      {{ user.email }}
                    </small>
                  </div>
                </div>
              </td>
              
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <span class="text-dark">{{ user.fonction || '-' }}</span>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <span class="badge bg-primary">
                  <i class="flaticon-shield me-1"></i>
                  {{ user.role?.libelle || 'Role #' + user.idRole }}
                </span>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <div>
                  <strong class="text-info">
                    {{ user.agency?.name || user.agency?.libelle || (user.idAgency ? 'Agence #' + user.idAgency : 'Non assignée') }}
                  </strong>
                  <div v-if="user.agency?.location" class="mt-1">
                    <small class="text-muted">
                      <i class="flaticon-location me-1"></i>
                      {{ user.agency.location }}
                    </small>
                  </div>
                </div>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <div>
                  <strong>{{ formatDate(user.birthdate) }}</strong>
                  <div v-if="user.birthdate" class="mt-1">
                    <small class="badge bg-light text-dark">{{ calculateAge(user.birthdate) }} ans</small>
                  </div>
                </div>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <span :class="getStatutClass(user)">
                  <i :class="getStatutIcon(user)" class="me-1"></i>
                  {{ getStatutTexte(user) }}
                </span>
              </td>

              <td class="shadow-none lh-1 fw-medium text-body-tertiary text pe-0">
                <button
                  v-if="user.id"
                  @click="voirDetails(user)"
                  class="btn btn-sm btn-fnda py-1 px-3 fs-13 d-inline-flex align-items-center gap-1"
                  style="background-color: #33b04a; color: #231f20; border-color: #33b04a; font-weight: 500;"
                >
                  <i class="flaticon-eye me-1 fs-12"></i>
                  Détails
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination (hidden when filters are active since all data is loaded client-side) -->
      <div
        class="pagination-area d-md-flex mt-15 mt-sm-20 mt-md-25 justify-content-between align-items-center"
        v-if="totalElements > 0 && !selectedAgence && !selectedRole"
      >
        <PaginationComponent 
          :page="page" 
          :totalPages="totalPages" 
          :totalElements="totalElements" 
          :limit="limit" 
          @paginate="handlePaginate" 
        />
      </div>
      <!-- Filter active: show count only -->
      <div v-else-if="(selectedAgence || selectedRole) && filteredUsers.length >= 0"
        class="mt-15 mt-sm-20 mt-md-25 d-flex align-items-center gap-2 px-1"
      >
        <span class="badge bg-soft-fnda text-fnda px-3 py-2 rounded-pill fs-13 fw-semibold">
          <i class="ph-bold ph-funnel me-1"></i>
          {{ filteredUsers.length }} résultat{{ filteredUsers.length > 1 ? 's' : '' }} trouvé{{ filteredUsers.length > 1 ? 's' : '' }}
        </span>
        <button @click="clearAllFilters" class="btn btn-sm btn-outline-secondary rounded-pill fs-13">
          <i class="ph-bold ph-x me-1"></i> Effacer les filtres
        </button>
      </div>
    </div>
  </div>

  <!-- Modal détails -->
  <Modal 
    :isVisible="showDetailsModal"
    :title="`Détails de l'utilisateur ${userDetails?.firstname || ''} ${userDetails?.lastname || ''}`"
    icon="flaticon-user"
    size="xlarge"
    @close="closeDetailsModal"
    @update:isVisible="showDetailsModal = $event"
  >
    <template #default>
      <div v-if="userDetails">
          <!-- Navigation par onglets -->
          <ul class="nav nav-tabs nav-tabs-custom mb-4" id="userTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active d-flex align-items-center" 
                      id="info-tab" 
                      data-bs-toggle="tab" 
                      data-bs-target="#info-panel" 
                      type="button" 
                      role="tab" 
                      aria-controls="info-panel" 
                      aria-selected="true">
                <i class="flaticon-user me-2"></i>
                Informations Utilisateur
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link d-flex align-items-center" 
                      id="contrats-tab" 
                      data-bs-toggle="tab" 
                      data-bs-target="#contrats-panel" 
                      type="button" 
                      role="tab" 
                      aria-controls="contrats-panel" 
                      aria-selected="false"
                      @click="() => chargerContratsUtilisateur()">
                <i class="flaticon-file-1 me-2"></i>
                Contrats 
                <span v-if="userContratsSummary" class="badge bg-primary ms-2">
                  {{ userContratsSummary.totalContracts }}
                </span>
                <span v-else-if="userContrats.length > 0" class="badge bg-secondary ms-2">
                  {{ userContrats.length }}+
                </span>
              </button>
            </li>
          </ul>

          <!-- Contenu des onglets -->
          <div class="tab-content" id="userTabsContent">
            
            <!-- Onglet Informations Utilisateur -->
            <div class="tab-pane fade show active" 
                 id="info-panel" 
                 role="tabpanel" 
                 aria-labelledby="info-tab">
              
              <!-- Header avec photo et infos principales -->
              <div class="user-profile-header mb-4">
                <div class="row align-items-center">
                  <div class="col-auto">
                    <div class="user-avatar">
                      <img v-if="userDetails.avatar" 
                           :src="userDetails.avatar" 
                           :alt="`${userDetails.firstname} ${userDetails.lastname}`" 
                           class="avatar-img">
                      <div v-else class="avatar-placeholder">
                        <span class="avatar-initials">{{ getInitials(userDetails) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="col">
                    <h3 class="user-name mb-2">{{ userDetails.lastname }} {{ userDetails.firstname }}</h3>
                    <div class="user-status">
                      <span :class="getStatutClass(userDetails)" class="status-badge">
                        <i :class="getStatutIcon(userDetails)"></i>
                        {{ getStatutTexte(userDetails) }}
                      </span>
                    </div>
                  </div>
                  <div class="col-auto">
                    <div class="user-role">
                      <span class="role-badge">
                        <i class="flaticon-shield"></i>
                        {{ userDetails.role?.libelle || 'Rôle non défini' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Informations détaillées -->
              <div class="row g-4">
                <!-- Informations personnelles -->
                <div class="col-md-6">
                  <div class="info-card">
                    <div class="info-card-header">
                      <i class="flaticon-user"></i>
                      <h5>Informations personnelles</h5>
                    </div>
                    <div class="info-card-body">
                      <div class="info-row">
                        <span class="info-label">Genre</span>
                        <span class="info-value">
                          <i :class="userDetails.gender === 'M' ? 'flaticon-male' : 'flaticon-female'"></i>
                          {{ userDetails.gender === 'M' ? 'Masculin' : 'Féminin' }}
                        </span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Date de naissance</span>
                        <span class="info-value">
                          <i class="flaticon-calendar"></i>
                          {{ formatDate(userDetails.birthdate) }}
                        </span>
                      </div>
                      <div v-if="userDetails.birthdate" class="info-row">
                        <span class="info-label">Âge</span>
                        <span class="info-value age-value">
                          {{ calculateAge(userDetails.birthdate) }} ans
                        </span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Version</span>
                        <span class="info-value version-value">
                          v{{ userDetails.version }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Contact -->
                <div class="col-md-6">
                  <div class="info-card">
                    <div class="info-card-header">
                      <i class="flaticon-phone-call"></i>
                      <h5>Contact</h5>
                    </div>
                    <div class="info-card-body">
                      <div class="info-row">
                        <span class="info-label">Téléphone</span>
                        <span class="info-value">
                          <i class="flaticon-phone-call"></i>
                          <a :href="`tel:${userDetails.phone}`" class="contact-link">
                            {{ userDetails.phone || '-' }}
                          </a>
                        </span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Email</span>
                        <span class="info-value">
                          <i class="flaticon-email"></i>
                          <a :href="`mailto:${userDetails.email}`" class="contact-link">
                            {{ userDetails.email || '-' }}
                          </a>
                        </span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Adresse</span>
                        <span class="info-value">
                          <i class="flaticon-location"></i>
                          {{ userDetails.address || '-' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Informations professionnelles -->
                <div class="col-md-6">
                  <div class="info-card">
                    <div class="info-card-header">
                      <i class="flaticon-briefcase"></i>
                      <h5>Professionnel</h5>
                    </div>
                    <div class="info-card-body">
                      <div class="info-row">
                        <span class="info-label">Fonction</span>
                        <span class="info-value">
                          <i class="flaticon-briefcase"></i>
                          {{ userDetails.fonction || '-' }}
                        </span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Rôle</span>
                        <span class="info-value">
                          <i class="flaticon-shield"></i>
                          {{ userDetails.role?.libelle || 'Non défini' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Agence -->
                <div class="col-md-6">
                  <div class="info-card">
                    <div class="info-card-header">
                      <i class="flaticon-building"></i>
                      <h5>Agence</h5>
                    </div>
                    <div class="info-card-body">
                      <div class="info-row">
                        <span class="info-label">Nom</span>
                        <span class="info-value">
                          <i class="flaticon-building"></i>
                          {{ userDetails.agency?.name || 'Non définie' }}
                        </span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Adresse</span>
                        <span class="info-value">
                          <i class="flaticon-location"></i>
                          {{ userDetails.agency?.location || 'Non renseignée' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            <!-- Onglet Contrats -->
            <div class="tab-pane fade" 
                 id="contrats-panel" 
                 role="tabpanel" 
                 aria-labelledby="contrats-tab">
              
              <!-- Résumé des contrats -->
              <div v-if="userContratsSummary" class="row g-2 mb-3">
                <div class="col-6 col-md-3">
                  <div class="card border-0 shadow-sm h-100 stats-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <div class="card-body text-center py-3 text-white">
                      <i class="flaticon-file-1 fs-4 mb-1"></i>
                      <h5 class="mb-0 fw-bold">{{ userContratsSummary.totalContracts }}</h5>
                      <small class="opacity-75">Total</small>
                    </div>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="card border-0 shadow-sm h-100 stats-card" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
                    <div class="card-body text-center py-3 text-white">
                      <i class="flaticon-check fs-4 mb-1"></i>
                      <h5 class="mb-0 fw-bold">{{ userContratsSummary.activeContracts }}</h5>
                      <small class="opacity-75">Actifs</small>
                    </div>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="card border-0 shadow-sm h-100 stats-card" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
                    <div class="card-body text-center py-3 text-dark">
                      <i class="flaticon-pause fs-4 mb-1"></i>
                      <h5 class="mb-0 fw-bold">{{ userContratsSummary.suspendedContracts }}</h5>
                      <small class="opacity-75">Suspendus</small>
                    </div>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="card border-0 shadow-sm h-100 stats-card" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
                    <div class="card-body text-center py-3 text-dark">
                      <i class="flaticon-money fs-4 mb-1"></i>
                      <h6 class="mb-0 fw-bold small montant-display">{{ formatMontant(userContratsSummary.totalValue) }}</h6>
                      <small class="opacity-75">Valeur totale</small>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="card">
                <div class="card-header text-dark d-flex justify-content-between align-items-center" style="background-color: #dee2e6; border-bottom: 1px solid #dee2e6;">
                  <h5 class="card-title mb-0">
                    <i class="flaticon-file-1 me-2 text-info"></i>
                    Contrats ({{ userContrats.length }}{{ contratsTotalElements > userContrats.length ? ` / ${contratsTotalElements}` : '' }})
                  </h5>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" 
                            @click="actualiserContrats" 
                            :disabled="loadingContrats"
                            title="Actualiser">
                      <i class="flaticon-refresh"></i>
                    </button>
                    <button class="btn btn-outline-primary" 
                            @click="exporterContratsUtilisateur" 
                            :disabled="exportingContrats || userContrats.length === 0"
                            title="Exporter la production">
                      <div v-if="exportingContrats" class="spinner-border spinner-border-sm" role="status">
                        <span class="visually-hidden">Export...</span>
                      </div>
                      <i v-else class="flaticon-download"></i>
                    </button>
                  </div>
                </div>
                <div class="card-body" style="background-color: #dee2e6;">
                  <div v-if="loadingContrats" class="text-center py-4">
                    <div class="spinner-border" role="status">
                      <span class="visually-hidden">Chargement...</span>
                    </div>
                  </div>
                  <div v-else-if="userContrats.length === 0" class="text-center py-5">
                    <i class="flaticon-file-1 fs-1 text-muted opacity-50 mb-3"></i>
                    <h5 class="text-muted">Aucun contrat trouvé</h5>
                    <p class="text-muted">Cet utilisateur ne gère pas encore de contrat</p>
                  </div>
                  <div v-else>
                    <!-- Version responsive pour mobile -->
                    <div class="d-md-none">
                      <div v-for="contrat in userContrats" :key="contrat.code" class="card mb-3 border">
                        <div class="card-body">
                          <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title text-primary mb-0">{{ contrat.customer?.firstname }} {{ contrat.customer?.lastname }}</h6>
                          </div>
                          <p class="card-text">
                            <strong>Police:</strong> <span class="badge bg-info">{{ contrat.police }}</span><br>
                            <strong>Capital:</strong> <span class="text-success fw-bold">{{ formatMontant(contrat.capital) }}</span><br>
                            <strong>Prime TTC:</strong> <span class="text-warning fw-bold">{{ formatMontant(contrat.puttc) || '-' }}</span>
                          </p>
                          <div class="btn-group btn-group-sm w-100">
                            <button class="btn btn-outline-danger" 
                                    @click="genererPDFContrat(contrat.id)"
                                    :disabled="loadingContrats"
                                    title="Générer PDF">
                              <i v-if="!loadingContrats" class="flaticon-file-1 me-1"></i>
                              <div v-else class="spinner-border spinner-border-sm me-1" role="status">
                                <span class="visually-hidden">Chargement...</span>
                              </div>
                              {{ loadingContrats ? 'Génération...' : 'PDF' }}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Version tableau pour desktop -->
                    <div class="table-responsive d-none d-md-block">
                      <table class="table table-sm table-hover">
                        <thead class="table-light">
                          <tr>
                            <th>Client</th>
                            <th>Police</th>
                            <th>Capital</th>
                            <th>Prime TTC</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="contrat in userContrats" :key="contrat.code">
                            <td>
                              <div>
                                <strong>{{ contrat.customer?.firstname }} {{ contrat.customer?.lastname }}</strong>
                                <div v-if="contrat.customer?.phone" class="small text-muted">
                                  <i class="flaticon-phone-call me-1"></i>{{ contrat.customer.phone }}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span class="badge bg-info">{{ contrat.police }}</span>
                            </td>
                            <td>
                              <strong class="text-success">{{ formatMontant(contrat.capital) }}</strong>
                            </td>
                            <td>
                              <strong class="text-warning">{{ formatMontant(contrat.puttc) || '-' }}</strong>
                            </td>
                            <td>
                              <button class="btn btn-outline-danger btn-sm" 
                                      @click="genererPDFContrat(contrat.id)"
                                      :disabled="loadingContrats"
                                      title="Générer PDF">
                                <i v-if="!loadingContrats" class="flaticon-file-1 me-1"></i>
                                <div v-else class="spinner-border spinner-border-sm me-1" role="status">
                                  <span class="visually-hidden">Chargement...</span>
                                </div>
                                {{ loadingContrats ? 'Génération...' : 'PDF' }}
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <!-- Pagination des contrats -->
                    <div class="mt-3">
                      <div v-if="contratsTotalElements > 0">
                        <PaginationComponent 
                          :page="contratsPage"
                          :totalPages="contratsTotalPages"
                          :limit="contratsLimit"
                          :totalElements="contratsTotalElements"
                          @paginate="handleContratsPagination"
                        />
                      </div>
                      <div v-else class="text-center text-muted">
                        <small>Aucun contrat trouvé</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn-sm btn-secondary" @click="closeDetailsModal" style="background-color: #6c757d; border-color: #6c757d; color: white;">
        <i class="flaticon-cancel me-1"></i>Fermer
      </button>
      
      <button type="button" class="btn btn-sm btn-warning" 
              v-if="userDetails?.id && userDetails?.status === 'ACTIVE'" 
              @click="reinitialiserMotDePasse(userDetails)"
              style="background-color: #e67e22; border-color: #e67e22; color: white;">
        <i class="flaticon-lock me-1"></i>Réinitialiser MDP
      </button>
      
      <button type="button" class="btn btn-sm btn-primary" 
              v-if="userDetails?.id && userDetails?.status === 'ACTIVE'" 
              @click="modifier(userDetails)"
              style="background-color: #3498db; border-color: #3498db; color: white;">
        <i class="flaticon-pen me-1"></i>Modifier
      </button>
    </template>
  </Modal>

  <!-- Modal Ajouter Permissions -->
  <div class="modal fade" id="addPermissionsModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered">
      <div class="modal-content shadow-lg">
        <div class="modal-header">
          <h4 class="modal-title fw-bold d-flex align-items-center gap-2">
            <img src="@/assets/images/logo-guda-with.png" alt="L'Africaine Vie" class="modal-inline-logo" />
            <span>Ajouter des permissions à {{ selectedUser?.firstname }} {{ selectedUser?.lastname }}</span>
          </h4>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        
        <div class="modal-body p-4" v-if="selectedUser">
          <div v-if="loadingAvailablePermissions" class="text-center py-4">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Chargement des permissions...</span>
            </div>
          </div>
          
          <div v-else>
            <!-- Informations utilisateur -->
            <div class="card mb-4">
              <div class="card-header text-dark" style="background-color: #f8f9fa; border-bottom: 1px solid #dee2e6;">
                <h6 class="card-title mb-0">
                  <i class="flaticon-user me-2 text-info"></i>
                  Informations utilisateur
                </h6>
              </div>
              <div class="card-body" style="background-color: #f8f9fa;">
                <div class="row">
                  <div class="col-md-6">
                    <strong>Nom complet :</strong> {{ selectedUser.firstname }} {{ selectedUser.lastname }}
                  </div>
                  <div class="col-md-6">
                    <strong>Rôle :</strong> 
                    <span class="badge bg-primary ms-2">{{ selectedUser.role?.libelle || 'Rôle #' + selectedUser.idRole }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Formulaire d'ajout de permissions -->
            <div class="card">
              <div class="card-header text-dark" style="background-color: #e2e3e5; border-bottom: 1px solid #dee2e6;">
                <h6 class="card-title mb-0">
                  <i class="flaticon-plus me-2 text-success"></i>
                  Sélectionner les permissions à ajouter
                </h6>
              </div>
              <div class="card-body" style="background-color: #e2e3e5;">
                
                <!-- Recherche de permissions -->
                <div class="mb-4">
                  <div class="row">
                    <div class="col-md-8">
                      <input 
                        type="text" 
                        class="form-control" 
                        v-model="permissionSearchTerm"
                        @input="filtrerPermissions"
                        placeholder="Rechercher une permission..."
                      >
                    </div>
                    <div class="col-md-4">
                      <select 
                        class="form-select" 
                        v-model="selectedModule"
                        @change="filtrerPermissions"
                      >
                        <option value="">Tous les modules</option>
                        <option v-for="module in availableModules" :key="module" :value="module">
                          {{ module }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Liste des permissions par module -->
                <div v-if="filteredPermissions.length === 0" class="text-center py-4">
                  <i class="flaticon-search fs-1 text-muted opacity-50 mb-3"></i>
                  <h6 class="text-muted">Aucune permission trouvée</h6>
                  <p class="text-muted">Essayez de modifier vos critères de recherche</p>
                </div>

                <div v-else>
                  <div v-for="(permissions, module) in groupedFilteredPermissions" :key="module" class="mb-4">
                    <h6 class="text-primary mb-3">
                      <i class="flaticon-folder me-2"></i>
                      Module: {{ module }}
                    </h6>
                    
                    <div class="row g-2">
                      <div v-for="permission in permissions" :key="permission.id" class="col-md-6">
                        <div class="card border-light">
                          <div class="card-body p-3">
                            <div class="form-check">
                              <input 
                                class="form-check-input" 
                                type="checkbox" 
                                :id="`permission-${permission.id}`"
                                :value="permission.id"
                                v-model="selectedPermissions"
                                :disabled="permission.alreadyHas"
                              >
                              <label class="form-check-label" :for="`permission-${permission.id}`">
                                <div class="d-flex justify-content-between align-items-start">
                                  <div>
                                    <strong>{{ permission.name }}</strong>
                                    <br>
                                    <small class="text-muted">{{ permission.description }}</small>
                                    <br>
                                    <span class="badge bg-light text-dark">{{ permission.action }}</span>
                                  </div>
                                  <div>
                                    <span v-if="permission.alreadyHas" class="badge bg-warning">
                                      <i class="flaticon-check me-1"></i>
                                      Déjà attribuée
                                    </span>
                                    <span v-else-if="permission.isSystemPermission" class="badge bg-danger">
                                      <i class="flaticon-warning me-1"></i>
                                      Système
                                    </span>
                                  </div>
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Options avancées -->
                <div class="card mt-4">
                  <div class="card-header">
                    <h6 class="card-title mb-0">
                      <i class="flaticon-settings me-2"></i>
                      Options avancées
                    </h6>
                  </div>
                  <div class="card-body">
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label class="form-label">Type de permission</label>
                        <select class="form-select" v-model="permissionType">
                          <option value="granted">Accordée</option>
                          <option value="denied">Refusée</option>
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Accordée par</label>
                        <input type="text" class="form-control" v-model="grantedBy" placeholder="admin">
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Date d'expiration (optionnel)</label>
                        <input type="datetime-local" class="form-control" v-model="expiresAt">
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Raison (optionnel)</label>
                        <input type="text" class="form-control" v-model="reason" placeholder="Raison de l'attribution">
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="background-color: #f8f9fa; border-top: 1px solid #dee2e6;">
          <button type="button" class="btn btn-lg" 
                  style="background-color: #dee2e6; color: #495057; border-color: #dee2e6;" 
                  data-bs-dismiss="modal">
            <i class="flaticon-cancel me-2"></i>Annuler
          </button>
          
          <button type="button" class="btn btn-lg" 
                  style="background-color: #e2e3e5; color: #495057; border-color: #e2e3e5;"
                  @click="resetPermissionForm">
            <i class="flaticon-refresh me-2"></i>Réinitialiser
          </button>
          
          <button type="button" class="btn btn-primary btn-lg" 
                  @click="ajouterPermissions"
                  :disabled="selectedPermissions.length === 0 || savingPermissions">
            <div v-if="savingPermissions" class="spinner-border spinner-border-sm me-2" role="status">
              <span class="visually-hidden">Sauvegarde...</span>
            </div>
            <i v-else class="flaticon-plus me-2"></i>
            {{ savingPermissions ? 'Ajout en cours...' : `Ajouter ${selectedPermissions.length} permission(s)` }}
          </button>
        </div>
      </div>
    </div>
  </div>
  </div>

    <!-- Modal d'importation en masse -->
    <ImportUsersModal
      :isVisible="showImportModal"
      @close="showImportModal = false"
      @imported="handleUsersImported"
    />

    <!-- Offcanvas overlay -->
    <div v-if="showFiltersOffcanvas" class="filters-offcanvas-overlay" @click="showFiltersOffcanvas = false"></div>

    <!-- Offcanvas filters panel -->
    <div class="filters-offcanvas" :class="{ 'show': showFiltersOffcanvas }">
      <div class="offcanvas-header d-flex align-items-center justify-content-between p-3">
        <h5 class="m-0 d-flex align-items-center gap-2">
          <i class="fas fa-filter text-success"></i>
          <span>Filtres & Actions</span>
        </h5>
        <button type="button" class="btn-close shadow-none" @click="showFiltersOffcanvas = false" aria-label="Close"></button>
      </div>
      <div class="offcanvas-body p-3">
        <!-- Agence -->
        <div class="mb-3">
          <label class="form-label fw-semibold text-muted fs-12 mb-1">Agence</label>
          <select 
            v-model="selectedAgence" 
            @change="filtrerUtilisateurs" 
            class="form-select border-gray rounded-1 fs-14 py-2 shadow-none text-black bg-white"
          >
            <option value="">Toutes les agences</option>
            <option v-for="agence in agences" :key="agence.id" :value="agence.id">{{ agence.name || agence.libelle }}</option>
          </select>
        </div>

        <!-- Rôle -->
        <div class="mb-3">
          <label class="form-label fw-semibold text-muted fs-12 mb-1">Rôle</label>
          <select 
            v-model="selectedRole" 
            @change="filtrerUtilisateurs" 
            class="form-select border-gray rounded-1 fs-14 py-2 shadow-none text-black bg-white"
          >
            <option value="">Tous les rôles</option>
            <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.libelle }}</option>
          </select>
        </div>


        <div class="d-md-none mt-4">
          <hr class="text-black-50">
          <label class="form-label fw-semibold text-muted fs-12 mb-1">Actions</label>
          <button 
            v-if="canManageUsers"
            class="btn btn-info w-100 text-white d-flex align-items-center justify-content-center gap-2 py-2 fs-14 rounded-1"
            @click="showImportModal = true; showFiltersOffcanvas = false"
            type="button"
          >
            <i class="fas fa-upload fs-12"></i>
            Importer des utilisateurs
          </button>
        </div>

        <!-- Reset Button -->
        <div class="mt-4">
          <button 
            class="btn btn-light border-gray w-100 py-2 fs-14 text-black rounded-1"
            @click="clearAllFilters"
            type="button"
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import ApiService from "../../services/ApiService";
import JwtService from "../../services/JwtService";
import { error, success } from "../../utils/utils";
import PaginationComponent from '../Utilities/Pagination.vue';
import Modal from '../Common/Modal.vue';
import ImportUsersModal from './ImportUsersModal.vue';
import { nextTick } from 'vue';
import { useAuthStore } from "../../services/auth";
import { ExcelExporter, ExcelFormatters, type ExcelData } from '../../utils/excelUtils';
import { XlsxExporter, XlsxFormatters, type XlsxSheet } from '../../utils/xlsxUtils';

// Interface pour les utilisateurs
interface User {
  id: number;
  idRole: number;
  idAgency: number;
  lastname: string;
  firstname: string;
  birthdate: string;
  gender: "M" | "F";
  avatar?: string;
  address: string;
  phone: string;
  email: string;
  fonction?: string;
  password: string;
  salt: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  role?: {
    id: number;
    name: string;
    libelle?: string;
    description?: string;
  };
  agency?: {
    id: number;
    name: string;
    libelle?: string;
    location?: string;
  };
  contracts?: any[];
  userPermissions?: any[];
}

// Interface pour les contrats dans le modal
interface ContratUser {
  id: number;
  code: string;
  police: string;
  capital: number;
  primeTTC: number;
  puttc: number;
  status: number;
  dateEff: string;
  dateEch: string;
  refCompte: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    code: string;
    firstname: string;
    lastname: string;
    email?: string;
    phone?: string;
  };
  agency?: {
    id: number;
    name: string;
    libelle?: string;
    location?: string;
  };
  product?: {
    id: number;
    descProduct: string;
    codeProduct: string;
  };
}

// Interface pour le résumé des contrats
interface ContratsSummary {
  totalContracts: number;
  activeContracts: number;
  suspendedContracts: number;
  totalValue: number;
  averageValue: number;
}

// Interface pour les permissions
interface UserPermission {
  id: number;
  name: string;
  description?: string;
  module: string;
  action: string;
  granted: boolean;
  source: string;
  userPermissionId?: number;
  permission?: {
    id: number;
    name: string;
    description?: string;
  };
}

// Interface pour les permissions disponibles
interface AvailablePermission {
  id: number;
  name: string;
  slug: string;
  description?: string;
  module: string;
  action: string;
  isSystemPermission: boolean;
  alreadyHas?: boolean;
}

export default defineComponent({
  name: "ListeUtilisateurs",
  components: {
    PaginationComponent,
    Modal,
    ImportUsersModal
  },
  setup() {
    // Composables
    const router = useRouter();
    const authStore = useAuthStore();
    const canManageUsers = computed(() => {
      const roleName = (authStore.user?.role?.libelle || authStore.user?.role || '').toString().toUpperCase();
      return authStore.user?.idRole === 1 || authStore.user?.idRole === 5 || roleName === 'ADMIN' || roleName === 'SUPER ADMIN' || roleName === 'SUPER_ADMIN';
    });

    // Refs
    const users = ref<Array<User>>([]);   
    const userDetails = ref<User | null>(null);
    const userContrats = ref<Array<ContratUser>>([]);
    const userContratsSummary = ref<ContratsSummary | null>(null);
    const userPermissions = ref<Array<UserPermission>>([]);
    const loading = ref(false);
    const loadingContrats = ref(false);
    const loadingPermissions = ref(false);
    const showDetailsModal = ref(false);
    const showImportModal = ref(false);

    // Pagination des contrats
    const contratsPage = ref(1);
    const contratsLimit = ref(7);
    const contratsTotalPages = ref(0);
    const contratsTotalElements = ref(0);
    const contratsHasMore = ref(false);
    const exportingContrats = ref(false);

    // Modal permissions
    const selectedUser = ref<User | null>(null);
    const availablePermissions = ref<Array<AvailablePermission>>([]);
    const filteredPermissions = ref<Array<AvailablePermission>>([]);
    const selectedPermissions = ref<Array<number>>([]);
    const loadingAvailablePermissions = ref(false);
    const savingPermissions = ref(false);
    const permissionSearchTerm = ref('');
    const selectedModule = ref('');
    const permissionType = ref('granted');
    const grantedBy = ref('admin');
    const expiresAt = ref('');
    const reason = ref('');

    // Pagination
    const searchTerm = ref('');
    const page = ref(1);
    const totalPages = ref(0);
    const limit = ref(10);
    const totalElements = ref(0);

    // Computed properties pour les permissions
    const availableModules = computed(() => {
      const modules = [...new Set(availablePermissions.value.map(p => p.module))];
      return modules.sort();
    });

    const groupedFilteredPermissions = computed(() => {
      const grouped: Record<string, AvailablePermission[]> = {};
      filteredPermissions.value.forEach(permission => {
        if (!grouped[permission.module]) {
          grouped[permission.module] = [];
        }
        grouped[permission.module].push(permission);
      });
      return grouped;
    });

    const handlePaginate = ({ page_, limit_ }: { page_: number; limit_: number }) => {
      try {
        page.value = page_;
        limit.value = limit_;
        getAllUsers(page_, limit_, searchTerm.value);
      } catch (err) {
        console.error('Erreur pagination:', err);
      }
    };

    function rechercher() {
      page.value = 1;
      getAllUsers(page.value, limit.value, searchTerm.value);
    }

    async function getAllUsers(pageNum = 1, limitNum = 10, search = '') {
  try {
    loading.value = true;
    
    const params = new URLSearchParams({
      page: pageNum.toString(),
      limit: limitNum.toString(),
      includeRole: 'true',
      includeAgency: 'true',
      ...(search && { search })
    });

    const url = `/users?${params}`;

    const response = await ApiService.get(url);
    const { data } = response;
    
    if (!data) {
      console.error("❌ Aucune donnée reçue de l'API");
      users.value = [];
      totalPages.value = 0;
      totalElements.value = 0;
      return;
    }

    // Adapter à la structure de réponse du backend : { data: { message: string, users: User[], pagination: {...} } }
    if (data && data.data && data.data.users && Array.isArray(data.data.users)) {
      // Utiliser les utilisateurs retournés par le backend (déjà filtrés et paginés côté serveur)
      users.value = data.data.users;
      
      // Utiliser les métadonnées de pagination du backend
      if (data.data.pagination) {
        totalElements.value = data.data.pagination.total;
        totalPages.value = data.data.pagination.totalPages;
        page.value = data.data.pagination.page;
        limit.value = data.data.pagination.limit;
      } else {
        // Fallback si les métadonnées ne sont pas disponibles
        totalElements.value = users.value.length;
        totalPages.value = 1;
        page.value = pageNum;
        limit.value = limitNum;
      }
    } else if (data && data.data && Array.isArray(data.data)) {
      // Fallback pour compatibilité avec l'ancienne structure
      users.value = data.data;
      totalPages.value = 1;
      totalElements.value = users.value.length;
      page.value = pageNum;
      limit.value = limitNum;
    } else {
      // Chercher le tableau d'utilisateurs dans l'objet
      const possibleArrays = Object.values(data?.data || {}).filter(Array.isArray);
      if (possibleArrays.length > 0) {
        users.value = possibleArrays[0] as User[];
      } else {
        console.warn("⚠️ Aucun tableau d'utilisateurs trouvé dans data.data");
        users.value = [];
      }
      
      totalPages.value = 1;
      totalElements.value = users.value.length;
      page.value = pageNum;
      limit.value = limitNum;
    }
    
  } catch (err: any) {
    console.error("❌ Erreur lors de la récupération des utilisateurs:", err);
    console.error("❌ Détails de l'erreur:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    error(err?.response?.data?.message || "Erreur lors de la récupération des utilisateurs");
    users.value = [];
    totalPages.value = 0;
    totalElements.value = 0;
  } finally {
    loading.value = false;
  }
}
    // Fonction utilitaire pour fermer le modal avant navigation
    function closeModalBeforeNavigation() {
      closeDetailsModal();
    }

function modifier(editUser: User) {
  
  // Fermer le modal si ouvert
  closeModalBeforeNavigation();
  
  try {
    // ✅ Utiliser le nom de route exact de votre router
    router.push({ 
      name: "EditUserPage", 
      params: { id: editUser.id.toString() } 
    });
  } catch (err) {
    console.error('❌ Erreur lors de la navigation:', err);
    error('Erreur lors de la navigation vers la page de modification.');
  }
}
    function voirDetails(user: User) {
      if (!user || !user.id) return;
      try {
        router.push({
          name: "UserDetailPage",
          params: { id: user.id.toString() }
        });
      } catch (err) {
        console.error('❌ Erreur lors de la navigation:', err);
        error('Erreur lors de la navigation vers la page de détails.');
      }
    }

    function closeDetailsModal() {
      showDetailsModal.value = false;
      userDetails.value = null;
    }

    async function chargerContratsUtilisateur(page = 1, resetData = false) {
      if (!userDetails.value?.id) return;
      
      try {
        loadingContrats.value = true;
        
        // Paramètres optimisés pour l'API avec pagination
        const params = new URLSearchParams({
          limit: contratsLimit.value.toString(),
          page: page.toString(),
          includeCustomer: 'true',
          includeAgency: 'false',
          includeProduct: 'false'
        });
        
        const { data } = await ApiService.get(`/contracts/user/${userDetails.value.id}?${params}`);
        
        if (data && data.data) {
          let nouveauxContrats: ContratUser[] = [];
          
          // ✅ CORRECTION: L'API retourne { message: "...", contracts: [...] }
          // L'interceptor transforme cela en { code: 200, message: "...", data: { contracts: [...] }, timestamp: "..." }
          if (data.data.contracts && Array.isArray(data.data.contracts)) {
            nouveauxContrats = data.data.contracts;
          } else if (Array.isArray(data.data)) {
            nouveauxContrats = data.data;
          } else if (data.data.data && Array.isArray(data.data.data)) {
            nouveauxContrats = data.data.data;
          }
          
          // Gérer la pagination
          if (resetData || page === 1) {
            userContrats.value = nouveauxContrats;
          } else {
            userContrats.value = [...userContrats.value, ...nouveauxContrats];
          }
          
          // Extraire le résumé (seulement au premier chargement)
          if (page === 1 && (data.data.summary || data.summary)) {
            userContratsSummary.value = data.data.summary || data.summary;
          }
          
          // Mettre à jour les informations de pagination
          // L'API retourne maintenant le total et les informations de pagination
          contratsTotalElements.value = data.data.total || nouveauxContrats.length;
          contratsTotalPages.value = data.data.totalPages || Math.ceil(contratsTotalElements.value / contratsLimit.value);
          contratsHasMore.value = contratsTotalElements.value > contratsLimit.value;
          
          contratsPage.value = page;
        } else {
          if (resetData || page === 1) {
            userContrats.value = [];
            userContratsSummary.value = null;
          }
        }
        
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des contrats:', err);
        error('Erreur lors du chargement des contrats de l\'utilisateur');
        if (resetData || page === 1) {
          userContrats.value = [];
          userContratsSummary.value = null;
        }
      } finally {
        loadingContrats.value = false;
      }
    }

    async function chargerPermissionsUtilisateur() {
      if (!userDetails.value?.id) return;
      
      try {
        loadingPermissions.value = true;
        
        // ✅ MISE À JOUR: Utiliser le préfixe /users
        const { data } = await ApiService.get(`/users/${userDetails.value.id}/permissions`);
        
        if (data && data.data) {
          // ✅ CORRECTION: Extraire les vraies données depuis la structure imbriquée
          let permissionsData = data.data;
          
          // Si data.data contient encore une propriété 'data', c'est là que sont les vraies données
          if (permissionsData.data && typeof permissionsData.data === 'object') {
            permissionsData = permissionsData.data;
          }
          
          // Maintenant vérifier si on a un tableau ou un objet avec des permissions
          if (Array.isArray(permissionsData)) {
            userPermissions.value = permissionsData;
          } else if (permissionsData.permissions && Array.isArray(permissionsData.permissions)) {
            // Structure retournée par getUserPermissionsByUser : data.data.permissions
            userPermissions.value = permissionsData.permissions;
          } else if (permissionsData.user && permissionsData.permissions) {
            // Structure complète avec user, permissions, stats
            userPermissions.value = permissionsData.permissions;
          } else {
            userPermissions.value = [];
          }
        } else {
          userPermissions.value = [];
        }
        
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des permissions:', err);
        error('Erreur lors du chargement des permissions de l\'utilisateur');
        userPermissions.value = [];
      } finally {
        loadingPermissions.value = false;
      }
    }

    // Fonctions pour la gestion des contrats
    function chargerPlusContrats() {
      if (contratsHasMore.value && !loadingContrats.value) {
        chargerContratsUtilisateur(contratsPage.value + 1, false);
      }
    }

    function pagePrecedenteContrats() {
      if (contratsPage.value > 1 && !loadingContrats.value) {
        chargerContratsUtilisateur(contratsPage.value - 1, true);
      }
    }

    function pageSuivanteContrats() {
      if (contratsPage.value < contratsTotalPages.value && !loadingContrats.value) {
        chargerContratsUtilisateur(contratsPage.value + 1, true);
      }
    }

    function handleContratsPagination({ page_, limit_ }: { page_: number; limit_: number }) {
      if (page_ !== contratsPage.value && !loadingContrats.value) {
        chargerContratsUtilisateur(page_, true);
      }
    }

    function actualiserContrats() {
      contratsPage.value = 1;
      chargerContratsUtilisateur(1, true);
    }

    // Fonction utilitaire pour obtenir le nom de l'agence
    function getAgencyName(agency: any): string {
      if (!agency) return '';
      
      // Essayer différents champs possibles
      if (agency.name && agency.name.trim()) {
        return agency.name.trim();
      } else if (agency.libelle && agency.libelle.trim()) {
        return agency.libelle.trim();
      } else if (agency.location && agency.location.trim()) {
        return agency.location.trim();
      } else if (agency.address && agency.address.trim()) {
        return agency.address.trim();
      } else if (agency.id) {
        return `Agence #${agency.id}`;
      } else {
        return '';
      }
    }

    async function exporterContratsUtilisateur() {
      if (!userDetails.value?.id) return;
      
      try {
        exportingContrats.value = true;
        
        const { value: format } = await Swal.fire({
          title: 'Format d\'export des contrats',
          input: 'select',
          inputOptions: {
            'xlsx': 'Excel moderne (.xlsx)',
            'xls': 'Excel classique (.xls)',
            'csv': 'CSV',
            'json': 'JSON'
          },
          inputValue: 'xlsx',
          showCancelButton: true,
          confirmButtonText: 'Exporter',
          cancelButtonText: 'Annuler'
        });

        if (format) {
          // Récupérer tous les contrats pour l'export
          const params = new URLSearchParams({
            limit: '0', // 0 = tous les contrats
            includeCustomer: 'true',
            includeAgency: 'true',
            includeProduct: 'true'
          });

          const { data } = await ApiService.get(`/contracts/user/${userDetails.value.id}?${params}`);
          
          let contratsData: ContratUser[] = [];
          if (data && data.data) {
            if (Array.isArray(data.data)) {
              contratsData = data.data;
            } else if (data.data.data && Array.isArray(data.data.data)) {
              contratsData = data.data.data;
            }
          }



          if (contratsData.length === 0) {
            error('Aucun contrat à exporter pour cet utilisateur');
            return;
          }

          const fileName = `contrats_${userDetails.value.lastname}_${userDetails.value.firstname}_${new Date().toISOString().split('T')[0]}`;

          if (format === 'xlsx') {
            // Export Excel moderne (.xlsx) avec données enrichies
            const columns = [
              { key: 'code', title: 'Code Contrat', width: 150 },
              { key: 'police', title: 'Police', width: 120 },
              { key: 'customerFullName', title: 'Client', width: 200 },
              { key: 'customer.phone', title: 'Téléphone Client', width: 150, formatter: XlsxFormatters.phone },
              { key: 'customer.email', title: 'Email Client', width: 200 },
              { key: 'capital', title: 'Capital', width: 120, formatter: XlsxFormatters.currencyText },
              { key: 'primeTTC', title: 'Prime TTC', width: 120, formatter: XlsxFormatters.currencyText },
              { key: 'dateEff', title: 'Date Effet', width: 120, formatter: XlsxFormatters.date },
              { key: 'dateEch', title: 'Date Échéance', width: 120, formatter: XlsxFormatters.date },
              { key: 'refCompte', title: 'Référence Compte', width: 150 },
              { key: 'agencyName', title: 'Agence', width: 150 },
              { key: 'productName', title: 'Produit', width: 150 },
              { key: 'status', title: 'Statut', width: 100, formatter: XlsxFormatters.status },
              { key: 'createdAt', title: 'Date Création', width: 150, formatter: XlsxFormatters.dateTimeText }
            ];

            // Enrichir les données pour l'export
            const enrichedData = contratsData.map(contrat => ({
              ...contrat,
              customerFullName: `${contrat.customer?.firstname || ''} ${contrat.customer?.lastname || ''}`.trim(),
              agencyName: getAgencyName(contrat.agency),
              productName: contrat.product?.descProduct || contrat.product?.codeProduct || 'Produit non défini'
            }));

            const xlsxData: XlsxSheet = {
              name: `Contrats - ${userDetails.value.firstname} ${userDetails.value.lastname}`,
              columns,
              data: enrichedData
            };

            XlsxExporter.exportToXlsx(xlsxData, fileName);
            success(`Export Excel (.xlsx) généré avec succès (${contratsData.length} contrats)`);
            
          } else if (format === 'xls') {
            // Export Excel classique (.xls) avec données enrichies
            const columns = [
              { key: 'code', title: 'Code Contrat', width: 150 },
              { key: 'police', title: 'Police', width: 120 },
              { key: 'customerFullName', title: 'Client', width: 200 },
              { key: 'customer.phone', title: 'Téléphone Client', width: 150, formatter: ExcelFormatters.phone },
              { key: 'customer.email', title: 'Email Client', width: 200 },
              { key: 'capital', title: 'Capital', width: 120, formatter: ExcelFormatters.currency },
              { key: 'primeTTC', title: 'Prime TTC', width: 120, formatter: ExcelFormatters.currency },
              { key: 'dateEff', title: 'Date Effet', width: 120, formatter: ExcelFormatters.date },
              { key: 'dateEch', title: 'Date Échéance', width: 120, formatter: ExcelFormatters.date },
              { key: 'refCompte', title: 'Référence Compte', width: 150 },
              { key: 'agencyName', title: 'Agence', width: 150 },
              { key: 'productName', title: 'Produit', width: 150 },
              { key: 'status', title: 'Statut', width: 100, formatter: ExcelFormatters.status },
              { key: 'createdAt', title: 'Date Création', width: 150, formatter: ExcelFormatters.dateTime }
            ];

            // Enrichir les données pour l'export
            const enrichedData = contratsData.map(contrat => ({
              ...contrat,
              customerFullName: `${contrat.customer?.firstname || ''} ${contrat.customer?.lastname || ''}`.trim(),
              agencyName: getAgencyName(contrat.agency),
              productName: contrat.product?.descProduct || contrat.product?.codeProduct || 'Produit non défini'
            }));

            const excelData: ExcelData = {
              sheetName: `Contrats - ${userDetails.value.firstname} ${userDetails.value.lastname}`,
              columns,
              data: enrichedData
            };

            ExcelExporter.exportToExcel(excelData, fileName);
            success(`Export Excel (.xls) généré avec succès (${contratsData.length} contrats)`);
            
          } else if (format === 'csv') {
            const csvHeaders = [
              'Code',
              'Police',
              'Client',
              'Téléphone Client',
              'Capital',
              'Prime TTC',
              'Date Effet',
              'Date Échéance',
              'Référence Compte',
              'Statut',
              'Date Création'
            ];

            const csvData = contratsData.map(contrat => [
              contrat.code,
              contrat.police,
              `${contrat.customer?.firstname || ''} ${contrat.customer?.lastname || ''}`.trim(),
              contrat.customer?.phone || '',
              contrat.capital,
              contrat.primeTTC,
              contrat.dateEff,
              contrat.dateEch,
              contrat.refCompte,
              getStatutTexte(contrat),
              new Date(contrat.createdAt).toLocaleDateString('fr-FR')
            ]);

            const csvContent = [csvHeaders, ...csvData]
              .map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
              .join('\n');

            downloadFile(csvContent, `${fileName}.csv`, 'text/csv');
            success(`Export CSV généré avec succès (${contratsData.length} contrats)`);
            
          } else {
            const jsonContent = JSON.stringify({
              utilisateur: {
                id: userDetails.value.id,
                nom: `${userDetails.value.firstname} ${userDetails.value.lastname}`,
                email: userDetails.value.email
              },
              contrats: contratsData,
              summary: userContratsSummary.value,
              exportDate: new Date().toISOString(),
              totalExported: contratsData.length
            }, null, 2);

            downloadFile(jsonContent, `${fileName}.json`, 'application/json');
            success(`Export JSON généré avec succès (${contratsData.length} contrats)`);
          }
        }
      } catch (err: any) {
        console.error('❌ Erreur lors de l\'export:', err);
        error('Erreur lors de l\'export des contrats');
      } finally {
        exportingContrats.value = false;
      }
    }

    function voirContrats(user: User) {
  
  // Routes possibles pour les contrats (à adapter selon votre router)
  const routeNames = ['ListeContrats', 'ContratsList', 'Contrats', 'ContractsPage'];
  const fallbackPaths = ['/contrats', '/liste-contrats'];
  
  let routeFound = false;
  
  // Essayer les noms de routes
  for (const routeName of routeNames) {
    try {
      router.push({ 
        name: routeName,
        query: { user: user.id.toString() }
      });
      routeFound = true;
      break;
    } catch (err) {
      continue;
    }
  }
  
  // Fallback vers les chemins directs
  if (!routeFound) {
    for (const path of fallbackPaths) {
      try {
        router.push(`${path}?user=${user.id}`);
        routeFound = true;
        break;
      } catch (err) {
        continue;
      }
    }
  }
  
  if (!routeFound) {
    console.warn('⚠️ Aucune route de contrats trouvée');
    error('Route de liste des contrats non configurée.');
  }
}

function voirContrat(contractCode: string) {
  
  // Fermer le modal avant de naviguer
  closeModalBeforeNavigation();
  
  const routeNames = ['DetailsContrat', 'ContratDetails', 'ViewContrat', 'ContractDetailsPage'];
  const fallbackPathsContrat = [`/contrats/${contractCode}`, `/contrat/${contractCode}`];
  
  let routeFound = false;
  
  for (const routeName of routeNames) {
    try {
      router.push({ 
        name: routeName, 
        params: { code: contractCode } 
      });
      routeFound = true;
      break;
    } catch (err) {
      continue;
    }
  }
  
  if (!routeFound) {
    for (const path of fallbackPathsContrat) {
      try {
        router.push(path);
        routeFound = true;
        break;
      } catch (err) {
        continue;
      }
    }
  }
  
  if (!routeFound) {
    console.warn('⚠️ Aucune route de détails contrat trouvée');
    error('Route de détails du contrat non configurée.');
  }
}

function modifierContrat(contractCode: string) {
  
  // Fermer le modal avant de naviguer
  closeModalBeforeNavigation();
  
  const routeNames = ['ListeContratPage'];
  const fallbackPathsContrat = ['/liste-contrats'];
  
  let routeFound = false;
  
  for (const routeName of routeNames) {
    try {
      router.push({ 
        name: routeName, 
        params: { code: contractCode } 
      });
      routeFound = true;
      break;
    } catch (err) {
      continue;
    }
  }
  
  if (!routeFound) {
    for (const path of fallbackPathsContrat) {
      try {
        router.push(path);
        routeFound = true;
        break;
      } catch (err) {
        continue;
      }
    }
  }
  
  if (!routeFound) {
    console.warn('⚠️ Aucune route de modification contrat trouvée');
    error('Route de modification du contrat non configurée.');
  }
}

async function genererPDFContrat(contractId: number) {
  if (!contractId) {
    error('ID de contrat manquant');
    return;
  }

  
  // Activer l'état de chargement
  loadingContrats.value = true;

  try {
    // Utiliser l'ID du contrat dans l'URL avec axios directement
    const response = await ApiService.vueInstance.axios.get(`/contracts/${contractId}/pdf`, {
      responseType: 'blob',
      headers: { 
        'Accept': 'application/pdf',
        'Authorization': `Bearer ${JwtService.getToken()}`
      }
    });

    // Vérifier que c'est bien un blob
    if (!(response.data instanceof Blob)) {
      throw new Error('Réponse invalide du serveur');
    }

    // Créer un blob PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = url;
    link.download = `contrat_${contractId}.pdf`;
    link.style.display = 'none';

    // Télécharger
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Nettoyer
    window.URL.revokeObjectURL(url);

    success('PDF généré avec succès !');

  } catch (err: any) {
    console.error('❌ Erreur génération PDF:', err);
    
    if (err.response?.status === 404) {
      error('Contrat non trouvé');
    } else if (err.response?.status === 400) {
      error('ID de contrat invalide');
    } else if (err.response?.status === 500) {
      error('Erreur serveur lors de la génération');
    } else {
      error('Erreur lors de la génération du PDF');
    }
  } finally {
    loadingContrats.value = false;
  }
}

function gererPermissions(user: User) {
  
  // Fermer le modal si ouvert
  closeModalBeforeNavigation();
  
  const routeNames = ['PermissionsUtilisateur', 'UserPermissions', 'GererPermissions', 'UserPermissionsPage'];
  const fallbackPathsPermissions = [`/utilisateurs/${user.id}/permissions`, `/permissions/${user.id}`];
  
  let routeFound = false;
  
  for (const routeName of routeNames) {
    try {
      router.push({ 
        name: routeName,
        params: { id: user.id.toString() }
      });
      routeFound = true;
      break;
    } catch (err) {
      continue;
    }
  }
  
  if (!routeFound) {
    for (const path of fallbackPathsPermissions) {
      try {
        router.push(path);
        routeFound = true;
        break;
      } catch (err) {
        continue;
      }
    }
  }
  
  if (!routeFound) {
    console.warn('⚠️ Aucune route de permissions trouvée');
    error('Route de gestion des permissions non configurée.');
  }
}

    async function reinitialiserMotDePasse(user: User) {
      try {
        const result = await Swal.fire({
          title: 'Réinitialiser le mot de passe',
          text: `Voulez-vous vraiment réinitialiser le mot de passe de ${user.firstname} ${user.lastname} ?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Oui, réinitialiser',
          cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
          // ✅ CORRECTION: Utiliser la bonne route complète
          const { data } = await ApiService.put(`/user-management/reset-password/${user.id}`, {
            newPassword: 'TempPass123!' // Mot de passe temporaire par défaut
          });
          
          await Swal.fire({
            title: 'Mot de passe réinitialisé',
            html: `
              <div class="text-start">
                <p>Le mot de passe a été réinitialisé avec succès.</p>
                <div class="alert alert-info">
                  <strong>Nouveau mot de passe temporaire :</strong><br>
                  <code class="fs-5">TempPass123!</code>
                </div>
                <small class="text-muted">L'utilisateur devra changer ce mot de passe lors de sa prochaine connexion.</small>
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'J\'ai noté'
          });
        }
      } catch (err: any) {
        console.error('❌ Erreur lors de la réinitialisation:', err);
        error('Erreur lors de la réinitialisation du mot de passe');
      }
    }

    async function toggleSuspension(user: User) {
      try {
        const action = user.status === 'SUSPENDED' ? 'réactiver' : 'suspendre';
        const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        
        const result = await Swal.fire({
          title: `Confirmer l'action`,
          text: `Voulez-vous vraiment ${action} cet utilisateur ?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: `Oui, ${action}`,
          cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
          // ✅ CORRECTION: Utiliser les bonnes routes selon le statut
          if (newStatus === 'ACTIVE') {
            await ApiService.put(`/user-management/activate/${user.id}`, {});
          } else {
            await ApiService.put(`/user-management/deactivate/${user.id}`, {});
          }
          
          user.status = newStatus;
          success(`Utilisateur ${action} avec succès`);
          
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du changement de statut:', err);
        error(`Erreur lors de la ${user.status === 'SUSPENDED' ? 'réactivation' : 'suspension'}`);
      }
    }

    async function confirmerSuppression(userToDelete: User) {
      if (!userToDelete.id) {
        console.error('ID d\'utilisateur manquant');
        return;
      }
      
      try {
        const result = await Swal.fire({
          title: 'Êtes-vous sûr?',
          text: `Voulez-vous vraiment supprimer définitivement l'utilisateur #${userToDelete.id} (${userToDelete.lastname} ${userToDelete.firstname})?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Oui, supprimer',
          cancelButtonText: 'Annuler',
          heightAuto: false
        });

        if (result.isConfirmed) {
          await deleteUser(userToDelete.id);
        }
      } catch (err) {
        console.error('Erreur lors de la confirmation:', err);
      }
    }

    async function deleteUser(id: number) {
      try {
        // ✅ MISE À JOUR: Utiliser le préfixe /users
        const { data } = await ApiService.delete(`/users/${id}`);
        
        users.value = users.value.filter(u => u.id !== id);
        totalElements.value = Math.max(0, totalElements.value - 1);
        
        await Swal.fire({
          text: data.message || 'Utilisateur supprimé avec succès',
          toast: true,
          icon: 'success',
          title: 'Suppression réussie',
          animation: false,
          position: 'top-right',
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
          heightAuto: false
        });

        if (users.value.length === 0 && page.value > 1) {
          page.value--;
          await getAllUsers(page.value, limit.value, searchTerm.value);
        }
      } catch (err: any) {
        console.error('Erreur suppression:', err);
        await Swal.fire({
          text: err?.response?.data?.message || 'Erreur lors de la suppression',
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Réessayer",
          heightAuto: false,
          customClass: {
            confirmButton: "btn fw-semibold btn-light-danger",
          },
        });
      }
    }

    // Utilitaires de formatage
    function formatDate(dateString: string | null | undefined): string {
      if (!dateString) return '-';
      try {
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateString.split('-');
          return `${day}/${month}/${year}`;
        }
        if (dateString.includes('/')) {
          return dateString;
        }
        return new Date(dateString).toLocaleDateString('fr-FR');
      } catch {
        return dateString;
      }
    }

    function formatMontant(montant: number | null | undefined): string {
      if (montant == null || montant === undefined || isNaN(montant)) return '-';
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(montant);
    }

    function calculateAge(birthdate: string): number {
      if (!birthdate) return 0;
      try {
        const birth = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        
        return age;
      } catch {
        return 0;
      }
    }

    // Utilitaires de style
    function getStatutClass(item: any): string {
      if (item.status === 'ACTIVE' || item.status === 1) return 'badge bg-success';
      if (item.status === 'SUSPENDED' || item.status === 0) return 'badge bg-warning text-dark';
      if (item.status === 'INACTIVE' || item.status === -1) return 'badge bg-danger';
      return 'badge bg-secondary';
    }

    function getStatutTexte(item: any): string {
      if (item.status === 'ACTIVE' || item.status === 1) return 'Actif';
      if (item.status === 'SUSPENDED' || item.status === 0) return 'Suspendu';
      if (item.status === 'INACTIVE' || item.status === -1) return 'Inactif';
      return 'Inconnu';
    }

    function getStatutIcon(item: any): string {
      if (item.status === 'ACTIVE' || item.status === 1) return 'flaticon-check';
      if (item.status === 'SUSPENDED' || item.status === 0) return 'flaticon-pause';
      if (item.status === 'INACTIVE' || item.status === -1) return 'flaticon-cancel';
      return 'flaticon-question';
    }

    function getInitials(user: any): string {
      if (!user) return '??';
      
      const firstname = user.firstname || '';
      const lastname = user.lastname || '';
      
      const firstInitial = firstname.charAt(0).toUpperCase();
      const lastInitial = lastname.charAt(0).toUpperCase();
      
      return firstInitial + lastInitial;
    }

    async function exporterUtilisateurs() {
      try {
        
        const { value: format } = await Swal.fire({
          title: 'Format d\'export',
          input: 'select',
          inputOptions: {
            'xlsx': 'Excel moderne (.xlsx)',
            'xls': 'Excel classique (.xls)',
            'csv': 'CSV',
            'json': 'JSON'
          },
          inputValue: 'xlsx',
          showCancelButton: true,
          confirmButtonText: 'Exporter',
          cancelButtonText: 'Annuler'
        });


        if (format) {
          if (format === 'xlsx') {
            // Export Excel moderne (.xlsx) côté frontend
            await exporterUtilisateursXlsx();
          } else if (format === 'xls') {
            // Export Excel classique (.xls) côté frontend
            await exporterUtilisateursExcel();
          } else if (format === 'csv') {
            await exporterUtilisateursCsv();
          } else if (format === 'json') {
            await exporterUtilisateursJson();
          }
        } else {
        }
      } catch (err: any) {
        console.error('❌ Erreur lors de l\'export:', err);
        console.error('❌ Détails de l\'erreur:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        error('Erreur lors de l\'export des données: ' + err.message);
      }
    }

    async function exporterUtilisateursExcel() {
      try {
        // Récupérer tous les utilisateurs pour l'export
        const { data } = await ApiService.get('/users?limit=1000&includeRole=true&includeAgency=true');
        
        let allUsers: User[] = [];
        if (data && data.data) {
          if (data.data.users && Array.isArray(data.data.users)) {
            allUsers = data.data.users;
          } else if (Array.isArray(data.data)) {
            allUsers = data.data;
          } else if (data.data.data && Array.isArray(data.data.data)) {
            allUsers = data.data.data;
          }
        }

        if (allUsers.length === 0) {
          error('Aucun utilisateur à exporter');
          return;
        }

        // Enrichir les données avec les noms des rôles et agences
        const enrichedUsers = allUsers.map(user => ({
          ...user,
          roleName: user.role?.libelle || user.role?.name || `Rôle #${user.idRole}`,
          agencyName: user.agency?.name || user.agency?.libelle || (user.idAgency ? `Agence #${user.idAgency}` : 'Non assignée'),
          agencyLocation: (user.agency as any)?.address || user.agency?.location || ''
        }));

        // Définir les colonnes Excel
        const columns = [
          { key: 'id', title: 'ID', width: 80 },
          { key: 'lastname', title: 'Nom', width: 150 },
          { key: 'firstname', title: 'Prénom', width: 150 },
          { key: 'email', title: 'Email', width: 200 },
          { key: 'phone', title: 'Téléphone', width: 150, formatter: ExcelFormatters.phone },
          { key: 'address', title: 'Adresse', width: 250 },
          { key: 'birthdate', title: 'Date de naissance', width: 150, formatter: ExcelFormatters.date },
          { key: 'gender', title: 'Genre', width: 100, formatter: ExcelFormatters.gender },
          { key: 'fonction', title: 'Fonction', width: 150 },
          { key: 'roleName', title: 'Rôle', width: 150 },
          { key: 'agencyName', title: 'Agence', width: 150 },
          { key: 'agencyLocation', title: 'Adresse Agence', width: 200 },
          { key: 'status', title: 'Statut', width: 100, formatter: ExcelFormatters.status },
          { key: 'createdAt', title: 'Date de création', width: 150, formatter: ExcelFormatters.dateTime }
        ];

        const excelData: ExcelData = {
          sheetName: 'Liste des Utilisateurs',
          columns,
          data: enrichedUsers
        };

        const filename = `utilisateurs_${new Date().toISOString().split('T')[0]}`;
        ExcelExporter.exportToExcel(excelData, filename);
        
        success(`Export Excel (.xls) généré avec succès (${allUsers.length} utilisateurs)`);
        
      } catch (err: any) {
        console.error('❌ Erreur lors de l\'export Excel:', err);
        error('Erreur lors de l\'export Excel');
      }
    }

    async function exporterUtilisateursXlsx() {
      try {
        
        // Récupérer tous les utilisateurs pour l'export
        const { data } = await ApiService.get('/users?limit=1000&includeRole=true&includeAgency=true');
        
        
        let allUsers: User[] = [];
        if (data && data.data) {
          // L'API retourne { code: 200, message: '...', data: { users: [...] } }
          if (data.data.users && Array.isArray(data.data.users)) {
            allUsers = data.data.users;
          } else if (Array.isArray(data.data)) {
            allUsers = data.data;
          } else if (data.data.data && Array.isArray(data.data.data)) {
            allUsers = data.data.data;
          } else {
          }
        }

        // Debug: Afficher la structure d'un utilisateur pour voir les relations
        if (allUsers.length > 0) {
        }


        if (allUsers.length === 0) {
          error('Aucun utilisateur à exporter');
          return;
        }

        // Définir les colonnes Excel .xlsx
        const columns = [
          { key: 'id', title: 'ID', width: 80 },
          { key: 'lastname', title: 'Nom', width: 150 },
          { key: 'firstname', title: 'Prénom', width: 150 },
          { key: 'email', title: 'Email', width: 200 },
          { key: 'phone', title: 'Téléphone', width: 150, formatter: XlsxFormatters.phone },
          { key: 'address', title: 'Adresse', width: 250 },
          { key: 'birthdate', title: 'Date de naissance', width: 150, formatter: XlsxFormatters.dateText },
          { key: 'gender', title: 'Genre', width: 100, formatter: XlsxFormatters.gender },
          { key: 'fonction', title: 'Fonction', width: 150 },
          { key: 'roleName', title: 'Rôle', width: 150 },
          { key: 'agencyName', title: 'Agence', width: 150 },
          { key: 'agencyLocation', title: 'Adresse Agence', width: 200 },
          { key: 'status', title: 'Statut', width: 100, formatter: XlsxFormatters.status },
          { key: 'createdAt', title: 'Date de création', width: 150, formatter: XlsxFormatters.dateTimeText }
        ];


        // Fonction utilitaire pour extraire l'adresse de l'agence
        const getAgencyAddress = (agency: any): string => {
          if (!agency) return '';
          
          // Essayer différents champs possibles pour l'adresse
          const possibleAddressFields = [
            'address', 'location', 'adresse', 'lieu', 'place', 
            'address1', 'address2', 'street', 'rue', 'ville', 'city'
          ];
          
          for (const field of possibleAddressFields) {
            if (agency[field] && agency[field].trim()) {
              return agency[field].trim();
            }
          }
          
          return '';
        };

        // Enrichir les données avec les noms des rôles et agences
        const enrichedUsers = allUsers.map(user => ({
          ...user,
          roleName: user.role?.libelle || user.role?.name || `Rôle #${user.idRole}`,
          agencyName: user.agency?.name || user.agency?.libelle || (user.idAgency ? `Agence #${user.idAgency}` : 'Non assignée'),
          agencyLocation: getAgencyAddress(user.agency)
        }));


        const xlsxData: XlsxSheet = {
          name: 'Liste des Utilisateurs',
          columns,
          data: enrichedUsers
        };

        const filename = `utilisateurs_${new Date().toISOString().split('T')[0]}`;
        
        XlsxExporter.exportToXlsx(xlsxData, filename);
        
        success(`Export Excel (.xlsx) généré avec succès (${allUsers.length} utilisateurs)`);
        
      } catch (err: any) {
        console.error('❌ Erreur lors de l\'export Excel XLSX:', err);
        console.error('❌ Détails de l\'erreur XLSX:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        error('Erreur lors de l\'export Excel XLSX: ' + err.message);
      }
    }

    async function exporterUtilisateursCsv() {
      try {
        
        // Récupérer tous les utilisateurs pour l'export
        const { data } = await ApiService.get('/users?limit=1000&includeRole=true&includeAgency=true');
        
        let allUsers: User[] = [];
        if (data && data.data) {
          if (data.data.users && Array.isArray(data.data.users)) {
            allUsers = data.data.users;
          } else if (Array.isArray(data.data)) {
            allUsers = data.data;
          } else if (data.data.data && Array.isArray(data.data.data)) {
            allUsers = data.data.data;
          }
        }

        if (allUsers.length === 0) {
          error('Aucun utilisateur à exporter');
          return;
        }

        const headers = [
          'ID', 'Nom', 'Prénom', 'Email', 'Téléphone', 'Adresse', 
          'Date de naissance', 'Genre', 'Fonction', 'Rôle', 'Agence', 
          'Adresse Agence', 'Statut', 'Date de création'
        ];

        // Enrichir les données avec les noms des rôles et agences
        const enrichedUsers = allUsers.map(user => ({
          ...user,
          roleName: user.role?.libelle || user.role?.name || `Rôle #${user.idRole}`,
          agencyName: user.agency?.name || user.agency?.libelle || (user.idAgency ? `Agence #${user.idAgency}` : 'Non assignée'),
          agencyLocation: (user.agency as any)?.address || user.agency?.location || ''
        }));

        const csvData = enrichedUsers.map(user => [
          user.id,
          user.lastname,
          user.firstname,
          user.email || '',
          user.phone || '',
          user.address || '',
          user.birthdate || '',
          user.gender === 'M' ? 'Masculin' : 'Féminin',
          user.fonction || '',
          user.roleName,
          user.agencyName,
          user.agencyLocation,
          getStatutTexte(user),
          user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : ''
        ]);

        const csvContent = [headers, ...csvData]
          .map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
          .join('\n');

        const filename = `utilisateurs_${new Date().toISOString().split('T')[0]}`;
        downloadFile(csvContent, `${filename}.csv`, 'text/csv');
        
        success(`Export CSV généré avec succès (${allUsers.length} utilisateurs)`);
        
      } catch (err: any) {
        console.error('❌ Erreur lors de l\'export CSV:', err);
        error('Erreur lors de l\'export CSV: ' + err.message);
      }
    }

    async function exporterUtilisateursJson() {
      try {
        
        // Récupérer tous les utilisateurs pour l'export
        const { data } = await ApiService.get('/users?limit=1000&includeRole=true&includeAgency=true');
        
        let allUsers: User[] = [];
        if (data && data.data) {
          if (data.data.users && Array.isArray(data.data.users)) {
            allUsers = data.data.users;
          } else if (Array.isArray(data.data)) {
            allUsers = data.data;
          } else if (data.data.data && Array.isArray(data.data.data)) {
            allUsers = data.data.data;
          }
        }

        if (allUsers.length === 0) {
          error('Aucun utilisateur à exporter');
          return;
        }

        // Enrichir les données avec les noms des rôles et agences
        const enrichedUsers = allUsers.map(user => ({
          ...user,
          roleName: user.role?.libelle || user.role?.name || `Rôle #${user.idRole}`,
          agencyName: user.agency?.name || user.agency?.libelle || (user.idAgency ? `Agence #${user.idAgency}` : 'Non assignée'),
          agencyLocation: (user.agency as any)?.address || user.agency?.location || ''
        }));

        const jsonContent = JSON.stringify({
          exportDate: new Date().toISOString(),
          totalUsers: enrichedUsers.length,
          users: enrichedUsers
        }, null, 2);

        const filename = `utilisateurs_${new Date().toISOString().split('T')[0]}`;
        downloadFile(jsonContent, `${filename}.json`, 'application/json');
        
        success(`Export JSON généré avec succès (${allUsers.length} utilisateurs)`);
        
      } catch (err: any) {
        console.error('❌ Erreur lors de l\'export JSON:', err);
        error('Erreur lors de l\'export JSON: ' + err.message);
      }
    }

    function convertToCSV(data: any[], headers: string[]): string {
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row => 
        headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
      );
      return [csvHeaders, ...csvRows].join('\n');
    }

    function downloadFile(content: string, filename: string, mimeType: string) {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }

    // ===== MÉTHODES POUR LE MODAL PERMISSIONS =====
    
    async function ouvrirModalPermissions(user: User) {
      try {
        selectedUser.value = user;
        selectedPermissions.value = [];
        resetPermissionForm();
        
        // Ouvrir le modal
        const modalElement = document.getElementById('addPermissionsModal');
        if (modalElement) {
          const modal = new (window as any).bootstrap.Modal(modalElement);
          modal.show();
        }
        
        // Charger les permissions disponibles
        await chargerPermissionsDisponibles(user.id);
        
      } catch (err) {
        console.error('❌ Erreur lors de l\'ouverture du modal permissions:', err);
        error('Erreur lors du chargement des permissions');
      }
    }

    async function chargerPermissionsDisponibles(userId: number) {
      try {
        loadingAvailablePermissions.value = true;
        
        // Essayer d'abord l'endpoint by-module, puis fallback sur l'endpoint standard
        let allPermissions: any[] = [];
        let userCurrentPermissions: any[] = [];
        
        try {
          // Récupérer toutes les permissions disponibles
          const [permissionsResponse, userPermissionsResponse] = await Promise.all([
            ApiService.get('/permissions/by-module'),
            ApiService.get(`/users/${userId}/permissions`)
          ]);
          
          // Extraire le tableau des permissions depuis la réponse
          const permissionsData = permissionsResponse.data?.data;
          
          // ✅ CORRECTION: Extraire les vraies données depuis la structure imbriquée (même problème qu'avec userDetails)
          let extractedPermissions: any[] = [];
          let actualPermissionsData = permissionsData;
          
          // Si permissionsData contient encore une propriété 'data', c'est là que sont les vraies données
          if (actualPermissionsData?.data) {
            actualPermissionsData = actualPermissionsData.data;
          }
          
          // Maintenant essayer d'extraire les permissions
          if (actualPermissionsData?.permissions && Array.isArray(actualPermissionsData.permissions)) {
            extractedPermissions = actualPermissionsData.permissions;
          } else if (Array.isArray(actualPermissionsData)) {
            extractedPermissions = actualPermissionsData;
          } else if (actualPermissionsData && typeof actualPermissionsData === 'object') {
            // Si c'est un objet avec des modules
            const allPerms: any[] = [];
            Object.keys(actualPermissionsData).forEach(moduleName => {
              const modulePerms = actualPermissionsData[moduleName];
              if (Array.isArray(modulePerms)) {
                allPerms.push(...modulePerms);
              }
            });
            if (allPerms.length > 0) {
              extractedPermissions = allPerms;
            }
          }
          
          allPermissions = extractedPermissions;
          userCurrentPermissions = userPermissionsResponse.data?.data?.permissions || [];
          
          
        } catch (byModuleError) {
          console.warn('⚠️ Erreur avec /permissions/by-module, essai avec /permissions:', byModuleError);
          
          // Fallback: utiliser l'endpoint standard
          const [permissionsResponse, userPermissionsResponse] = await Promise.all([
            ApiService.get('/permissions'),
            ApiService.get(`/users/${userId}/permissions`)
          ]);
          
          
          // Pour l'endpoint standard, les permissions peuvent être dans data.data ou directement dans data
          const permissionsData = permissionsResponse.data?.data;
          if (Array.isArray(permissionsData)) {
            allPermissions = permissionsData;
          } else if (permissionsData?.data && Array.isArray(permissionsData.data)) {
            allPermissions = permissionsData.data;
          } else {
            allPermissions = [];
          }
          
          userCurrentPermissions = userPermissionsResponse.data?.data?.permissions || [];
        }
        
        
        // Vérifier que allPermissions est un tableau
        if (!Array.isArray(allPermissions)) {
          console.error('❌ allPermissions n\'est pas un tableau:', allPermissions);
          throw new Error('Format de données incorrect: les permissions doivent être un tableau');
        }
        
        if (allPermissions.length === 0) {
          console.warn('⚠️ Aucune permission trouvée');
        }
        
        // Marquer les permissions déjà attribuées
        const permissionsWithStatus = allPermissions.map((permission: any) => ({
          ...permission,
          alreadyHas: userCurrentPermissions.some((up: any) => up.id === permission.id)
        }));
        
        availablePermissions.value = permissionsWithStatus;
        filteredPermissions.value = [...permissionsWithStatus];
        
        
      } catch (err) {
        console.error('❌ Erreur lors du chargement des permissions:', err);
        error('Erreur lors du chargement des permissions disponibles');
      } finally {
        loadingAvailablePermissions.value = false;
      }
    }

    function filtrerPermissions() {
      let filtered = [...availablePermissions.value];
      
      // Filtrer par terme de recherche
      if (permissionSearchTerm.value.trim()) {
        const searchTerm = permissionSearchTerm.value.toLowerCase();
        filtered = filtered.filter(permission => 
          permission.name.toLowerCase().includes(searchTerm) ||
          permission.description?.toLowerCase().includes(searchTerm) ||
          permission.action.toLowerCase().includes(searchTerm)
        );
      }
      
      // Filtrer par module
      if (selectedModule.value) {
        filtered = filtered.filter(permission => permission.module === selectedModule.value);
      }
      
      filteredPermissions.value = filtered;
    }

    function resetPermissionForm() {
      selectedPermissions.value = [];
      permissionSearchTerm.value = '';
      selectedModule.value = '';
      permissionType.value = 'granted';
      grantedBy.value = 'admin';
      expiresAt.value = '';
      reason.value = '';
      filteredPermissions.value = [...availablePermissions.value];
    }

    async function ajouterPermissions() {
      if (!selectedUser.value || selectedPermissions.value.length === 0) {
        error('Veuillez sélectionner au moins une permission');
        return;
      }
      
      try {
        savingPermissions.value = true;
        
        // Préparer les données des permissions
        const permissionsData = selectedPermissions.value.map(permissionId => ({
          permissionId,
          granted: permissionType.value === 'granted',
          grantedBy: grantedBy.value || 'admin',
          reason: reason.value || undefined,
          expiresAt: expiresAt.value ? new Date(expiresAt.value).toISOString() : undefined
        }));
        
        // Envoyer la requête
        const response = await ApiService.put(`/users/${selectedUser.value.id}/permissions`, {
          permissions: permissionsData
        });
        
        success(`${selectedPermissions.value.length} permission(s) ajoutée(s) avec succès`);
        
        // Fermer le modal
        const modalElement = document.getElementById('addPermissionsModal');
        if (modalElement) {
          const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }
        
        // Recharger les permissions de l'utilisateur si le modal de détails est ouvert
        if (userDetails.value && userDetails.value.id === selectedUser.value.id) {
          await chargerPermissionsUtilisateur();
        }
        
        // Réinitialiser le formulaire
        resetPermissionForm();
        
      } catch (err: any) {
        console.error('❌ Erreur lors de l\'ajout des permissions:', err);
        error(err?.response?.data?.message || 'Erreur lors de l\'ajout des permissions');
      } finally {
        savingPermissions.value = false;
      }
    }

    async function supprimerPermission(permission: any) {
      if (!permission.userPermissionId || permission.source !== 'user_override') {
        error('Cette permission ne peut pas être supprimée');
        return;
      }

      try {
        const result = await Swal.fire({
          title: 'Supprimer la permission',
          text: `Voulez-vous vraiment supprimer la permission "${permission.name}" ?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Oui, supprimer',
          cancelButtonText: 'Annuler',
          confirmButtonColor: '#d33'
        });

        if (result.isConfirmed) {
          await ApiService.delete(`/user-permissions/${permission.userPermissionId}`);
          success('Permission supprimée avec succès');
          
          // Recharger les permissions
          await chargerPermissionsUtilisateur();
        }
      } catch (err: any) {
        console.error('❌ Erreur lors de la suppression:', err);
        error('Erreur lors de la suppression de la permission');
      }
    }

    // Méthode pour gérer l'importation des utilisateurs
    const handleUsersImported = (count: number): void => {
      success(`${count} utilisateur(s) importé(s) avec succès !`);
      // Recharger la liste des utilisateurs
      getAllUsers(page.value, limit.value, searchTerm.value);
    };

    // Filtres Agence & Rôle
    const selectedAgence = ref('');
    const selectedRole = ref('');
    const agences = ref<any[]>([]);
    const roles = ref<any[]>([]);
    const showFiltersOffcanvas = ref(false);

    const activeFiltersCount = computed(() => {
      let count = 0;
      if (selectedAgence.value) count++;
      if (selectedRole.value) count++;
      return count;
    });

    async function loadAgences() {
      try {
        const r = await ApiService.get('/agencies?limit=-1');
        const d = r.data;
        // Backend: { data: { agencies: [...] } }
        let list: any[] = [];
        if (Array.isArray(d?.data?.agencies)) list = d.data.agencies;
        else if (Array.isArray(d?.data)) list = d.data;
        else if (Array.isArray(d)) list = d;
        agences.value = list;
      } catch { agences.value = []; }
    }

    async function loadRoles() {
      try {
        const r = await ApiService.get('/roles');
        const d = r.data;
        // Backend: { data: { roles: [...] } } with libelle field
        let list: any[] = [];
        if (Array.isArray(d?.data?.roles)) list = d.data.roles;
        else if (Array.isArray(d?.data)) list = d.data;
        else if (Array.isArray(d)) list = d;
        roles.value = list;
      } catch { roles.value = []; }
    }

    function filtrerUtilisateurs() {
      // When a filter is active, load ALL users so we don't miss any on other pages
      const hasFilter = selectedAgence.value || selectedRole.value;
      if (hasFilter) {
        getAllUsers(1, 1000, searchTerm.value);
      }
      // filteredUsers computed reacts automatically
    }

    function clearAllFilters() {
      selectedAgence.value = '';
      selectedRole.value = '';
      getAllUsers(1, limit.value, searchTerm.value);
    }

    const filteredUsers = computed(() => {
      let list = users.value;
      if (selectedAgence.value) {
        const agId = String(selectedAgence.value);
        list = list.filter(u => 
          String(u.idAgency) === agId || 
          String(u.agency?.id) === agId
        );
      }
      if (selectedRole.value) {
        const rId = String(selectedRole.value);
        list = list.filter(u => 
          String(u.idRole) === rId || 
          String(u.role?.id) === rId
        );
      }
      return list;
    });

    function getAvatarColor(name: string): string {
      const colors = ['#33b04a','#17a2b8','#6f42c1','#fd7e14','#dc3545','#007bff','#20c997','#e83e8c'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
    }

    // Lifecycle
    onMounted(async () => {
      try {
        await Promise.all([loadAgences(), loadRoles()]);
        await getAllUsers();
      } catch (err) {
        console.error('❌ Erreur dans onMounted:', err);
      }
    });

    return {
      canManageUsers,
      // Refs
      users,
      userDetails,
      userContrats,
      userContratsSummary,
      userPermissions,
      loading,
      loadingContrats,
      loadingPermissions,
      showDetailsModal,
      showImportModal,
      searchTerm,
      page, 
      totalPages,
      limit,
      totalElements,
      
      // Pagination contrats
      contratsPage,
      contratsLimit,
      contratsTotalPages,
      contratsTotalElements,
      contratsHasMore,
      exportingContrats,
      
      // Modal permissions
      selectedUser,
      availablePermissions,
      filteredPermissions,
      selectedPermissions,
      loadingAvailablePermissions,
      savingPermissions,
      permissionSearchTerm,
      selectedModule,
      permissionType,
      grantedBy,
      expiresAt,
      reason,
      availableModules,
      groupedFilteredPermissions,
      
      // Methods
      getAllUsers,
      deleteUser,
      confirmerSuppression,
      toggleSuspension,
      voirDetails,
      closeDetailsModal,
      voirContrats,
      voirContrat,
      modifierContrat,
      genererPDFContrat,
      chargerContratsUtilisateur,
      chargerPlusContrats,
      getAgencyName,
      pagePrecedenteContrats,
      pageSuivanteContrats,
      handleContratsPagination,
      actualiserContrats,
      exporterContratsUtilisateur,
      chargerPermissionsUtilisateur,
      modifier,
      gererPermissions,
      reinitialiserMotDePasse,
      handlePaginate,
      rechercher,
      formatDate,
      formatMontant,
      calculateAge,
      getStatutClass,
      getStatutTexte,
      getStatutIcon,
      getInitials,
      exporterUtilisateurs,
      exporterUtilisateursExcel,
      exporterUtilisateursXlsx,
      exporterUtilisateursCsv,
      exporterUtilisateursJson,
      
      // Méthodes modal permissions
      ouvrirModalPermissions,
      chargerPermissionsDisponibles,
      filtrerPermissions,
      resetPermissionForm,
      ajouterPermissions,
      supprimerPermission,
      
      // Méthodes import
      handleUsersImported,
      selectedAgence,
      selectedRole,
      agences,
      roles,
      showFiltersOffcanvas,
      activeFiltersCount,
      clearAllFilters,
      filtrerUtilisateurs,
      filteredUsers,
      getAvatarColor
    };
  },
});
</script>

<style scoped>
.info-item {
  margin-bottom: 1rem;
}

.info-item label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.modal-xl {
  max-width: 80vw;
}

@media (min-width: 1400px) {
  .modal-xl {
    max-width: 1200px;
  }
}

.table th {
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.table td {
  vertical-align: middle;
}

.badge {
  font-size: 0.875rem;
}

.search-box {
  width: 300px;
}

.search-box input {
  padding-left: 15px;
  padding-right: 40px;
}

.search-box button {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border: 3px solid #dee2e6;
  margin: 0 auto;
  overflow: hidden;
}

.object-fit-cover {
  object-fit: cover;
}

/* Styles pour les badges colorés */
.bg-pink {
  background-color: #e91e63 !important;
  color: white !important;
}

/* Style pour les onglets personnalisés */
.nav-tabs-custom .nav-link {
  border: 1px solid transparent;
  border-radius: 0.5rem 0.5rem 0 0;
  margin-bottom: -1px;
}

.nav-tabs-custom .nav-link.active {
  background-color: #fff;
  border-color: #dee2e6 #dee2e6 #fff;
}

/* Responsive design pour les tableaux */
@media (max-width: 768px) {
  .table-responsive {
    font-size: 0.875rem;
  }
  
  .avatar-circle {
    width: 30px;
    height: 30px;
  }
  
  .search-box {
    width: 250px;
  }
}

/* Animation pour les cartes */
.card {
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Style pour les permissions */
.permission-card {
  transition: transform 0.2s ease;
}

.permission-card:hover {
  transform: translateY(-2px);
}

/* Styles pour les statuts utilisateur */
.status-active {
  background: linear-gradient(45deg, #28a745, #20c997);
}

.status-suspended {
  background: linear-gradient(45deg, #ffc107, #fd7e14);
}

.status-inactive {
  background: linear-gradient(45deg, #dc3545, #e83e8c);
}

/* Animation pour les boutons d'action */
.btn-group .btn {
  transition: all 0.3s ease;
}

.btn-group .btn:hover {
  transform: scale(1.05);
}

/* Style pour le dropdown des actions */
.dropdown-menu {
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
  transform: translateX(5px);
}

.dropdown-item.text-danger:hover {
  background-color: #fee;
  color: #dc3545 !important;
}

/* Styles pour les informations utilisateur */
.user-info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.user-stats {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

/* Animation de chargement */
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.loading-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

/* Style pour les codes temporaires */
code {
  background-color: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.1em;
  color: #e83e8c;
  border: 1px solid #dee2e6;
}

/* Responsive pour modal */
@media (max-width: 992px) {
  .modal-xl {
    max-width: 95vw;
  }
  
  .nav-tabs-custom {
    font-size: 0.875rem;
  }
  
  .nav-tabs-custom .nav-link {
    padding: 0.5rem 0.75rem;
  }
}

/* Style pour les alertes dans le modal */
.alert-info {
  background-color: #e7f3ff;
  border-color: #b3d7ff;
  color: #0c5460;
}

/* Animation d'entrée pour les éléments de liste */
.list-item {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Style pour les badges avec icônes */
.badge i {
  font-size: 0.875em;
}

/* Styles pour les cartes de statistiques */
.stats-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

/* Animation pour le bouton "Charger plus" */
.btn-load-more {
  transition: all 0.3s ease;
}

.btn-load-more:hover {
  transform: scale(1.05);
}

/* Styles pour l'export en cours */
.exporting {
  opacity: 0.7;
  pointer-events: none;
}

/* Amélioration de l'affichage des montants */
.montant-display {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
}

/* Style pour les informations de pagination */
.pagination-info {
  font-size: 0.875rem;
  color: #6c757d;
}

/* Animation de chargement pour les contrats */
.contracts-loading {
  position: relative;
}

.contracts-loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

/* Responsive pour les statistiques */
@media (max-width: 768px) {
  .stats-card .card-body {
    padding: 0.75rem;
  }
  
  .stats-card h5 {
    font-size: 1rem;
  }
  
  .stats-card h6 {
    font-size: 0.875rem;
  }
}

/* Amélioration du contraste pour l'accessibilité */
.text-muted {
  color: #6c757d !important;
}

.badge.bg-warning {
  color: #000 !important;
}

/* Style pour les informations de contact */
.contact-info a {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease;
}

.contact-info a:hover {
  color: #007bff !important;
  text-decoration: underline;
}

/* Style pour les permissions accordées/refusées */
.permission-granted {
  border-left: 4px solid #28a745;
}

.permission-denied {
  border-left: 4px solid #dc3545;
}

/* Style pour la pagination */
.pagination-area {
  border-top: 1px solid #dee2e6;
  padding-top: 1rem;
}

/* Animation pour le changement de statut */
.status-change {
  transition: all 0.5s ease;
}

/* Style pour les tooltips personnalisés */
[title] {
  position: relative;
}

/* Amélioration de l'espacement dans les formulaires de recherche */
.search-form {
  position: relative;
}

.search-form input:focus {
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  border-color: #80bdff;
}

/* ===== NOUVEAU DESIGN MODERNE ===== */

/* Header du profil utilisateur */
.user-profile-header {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border-radius: 15px;
  padding: 2rem;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.8);
}

.avatar-initials {
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.user-name {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.5);
  color: #ffffff;
}

.user-id {
  font-size: 0.9rem;
  opacity: 0.8;
  margin: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* Cartes d'informations */
.info-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.info-card-header {
  background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%);
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #bdc3c7;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-card-header i {
  font-size: 1.2rem;
  color: #2c3e50;
}

.info-card-header h5 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}

.info-card-body {
  padding: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
  min-width: 120px;
}

.info-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
  text-align: right;
  flex: 1;
  justify-content: flex-end;
}

.info-value i {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.contact-link {
  color: #3498db;
  text-decoration: none;
  transition: color 0.2s ease;
}

.contact-link:hover {
  color: #2980b9;
  text-decoration: underline;
}

.age-value {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 600;
}

.version-value {
  background: #95a5a6;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Boutons du modal avec couleurs distinctes */
.btn-close-modal {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d) !important;
  color: white !important;
  border: none !important;
  padding: 0.75rem 1.5rem !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.btn-close-modal:hover {
  background: linear-gradient(135deg, #7f8c8d, #6c7b7d) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
}

.btn-reset-password {
  background: linear-gradient(135deg, #e67e22, #d35400) !important;
  color: white !important;
  border: none !important;
  padding: 0.75rem 1.5rem !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.btn-reset-password:hover {
  background: linear-gradient(135deg, #d35400, #c0392b) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
}

.btn-edit-user {
  background: linear-gradient(135deg, #3498db, #2980b9) !important;
  color: white !important;
  border: none !important;
  padding: 0.75rem 1.5rem !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.btn-edit-user:hover {
  background: linear-gradient(135deg, #2980b9, #1f618d) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
}

/* Responsive */
@media (max-width: 768px) {
  .user-profile-header {
    padding: 1.5rem;
  }
  
  .user-avatar {
    width: 60px;
    height: 60px;
  }
  
  .user-name {
    font-size: 1.5rem;
  }
  
  .info-card-body {
    padding: 1rem;
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .info-value {
    justify-content: flex-start;
  }
  
  .btn-close-modal,
  .btn-reset-password,
  .btn-edit-user {
    padding: 0.6rem 1.2rem !important;
    font-size: 0.9rem !important;
  }
}

/* Style pour les messages d'état vide */
.empty-state {
  padding: 3rem 1rem;
  text-align: center;
  color: #6c757d;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Animation pour les boutons de navigation */
.nav-tabs .nav-link {
  transition: all 0.3s ease;
}

.nav-tabs .nav-link:hover {
  border-color: #e9ecef #e9ecef #dee2e6;
  background-color: #f8f9fa;
}

/* Style pour les étiquettes de version */
.version-badge {
  background: linear-gradient(45deg, #6c757d, #495057);
  color: white;
  border: none;
}

/* Amélioration de la lisibilité des tableaux */
.table-responsive table {
  margin-bottom: 0;
}

.table td, .table th {
  border-top: 1px solid #dee2e6;
}

.table thead th {
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.75rem;
}

/* Style pour les actions rapides */
.quick-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.quick-action-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.quick-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Optimisation mobile pour le header */
@media (max-width: 768px) {
  .card-head {
    padding: 10px 15px !important;
  }
  
  .search-box {
    width: 200px !important;
    max-width: 200px !important;
  }
  
  .search-box input {
    font-size: 14px !important;
    padding: 8px 12px !important;
  }
  
  .default-btn {
    font-size: 13px !important;
    padding: 8px 12px !important;
  }

  /* Optimisations pour le modal mobile */
  .modal-body {
    padding: 15px !important;
  }

  .modal-body .nav-tabs {
    margin-bottom: 15px !important;
  }

  .modal-body .nav-link {
    padding: 6px 10px !important;
    font-size: 0.75rem !important;
    border-radius: 4px !important;
  }

  .modal-body .nav-tabs .nav-link.active {
    background-color: #33b04a !important;
    border-color: #33b04a !important;
    color: white !important;
  }

  .modal-body .nav-tabs .nav-link:hover {
    border-color: #33b04a !important;
    color: #33b04a !important;
  }

  .modal-body .card {
    margin-bottom: 15px !important;
  }

  .modal-body .card-header {
    padding: 10px 15px !important;
  }

  .modal-body .card-body {
    padding: 15px !important;
  }

  .modal-body .info-item {
    margin-bottom: 0.75rem !important;
  }

  .modal-body .info-item label {
    font-size: 0.7rem !important;
    margin-bottom: 0.2rem !important;
  }

  .modal-body .h3, .modal-body .h4, .modal-body .h5, .modal-body .h6 {
    font-size: 1rem !important;
    margin-bottom: 0.25rem !important;
  }

  .modal-body .badge {
    font-size: 0.7rem !important;
    padding: 4px 8px !important;
  }

  .modal-body .row.g-4 {
    --bs-gutter-x: 0.75rem !important;
    --bs-gutter-y: 0.75rem !important;
  }

  .modal-body .col-md-4, .modal-body .col-md-6, .modal-body .col-md-8 {
    margin-bottom: 0.5rem !important;
  }

  /* Optimisation des colonnes sur mobile */
  .modal-body .col-md-4 {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }

  .modal-body .col-md-6 {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }

  .modal-body .col-md-8 {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }

  /* Tableau responsive dans le modal */
  .modal-body .table-responsive {
    font-size: 0.8rem !important;
  }

  .modal-body .table th,
  .modal-body .table td {
    padding: 6px 8px !important;
    font-size: 0.75rem !important;
  }

  /* Optimisation des boutons du modal */
  .modal-footer .btn {
    font-size: 0.8rem !important;
    padding: 6px 12px !important;
    min-height: 32px !important;
  }

  .modal-footer .btn i {
    font-size: 0.75rem !important;
  }

  /* Espacement entre les boutons */
  .modal-footer {
    gap: 6px !important;
  }

  /* Optimisation des icônes et textes */
  .modal-body i {
    font-size: 0.8rem !important;
  }

  .modal-body .flaticon {
    font-size: 0.75rem !important;
  }

  /* Amélioration de la lisibilité */
  .modal-body .text-muted {
    font-size: 0.7rem !important;
  }

  .modal-body .text-primary,
  .modal-body .text-success,
  .modal-body .text-warning,
  .modal-body .text-danger,
  .modal-body .text-info {
    font-weight: 600 !important;
  }

  /* Optimisation des liens */
  .modal-body a {
    font-size: 0.8rem !important;
    word-break: break-all !important;
  }

  /* Optimisation du header utilisateur */
  .modal-body .user-profile-header {
    padding: 1.5rem !important;
  }

  .modal-body .user-avatar {
    width: 60px !important;
    height: 60px !important;
  }

  .modal-body .user-name {
    font-size: 1.5rem !important;
  }

  .modal-body .info-card-body {
    padding: 1rem !important;
  }

  .modal-body .info-row {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 0.5rem !important;
  }

  .modal-body .info-value {
    justify-content: flex-start !important;
  }

  /* Optimisation des cartes de statistiques */
  .modal-body .stats-card .card-body {
    padding: 0.75rem !important;
  }

  .modal-body .stats-card h5 {
    font-size: 1rem !important;
  }

  .modal-body .stats-card h6 {
    font-size: 0.875rem !important;
  }
}

/* Optimisations pour très petits écrans */
@media (max-width: 480px) {
  .modal-body {
    padding: 10px !important;
  }

  .modal-body .nav-tabs {
    margin-bottom: 10px !important;
  }

  .modal-body .nav-link {
    padding: 4px 8px !important;
    font-size: 0.7rem !important;
  }

  .modal-body .card-header {
    padding: 8px 12px !important;
  }

  .modal-body .card-body {
    padding: 12px !important;
  }

  .modal-body .info-item {
    margin-bottom: 0.5rem !important;
  }

  .modal-body .info-item label {
    font-size: 0.65rem !important;
  }

  .modal-body .h3, .modal-body .h4, .modal-body .h5, .modal-body .h6 {
    font-size: 0.9rem !important;
  }

  .modal-body .badge {
    font-size: 0.65rem !important;
    padding: 3px 6px !important;
  }

  .modal-footer .btn {
    font-size: 0.75rem !important;
    padding: 5px 10px !important;
    min-height: 28px !important;
  }

  .modal-footer {
    padding: 8px 12px !important;
    gap: 4px !important;
  }

  /* Optimisation du header utilisateur sur très petits écrans */
  .modal-body .user-profile-header {
    padding: 1rem !important;
  }

  .modal-body .user-avatar {
    width: 50px !important;
    height: 50px !important;
  }

  .modal-body .user-name {
    font-size: 1.3rem !important;
  }

  .modal-body .info-card-body {
    padding: 0.75rem !important;
  }
}

/* Styles pour le tiroir de filtres responsive (Offcanvas) */
.filters-offcanvas-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1040;
  transition: opacity 0.3s ease;
}

.filters-offcanvas {
  position: fixed;
  top: 0;
  right: -320px;
  width: 320px;
  height: 100vh;
  background: #ffffff;
  z-index: 1050;
  box-shadow: -2px 0 15px rgba(0,0,0,0.15);
  transition: right 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
}

.filters-offcanvas.show {
  right: 0;
}

.filters-offcanvas .offcanvas-header {
  border-bottom: 1px solid #eef2f5;
  background: #f8f9fa;
}

.filters-offcanvas .offcanvas-body {
  overflow-y: auto;
  flex: 1;
}

.border-gray {
  border: 1px solid #dee2e6 !important;
}

/* Harmonisation de la hauteur des éléments dans l'entête (Header) */
.card-head .default-btn,
.card-head .form-select,
.card-head .btn-outline-secondary,
.card-head .search-box input {
  height: 42px !important;
  box-sizing: border-box !important;
  font-size: 14px !important;
}

/* Alignement vertical et padding pour les boutons */
.card-head .default-btn,
.card-head .btn-outline-secondary {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  vertical-align: middle !important;
}

/* Centrage vertical du texte de recherche */
.card-head .search-box input {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  line-height: 42px !important;
}

/* Réduction de la hauteur de l'entête pour éviter qu'il soit trop imposant */
.card-head {
  padding-top: 12px !important;
  padding-bottom: 12px !important;
}
</style>