<template>
  <div>
    <div class="card mb-25 border-0 rounded-0 bg-white letter-spacing">
      <div
        class="card-head box-shadow bg-white d-flex align-items-center justify-content-between p-15 p-sm-20 p-md-25">
        <div class="d-flex align-items-center">
          <button
            v-if="canManageAgencies"
            class="default-btn position-relative transition border-0 fw-medium pt-11 pb-11 ps-15 pe-15 ps-md-25 pe-md-25 pt-md-12 pb-md-12 ps-md-30 pe-md-30 rounded-1 fs-14 fs-md-15 fs-lg-16 d-inline-block me-10 mb-0"
            style="background-color: #33b04a; color: #231f20; border-color: #33b04a;"
            @click="ouvrirModalAjout">
            <i class="flaticon-plus position-relative ms-2 ms-md-5 fs-12"></i>
            <span class="d-none d-sm-inline">Ajouter une agence</span>
            <span class="d-sm-none">Agence</span>
          </button>
          
          <!-- Bouton import en masse -->
          <button 
            v-if="canManageAgencies"
            class="default-btn position-relative transition border-0 fw-medium pt-11 pb-11 ps-15 pe-15 ps-md-25 pe-md-25 pt-md-12 pb-md-12 ps-md-30 pe-md-30 rounded-1 fs-14 fs-md-15 fs-lg-16 d-none d-md-inline-block me-10 mb-0"
            style="background-color: #17a2b8; color: #ffffff; border-color: #17a2b8;"
            @click="showImportModal = true">
            <i class="fas fa-upload position-relative ms-2 ms-md-5 fs-12"></i>
            <span class="d-none d-lg-inline">Import en masse</span>
            <span class="d-lg-none">Import</span>
          </button>
          
          <!-- Bouton export - caché sur mobile -->
          <button 
            class="default-btn position-relative transition border-0 fw-medium pt-11 pb-11 ps-15 pe-15 ps-md-25 pe-md-25 pt-md-12 pb-md-12 ps-md-30 pe-md-30 rounded-1 fs-14 fs-md-15 fs-lg-16 d-none d-md-inline-block me-10 mb-0"
            style="background-color: #231f20; color: #ede947; border-color: #231f20;"
            @click="exporterAgences">
            <i class="flaticon-download position-relative ms-2 ms-md-5 fs-12"></i>
            <span class="d-none d-lg-inline">Exporter</span>
            <span class="d-lg-none">Export</span>
          </button>
        </div>
        <div class="d-flex align-items-center">
          <form class="search-box position-relative me-15" @submit.prevent="rechercher">
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
          <table class="table text-nowrap align-middle mb-0">
            <thead>
              <tr>
                <th class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">AGENCE</th>
                <th class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">ADRESSE</th>
                <th class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">CONTACT</th>
                <th class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">UTILISATEURS</th>
                <th class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">CONTRATS</th>
                <th class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">CRÉÉE LE</th>
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
                <td><div class="skeleton-line" style="width: 120px;"></div></td>
                <td><div class="skeleton-line" style="width: 100px;"></div></td>
                <td><div class="skeleton-badge"></div></td>
                <td><div class="skeleton-badge"></div></td>
                <td><div class="skeleton-line" style="width: 80px;"></div></td>
                <td><div class="skeleton-btn"></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="card-body p-15 p-sm-20 p-md-25">
        <div class="table-responsive">
          <table class="table text-nowrap align-middle mb-0">
            <thead>
              <tr>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">AGENCE</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">ADRESSE</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">CONTACT</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">UTILISATEURS</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">CONTRATS</th>
                <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3">CRÉÉE LE</th>
                <th key="actions" scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 py-3 text pe-0">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="agencies.length === 0">
                <td colspan="7" class="text-center text-muted py-4">
                  Aucune agence trouvée
                </td>
              </tr>
              <tr v-for="(agency, index) in agencies" :key="`agency-${agency.id || index}`">
                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <div class="d-flex align-items-center">
                    <div class="me-3">
                      <div class="avatar-circle" :style="{ background: getAgencyColor(agency.name) }">
                        <span class="avatar-initials">{{ getAgencyInitials(agency.name) }}</span>
                      </div>
                    </div>
                    <div>
                      <strong class="text-dark">{{ agency.name }}</strong>
                      <br>
                      <small class="text-muted">
                        <i class="flaticon-building me-1"></i>
                        Agence #{{ agency.id }}
                      </small>
                    </div>
                  </div>
                </td>

                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <div v-if="agency['address']">
                    <i class="flaticon-location me-1 text-danger"></i>
                    <span class="text-dark">{{ agency['address'] }}</span>
                  </div>
                  <div v-else class="text-muted">
                    <i class="flaticon-location me-1"></i>
                    Non renseigné
                  </div>
                </td>

                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <div>
                    <div v-if="agency.phone">
                      <strong class="text-success">
                        <i class="flaticon-phone-call me-1"></i>
                        {{ agency.phone }}
                      </strong>
                    </div>
                    <div v-if="agency.email" class="mt-1">
                      <small class="text-info">
                        <i class="flaticon-email me-1"></i>
                        {{ agency.email }}
                      </small>
                    </div>
                    <div v-if="!agency.phone && !agency.email" class="text-muted">
                      <i class="flaticon-phone-call me-1"></i>
                      Non renseigné
                    </div>
                  </div>
                </td>

                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <div class="d-flex align-items-center">
                    <span class="badge bg-primary me-2">
                      <i class="flaticon-user me-1"></i>
                      {{ agency.usersCount || agency.users?.length || 0 }}
                    </span>
                    <button 
                      v-if="(agency.usersCount || agency.users?.length || 0) > 0"
                      class="btn btn-sm btn-outline-primary"
                      @click="voirDetailsAvecOnglet(agency, 'users')"
                      title="Voir les utilisateurs">
                      <i class="flaticon-eye"></i>
                    </button>
                  </div>
                </td>

                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <div class="d-flex align-items-center">
                    <span class="badge bg-info me-2">
                      <i class="flaticon-file-1 me-1"></i>
                      {{ agency.contractsCount || agency.contracts?.length || 0 }}
                    </span>
                    <button 
                      v-if="(agency.contractsCount || agency.contracts?.length || 0) > 0"
                      class="btn btn-sm btn-outline-info"
                      @click="voirDetailsAvecOnglet(agency, 'contracts')"
                      title="Voir les contrats">
                      <i class="flaticon-eye"></i>
                    </button>
                  </div>
                </td>

                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <div>
                    <strong>{{ formatDate(agency.createdAt?.toString()) }}</strong>
                    <div v-if="agency.updatedAt && agency.updatedAt !== agency.createdAt" class="mt-1">
                      <small class="badge bg-light text-dark">
                        <i class="flaticon-refresh me-1"></i>
                        Modifiée {{ formatDateRelative(agency.updatedAt?.toString()) }}
                      </small>
                    </div>
                  </div>
                </td>

                <td class="shadow-none lh-1 fw-medium text-body-tertiary text pe-0">
                  <button
                    v-if="agency.id"
                    @click="voirDetails(agency)"
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
        
        <!-- Pagination -->
        <div
          class="pagination-area d-md-flex mt-15 mt-sm-20 mt-md-25 justify-content-between align-items-center"
          v-if="totalElements > 0"
        >
          <PaginationComponent 
            :page="page" 
            :totalPages="totalPages" 
            :totalElements="totalElements" 
            :limit="limit" 
            @paginate="handlePaginate" 
          />
        </div>
      </div>
    </div>

    <!-- Modal détails -->
    <div class="modal fade" id="detailsModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content shadow-lg">
          <div class="modal-header">
            <h4 class="modal-title fw-bold d-flex align-items-center gap-2">
              <img src="@/assets/images/logo-guda-with.png" alt="L'Africaine Vie" class="modal-inline-logo" />
              <span>Détails de l'agence {{ agencyDetails?.name || 'Sans nom' }}</span>
            </h4>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          
        <div class="modal-body p-4" v-if="agencyDetails">
          <!-- Navigation par onglets -->
          <ul class="nav nav-tabs nav-tabs-custom mb-4" id="agencyTabs" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active d-flex align-items-center" 
                        id="info-tab" 
                        data-bs-toggle="tab" 
                        data-bs-target="#info-panel" 
                        type="button" 
                        role="tab" 
                        aria-controls="info-panel" 
                        aria-selected="true">
                  <i class="flaticon-building me-2"></i>
                  Informations Générales
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link d-flex align-items-center" 
                        id="users-tab" 
                        data-bs-toggle="tab" 
                        data-bs-target="#users-panel" 
                        type="button" 
                        role="tab" 
                        aria-controls="users-panel" 
                        aria-selected="false"
                        @click="chargerUtilisateursAgence">
                  <i class="flaticon-user me-2"></i>
                  Utilisateurs ({{ agencyUsers.length }})
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link d-flex align-items-center" 
                        id="contracts-tab" 
                        data-bs-toggle="tab" 
                        data-bs-target="#contracts-panel" 
                        type="button" 
                        role="tab" 
                        aria-controls="contracts-panel" 
                        aria-selected="false"
                        @click="() => chargerContratsAgence()">
                  <i class="flaticon-file-1 me-2"></i>
                  Contrats ({{ agencyContracts.length }})
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link d-flex align-items-center" 
                        id="stats-tab" 
                        data-bs-toggle="tab" 
                        data-bs-target="#stats-panel" 
                        type="button" 
                        role="tab" 
                        aria-controls="stats-panel" 
                        aria-selected="false"
                        @click="chargerStatistiquesAgence">
                  <i class="flaticon-chart me-2"></i>
                  Statistiques
                </button>
              </li>
            </ul>

            <!-- Contenu des onglets -->
            <div class="tab-content" id="agencyTabsContent">
              
              <!-- Onglet Informations Générales -->
              <div class="tab-pane fade show active" 
                   id="info-panel" 
                   role="tabpanel" 
                   aria-labelledby="info-tab">
                
                <!-- Header avec logo et infos principales -->
                <div class="agency-profile-header mb-4">
                  <div class="row align-items-center">
                    <div class="col-auto">
                      <div class="agency-avatar">
                        <div class="agency-logo-placeholder">
                          <i class="flaticon-building"></i>
                        </div>
                      </div>
                    </div>
                    <div class="col">
                      <h3 class="agency-name mb-2">{{ agencyDetails.name || 'Agence sans nom' }}</h3>
                      <div class="agency-id">
                        <span class="id-badge">
                          <i class="flaticon-hashtag"></i>
                          Agence #{{ agencyDetails.id }}
                        </span>
                      </div>
                    </div>
                    <div class="col-auto">
                      <div class="agency-stats">
                        <span class="stats-badge">
                          <i class="flaticon-user"></i>
                          {{ agencyDetails.usersCount || agencyUsers.length || 0 }} utilisateurs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Informations détaillées -->
                <div class="row g-4">
                  <!-- Informations générales -->
                  <div class="col-md-6">
                    <div class="info-card">
                      <div class="info-card-header">
                        <i class="flaticon-building"></i>
                        <h5>Informations générales</h5>
                      </div>
                      <div class="info-card-body">
                        <div class="info-row">
                          <span class="info-label">Nom complet</span>
                          <span class="info-value">
                            <i class="flaticon-building"></i>
                            {{ agencyDetails.name || 'Non renseigné' }}
                          </span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Date de création</span>
                          <span class="info-value">
                            <i class="flaticon-calendar"></i>
                            {{ formatDate(agencyDetails.createdAt?.toString()) || '-' }}
                          </span>
                        </div>
                        <div v-if="agencyDetails.updatedAt && agencyDetails.updatedAt !== agencyDetails.createdAt" class="info-row">
                          <span class="info-label">Dernière modification</span>
                          <span class="info-value">
                            <i class="flaticon-refresh"></i>
                            {{ formatDate(agencyDetails.updatedAt?.toString()) }}
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
                            <a v-if="agencyDetails.phone" :href="`tel:${agencyDetails.phone}`" class="contact-link">
                              {{ agencyDetails.phone }}
                            </a>
                            <span v-else class="text-muted">Non renseigné</span>
                          </span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Email</span>
                          <span class="info-value">
                            <i class="flaticon-email"></i>
                            <a v-if="agencyDetails.email" :href="`mailto:${agencyDetails.email}`" class="contact-link">
                              {{ agencyDetails.email }}
                            </a>
                            <span v-else class="text-muted">Non renseigné</span>
                          </span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Adresse</span>
                          <span class="info-value">
                            <i class="flaticon-location"></i>
                            {{ agencyDetails['address'] || agencyDetails.location || 'Non renseignée' }}
                          </span>
                        </div>
                        <div v-if="agencyDetails['fax']" class="info-row">
                          <span class="info-label">Fax</span>
                          <span class="info-value">
                            <i class="flaticon-printer"></i>
                            {{ agencyDetails['fax'] }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Statistiques -->
                  <div class="col-md-6">
                    <div class="info-card">
                      <div class="info-card-header">
                        <i class="flaticon-chart"></i>
                        <h5>Statistiques</h5>
                      </div>
                      <div class="info-card-body">
                        <div class="info-row">
                          <span class="info-label">Utilisateurs</span>
                          <span class="info-value users-count">
                            <i class="flaticon-user"></i>
                            {{ agencyDetails.usersCount || agencyUsers.length || 0 }}
                          </span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Contrats</span>
                          <span class="info-value contracts-count">
                            <i class="flaticon-file-1"></i>
                            {{ agencyDetails.contractsCount || agencyContracts.length || 0 }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Informations système -->
                  <div class="col-md-6">
                    <div class="info-card">
                      <div class="info-card-header">
                        <i class="flaticon-settings"></i>
                        <h5>Système</h5>
                      </div>
                      <div class="info-card-body">
                        <div class="info-row">
                          <span class="info-label">ID Abonné</span>
                          <span class="info-value">
                            <i class="flaticon-hashtag"></i>
                            {{ agencyDetails['idSubscriber'] || '-' }}
                          </span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Créé par</span>
                          <span class="info-value">
                            <i class="flaticon-user"></i>
                            Utilisateur #{{ agencyDetails['createdBy'] || '-' }}
                          </span>
                        </div>
                        <div v-if="agencyDetails['updatedBy']" class="info-row">
                          <span class="info-label">Modifié par</span>
                          <span class="info-value">
                            <i class="flaticon-user"></i>
                            Utilisateur #{{ agencyDetails['updatedBy'] }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Onglet Utilisateurs -->
              <div class="tab-pane fade" 
                   id="users-panel" 
                   role="tabpanel" 
                   aria-labelledby="users-tab">
                <div class="card">
                  <div class="card-header text-dark d-flex justify-content-between align-items-center" style="background-color: #e2e3e5; border-bottom: 2px solid #d6d8db;">
                    <h5 class="card-title mb-0">
                      <i class="flaticon-user me-2 text-success"></i>
                      Utilisateurs de l'agence ({{ agencyUsers.length }})
                    </h5>
                  </div>
                  <div class="card-body">
                    <div v-if="loadingUsers" class="text-center py-4">
                      <div class="spinner-border" role="status">
                        <span class="visually-hidden">Chargement...</span>
                      </div>
                    </div>
                    <div v-else-if="agencyUsers.length === 0" class="text-center py-5">
                      <i class="flaticon-user fs-1 text-muted opacity-50 mb-3"></i>
                      <h5 class="text-muted">Aucun utilisateur</h5>
                      <p class="text-muted">Cette agence n'a pas encore d'utilisateur assigné</p>
                    </div>
                    <div v-else class="table-responsive">
                      <table class="table table-sm">
                        <thead class="table-light">
                          <tr>
                            <th>Nom</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Rôle</th>
                            <th>Statut</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="user in agencyUsers" :key="user.id">
                            <td>
                              <div class="d-flex align-items-center">
                                <div class="me-2">
                                  <i :class="user.gender === 'M' ? 'flaticon-male text-primary' : 'flaticon-female text-danger'"></i>
                                </div>
                                <div>
                                  <strong>{{ user.lastname }} {{ user.firstname }}</strong>
                                </div>
                              </div>
                            </td>
                            <td>{{ user.email }}</td>
                            <td>{{ user.phone }}</td>
                            <td>
                              <span class="badge bg-primary">{{ user.role?.['libelle'] || user.role?.name || 'N/A' }}</span>
                            </td>
                            <td>
                              <span :class="getStatutClass(user)">
                                {{ getStatutTexte(user) }}
                              </span>
                            </td>
                            <td>
                              <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary btn-sm" 
                                        @click="voirUtilisateur(user.id)"
                                        title="Voir détails">
                                  <i class="flaticon-eye"></i>
                                </button>
                                <button class="btn btn-outline-success btn-sm" 
                                        @click="modifierUtilisateur(user.id)"
                                        title="Modifier">
                                  <i class="flaticon-pen"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Onglet Contrats -->
              <div class="tab-pane fade" 
                   id="contracts-panel" 
                   role="tabpanel" 
                   aria-labelledby="contracts-tab">
                <div class="card">
                  <div class="card-header text-dark d-flex justify-content-between align-items-center" style="background-color: #f1f3f4; border-bottom: 2px solid #e9ecef;">
                    <h5 class="card-title mb-0">
                      <i class="flaticon-file-1 me-2 text-info"></i>
                      Contrats de l'agence ({{ agencyContracts.length }})
                    </h5>
                  </div>
                  <div class="card-body">
                    <div v-if="loadingContracts" class="text-center py-4">
                      <div class="spinner-border" role="status">
                        <span class="visually-hidden">Chargement...</span>
                      </div>
                    </div>
                    <div v-else-if="agencyContracts.length === 0" class="text-center py-5">
                      <i class="flaticon-file-1 fs-1 text-muted opacity-50 mb-3"></i>
                      <h5 class="text-muted">Aucun contrat</h5>
                      <p class="text-muted">Cette agence n'a pas encore de contrat enregistré</p>
                    </div>
                    <div v-else>
                      <!-- Version responsive pour mobile -->
                      <div class="d-md-none">
                        <div v-for="contract in agencyContracts" :key="contract['id'] || contract.code" class="card mb-3 border">
                          <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                              <h6 class="card-title text-primary mb-0">{{ contract.customer?.firstname }} {{ contract.customer?.lastname }}</h6>
                            </div>
                            <p class="card-text">
                              <strong>Police:</strong> <span class="badge bg-info">{{ contract.police }}</span><br>
                              <strong>Capital:</strong> <span class="text-success fw-bold">{{ formatMontant(contract.capital) }}</span><br>
                              <strong>Prime TTC:</strong> <span class="text-warning fw-bold">{{ formatMontant(contract['puttc'] || contract.primeTTC) || '-' }}</span>
                            </p>
                            <div class="btn-group btn-group-sm w-100">
                              <button class="btn btn-outline-danger" 
                                      @click="genererPDFContrat(contract['id'] || contract.code)"
                                      :disabled="loadingContracts"
                                      title="Générer PDF">
                                <i v-if="!loadingContracts" class="flaticon-file-1 me-1"></i>
                                <div v-else class="spinner-border spinner-border-sm me-1" role="status">
                                  <span class="visually-hidden">Chargement...</span>
                                </div>
                                {{ loadingContracts ? 'Génération...' : 'PDF' }}
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
                            <tr v-for="contract in agencyContracts" :key="contract['id'] || contract.code">
                              <td>
                                <div>
                                  <strong>{{ contract.customer?.firstname }} {{ contract.customer?.lastname }}</strong>
                                  <div v-if="contract.customer?.['phone']" class="small text-muted">
                                    <i class="flaticon-phone-call me-1"></i>{{ contract.customer['phone'] }}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span class="badge bg-info">{{ contract.police }}</span>
                              </td>
                              <td>
                                <strong class="text-success">{{ formatMontant(contract.capital) }}</strong>
                              </td>
                              <td>
                                <strong class="text-warning">{{ formatMontant(contract['puttc'] || contract.primeTTC) || '-' }}</strong>
                              </td>
                              <td>
                                <button class="btn btn-outline-danger btn-sm" 
                                        @click="genererPDFContrat(contract['id'] || contract.code)"
                                        :disabled="loadingContracts"
                                        title="Générer PDF">
                                  <i v-if="!loadingContracts" class="flaticon-file-1 me-1"></i>
                                  <div v-else class="spinner-border spinner-border-sm me-1" role="status">
                                    <span class="visually-hidden">Chargement...</span>
                                  </div>
                                  {{ loadingContracts ? 'Génération...' : 'PDF' }}
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

              <!-- Onglet Statistiques -->
              <div class="tab-pane fade" 
                   id="stats-panel" 
                   role="tabpanel" 
                   aria-labelledby="stats-tab">
                <div class="card">
                  <div class="card-header text-dark" style="background-color: #dee2e6; border-bottom: 2px solid #ced4da;">
                    <h5 class="card-title mb-0">
                      <i class="flaticon-chart me-2 text-warning"></i>
                      Statistiques de l'agence
                    </h5>
                  </div>
                  <div class="card-body">
                    <div v-if="loadingStats" class="text-center py-4">
                      <div class="spinner-border" role="status">
                        <span class="visually-hidden">Chargement...</span>
                      </div>
                    </div>
                    <div v-else class="row g-4">
                      <div class="col-md-3">
                        <div class="stat-card bg-primary text-white rounded p-3">
                          <div class="d-flex align-items-center">
                            <i class="flaticon-user fs-2 me-3"></i>
                            <div>
                              <h5 class="mb-0">{{ agencyStats.totalUsers || 0 }}</h5>
                              <small>Utilisateurs</small>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="stat-card bg-info text-white rounded p-3">
                          <div class="d-flex align-items-center">
                            <i class="flaticon-file-1 fs-2 me-3"></i>
                            <div>
                              <h5 class="mb-0">{{ agencyStats.totalContracts || 0 }}</h5>
                              <small>Contrats</small>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="stat-card bg-success text-white rounded p-3">
                          <div class="d-flex align-items-center">
                            <i class="flaticon-money fs-2 me-3"></i>
                            <div>
                              <h5 class="mb-0">{{ formatMontant(agencyStats.totalPrimes || 0) }}</h5>
                              <small>Primes totales</small>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="stat-card bg-warning text-dark rounded p-3">
                          <div class="d-flex align-items-center">
                            <i class="flaticon-chart fs-2 me-3"></i>
                            <div>
                              <h5 class="mb-0">{{ agencyStats.activeContracts || 0 }}</h5>
                              <small>Contrats actifs</small>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Graphiques ou statistiques détaillées -->
                      <div class="col-12 mt-4">
                        <div class="row">
                          <div class="col-md-6">
                            <div class="card border">
                              <div class="card-header">
                                <h6 class="mb-0">Répartition par statut utilisateur</h6>
                              </div>
                              <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                  <span>Actifs</span>
                                  <span class="badge bg-success">{{ agencyStats.activeUsers || 0 }}</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                  <span>Suspendus</span>
                                  <span class="badge bg-warning">{{ agencyStats.suspendedUsers || 0 }}</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                  <span>Inactifs</span>
                                  <span class="badge bg-danger">{{ agencyStats.inactiveUsers || 0 }}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div class="col-md-6">
                            <div class="card border">
                              <div class="card-header">
                                <h6 class="mb-0">Répartition par statut contrat</h6>
                              </div>
                              <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                  <span>Actifs</span>
                                  <span class="badge bg-success">{{ agencyStats.activeContracts || 0 }}</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                  <span>En attente</span>
                                  <span class="badge bg-warning">{{ agencyStats.pendingContracts || 0 }}</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                  <span>Expirés</span>
                                  <span class="badge bg-danger">{{ agencyStats.expiredContracts || 0 }}</span>
                                </div>
                              </div>
                            </div>
                          </div>
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
                    style="background-color: #6c757d; color: #ffffff; border-color: #6c757d;" 
                    data-bs-dismiss="modal">
              <i class="flaticon-cancel me-2"></i>Fermer
            </button>
            
            <button type="button" class="btn btn-lg" 
                    style="background-color: #495057; color: #ffffff; border-color: #495057;" 
                    v-if="agencyDetails?.id" 
                    @click="modifier(agencyDetails)">
              <i class="flaticon-pen me-2"></i>Modifier
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal d'ajout/édition d'agence -->
    <AddAgencyModal 
      :show="showModal"
      :agency-id="selectedAgencyId || undefined"
      @agency-saved="handleAgencySaved"
      @modal-closed="showModal = false"
    />

    <!-- Modal d'import en masse -->
    <ImportAgenciesModal
      :isVisible="showImportModal"
      @close="showImportModal = false"
      @imported="handleAgenciesImported"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed, type Ref } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore, User } from "../../services/auth";
import AddAgencyModal from "./AddAgenceModal.vue";
import { default as ImportAgenciesModal } from "./ImportAgenciesModal.vue";

import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import ApiService from "../../services/ApiService";
import JwtService from "../../services/JwtService";
import { error, success } from "../../utils/utils";
import PaginationComponent from '../Utilities/Pagination.vue';
import { nextTick } from 'vue';
import { Modal } from 'bootstrap';
import { Agency } from "../../models/Agency";

// Interface pour les agences


// Interface pour les utilisateurs dans l'agence
interface AgencyUser {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  gender: "M" | "F";
  status: string;
  role?: {
    id: number;
    name: string;
  };
}

// Interface pour les contrats dans l'agence
interface AgencyContract {
  code: string;
  police: string;
  capital: number;
  primeTTC: number;
  status: number;
  customer?: {
    firstname: string;
    lastname: string;
  };
}

// Interface pour les statistiques
interface AgencyStats {
  totalUsers: number;
  totalContracts: number;
  totalPrimes: number;
  activeContracts: number;
  activeUsers: number;
  suspendedUsers: number;
  inactiveUsers: number;
  pendingContracts: number;
  expiredContracts: number;
}

export default defineComponent({
  name: "ListeAgence",
  components: {
    PaginationComponent,
    AddAgencyModal,
    ImportAgenciesModal
  },
  setup() {
    // Composables
    const router = useRouter();
    const authStore = useAuthStore();
    const { user: authUser } = storeToRefs(authStore);
    const canManageAgencies = computed(() => {
      const roleName = (authUser.value?.role?.libelle || authUser.value?.role?.name || '').toUpperCase();
      return authUser.value?.idRole === 1 || authUser.value?.idRole === 5 || roleName === 'ADMIN' || roleName === 'SUPER ADMIN' || roleName === 'SUPER_ADMIN';
    });

    // Refs
    const agencies = ref<Array<Agency>>([]);   
    const agencyDetails = ref<Agency | null>(null);
    const agencyUsers = ref<Array<AgencyUser>>([]);
    const agencyContracts = ref<Array<AgencyContract>>([]);
    const agencyStats = ref<AgencyStats>({
      totalUsers: 0,
      totalContracts: 0,
      totalPrimes: 0,
      activeContracts: 0,
      activeUsers: 0,
      suspendedUsers: 0,
      inactiveUsers: 0,
      pendingContracts: 0,
      expiredContracts: 0
    });
    
    const loading = ref(false);
    const loadingUsers = ref(false);
    const loadingContracts = ref(false);
    const loadingStats = ref(false);

    // Pagination des contrats
    const contratsPage = ref(1);
    const contratsLimit = ref(7);
    const contratsTotalPages = ref(0);
    const contratsTotalElements = ref(0);

    // Modal
    const showModal = ref(false);
    const showImportModal = ref(false);
    const selectedAgencyId = ref<number | null>(null);

    // Pagination
    const searchTerm = ref('');
    const page = ref(1);
    const totalPages = ref(0);
    const limit = ref(10);
    const totalElements = ref(0);

    const handlePaginate = ({ page_, limit_ }: { page_: number; limit_: number }) => {
      try {
        page.value = page_;
        limit.value = limit_;
        getAllAgencies(page_, limit_, searchTerm.value);
      } catch (err) {
        console.error('Erreur pagination:', err);
      }
    };

    function rechercher() {
      page.value = 1;
      getAllAgencies(page.value, limit.value, searchTerm.value);
    }

    async function getAllAgencies(pageNum = 1, limitNum = 10, search = '') {
      try {
        loading.value = true;
        
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: limitNum.toString(),
          includeUsers: 'true',
          includeContracts: 'true',
          ...(search && { search })
        });

        const url = `/agencies?${params}`;

        const response = await ApiService.get(url);
        const { data } = response;
        
        
        if (!data) {
          agencies.value = [];
          totalPages.value = 0;
          totalElements.value = 0;
          return;
        }

        // Adapter à la structure de réponse du backend : { data: { message: string, agencies: Agency[], pagination: {...} } }
        if (data && data.data && data.data.agencies && Array.isArray(data.data.agencies)) {
          let agenciesList = data.data.agencies;
          
          // Filtrer par recherche côté client si un terme est fourni (optionnel, peut être fait côté serveur aussi)
          if (search && search.trim()) {
            const searchLower = search.toLowerCase().trim();
            agenciesList = agenciesList.filter(agency => 
              agency.id?.toString().includes(searchLower) ||
              agency.name?.toLowerCase().includes(searchLower) ||
              agency.address?.toLowerCase().includes(searchLower) ||
              agency.phone?.toLowerCase().includes(searchLower)
            );
          }
          
          // Utiliser les agences retournées par le backend (déjà paginées)
          agencies.value = agenciesList;
          
          // Utiliser les métadonnées de pagination du backend
          if (data.data.pagination) {
            totalElements.value = data.data.pagination.total;
            totalPages.value = data.data.pagination.totalPages;
            page.value = data.data.pagination.page;
            limit.value = data.data.pagination.limit;
          } else {
            // Fallback si les métadonnées ne sont pas disponibles
            totalElements.value = agenciesList.length;
            totalPages.value = 1;
            page.value = pageNum;
            limit.value = limitNum;
          }
        } else if (data && data.data && Array.isArray(data.data)) {
          // Fallback pour compatibilité avec l'ancienne structure
          agencies.value = data.data;
          totalPages.value = 1;
          totalElements.value = agencies.value.length;
          page.value = pageNum;
          limit.value = limitNum;
        } else {
          agencies.value = [];
          totalPages.value = 0;
          totalElements.value = 0;
        }
        
      } catch (err: any) {
        console.error("❌ Erreur lors de la récupération des agences:", err);
        console.error("❌ Détails de l'erreur:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        error(err?.response?.data?.message || "Erreur lors de la récupération des agences");
        agencies.value = [];
        totalPages.value = 0;
        totalElements.value = 0;
      } finally {
        loading.value = false;
      }
    }

    // Fonctions de gestion des modals
    function ouvrirModalAjout() {
      selectedAgencyId.value = null;
      showModal.value = true;
    }

    function modifier(agency: Agency) {
      selectedAgencyId.value = agency.id;
      showModal.value = true;
      
      // Fermer le modal de détails si ouvert
      const modalElement = document.getElementById('detailsModal');
      if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
    }

    function handleAgencySaved(event: any) {
      showModal.value = false;
      selectedAgencyId.value = null;
      
      // Rafraîchir la liste
      getAllAgencies(page.value, limit.value, searchTerm.value);
    }

    function handleAgenciesImported(count: number): void {
      success(`${count} agence(s) importée(s) avec succès !`);
      getAllAgencies(page.value, limit.value, searchTerm.value);
    }

    function voirDetails(agency: Agency) {
      if (!agency || !agency.id) return;
      try {
        const slug = (agency as any).uuid ? `${(agency as any).uuid}-${agency.id}` : agency.id.toString();
        router.push({
          name: "AgencyDetailPage",
          params: { id: slug }
        });
      } catch (err) {
        console.error('❌ Erreur lors de la navigation:', err);
        error('Erreur lors de la navigation vers la page de détails.');
      }
    }



    async function chargerToutesLesDonnees() {
      if (!agencyDetails.value?.id) return;
      
      try {
        // Charger les utilisateurs et contrats en parallèle
        await Promise.all([
          chargerUtilisateursAgence(),
          chargerContratsAgence()
        ]);
        
        // Calculer les statistiques une fois que tout est chargé
        chargerStatistiquesAgence();
        
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des données:', err);
      }
    }

    async function chargerStatistiquesAgence() {
      if (!agencyDetails.value?.id) return;
      
      try {
        loadingStats.value = true;
        
        // Calculer les statistiques à partir des données déjà chargées
        const totalUsers = agencyUsers.value.length;
        const totalContracts = agencyContracts.value.length;
        
        // Calculer les primes totales
        const totalPrimes = agencyContracts.value.reduce((sum, contract) => {
          return sum + (contract.primeTTC || contract['puttc'] || 0);
        }, 0);
        
        // Calculer les utilisateurs par statut
        const activeUsers = agencyUsers.value.filter(user => user.status === 'ACTIVE').length;
        const suspendedUsers = agencyUsers.value.filter(user => user.status === 'SUSPENDED').length;
        const inactiveUsers = agencyUsers.value.filter(user => user.status === 'INACTIVE').length;
        
        // Calculer les contrats par statut
        const activeContracts = agencyContracts.value.filter(contract => contract.status === 1).length;
        const pendingContracts = agencyContracts.value.filter(contract => contract.status === 0).length;
        const expiredContracts = agencyContracts.value.filter(contract => {
          if (!contract['dateEch']) return false;
          return new Date(contract['dateEch']) < new Date();
        }).length;
        
        agencyStats.value = {
          totalUsers,
          totalContracts,
          totalPrimes,
          activeContracts,
          activeUsers,
          suspendedUsers,
          inactiveUsers,
          pendingContracts,
          expiredContracts
        };
        
        
      } catch (err: any) {
        console.error('❌ Erreur lors du calcul des statistiques:', err);
        error('Erreur lors du calcul des statistiques de l\'agence');
      } finally {
        loadingStats.value = false;
      }
    }

    async function genererPDFContrat(contractId: number) {
      if (!contractId) {
        error('ID de contrat manquant');
        return;
      }

      
      // Activer l'état de chargement
      loadingContracts.value = true;

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
        loadingContracts.value = false;
      }
    }

    async function voirDetailsAvecOnglet(agency: Agency, onglet: 'users' | 'contracts') {
      try {
        
        // Charger les détails de l'agence
        const { data } = await ApiService.get(`/agencies/${agency.id}?includeUsers=true&includeContracts=true`);
        
        if (data && data.data) {
          // L'API retourne { code, message, data: { agency: {...} } }
          if (data.data.agency) {
            agencyDetails.value = data.data.agency;
          } else {
            agencyDetails.value = data.data;
          }
        } else {
          agencyDetails.value = agency;
        }
        
        await nextTick();
        
        // Ouvrir le modal
        const modalElement = document.getElementById('detailsModal');
        if (modalElement) {
          const modal = new Modal(modalElement);
          modal.show();
          
          // Attendre que le modal soit complètement ouvert
          modalElement.addEventListener('shown.bs.modal', () => {
            activerOnglet(onglet);
          }, { once: true });
        }
        
        
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des détails:', err);
        agencyDetails.value = agency;
        
        await nextTick();
        
        const modalElement = document.getElementById('detailsModal');
        if (modalElement) {
          const modal = new Modal(modalElement);
          modal.show();
          
          modalElement.addEventListener('shown.bs.modal', () => {
            activerOnglet(onglet);
          }, { once: true });
        }
      }
    }

    function activerOnglet(onglet: 'users' | 'contracts') {
      
      // Désactiver tous les onglets
      const allTabs = document.querySelectorAll('#agencyTabs .nav-link');
      const allPanels = document.querySelectorAll('.tab-pane');
      
      allTabs.forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      });
      
      allPanels.forEach(panel => {
        panel.classList.remove('show', 'active');
      });
      
      // Activer l'onglet et le panneau correspondant
      let tabId = '';
      let panelId = '';
      
      if (onglet === 'users') {
        tabId = 'users-tab';
        panelId = 'users-panel';
        // Charger les utilisateurs si nécessaire
        chargerUtilisateursAgence();
      } else if (onglet === 'contracts') {
        tabId = 'contracts-tab';
        panelId = 'contracts-panel';
        // Charger les contrats si nécessaire
        chargerContratsAgence();
      }
      
      const targetTab = document.getElementById(tabId);
      const targetPanel = document.getElementById(panelId);
      
      if (targetTab && targetPanel) {
        targetTab.classList.add('active');
        targetTab.setAttribute('aria-selected', 'true');
        
        targetPanel.classList.add('show', 'active');
        
      } else {
        console.error(`❌ Impossible de trouver l'onglet ou le panneau pour ${onglet}`);
      }
    }

    async function chargerUtilisateursAgence() {
      if (!agencyDetails.value?.id) return;
      
      try {
        loadingUsers.value = true;
        
        const { data } = await ApiService.get(`/agencies/${agencyDetails.value.id}/users`);
        
        if (data && data.data) {
          // L'API retourne { code, message, data: { users: [...] } }
          if (data.data.users && Array.isArray(data.data.users)) {
            agencyUsers.value = data.data.users;
          } else if (Array.isArray(data.data)) {
            agencyUsers.value = data.data;
          } else {
            agencyUsers.value = [];
          }
        } else {
          agencyUsers.value = [];
        }
        
        
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des utilisateurs:', err);
        error('Erreur lors du chargement des utilisateurs de l\'agence');
        agencyUsers.value = [];
      } finally {
        loadingUsers.value = false;
      }
    }

    async function chargerContratsAgence(page = 1) {
      if (!agencyDetails.value?.id) return;
      
      try {
        loadingContracts.value = true;
        
        // Paramètres de pagination
        const params = new URLSearchParams({
          page: page.toString(),
          limit: contratsLimit.value.toString()
        });
        
        const { data } = await ApiService.get(`/agencies/${agencyDetails.value.id}/contracts?${params}`);
        
        if (data && data.data) {
          // L'API retourne { code, message, data: { contracts: [...], total, totalPages } }
          if (data.data.contracts && Array.isArray(data.data.contracts)) {
            agencyContracts.value = data.data.contracts;
            contratsTotalElements.value = data.data.total || data.data.contracts.length;
            contratsTotalPages.value = data.data.totalPages || Math.ceil(contratsTotalElements.value / contratsLimit.value);
            contratsPage.value = page;
          } else if (Array.isArray(data.data)) {
            agencyContracts.value = data.data;
            contratsTotalElements.value = data.data.length;
            contratsTotalPages.value = 1;
            contratsPage.value = page;
          } else {
            agencyContracts.value = [];
            contratsTotalElements.value = 0;
            contratsTotalPages.value = 0;
          }
        } else {
          agencyContracts.value = [];
          contratsTotalElements.value = 0;
          contratsTotalPages.value = 0;
        }
        
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des contrats:', err);
        error('Erreur lors du chargement des contrats de l\'agence');
        agencyContracts.value = [];
        contratsTotalElements.value = 0;
        contratsTotalPages.value = 0;
      } finally {
        loadingContracts.value = false;
      }
    }

    function handleContratsPagination({ page_, limit_ }: { page_: number; limit_: number }) {
      if (page_ !== contratsPage.value && !loadingContracts.value) {
        chargerContratsAgence(page_);
      }
    }


    // Fonction utilitaire pour fermer le modal avant navigation
    function closeModalBeforeNavigation() {
      const modalElement = document.getElementById('detailsModal');
      if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
    }

    // Fonctions de navigation
    function voirUtilisateurs(agency: Agency) {
      
      const routeNames = ['ListeUtilisateurs', 'UsersList', 'Utilisateurs', 'UsersPage'];
      const fallbackPaths = ['/utilisateurs', '/liste-utilisateurs'];
      
      let routeFound = false;
      
      for (const routeName of routeNames) {
        try {
          router.push({ 
            name: routeName,
            query: { agency: agency.id.toString() }
          });
          routeFound = true;
          break;
        } catch (err) {
          continue;
        }
      }
      
      if (!routeFound) {
        for (const path of fallbackPaths) {
          try {
            router.push(`${path}?agency=${agency.id}`);
            routeFound = true;
            break;
          } catch (err) {
            continue;
          }
        }
      }
      
      if (!routeFound) {
        console.warn('⚠️ Aucune route d\'utilisateurs trouvée');
        error('Route de liste des utilisateurs non configurée.');
      }
    }

    function voirContrats(agency: Agency) {
      
      const routeNames = ['ListeContrats', 'ContratsList', 'Contrats', 'ContractsPage'];
      const fallbackPaths = ['/contrats', '/liste-contrats'];
      
      let routeFound = false;
      
      for (const routeName of routeNames) {
        try {
          router.push({ 
            name: routeName,
            query: { agency: agency.id.toString() }
          });
          routeFound = true;
          break;
        } catch (err) {
          continue;
        }
      }
      
      if (!routeFound) {
        for (const path of fallbackPaths) {
          try {
            router.push(`${path}?agency=${agency.id}`);
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

    function voirUtilisateur(userId: number) {
      
      // Fermer le modal avant de naviguer
      closeModalBeforeNavigation();
      
      const routeNames = ['DetailsUtilisateur', 'UserDetails', 'ViewUser', 'UserDetailsPage'];
      const fallbackPaths = [`/utilisateurs/${userId}`, `/utilisateur/${userId}`];
      
      let routeFound = false;
      
      for (const routeName of routeNames) {
        try {
          router.push({ 
            name: routeName, 
            params: { id: userId.toString() } 
          });
          routeFound = true;
          break;
        } catch (err) {
          continue;
        }
      }
      
      if (!routeFound) {
        for (const path of fallbackPaths) {
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
        console.warn('⚠️ Aucune route de détails utilisateur trouvée');
        error('Route de détails de l\'utilisateur non configurée.');
      }
    }

    function modifierUtilisateur(userId: number) {
      
      // Fermer le modal avant de naviguer
      closeModalBeforeNavigation();
      
      const routeNames = ['EditUser', 'ModifierUtilisateur', 'UserEdit', 'EditUserPage'];
      const fallbackPaths = [`/modifier-utilisateur/${userId}`, `/utilisateurs/${userId}/edit`];
      
      let routeFound = false;
      
      for (const routeName of routeNames) {
        try {
          router.push({ 
            name: routeName, 
            params: { id: userId.toString() } 
          });
          routeFound = true;
          break;
        } catch (err) {
          continue;
        }
      }
      
      if (!routeFound) {
        for (const path of fallbackPaths) {
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
        console.warn('⚠️ Aucune route de modification utilisateur trouvée');
        error('Route de modification de l\'utilisateur non configurée.');
      }
    }

    function voirContrat(contractCode: string) {
      
      // Fermer le modal avant de naviguer
      closeModalBeforeNavigation();
      
      try {
        // Rediriger vers /liste-contrats avec le code du contrat en paramètre
        router.push({
          path: '/liste-contrats',
          query: { 
            openContract: contractCode,
            autoOpen: 'true'
          }
        });
        
        
      } catch (err) {
        console.error('❌ Erreur lors de la navigation:', err);
        
        // Fallback : essayer avec différents chemins
        const fallbackPaths = ['/contrats', '/contract', '/liste-contrat'];
        
        let routeFound = false;
        for (const path of fallbackPaths) {
          try {
            router.push({
              path: path,
              query: { 
                openContract: contractCode,
                autoOpen: 'true'
              }
            });
            routeFound = true;
            break;
          } catch (fallbackErr) {
            continue;
          }
        }
        
        if (!routeFound) {
          console.warn('⚠️ Aucune route de liste contrats trouvée');
          error('Route de liste des contrats non configurée.');
        }
      }
    }

    function modifierContrat(contractCode: string) {
      
      // Fermer le modal avant de naviguer
      closeModalBeforeNavigation();
      
      const routeNames = ['ListeContratPage'];
      const fallbackPaths = ['/liste-contrats'];
      
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
        for (const path of fallbackPaths) {
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

    async function dupliquer(agency: Agency) {
      try {
        const result = await Swal.fire({
          title: 'Dupliquer l\'agence',
          text: `Voulez-vous créer une copie de l'agence "${agency.name}" ?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Oui, dupliquer',
          cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
          const { data } = await ApiService.post(`/agencies/${agency.id}/duplicate`, {});
          
          success(`Agence "${data.data.name}" dupliquée avec succès!`);
          
          // Rafraîchir la liste
          getAllAgencies(page.value, limit.value, searchTerm.value);
        }
      } catch (err: any) {
        console.error('❌ Erreur lors de la duplication:', err);
        error('Erreur lors de la duplication de l\'agence');
      }
    }

    async function confirmerSuppression(agencyToDelete: Agency) {
      if (!agencyToDelete.id) {
        console.error('ID d\'agence manquant');
        return;
      }
      
      try {
        const result = await Swal.fire({
          title: 'Êtes-vous sûr?',
          text: `Voulez-vous vraiment supprimer définitivement l'agence #${agencyToDelete.id} (${agencyToDelete.name})? Cette action supprimera aussi tous les utilisateurs et contrats associés.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Oui, supprimer',
          cancelButtonText: 'Annuler',
          heightAuto: false
        });

        if (result.isConfirmed) {
          await deleteAgency(agencyToDelete.id);
        }
      } catch (err) {
        console.error('Erreur lors de la confirmation:', err);
      }
    }

    async function deleteAgency(id: number) {
      try {
        const { data } = await ApiService.delete(`/agencies/${id}`);
        
        agencies.value = agencies.value.filter(a => a.id !== id);
        totalElements.value = Math.max(0, totalElements.value - 1);
        
        await Swal.fire({
          text: data.message || 'Agence supprimée avec succès',
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

        if (agencies.value.length === 0 && page.value > 1) {
          page.value--;
          await getAllAgencies(page.value, limit.value, searchTerm.value);
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

    function formatDateRelative(dateString: string | null | undefined): string {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'hier';
        if (diffDays < 7) return `il y a ${diffDays} jours`;
        if (diffDays < 30) return `il y a ${Math.ceil(diffDays / 7)} semaines`;
        if (diffDays < 365) return `il y a ${Math.ceil(diffDays / 30)} mois`;
        return `il y a ${Math.ceil(diffDays / 365)} ans`;
      } catch {
        return dateString;
      }
    }

    function formatMontant(montant: number | null | undefined): string {
      if (montant == null) return '-';
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(montant);
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

    async function exporterAgences() {
      try {
        const { value: format } = await Swal.fire({
          title: 'Format d\'export',
          input: 'select',
          inputOptions: {
            'json': 'JSON',
            'csv': 'CSV'
          },
          inputValue: 'csv',
          showCancelButton: true,
          confirmButtonText: 'Exporter',
          cancelButtonText: 'Annuler'
        });

        if (format) {
          const params = new URLSearchParams({
            format,
            includeUsers: 'true',
            includeContracts: 'true'
          });

          const { data } = await ApiService.get(`/agencies/export/data?${params}`);
          
          if (data && data.data) {
            if (format === 'csv') {
              const csvContent = convertToCSV(data.data.data, data.data.headers);
              downloadFile(csvContent, 'agences.csv', 'text/csv');
            } else {
              const jsonContent = JSON.stringify(data.data, null, 2);
              downloadFile(jsonContent, 'agences.json', 'application/json');
            }
            
            success(`Export ${format.toUpperCase()} généré avec succès`);
          }
        }
      } catch (err: any) {
        console.error('❌ Erreur lors de l\'export:', err);
        error('Erreur lors de l\'export des données');
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
    function getAgencyColor(name: string): string {
      if (!name) return '#33b04a';
      const colors = ['#33b04a', '#17a2b8', '#6f42c1', '#fd7e14', '#dc3545', '#007bff', '#20c997', '#e83e8c'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    }

    function getAgencyInitials(name: string): string {
      if (!name) return '?';
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      }
      return name.substring(0, Math.min(2, name.length)).toUpperCase();
    }

    // Lifecycle
    onMounted(async () => {
      try {
        await getAllAgencies();
      } catch (err) {
        console.error('❌ Erreur dans onMounted:', err);
      }
    });

    return {
      canManageAgencies,
      getAgencyColor,
      getAgencyInitials,
      // Refs
      agencies,
      agencyDetails,
      agencyUsers,
      agencyContracts,
      agencyStats,
      loading,
      loadingUsers,
      loadingContracts,
      loadingStats,
      contratsPage,
      contratsLimit,
      contratsTotalPages,
      contratsTotalElements,
      searchTerm,
      page, 
      totalPages,
      limit,
      totalElements,
      showModal,
      showImportModal,
      selectedAgencyId,
      
      // Methods
      getAllAgencies,
      deleteAgency,
      confirmerSuppression,
      voirDetails,
      voirDetailsAvecOnglet,
      activerOnglet,
      voirUtilisateurs,
      voirContrats,
      voirUtilisateur,
      modifierUtilisateur,
      voirContrat,
      modifierContrat,
      chargerUtilisateursAgence,
      chargerContratsAgence,
      chargerStatistiquesAgence,
      chargerToutesLesDonnees,
      genererPDFContrat,
      handleContratsPagination,
      ouvrirModalAjout,
      modifier,
      dupliquer,
      handleAgencySaved,
      handleAgenciesImported,
      handlePaginate,
      rechercher,
      formatDate,
      formatDateRelative,
      formatMontant,
      getStatutClass,
      getStatutTexte,
      exporterAgences
    };
  },
});
</script>

<style scoped>
.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
  font-size: 14px;
}

.avatar-initials {
  font-size: 14px;
  letter-spacing: 0.5px;
}

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

.agency-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border: 2px solid #dee2e6;
}

.agency-logo {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border: 3px solid #dee2e6;
  margin: 0 auto;
}

/* Style pour les cartes statistiques */
.stat-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Styles pour les onglets personnalisés */
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
  
  .agency-icon {
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

/* Styles pour les badges avec icônes */
.badge i {
  font-size: 0.875em;
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

/* Style pour la pagination */
.pagination-area {
  border-top: 1px solid #dee2e6;
  padding-top: 1rem;
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

/* Amélioration du contraste pour l'accessibilité */
.text-muted {
  color: #6c757d !important;
}

.badge.bg-warning {
  color: #000 !important;
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

/* Style pour les boutons d'action dans les tableaux */
.btn-group .btn {
  transition: all 0.3s ease;
}

.btn-group .btn:hover {
  transform: scale(1.05);
}

/* Gradient backgrounds pour les cartes statistiques */
.stat-card.bg-primary {
  background: linear-gradient(135deg, #007bff, #0056b3) !important;
}

.stat-card.bg-info {
  background: linear-gradient(135deg, #17a2b8, #117a8b) !important;
}

.stat-card.bg-success {
  background: linear-gradient(135deg, #28a745, #1e7e34) !important;
}

.stat-card.bg-warning {
  background: linear-gradient(135deg, #ffc107, #d39e00) !important;
}

/* Style pour les icônes dans les statistiques */
.stat-card i {
  opacity: 0.8;
}

/* Animation pour le changement d'onglets */
.tab-pane {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Style pour les cartes d'information dans les onglets */
.card .card-header {
  font-weight: 600;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

/* Style pour les liens dans les tableaux */
.table a {
  color: inherit;
  text-decoration: none;
}

.table a:hover {
  color: #007bff;
  text-decoration: underline;
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
  
  .stat-card {
    margin-bottom: 1rem;
  }
}

/* Style pour les alertes et notifications */
.alert {
  border-radius: 8px;
  border: none;
}

/* Animation d'entrée pour les modals */
.modal-content {
  animation: slideInDown 0.4s ease-out;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Style pour les tooltips personnalisés */
[title] {
  position: relative;
}

/* Style pour les champs de recherche */
.search-form {
  position: relative;
}

.search-form input:focus {
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  border-color: #80bdff;
}

/* Amélioration de l'espacement */
.form-group {
  margin-bottom: 1rem;
}

/* Style pour les conteneurs de statistiques */
.stats-container {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  padding: 1.5rem;
}

/* Style pour les indicateurs de performance */
.performance-indicator {
  position: relative;
  overflow: hidden;
}

.performance-indicator::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #28a745, #20c997);
  border-radius: 2px;
}

/* Animation pour les boutons principales */
.btn-primary, .btn-success, .btn-info, .btn-warning {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-primary:hover, .btn-success:hover, .btn-info:hover, .btn-warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* Style pour les badges de comptage */
.count-badge {
  min-width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

/* ===== DESIGN MODERNE POUR AGENCE ===== */

/* Header du profil agence */
.agency-profile-header {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border-radius: 15px;
  padding: 2rem;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.agency-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.agency-logo-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: rgba(255, 255, 255, 0.9);
}

.agency-name {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.5);
  color: #ffffff;
}

.id-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stats-badge {
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

.users-count {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 600;
}

.contracts-count {
  background: linear-gradient(135deg, #e67e22, #d35400);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .agency-profile-header {
    padding: 1.5rem;
  }
  
  .agency-avatar {
    width: 60px;
    height: 60px;
  }
  
  .agency-name {
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
}

/* Amélioration des transitions globales */
* {
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

/* Style pour les états de chargement */
.loading-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
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
}
</style>