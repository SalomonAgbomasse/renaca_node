<template>
  <div class="user-detail-container">
    <div v-if="loading" class="d-flex align-items-center justify-content-center" style="min-height: 400px;">
      <div class="text-center">
        <div class="spinner-border text-fnda" style="width:3rem;height:3rem;" role="status"></div>
        <p class="mt-3 text-muted">Chargement du profil…</p>
      </div>
    </div>

    <div v-else-if="!user" class="text-center py-5">
      <i class="ph-bold ph-user-x fs-1 text-muted"></i>
      <p class="text-muted mt-3">Utilisateur introuvable.</p>
      <router-link :to="{ name: 'ListeUserPage' }" class="btn btn-fnda mt-2">Retour à la liste</router-link>
    </div>

    <template v-else>
      <!-- ── Hero header ── -->
      <div class="hero-card card border-0 shadow-sm mb-4 bg-white">
        <div class="card-body p-4">
          <!-- Rangée principale : Avatar + Identité + Actions -->
          <div class="hero-main-header d-flex flex-column flex-xl-row justify-content-between align-items-start align-items-xl-center gap-3">
            
            <!-- Gauche : Avatar + Infos utilisateur -->
            <div class="d-flex align-items-center gap-3 flex-grow-1 flex-wrap flex-sm-nowrap">
              <!-- Avatar -->
              <div class="avatar-hero" :style="{ background: avatarColor }">
                <img v-if="user.avatar" :src="user.avatar" class="w-100 h-100 rounded-circle object-fit-cover" :alt="fullName">
                <span v-else class="initials-text">{{ initials }}</span>
              </div>

              <!-- Bloc identité -->
              <div class="user-identity-block">
                <div class="d-flex align-items-center flex-wrap gap-2 mb-1.5">
                  <h3 class="fw-bold mb-0 text-dark user-name-title">{{ fullName }}</h3>
                  <!-- Badge rôle -->
                  <span class="badge badge-role rounded-pill px-3 py-1.5 fw-semibold fs-12" :style="roleBadgeStyle">
                    <i class="ph-bold ph-shield me-1"></i>{{ user.role?.libelle || 'Rôle #' + user.idRole }}
                  </span>
                  <!-- Badge statut -->
                  <span :class="statusBadgeClass" class="badge badge-status rounded-pill px-2.5 py-1.5 fw-semibold fs-12">
                    <i :class="statusIcon" class="me-1"></i>{{ statusText }}
                  </span>
                  <!-- Badge verrouillé si applicable -->
                  <span v-if="isAccountLocked" class="badge bg-danger text-white rounded-pill px-2.5 py-1.5 fw-semibold fs-12 shadow-sm">
                    <i class="ph-bold ph-lock-simple me-1"></i>Verrouillé ({{ user.loginAttempts || 0 }} tentatives)
                  </span>
                </div>

                <!-- Métadonnées : Fonction & Agence -->
                <div class="d-flex flex-wrap align-items-center gap-2.5 text-muted fs-13 user-meta-line">
                  <span class="d-inline-flex align-items-center gap-1.5">
                    <i class="ph-bold ph-briefcase text-success fs-14"></i>
                    <span class="text-dark fw-medium">{{ user.fonction || 'Fonction non définie' }}</span>
                  </span>
                  
                  <span class="user-meta-divider text-muted">•</span>
                  
                  <router-link
                    v-if="user.agency?.id || user.idAgency"
                    :to="{ name: 'AgencyDetailPage', params: { id: user.agency?.uuid || user.agency?.id || user.idAgency } }"
                    class="agency-link-badge text-decoration-none d-inline-flex align-items-center gap-1.5"
                    :title="`Voir la fiche de l'agence ${user.agency?.name || user.agency?.libelle || ''}`"
                  >
                    <i class="ph-bold ph-storefront text-primary fs-14"></i>
                    <span class="fw-semibold text-dark">{{ user.agency?.name || user.agency?.libelle || ('Agence #' + user.idAgency) }}</span>
                  </router-link>
                  <span v-else class="text-muted d-inline-flex align-items-center gap-1">
                    <i class="ph-bold ph-storefront fs-14"></i>
                    <span>Aucune agence assignée</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Droite : Actions harmonisées avec adaptation responsive optimisée -->
            <div v-if="canManageUsers" class="hero-actions-container mt-2 mt-md-0">
              
              <!-- 1. Version GRAND ÉCRAN (>= 1400px) : Tous les boutons complets -->
              <div class="d-none d-xxl-flex flex-wrap align-items-center gap-2">
                <!-- Action principale : Modifier -->
                <button @click="goEdit" class="btn btn-action-primary d-inline-flex align-items-center gap-1.5 px-3 py-1.5 shadow-sm">
                  <i class="ph-bold ph-pencil-simple fs-14"></i>
                  <span>Modifier</span>
                </button>

                <!-- Actions secondaires -->
                <button @click="ouvrirModalChangerRole" class="btn btn-action-neutral d-inline-flex align-items-center gap-1.5 px-3 py-1.5">
                  <i class="ph-bold ph-shield text-primary fs-14"></i>
                  <span>Changer Rôle</span>
                </button>

                <button @click="ouvrirModalChangerAgence" class="btn btn-action-neutral d-inline-flex align-items-center gap-1.5 px-3 py-1.5">
                  <i class="ph-bold ph-map-pin text-info fs-14"></i>
                  <span>Changer Agence</span>
                </button>

                <button @click="resetPassword" class="btn btn-action-neutral d-inline-flex align-items-center gap-1.5 px-3 py-1.5">
                  <i class="ph-bold ph-lock-key text-secondary fs-14"></i>
                  <span>Réinitialiser MDP</span>
                </button>

                <!-- Verrouillage / Déverrouillage réactif -->
                <button
                  @click="toggleLock"
                  :class="isAccountLocked ? 'btn-action-locked' : 'btn-action-neutral'"
                  class="btn d-inline-flex align-items-center gap-1.5 px-3 py-1.5"
                  :title="isAccountLocked ? 'Compte actuellement verrouillé. Cliquer pour déverrouiller' : 'Compte actif. Cliquer pour verrouiller le compte'"
                >
                  <i :class="isAccountLocked ? 'ph-bold ph-lock-key-open text-danger' : 'ph-bold ph-lock-key text-warning'" class="fs-14"></i>
                  <span>{{ isAccountLocked ? 'Déverrouiller' : 'Verrouiller' }}</span>
                </button>

                <!-- Suspension / Réactivation -->
                <button
                  @click="toggleSuspension"
                  :class="user.status === 'SUSPENDED' ? 'btn-action-activate' : 'btn-action-suspend'"
                  class="btn d-inline-flex align-items-center gap-1.5 px-3 py-1.5"
                >
                  <i :class="user.status === 'SUSPENDED' ? 'ph-bold ph-play' : 'ph-bold ph-pause'" class="fs-14"></i>
                  <span>{{ user.status === 'SUSPENDED' ? 'Réactiver' : 'Suspendre' }}</span>
                </button>

                <!-- Suppression -->
                <button @click="deleteUser" class="btn btn-action-danger d-inline-flex align-items-center gap-1.5 px-3 py-1.5">
                  <i class="ph-bold ph-trash fs-14"></i>
                  <span>Supprimer</span>
                </button>
              </div>

              <!-- 2. Version MOBILE & TABLETTE (< 1400px) : 1 ligne épurée avec Menu Déroulant -->
              <div class="d-flex d-xxl-none align-items-center gap-2">
                <!-- Action principale : Modifier -->
                <button @click="goEdit" class="btn btn-action-primary d-inline-flex align-items-center gap-1.5 px-3 py-1.5 shadow-sm">
                  <i class="ph-bold ph-pencil-simple fs-14"></i>
                  <span>Modifier</span>
                </button>

                <!-- Si verrouillé, bouton Déverrouiller bien en évidence -->
                <button
                  v-if="isAccountLocked"
                  @click="toggleLock"
                  class="btn btn-action-locked d-inline-flex align-items-center gap-1.5 px-3 py-1.5 shadow-sm"
                  title="Compte verrouillé - Cliquer pour déverrouiller"
                >
                  <i class="ph-bold ph-lock-key-open text-danger fs-14"></i>
                  <span>Déverrouiller</span>
                </button>

                <!-- Menu déroulant Actions -->
                <div class="position-relative actions-dropdown-wrapper">
                  <button
                    type="button"
                    @click.stop="toggleActionsDropdown"
                    class="btn btn-action-neutral d-inline-flex align-items-center gap-1.5 px-3 py-1.5 shadow-sm"
                    :class="{ 'active': showActionsDropdown }"
                  >
                    <i class="ph-bold ph-dots-three-vertical fs-14"></i>
                    <span>Actions</span>
                    <i class="ph-bold ph-caret-down fs-11 ms-0.5"></i>
                  </button>

                  <!-- Menu déroulant stylé -->
                  <div
                    v-if="showActionsDropdown"
                    class="actions-mobile-dropdown shadow-lg rounded-3 py-2 bg-white border"
                    @click.stop
                  >
                    <a
                      href="javascript:void(0);"
                      class="dropdown-action-item d-flex align-items-center gap-2.5 px-3 py-2 text-decoration-none text-dark"
                      @click="ouvrirModalChangerRole(); closeActionsDropdown()"
                    >
                      <i class="ph-bold ph-shield text-primary fs-16"></i>
                      <span>Changer le rôle</span>
                    </a>

                    <a
                      href="javascript:void(0);"
                      class="dropdown-action-item d-flex align-items-center gap-2.5 px-3 py-2 text-decoration-none text-dark"
                      @click="ouvrirModalChangerAgence(); closeActionsDropdown()"
                    >
                      <i class="ph-bold ph-map-pin text-info fs-16"></i>
                      <span>Changer d'agence</span>
                    </a>

                    <a
                      href="javascript:void(0);"
                      class="dropdown-action-item d-flex align-items-center gap-2.5 px-3 py-2 text-decoration-none text-dark"
                      @click="resetPassword(); closeActionsDropdown()"
                    >
                      <i class="ph-bold ph-lock-key text-secondary fs-16"></i>
                      <span>Réinitialiser MDP</span>
                    </a>

                    <!-- Déverrouiller (visible dans le menu si compte verrouillé) -->
                    <a
                      v-if="isAccountLocked"
                      href="javascript:void(0);"
                      class="dropdown-action-item d-flex align-items-center gap-2.5 px-3 py-2 text-decoration-none text-danger"
                      @click="toggleLock(); closeActionsDropdown()"
                    >
                      <i class="ph-bold ph-lock-key-open text-danger fs-16"></i>
                      <span class="text-danger fw-semibold">Déverrouiller le compte</span>
                    </a>

                    <!-- Verrouiller (visible si compte accessible) -->
                    <a
                      v-else
                      href="javascript:void(0);"
                      class="dropdown-action-item d-flex align-items-center gap-2.5 px-3 py-2 text-decoration-none text-dark"
                      @click="toggleLock(); closeActionsDropdown()"
                    >
                      <i class="ph-bold ph-lock-key text-warning fs-16"></i>
                      <span>Verrouiller le compte</span>
                    </a>

                    <!-- Suspendre / Réactiver -->
                    <a
                      href="javascript:void(0);"
                      class="dropdown-action-item d-flex align-items-center gap-2.5 px-3 py-2 text-decoration-none"
                      :class="user.status === 'SUSPENDED' ? 'text-success' : 'text-warning'"
                      @click="toggleSuspension(); closeActionsDropdown()"
                    >
                      <i :class="user.status === 'SUSPENDED' ? 'ph-bold ph-play text-success' : 'ph-bold ph-pause text-warning'" class="fs-16"></i>
                      <span>{{ user.status === 'SUSPENDED' ? 'Réactiver le compte' : 'Suspendre le compte' }}</span>
                    </a>

                    <div class="dropdown-divider my-1"></div>

                    <!-- Supprimer -->
                    <a
                      href="javascript:void(0);"
                      class="dropdown-action-item d-flex align-items-center gap-2.5 px-3 py-2 text-decoration-none text-danger"
                      @click="deleteUser(); closeActionsDropdown()"
                    >
                      <i class="ph-bold ph-trash text-danger fs-16"></i>
                      <span class="fw-semibold">Supprimer l'utilisateur</span>
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- ── Barre de contacts sous forme de fiches structurées ── -->
          <div class="hero-contacts-strip mt-3 pt-3 border-top">
            <div class="row g-2.5">
              <!-- Téléphone -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="contact-pill-card h-100">
                  <div class="contact-icon bg-soft-success text-success">
                    <i class="ph-bold ph-phone fs-16"></i>
                  </div>
                  <div class="contact-details text-truncate">
                    <span class="contact-caption">Téléphone</span>
                    <a v-if="user.phone" :href="`tel:${user.phone}`" class="contact-data text-dark text-decoration-none fw-semibold d-block text-truncate">
                      {{ user.phone }}
                    </a>
                    <span v-else class="contact-data text-muted d-block">—</span>
                  </div>
                </div>
              </div>

              <!-- Email -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="contact-pill-card h-100">
                  <div class="contact-icon bg-soft-info text-info">
                    <i class="ph-bold ph-envelope fs-16"></i>
                  </div>
                  <div class="contact-details text-truncate">
                    <span class="contact-caption">Email</span>
                    <a v-if="user.email" :href="`mailto:${user.email}`" class="contact-data text-dark text-decoration-none fw-semibold d-block text-truncate" :title="user.email">
                      {{ user.email }}
                    </a>
                    <span v-else class="contact-data text-muted d-block">—</span>
                  </div>
                </div>
              </div>

              <!-- Date de naissance / Âge -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="contact-pill-card h-100">
                  <div class="contact-icon bg-soft-warning text-warning">
                    <i class="ph-bold ph-cake fs-16"></i>
                  </div>
                  <div class="contact-details text-truncate">
                    <span class="contact-caption">Date de naissance</span>
                    <span v-if="user.birthdate || user.dateNaissance" class="contact-data text-dark fw-semibold d-block text-truncate">
                      {{ formatDate(user.birthdate || user.dateNaissance) }}
                      <small class="text-muted fw-normal ms-1" v-if="age > 0">({{ age }} ans)</small>
                    </span>
                    <span v-else class="contact-data text-muted d-block">—</span>
                  </div>
                </div>
              </div>

              <!-- Genre -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="contact-pill-card h-100">
                  <div class="contact-icon" :class="user.gender === 'M' ? 'bg-soft-primary text-primary' : user.gender === 'F' ? 'bg-soft-danger text-danger' : 'bg-soft-secondary text-secondary'">
                    <i :class="user.gender === 'M' ? 'ph-bold ph-gender-male' : user.gender === 'F' ? 'ph-bold ph-gender-female' : 'ph-bold ph-user'" class="fs-16"></i>
                  </div>
                  <div class="contact-details text-truncate">
                    <span class="contact-caption">Genre</span>
                    <span class="contact-data text-dark fw-semibold d-block text-truncate">
                      {{ user.gender === 'M' ? 'Masculin' : user.gender === 'F' ? 'Féminin' : (user.gender || 'Non précisé') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── KPI row ── -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="kpi-chip">
            <div class="kpi-icon bg-soft-success"><i class="ph-bold ph-file-text text-success"></i></div>
            <div>
              <div class="kpi-label">Contrats</div>
              <div class="kpi-value">{{ contractsSummary.total }}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-chip">
            <div class="kpi-icon bg-soft-fnda"><i class="ph-bold ph-bank text-fnda"></i></div>
            <div>
              <div class="kpi-label">Capital total</div>
              <div class="kpi-value text-nowrap">{{ formatMontant(contractsSummary.capital) }} F</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-chip">
            <div class="kpi-icon" style="background:rgba(35,31,32,.1)"><i class="ph-bold ph-coins text-dark"></i></div>
            <div>
              <div class="kpi-label">Primes TTC</div>
              <div class="kpi-value text-nowrap">{{ formatMontant(contractsSummary.primes) }} F</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-chip">
            <div class="kpi-icon bg-soft-warning"><i class="ph-bold ph-key text-warning"></i></div>
            <div>
              <div class="kpi-label">Permissions</div>
              <div class="kpi-value">{{ userPermissions.length }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tabs ── -->
      <div class="card border-0 shadow-sm bg-white mb-25">
        <div class="card-header bg-white border-bottom px-4 pt-3 pb-0">
          <ul class="nav nav-tabs border-0 gap-1" id="userDetailTabs">
            <li class="nav-item">
              <button class="nav-link fw-semibold fs-13 px-3 py-2" :class="{ active: tab === 'contrats' }" @click="tab = 'contrats'; loadContrats(contratsPage)">
                <i class="ph-bold ph-file-text me-1"></i> Contrats
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link fw-semibold fs-13 px-3 py-2" :class="{ active: tab === 'permissions' }" @click="tab = 'permissions'; loadPermissions()">
                <i class="ph-bold ph-key me-1"></i> Permissions
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link fw-semibold fs-13 px-3 py-2" :class="{ active: tab === 'activities' }" @click="tab = 'activities'; loadActivities(activitiesPage)">
                <i class="ph-bold ph-activity me-1"></i> Activités
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link fw-semibold fs-13 px-3 py-2" :class="{ active: tab === 'infos' }" @click="tab = 'infos'">
                <i class="ph-bold ph-identification-card me-1"></i> Informations
              </button>
            </li>
          </ul>
        </div>

        <div class="card-body p-4">

          <!-- TAB: Contrats -->
          <div v-show="tab === 'contrats'">
            <div v-if="loadingContrats" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-fnda"></div>
              <span class="ms-2 text-muted">Chargement des contrats…</span>
            </div>
            <div v-else-if="contrats.length === 0" class="text-center text-muted py-5">
              <i class="ph-bold ph-file-dashed fs-1 d-block mb-2"></i>
              Aucun contrat associé à cet utilisateur.
            </div>
            <template v-else>
              <div class="table-responsive">
                <table class="table table-striped align-middle mb-0 fs-13">
                  <thead>
                    <tr>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Référence</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Client</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Nature</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Capital</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Prime TTC</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Statut</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Effet</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3 pe-0 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in contrats" :key="c.id">
                      <td>
                        <span class="fw-semibold text-fnda d-block">{{ c.police || c.reference || '—' }}</span>
                        <small v-if="c.police && c.reference && c.police !== c.reference" class="text-muted fs-xs">Réf: {{ c.reference }}</small>
                      </td>
                      <td>
                        <span v-if="c.customer">
                          {{ c.customer.raisonSociale || `${c.customer.lastname || ''} ${c.customer.firstname || ''}`.trim() }}
                        </span>
                        <span v-else class="text-muted">—</span>
                      </td>
                      <td>{{ getNatureCreditLabel(c) }}</td>
                      <td class="text-nowrap">{{ formatMontant(c.capital) }} F</td>
                      <td class="text-nowrap fw-semibold text-success">{{ formatMontant(c.puttc || c.prime) }} F</td>
                      <td>
                        <span class="badge rounded-pill" :class="c.isActive ? 'bg-success' : 'bg-warning text-dark'">
                          {{ c.isActive ? 'Actif' : 'Suspendu' }}
                        </span>
                      </td>
                      <td class="text-muted">{{ formatDate(c.dateEff) }}</td>
                      <td class="text-end pe-0">
                        <button
                          @click="voirDetailsContrat(c)"
                          class="btn btn-sm btn-outline-fnda py-1 px-2 fs-xs d-inline-flex align-items-center gap-1 me-1"
                        >
                          <i class="ph-bold ph-eye"></i>
                          Voir
                        </button>
                        <button
                          @click="openContractPdf(c)"
                          class="btn btn-sm btn-fnda py-1 px-2 fs-xs d-inline-flex align-items-center gap-1"
                          :disabled="viewerLoading"
                          title="Consulter / Télécharger le PDF"
                        >
                          <span v-if="viewerLoading" class="spinner-border spinner-border-sm" role="status" style="width: 12px; height: 12px;"></span>
                          <i v-else class="ph-bold ph-file-pdf"></i>
                          PDF
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination des contrats -->
              <div
                class="pagination-area d-md-flex mt-15 mt-sm-20 mt-md-25 justify-content-between align-items-center"
                v-if="contratsTotalElements > 0"
              >
                <PaginationComponent 
                  :page="contratsPage" 
                  :totalPages="contratsTotalPages" 
                  :totalElements="contratsTotalElements" 
                  :limit="contratsLimit" 
                  @paginate="handleContratsPagination" 
                />
              </div>
            </template>
          </div>

          <!-- TAB: Permissions -->
          <div v-show="tab === 'permissions'">
            <div v-if="loadingPermissions" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-fnda"></div>
              <span class="ms-2 text-muted">Chargement des permissions…</span>
            </div>
            <div v-else-if="userPermissions.length === 0" class="text-center text-muted py-5">
              <i class="ph-bold ph-key fs-1 d-block mb-2"></i>
              Aucune permission spécifique assignée.
            </div>
            <div v-else>
              <div class="row g-2">
                <div v-for="perm in userPermissions" :key="perm.id" class="col-md-4 col-sm-6">
                  <div class="permission-chip d-flex align-items-center gap-2 p-2 border rounded-2 bg-light">
                    <i class="ph-bold ph-check-circle text-success"></i>
                    <div>
                      <div class="fw-semibold fs-13">{{ perm.name || perm.permission?.name }}</div>
                      <div class="text-muted fs-xs">{{ perm.module || perm.permission?.module }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB: Informations -->
          <div v-show="tab === 'infos'">
            <div class="row g-4">
              <div class="col-md-6">
                <div class="info-section">
                  <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <i class="ph-bold ph-user text-fnda"></i> Informations personnelles
                  </h6>
                  <div class="info-grid">
                    <div class="info-row"><span class="info-label">Prénom</span><span>{{ user.firstname }}</span></div>
                    <div class="info-row"><span class="info-label">Nom</span><span>{{ user.lastname }}</span></div>
                    <div class="info-row"><span class="info-label">Genre</span><span>{{ user.gender === 'M' ? 'Masculin' : 'Féminin' }}</span></div>
                    <div class="info-row"><span class="info-label">Date naissance</span><span>{{ formatDate(user.birthdate || user.dateNaissance) || '—' }}</span></div>
                    <div class="info-row"><span class="info-label">Âge</span><span>{{ age > 0 ? age + ' ans' : '—' }}</span></div>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="info-section">
                  <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <i class="ph-bold ph-buildings text-fnda"></i> Informations professionnelles
                  </h6>
                  <div class="info-grid">
                    <div class="info-row"><span class="info-label">Fonction</span><span>{{ user.fonction || '—' }}</span></div>
                    <div class="info-row"><span class="info-label">Rôle</span><span>{{ user.role?.libelle || '—' }}</span></div>
                    <div class="info-row">
                      <span class="info-label">Agence</span>
                      <span v-if="user.agency?.id || user.idAgency">
                        <router-link
                          :to="{ name: 'AgencyDetailPage', params: { id: user.agency?.uuid || user.agency?.id || user.idAgency } }"
                          class="text-decoration-none fw-semibold text-fnda d-inline-flex align-items-center gap-1"
                          :title="`Voir la fiche de l'agence ${user.agency?.name || user.agency?.libelle || ''}`"
                        >
                          <i class="ph-bold ph-storefront"></i>
                          {{ user.agency?.name || user.agency?.libelle || ('Agence #' + user.idAgency) }}
                        </router-link>
                      </span>
                      <span v-else class="text-muted">—</span>
                    </div>
                    <div class="info-row"><span class="info-label">Email</span><span class="text-info">{{ user.email }}</span></div>
                    <div class="info-row"><span class="info-label">Téléphone</span><span class="text-success">{{ user.phone || '—' }}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB: Activités -->
          <div v-show="tab === 'activities'">
            <div v-if="loadingActivities" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-fnda"></div>
              <span class="ms-2 text-muted">Chargement des activités…</span>
            </div>
            <div v-else-if="activities.length === 0" class="text-center text-muted py-5">
              <i class="ph-bold ph-pulse fs-1 d-block mb-2"></i>
              Aucune activité enregistrée pour cet utilisateur.
            </div>
            <template v-else>
              <div class="table-responsive">
                <table class="table table-striped align-middle mb-0 fs-13">
                  <thead>
                    <tr>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Date & Heure</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Type</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Description</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">IP</th>
                      <th class="text-uppercase text-muted fw-semibold fs-xs py-3">Navigateur / App</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="act in activities" :key="act.id">
                      <td class="text-muted text-nowrap">{{ formatDateTime(act.createdAt) }}</td>
                      <td>
                        <span class="badge rounded-pill bg-dark text-warning fw-semibold px-2 py-1 fs-xs">
                          {{ act.activityType }}
                        </span>
                      </td>
                      <td>{{ act.description || '—' }}</td>
                      <td class="font-monospace text-muted">{{ act.ipAddress || '—' }}</td>
                      <td class="text-muted fs-xs text-truncate" style="max-width: 220px;" :title="act.userAgent">
                        {{ act.userAgent || '—' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination des activités -->
              <div
                class="pagination-area d-md-flex mt-15 mt-sm-20 mt-md-25 justify-content-between align-items-center"
                v-if="activitiesTotalElements > 0"
              >
                <PaginationComponent 
                  :page="activitiesPage" 
                  :totalPages="activitiesTotalPages" 
                  :totalElements="activitiesTotalElements" 
                  :limit="activitiesLimit" 
                  @paginate="handleActivitiesPagination" 
                />
              </div>
            </template>
          </div>

        </div>
      </div>
    </template>

    <!-- Modal Changer Rôle -->
    <Modal
      :isVisible="showChangeRoleModal"
      :title="`Changer le rôle de ${fullName}`"
      icon="ph-bold ph-shield"
      size="medium"
      @close="showChangeRoleModal = false"
      @update:isVisible="showChangeRoleModal = $event"
    >
      <template #default>
        <div class="p-2">
          <div class="alert alert-light border mb-4 d-flex align-items-center gap-2">
            <i class="ph-bold ph-shield text-primary fs-5"></i>
            <div>
              <strong>Rôle actuel :</strong>
              <span class="badge bg-dark text-warning ms-2 fs-13">
                {{ user?.role?.libelle || 'Rôle #' + user?.idRole }}
              </span>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label fw-bold text-black">Sélectionner un nouveau rôle <span class="text-danger">*</span></label>
            <select v-model="newRoleId" class="form-select border-gray shadow-none py-2 text-black bg-white">
              <option value="">-- Sélectionner un rôle --</option>
              <option v-for="r in availableRoles" :key="r.id" :value="r.id">
                {{ r.libelle || r.name }}
              </option>
            </select>
            <div v-if="loadingRoles" class="mt-2 text-muted fs-13">
              <div class="spinner-border spinner-border-sm me-1"></div> Chargement des rôles...
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <button type="button" class="btn btn-secondary px-4" @click="showChangeRoleModal = false">Annuler</button>
        <button
          type="button"
          class="btn text-white px-4"
          style="background-color: #33b04a;"
          :disabled="!newRoleId || savingRole"
          @click="sauvegarderRole"
        >
          <span v-if="savingRole" class="spinner-border spinner-border-sm me-2"></span>
          Enregistrer le rôle
        </button>
      </template>
    </Modal>

    <!-- Modal Changer Agence -->
    <Modal
      :isVisible="showChangeAgencyModal"
      :title="`Changer l'agence de ${fullName}`"
      icon="ph-bold ph-map-pin"
      size="medium"
      @close="showChangeAgencyModal = false"
      @update:isVisible="showChangeAgencyModal = $event"
    >
      <template #default>
        <div class="p-2">
          <div class="alert alert-light border mb-4 d-flex align-items-center gap-2">
            <i class="ph-bold ph-map-pin text-info fs-5"></i>
            <div>
              <strong>Agence actuelle :</strong>
              <span class="badge bg-info text-white ms-2 fs-13">
                {{ user?.agency?.name || user?.agency?.libelle || (user?.idAgency ? 'Agence #' + user?.idAgency : 'Non assignée') }}
              </span>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label fw-bold text-black">Sélectionner une nouvelle agence <span class="text-danger">*</span></label>
            <select v-model="newAgencyId" class="form-select border-gray shadow-none py-2 text-black bg-white">
              <option value="">-- Sélectionner une agence --</option>
              <option v-for="a in availableAgences" :key="a.id" :value="a.id">
                {{ a.name || a.libelle }}
              </option>
            </select>
            <div v-if="loadingAgences" class="mt-2 text-muted fs-13">
              <div class="spinner-border spinner-border-sm me-1"></div> Chargement des agences...
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <button type="button" class="btn btn-secondary px-4" @click="showChangeAgencyModal = false">Annuler</button>
        <button
          type="button"
          class="btn text-white px-4"
          style="background-color: #33b04a;"
          :disabled="!newAgencyId || savingAgency"
          @click="sauvegarderAgence"
        >
          <span v-if="savingAgency" class="spinner-border spinner-border-sm me-2"></span>
          Enregistrer l'agence
        </button>
      </template>
    </Modal>

    <!-- Visionneur PDF intégré -->
    <PdfViewerModal
      :visible="viewerVisible"
      :pdf-url="viewerPdfUrl"
      :loading="viewerLoading"
      :error-message="viewerErrorMessage"
      :title="viewerTitle"
      :subtitle="viewerSubtitle"
      :document-key="viewerDocumentKey"
      :filename="viewerFilename"
      @close="closeViewer"
      @download="handleViewerDownload"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ApiService from '../../services/ApiService';
import JwtService from '../../services/JwtService';
import Modal from '../Common/Modal.vue';
import PaginationComponent from '../Utilities/Pagination.vue';
import PdfViewerModal from '../Common/PdfViewerModal.vue';
import Swal from 'sweetalert2';
import { useAuthStore } from '../../services/auth';
import { usePdfViewer } from '../../composables/usePdfViewer';

export default defineComponent({
  name: 'UserDetail',
  components: {
    Modal,
    PaginationComponent,
    PdfViewerModal
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    const canManageUsers = computed(() => {
      const roleName = (authStore.user?.role?.libelle || authStore.user?.role || '').toString().toUpperCase();
      return authStore.user?.idRole === 1 || authStore.user?.idRole === 5 || roleName === 'ADMIN' || roleName === 'SUPER ADMIN' || roleName === 'SUPER_ADMIN';
    });
    const userId = computed(() => String(route.params.id || ''));

    // Visionneur PDF intégré
    const {
      viewerVisible,
      viewerPdfUrl,
      viewerLoading,
      viewerErrorMessage,
      viewerTitle,
      viewerSubtitle,
      viewerDocumentKey,
      viewerFilename,
      closeViewer,
      handleViewerDownload,
      openContractPdf
    } = usePdfViewer();

    const user = ref<any>(null);
    const loading = ref(true);
    const showActionsDropdown = ref(false);

    function toggleActionsDropdown() {
      showActionsDropdown.value = !showActionsDropdown.value;
    }

    function closeActionsDropdown() {
      showActionsDropdown.value = false;
    }

    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('.actions-dropdown-wrapper')) {
        showActionsDropdown.value = false;
      }
    }
    const contrats = ref<any[]>([]);
    const loadingContrats = ref(false);
    const userPermissions = ref<any[]>([]);
    const loadingPermissions = ref(false);
    const activities = ref<any[]>([]);
    const loadingActivities = ref(false);
    const tab = ref('contrats');

    // Pagination activités
    const activitiesPage = ref(1);
    const activitiesLimit = ref(10);
    const activitiesTotalPages = ref(0);
    const activitiesTotalElements = ref(0);

    // Pagination contrats
    const contratsPage = ref(1);
    const contratsLimit = ref(10);
    const contratsTotalPages = ref(0);
    const contratsTotalElements = ref(0);
    const downloadingContractId = ref<number | null>(null);

    // ── Computed ──────────────────────────────────────────────────────────────
    const fullName = computed(() => `${user.value?.lastname || ''} ${user.value?.firstname || ''}`.trim());

    const initials = computed(() => {
      const f = user.value?.firstname?.charAt(0)?.toUpperCase() || '';
      const l = user.value?.lastname?.charAt(0)?.toUpperCase() || '';
      return f + l || '??';
    });

    const COLORS = ['#33b04a','#17a2b8','#6f42c1','#fd7e14','#dc3545','#007bff','#20c997','#e83e8c'];
    const avatarColor = computed(() => {
      const name = (user.value?.lastname || '') + (user.value?.firstname || '');
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return COLORS[Math.abs(hash) % COLORS.length];
    });

    const statusClass = computed(() => {
      if (user.value?.status === 'ACTIVE') return 'bg-success';
      if (user.value?.status === 'SUSPENDED') return 'bg-warning text-dark';
      return 'bg-secondary';
    });
    const statusBadgeClass = computed(() => {
      if (user.value?.status === 'ACTIVE') return 'badge-status-active';
      if (user.value?.status === 'SUSPENDED') return 'badge-status-suspended';
      return 'badge-status-default';
    });
    const statusIcon = computed(() => user.value?.status === 'ACTIVE' ? 'ph-bold ph-check-circle' : 'ph-bold ph-pause-circle');
    const statusText = computed(() => user.value?.status === 'ACTIVE' ? 'Actif' : user.value?.status === 'SUSPENDED' ? 'Suspendu' : user.value?.status || '—');

    const isAccountLocked = computed(() => {
      if (!user.value) return false;
      const hasTimeLock = user.value.lockedUntil && new Date(user.value.lockedUntil) > new Date();
      const hasAttemptLock = (user.value.loginAttempts || 0) >= 5;
      return Boolean(hasTimeLock || hasAttemptLock);
    });

    const roleBadgeStyle = computed(() => ({ background: '#231f20', color: '#ede947' }));

    const age = computed(() => {
      const birth = user.value?.birthdate || user.value?.dateNaissance;
      if (!birth) return 0;
      const d = new Date(birth);
      const now = new Date();
      let a = now.getFullYear() - d.getFullYear();
      if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
      return a;
    });

    const contractsSummary = computed(() => ({
      total: contratsTotalElements.value,
      capital: contrats.value.reduce((s, c) => s + (Number(c.capital) || 0), 0),
      primes: contrats.value.reduce((s, c) => s + (Number(c.puttc || c.prime) || 0), 0),
    }));

    // ── Helpers ───────────────────────────────────────────────────────────────
    function formatDate(d: string | null): string {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    function formatDateTime(d: string | null): string {
      if (!d) return '—';
      return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    function formatMontant(v: number): string {
      return (v || 0).toLocaleString('fr-FR');
    }
    const natureCreditsList = ref<any[]>([]);

    async function loadNatureCredits() {
      try {
        const { data } = await ApiService.get('/nature-credits');
        const list = data?.data || data;
        natureCreditsList.value = Array.isArray(list) ? list : [];
      } catch {
        natureCreditsList.value = [];
      }
    }

    function getNatureCreditLabel(c: any): string {
      if (!c) return '—';
      if (c.natureCredit?.libelle) return c.natureCredit.libelle;
      if (c.natureCredit?.name) return c.natureCredit.name;
      if (c.natureCredit?.code) return c.natureCredit.code;
      if (typeof c.natureCredit === 'string') return c.natureCredit;

      const idNC = Number(c.idNatureCredit || c.id_nature_credit || c.natureCreditId);
      if (idNC) {
        const found = natureCreditsList.value.find((n: any) => n.id === idNC);
        if (found) return found.libelle || found.name || found.code;
        if (idNC === 1) return 'AMORTISSABLE';
        if (idNC === 2) return 'CONSTANT';
        if (idNC === 3) return 'CREDIT SALARIE';
      }

      if (c.product?.libelle) return c.product.libelle;
      if (c.product?.name) return c.product.name;
      if (c.nature) return c.nature;
      return '—';
    }

    const effectiveUserId = computed(() => user.value?.id?.toString() || user.value?.uuid || userId.value);

    // ── API calls ─────────────────────────────────────────────────────────────
    async function loadUser() {
      try {
        loading.value = true;
        const { data } = await ApiService.get(`/users/${userId.value}?includeRole=true&includeAgency=true`);
        user.value = data?.data?.user || data?.data || data?.user || data;
      } catch {
        user.value = null;
      } finally {
        loading.value = false;
      }
    }

    async function loadContrats(page = 1) {
      try {
        loadingContrats.value = true;
        const idToQuery = effectiveUserId.value;
        const { data } = await ApiService.get(`/contracts/user/${idToQuery}?includeCustomer=true&includeAgency=true&includeProduct=true&limit=${contratsLimit.value}&page=${page}`);
        const d = data?.data;
        if (d) {
          contrats.value = d.contracts || [];
          contratsTotalElements.value = d.total !== undefined ? d.total : contrats.value.length;
          contratsTotalPages.value = d.totalPages || Math.ceil(contratsTotalElements.value / contratsLimit.value);
        } else {
          contrats.value = [];
        }
        contratsPage.value = page;
      } catch {
        contrats.value = [];
      } finally {
        loadingContrats.value = false;
      }
    }

    async function loadPermissions() {
      try {
        loadingPermissions.value = true;
        const idToQuery = effectiveUserId.value;
        const { data } = await ApiService.get(`/users/${idToQuery}/permissions`);
        const d = data?.data;
        userPermissions.value = d?.permissions || (Array.isArray(d) ? d : []);
      } catch {
        userPermissions.value = [];
      } finally {
        loadingPermissions.value = false;
      }
    }

    async function loadActivities(page = 1) {
      try {
        loadingActivities.value = true;
        const idToQuery = effectiveUserId.value;
        const { data } = await ApiService.get(`/users/${idToQuery}/activities?page=${page}&limit=${activitiesLimit.value}`);
        const d = data?.data || data;
        activities.value = d?.activities || (Array.isArray(d) ? d : []);
        activitiesTotalElements.value = d?.total !== undefined ? d.total : activities.value.length;
        activitiesTotalPages.value = d?.totalPages || Math.ceil(activitiesTotalElements.value / activitiesLimit.value);
        activitiesPage.value = page;
      } catch {
        activities.value = [];
      } finally {
        loadingActivities.value = false;
      }
    }

    const handleActivitiesPagination = ({ page_, limit_ }: { page_: number; limit_: number }) => {
      activitiesLimit.value = limit_;
      loadActivities(page_);
    };

    const handleContratsPagination = ({ page_, limit_ }: { page_: number; limit_: number }) => {
      contratsLimit.value = limit_;
      loadContrats(page_);
    };

    // ── Actions ───────────────────────────────────────────────────────────────
    function goEdit() {
      router.push({ name: 'EditUserPage', params: { id: user.value?.uuid || userId.value } });
    }

    async function resetPassword() {
      const { value: customPassword, isConfirmed } = await Swal.fire({
        title: 'Réinitialiser le mot de passe',
        text: `Veuillez renseigner le nouveau mot de passe pour ${fullName.value} :`,
        input: 'text',
        inputPlaceholder: 'Entrez le nouveau mot de passe',
        showCancelButton: true,
        confirmButtonText: 'Enregistrer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#33b04a',
        inputValidator: (value) => {
          if (!value) {
            return 'Vous devez saisir un mot de passe !';
          }
          if (value.length < 6) {
            return 'Le mot de passe doit contenir au moins 6 caractères.';
          }
        }
      });

      if (!isConfirmed || !customPassword) return;

      try {
        const targetId = user.value?.id || effectiveUserId.value || userId.value;
        await ApiService.put(`/user-management/reset-password/${targetId}`, {
          newPassword: customPassword
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Mot de passe modifié !',
          text: `Le mot de passe de ${fullName.value} a été mis à jour avec succès.`,
          timer: 3000,
          showConfirmButton: true
        });
      } catch (err: any) {
        console.error('Erreur de réinitialisation:', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.response?.data?.message || 'Impossible de réinitialiser le mot de passe.'
        });
      }
    }

    async function toggleLock() {
      const targetId = user.value?.id || effectiveUserId.value || userId.value;

      if (isAccountLocked.value) {
        // Déverrouillage
        const attempts = user.value?.loginAttempts || 0;
        const { isConfirmed } = await Swal.fire({
          title: `Déverrouiller le compte ?`,
          html: `<p>Voulez-vous déverrouiller le compte de <strong>${fullName.value}</strong> ?</p>
                 <p class="text-muted small">Cette action remettra à zéro le compteur de tentatives (${attempts}) et lèvera le verrouillage.</p>`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Oui, déverrouiller',
          cancelButtonText: 'Annuler',
          confirmButtonColor: '#33b04a',
        });

        if (!isConfirmed) return;

        try {
          await ApiService.put(`/user-management/unlock/${targetId}`, {});
          await loadUser();
          Swal.fire({
            icon: 'success',
            title: 'Compte déverrouillé !',
            text: `Le compte de ${fullName.value} a été déverrouillé avec succès.`,
            timer: 2000,
            showConfirmButton: false
          });
        } catch (err: any) {
          console.error('Erreur lors du déverrouillage:', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: err.response?.data?.message || 'Impossible de déverrouiller le compte.'
          });
        }
        return;
      }

      // Verrouillage
      const { isConfirmed } = await Swal.fire({
        title: `Verrouiller le compte ?`,
        html: `<p>Voulez-vous verrouiller le compte de <strong>${fullName.value}</strong> ?</p>
               <p class="text-muted small">L'utilisateur ne pourra plus se connecter jusqu'à ce que son compte soit déverrouillé.</p>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, verrouiller',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#dc3545',
      });

      if (!isConfirmed) return;

      try {
        await ApiService.put(`/user-management/lock/${targetId}`, { minutes: 1440 });
        await loadUser();
        Swal.fire({
          icon: 'success',
          title: 'Compte verrouillé !',
          text: `Le compte de ${fullName.value} a été verrouillé.`,
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err: any) {
        console.error('Erreur lors du verrouillage:', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.response?.data?.message || 'Impossible de verrouiller le compte.'
        });
      }
    }

    async function toggleSuspension() {
      const isSuspended = user.value?.status === 'SUSPENDED';
      const targetId = user.value?.id || effectiveUserId.value || userId.value;

      if (isSuspended) {
        // Réactivation : simple confirmation
        const { isConfirmed } = await Swal.fire({
          title: `Réactiver ${fullName.value} ?`,
          text: `Le compte de ${fullName.value} sera réactivé et il pourra de nouveau se connecter.`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Oui, réactiver',
          cancelButtonText: 'Annuler',
          confirmButtonColor: '#33b04a',
        });
        if (!isConfirmed) return;
        try {
          await ApiService.put(`/user-management/activate/${targetId}`, {});
          await loadUser();
          Swal.fire({ icon: 'success', title: 'Compte réactivé !', timer: 1800, showConfirmButton: false });
        } catch {
          Swal.fire({ icon: 'error', title: 'Erreur', text: 'Action impossible.' });
        }
        return;
      }

      // Suspension : demander la raison
      const { value: reason, isConfirmed } = await Swal.fire({
        title: `Suspendre ${fullName.value}`,
        text: 'Veuillez indiquer la raison de la suspension :',
        input: 'textarea',
        inputPlaceholder: 'Ex : Violation des conditions, contrôle interne...',
        inputAttributes: { rows: '3', style: 'resize:vertical;' },
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Suspendre',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#ffc107',
        inputValidator: (value) => {
          if (!value?.trim()) return 'La raison est obligatoire.';
        }
      });

      if (!isConfirmed || !reason) return;
      try {
        await ApiService.put(`/users/${targetId}`, { suspensionReason: reason });
        await ApiService.put(`/user-management/deactivate/${targetId}`, {});
        await loadUser();
        Swal.fire({ icon: 'success', title: 'Compte suspendu', text: `Raison : ${reason}`, timer: 2500, showConfirmButton: false });
      } catch {
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Action impossible.' });
      }
    }

    async function deleteUser() {
      // Étape 1 : demander la raison
      const { value: reason, isConfirmed: reasonConfirmed } = await Swal.fire({
        title: `Supprimer ${fullName.value}`,
        text: 'Veuillez indiquer la raison de la suppression :',
        input: 'textarea',
        inputPlaceholder: "Ex : Doublon, départ de l'entreprise, demande de l'intéressé...",
        inputAttributes: { rows: '3', style: 'resize:vertical;' },
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Continuer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#dc3545',
        inputValidator: (value) => {
          if (!value?.trim()) return 'La raison est obligatoire.';
        }
      });

      if (!reasonConfirmed || !reason) return;

      // Étape 2 : confirmation finale
      const { isConfirmed } = await Swal.fire({
        title: 'Confirmer la suppression',
        html: `<p>Vous êtes sur le point de supprimer <strong>${fullName.value}</strong>.</p><p class="text-muted fs-13">Raison : <em>${reason}</em></p>`,
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'Oui, supprimer définitivement',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#dc3545',
      });

      if (!isConfirmed) return;
      try {
        await ApiService.deleteWithBody(`/users/${userId.value}`, { reason });
        Swal.fire({ icon: 'success', title: 'Supprimé', timer: 1500, showConfirmButton: false });
        router.push({ name: 'ListeUserPage' });
      } catch {
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de supprimer cet utilisateur.' });
      }
    }

    async function genererPDFContrat(contractId: number) {
      if (!contractId) return;
      try {
        downloadingContractId.value = contractId;
        const response = await ApiService.vueInstance.axios.get(`/contracts/${contractId}/pdf`, {
          responseType: 'blob',
          headers: { 
            'Accept': 'application/pdf',
            'Authorization': `Bearer ${JwtService.getToken()}`
          }
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contrat_${contractId}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        Swal.fire({
          toast: true,
          position: 'top-right',
          icon: 'success',
          title: 'PDF téléchargé avec succès',
          showConfirmButton: false,
          timer: 3000
        });
      } catch (err) {
        console.error('Erreur de téléchargement PDF:', err);
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de télécharger le PDF.' });
      } finally {
        downloadingContractId.value = null;
      }
    }

    function voirDetailsContrat(contract: any) {
      if (!contract) return;
      const targetId = contract.uuid || contract.id || contract;
      router.push({ name: 'DetailsContratPage', params: { id: targetId.toString() } });
    }

    // ── Changer Rôle ──────────────────────────────────────────────────────────
    const showChangeRoleModal = ref(false);
    const newRoleId = ref<number | string>('');
    const savingRole = ref(false);
    const availableRoles = ref<any[]>([]);
    const loadingRoles = ref(false);

    async function ouvrirModalChangerRole() {
      showChangeRoleModal.value = true;
      newRoleId.value = user.value?.idRole || user.value?.role?.id || '';
      if (availableRoles.value.length === 0) {
        try {
          loadingRoles.value = true;
          const { data } = await ApiService.get('/roles');
          const d = data;
          let list: any[] = [];
          if (Array.isArray(d?.data?.roles)) list = d.data.roles;
          else if (Array.isArray(d?.roles)) list = d.roles;
          else if (Array.isArray(d?.data)) list = d.data;
          else if (Array.isArray(d)) list = d;
          availableRoles.value = list;
        } catch { availableRoles.value = []; }
        finally { loadingRoles.value = false; }
      }
    }

    async function sauvegarderRole() {
      if (!newRoleId.value) return;
      try {
        savingRole.value = true;
        await ApiService.put(`/users/${userId.value}`, { idRole: Number(newRoleId.value) });
        Swal.fire({ toast: true, position: 'top-right', icon: 'success', title: 'Rôle mis à jour !', showConfirmButton: false, timer: 2500 });
        showChangeRoleModal.value = false;
        await loadUser();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Erreur', text: err?.response?.data?.message || 'Impossible de modifier le rôle.' });
      } finally { savingRole.value = false; }
    }

    // ── Changer Agence ────────────────────────────────────────────────────────
    const showChangeAgencyModal = ref(false);
    const newAgencyId = ref<number | string>('');
    const savingAgency = ref(false);
    const availableAgences = ref<any[]>([]);
    const loadingAgences = ref(false);

    async function ouvrirModalChangerAgence() {
      showChangeAgencyModal.value = true;
      newAgencyId.value = user.value?.idAgency || user.value?.agency?.id || '';
      if (availableAgences.value.length === 0) {
        try {
          loadingAgences.value = true;
          const { data } = await ApiService.get('/agencies?limit=500');
          const d = data;
          let list: any[] = [];
          if (Array.isArray(d?.data?.agencies)) list = d.data.agencies;
          else if (Array.isArray(d?.agencies)) list = d.agencies;
          else if (Array.isArray(d?.data)) list = d.data;
          else if (Array.isArray(d)) list = d;
          availableAgences.value = list;
        } catch { availableAgences.value = []; }
        finally { loadingAgences.value = false; }
      }
    }

    async function sauvegarderAgence() {
      if (!newAgencyId.value) return;
      try {
        savingAgency.value = true;
        await ApiService.put(`/users/${userId.value}`, { idAgency: Number(newAgencyId.value) });
        Swal.fire({ toast: true, position: 'top-right', icon: 'success', title: 'Agence mise à jour !', showConfirmButton: false, timer: 2500 });
        showChangeAgencyModal.value = false;
        await loadUser();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Erreur', text: err?.response?.data?.message || 'Impossible de modifier l\'agence.' });
      } finally { savingAgency.value = false; }
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    onMounted(async () => {
      document.addEventListener('click', handleOutsideClick);
      await loadUser();
      loadNatureCredits();
      await Promise.all([
        loadContrats(1),
        loadPermissions(),
        loadActivities(1)
      ]);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleOutsideClick);
    });

    return {
      canManageUsers,
      user, loading, tab,
      contrats, loadingContrats, loadContrats,
      userPermissions, loadingPermissions,
      fullName, initials, avatarColor,
      statusClass, statusBadgeClass, statusIcon, statusText,
      roleBadgeStyle, age, contractsSummary,
      formatDate, formatDateTime, formatMontant, getNatureCreditLabel,
      loadPermissions,
      goEdit, resetPassword, toggleLock, isAccountLocked, toggleSuspension, deleteUser, genererPDFContrat, voirDetailsContrat,
      // Visionneur PDF
      viewerVisible,
      viewerPdfUrl,
      viewerLoading,
      viewerErrorMessage,
      viewerTitle,
      viewerSubtitle,
      viewerDocumentKey,
      viewerFilename,
      closeViewer,
      handleViewerDownload,
      openContractPdf,
      contratsPage, contratsLimit, contratsTotalPages, contratsTotalElements, downloadingContractId,
      handleContratsPagination,
      // Activités
      activities, loadingActivities, activitiesPage, activitiesLimit, activitiesTotalPages, activitiesTotalElements,
      loadActivities, handleActivitiesPagination,
      // Changer Rôle
      showChangeRoleModal, newRoleId, savingRole, availableRoles, loadingRoles,
      ouvrirModalChangerRole, sauvegarderRole,
      // Changer Agence
      showChangeAgencyModal, newAgencyId, savingAgency, availableAgences, loadingAgences,
      ouvrirModalChangerAgence, sauvegarderAgence,
      // Menu Actions Mobile
      showActionsDropdown, toggleActionsDropdown, closeActionsDropdown,
    };
  }
});
</script>

<style scoped>
/* =====================================================
   Hero Card Redesign (Executive Profile Header - Clean White)
   ===================================================== */
.hero-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04) !important;
  border: 1px solid #edf2f7 !important;
}

/* Avatar */
.avatar-hero {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  overflow: hidden;
  transition: transform 0.25s ease;
}

.avatar-hero:hover {
  transform: scale(1.04);
}

.initials-text {
  color: #ffffff;
  font-weight: 800;
  font-size: 26px;
  line-height: 1;
}

/* Titre et badges */
.user-name-title {
  font-size: 1.45rem;
  letter-spacing: -0.3px;
}

.badge-role {
  background: #231f20 !important;
  color: #ede947 !important;
  border: 1px solid rgba(237, 233, 71, 0.3);
  letter-spacing: 0.2px;
}

.badge-status-active {
  background: #eaf7ec !important;
  color: #1e7e34 !important;
  border: 1px solid rgba(40, 167, 69, 0.25);
}

.badge-status-suspended {
  background: #fff8e6 !important;
  color: #b78103 !important;
  border: 1px solid rgba(255, 193, 7, 0.35);
}

.badge-status-default {
  background: #f1f3f5 !important;
  color: #495057 !important;
  border: 1px solid #dee2e6;
}

/* Lien agence */
.agency-link-badge {
  padding: 2px 8px;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.agency-link-badge:hover {
  background: #eaf7ec;
  border-color: #33b04a;
}

.user-meta-divider {
  color: #ced4da;
  font-size: 10px;
}

/* =====================================================
   Boutons d'action harmonisés (Cohérents et élégants)
   ===================================================== */
.hero-actions-container .btn {
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

/* Bouton principal "Modifier" */
.btn-action-primary {
  background: linear-gradient(135deg, #33b04a 0%, #2a943e 100%) !important;
  border: 1px solid #2d9a41 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 6px rgba(51, 176, 74, 0.25);
}

.btn-action-primary:hover {
  background: linear-gradient(135deg, #2d9a41 0%, #238035 100%) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(51, 176, 74, 0.35);
}

/* Boutons neutres sobres (Changer Rôle, Changer Agence, MDP) */
.btn-action-neutral {
  background: #ffffff !important;
  border: 1px solid #dce2e6 !important;
  color: #2b3035 !important;
}

.btn-action-neutral:hover {
  background: #f4f6f8 !important;
  border-color: #c1c9cf !important;
  color: #111111 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

/* Menu dropdown mobile */
.actions-dropdown-wrapper {
  position: relative;
}

.actions-mobile-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  min-width: 230px;
  z-index: 1050;
  border-color: #e9ecef !important;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04) !important;
  animation: fadeInFast 0.15s ease-out;
}

@media (max-width: 767.98px) {
  .actions-mobile-dropdown {
    left: 0;
    right: auto;
  }
}

@media (min-width: 768px) {
  .actions-mobile-dropdown {
    right: 0;
    left: auto;
  }
}

@keyframes fadeInFast {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-action-item {
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
  cursor: pointer;
}

.dropdown-action-item:hover {
  background-color: #f8f9fa;
  color: #111111;
  padding-left: 1.15rem !important;
}

.dropdown-action-item.text-danger:hover {
  background-color: #fff5f5;
  color: #dc3545 !important;
}

/* Bouton Suspendre */
.btn-action-suspend {
  background: #fff8e6 !important;
  border: 1px solid #ffd566 !important;
  color: #b78103 !important;
}

.btn-action-suspend:hover {
  background: #ffecb5 !important;
  border-color: #ffc107 !important;
  color: #855f00 !important;
  transform: translateY(-1px);
}

/* Bouton Réactiver */
.btn-action-activate {
  background: #eaf7ec !important;
  border: 1px solid #99e0a7 !important;
  color: #1e7e34 !important;
}

.btn-action-activate:hover {
  background: #d4edda !important;
  border-color: #28a745 !important;
  transform: translateY(-1px);
}

/* Bouton Supprimer */
.btn-action-danger {
  background: #ffffff !important;
  border: 1px solid #fecdd3 !important;
  color: #e11d48 !important;
}

.btn-action-danger:hover {
  background: #e11d48 !important;
  border-color: #e11d48 !important;
  color: #ffffff !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(225, 29, 72, 0.25);
}

/* =====================================================
   Fiches de contact (Cartes structurées sous le profil)
   ===================================================== */
.contact-pill-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.contact-pill-card:hover {
  background: #ffffff;
  border-color: #dbe2ea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.contact-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.contact-caption {
  font-size: 11px;
  text-transform: uppercase;
  color: #718096;
  font-weight: 700;
  letter-spacing: 0.4px;
  line-height: 1.1;
  margin-bottom: 2px;
  display: block;
}

.contact-data {
  font-size: 13.5px;
  color: #1a202c;
  line-height: 1.2;
}

/* KPI */
.kpi-chip {
  background: #fff; border: 1px solid #eee; border-radius: 10px;
  padding: 14px 16px; display: flex; align-items: center; gap: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,.05);
}
.kpi-icon {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
.kpi-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #888; line-height: 1; }
.kpi-value { font-size: 16px; font-weight: 700; color: #231f20; line-height: 1.3; }

/* Tabs */
.nav-tabs .nav-link { border: none; border-bottom: 3px solid transparent; border-radius: 0; color: #888; }
.nav-tabs .nav-link.active { color: #231f20; border-bottom-color: #33b04a; font-weight: 700; }

/* Info grid */
.info-section { background: #f8f9fa; border-radius: 10px; padding: 20px; }
.info-grid { display: flex; flex-direction: column; gap: 10px; }
.info-row { display: flex; justify-content: space-between; font-size: 13px; border-bottom: 1px dashed #dee2e6; padding-bottom: 8px; }
.info-label { color: #888; font-weight: 600; }

/* Permission chips */
.permission-chip { background: #fff; border-radius: 8px; }

/* Soft colors */
.bg-soft-primary   { background: rgba(13, 110, 253, 0.12) !important; }
.bg-soft-info      { background: rgba(23, 162, 184, 0.12) !important; }
.bg-soft-secondary { background: rgba(108, 117, 125, 0.12) !important; }
.bg-soft-danger    { background: rgba(220, 53, 69, 0.12) !important; }
.bg-soft-warning   { background: rgba(255, 193, 7, 0.15) !important; }
.bg-soft-success   { background: rgba(51, 176, 74, 0.12) !important; }
.bg-soft-fnda      { background: rgba(35, 31, 32, 0.08) !important; }
</style>

