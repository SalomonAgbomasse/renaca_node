<template>
  <div>
    <!-- Page Header & Breadcrumb -->
    <BreadCrumb PageTitle="Détails du contrat" />

    <!-- Loading indicator -->
    <div v-if="loading" class="text-center p-5 card shadow-sm border-0 bg-white">
      <div class="spinner-border text-success" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <p class="mt-3 text-muted fw-semibold">Chargement des détails du contrat...</p>
    </div>

      <!-- Error view -->
      <div v-else-if="errorMessage" class="text-center p-5 card shadow-sm border-0 bg-white">
        <i class="flaticon-cancel fs-1 text-danger mb-3"></i>
        <h5 class="text-danger font-weight-bold">Une erreur est survenue</h5>
        <p class="text-muted">{{ errorMessage }}</p>
        <div class="mt-3">
          <button class="btn btn-primary px-4 py-2 me-2" @click="loadContractDetails">
            <i class="flaticon-refresh me-1"></i> Réessayer
          </button>
          <router-link to="/liste-contrats" class="btn btn-outline-secondary px-4 py-2">
            Retour à la liste
          </router-link>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else-if="contratDetails" class="content-fade pb-5">
        
        <!-- EXECUTIVE HERO HEADER -->
        <div class="cotation-header-card mb-4">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <!-- Identity block -->
            <div class="d-flex align-items-center gap-3">
              <div class="client-avatar-badge">
                {{ clientInitials }}
              </div>
              <div>
                <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                  <span class="ref-tag"><i class="flaticon-file-1 me-1"></i> Police N° {{ contratDetails.police }}</span>
                  <span :class="isExpired ? 'status-pill pending' : 'status-pill active'">
                    <i class="dot me-1"></i> {{ isExpired ? 'ÉCHU' : 'ACTIF' }}
                  </span>
                </div>
                <h2 class="client-title mb-0">{{ clientFullName }}</h2>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="d-flex flex-wrap align-items-center gap-2">
              <router-link to="/liste-contrats" class="btn btn-action-secondary">
                <i class="flaticon-left-arrow-1 me-1"></i> Liste
              </router-link>
              <button 
                @click="generateContractPDF" 
                class="btn btn-action-pdf"
                :disabled="isGeneratingPDF">
                <i v-if="!isGeneratingPDF" class="flaticon-file me-1"></i>
                <span v-else class="spinner-border spinner-border-sm me-1" role="status"></span>
                BIA PDF
              </button>
              <div v-if="canModify || isAdmin" class="dropdown">
                <button 
                  class="btn btn-action-primary dropdown-toggle" 
                  type="button" 
                  id="dropdownMenuModify" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  title="Modifier le contrat"
                >
                  <i class="flaticon-pen me-1"></i> Modifier
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="dropdownMenuModify">
                  <li>
                    <button class="dropdown-item py-2" type="button" @click="showEditCalculModal = true">
                      <i class="flaticon-settings text-primary me-2"></i> Modifier le Contrat
                    </button>
                  </li>
                  <li>
                    <button class="dropdown-item py-2" type="button" @click="showEditAssureModal = true">
                      <i class="flaticon-user text-success me-2"></i> Modifier l'Assuré
                    </button>
                  </li>
                </ul>
              </div>
              <button 
                v-if="isAdmin" 
                type="button" 
                class="btn btn-action-secondary" 
                @click="openAdminEditModal"
                title="Modification administrative"
              >
                <i class="flaticon-settings me-1"></i> Admin
              </button>
            </div>
          </div>

          <!-- Horizontal Metrics Bar -->
          <div class="cotation-metrics-strip">
            <div class="metric-cell">
              <span class="metric-label">Capital Garanti</span>
              <span class="metric-val">{{ formatMontant(contratDetails.capital) }} <small class="unit">FCFA</small></span>
            </div>
            <div class="metric-divider"></div>
            <div class="metric-cell">
              <span class="metric-label">Durée du prêt</span>
              <span class="metric-val">{{ contratDetails.duration || contratDetails.duree }} <small class="unit">mois</small></span>
            </div>
            <div class="metric-divider"></div>
            <div class="metric-cell">
              <span class="metric-label">Taux appliqué</span>
              <span class="metric-val text-primary">{{ contratDetails.taux || 'N/A' }}%</span>
            </div>
            <div class="metric-divider"></div>
            <div class="metric-cell">
              <span class="metric-label">Produit / Crédit</span>
              <span class="metric-val text-dark">{{ contratDetails.natureCredit?.libelle || contratDetails.product?.libelle || 'Standard' }}</span>
            </div>
            <div class="metric-divider"></div>
            <div class="metric-cell highlight-cell">
              <span class="metric-label text-success">Prime TTC</span>
              <span class="metric-val text-emerald">{{ formatMontant(contratDetails.puttc) }} <small class="unit text-emerald">FCFA</small></span>
            </div>
          </div>
        </div>

        <!-- 3-COLUMN CONTENT GRID -->
        <div class="row">
          
          <!-- LEFT SIDE: Profile & Details Card (2/3 width on large screens) -->
          <div class="col-lg-8 col-md-12 mb-4">
            
            <!-- Assuré profile card -->
            <div class="glass-card mb-4">
              <div class="card-header-modern">
                <i class="flaticon-user"></i>
                <h5>Fiche Assuré & Contrat</h5>
              </div>
              <div class="card-body p-4">
                <div class="data-grid">
                  <!-- Name -->
                  <div class="data-item span-2">
                    <span class="label-modern">Nom & Prénoms</span>
                    <span class="value-modern name-highlight">{{ clientFullName }}</span>
                  </div>

                  <!-- Date of birth -->
                  <div class="data-item">
                    <span class="label-modern">Date de Naissance</span>
                    <span class="value-modern">{{ formatDate(contratDetails.customer?.birthdate) }}</span>
                  </div>

                  <!-- Phone -->
                  <div class="data-item">
                    <span class="label-modern">Téléphone</span>
                    <span class="value-modern phone-link">
                      <i class="flaticon-phone-call me-1"></i> 
                      {{ contratDetails.customer?.phone || 'N/A' }}
                    </span>
                  </div>

                  <!-- Email -->
                  <div class="data-item">
                    <span class="label-modern">Email</span>
                    <span class="value-modern text-lowercase">{{ contratDetails.customer?.email || 'Non renseigné' }}</span>
                  </div>

                  <!-- Gender -->
                  <div class="data-item">
                    <span class="label-modern">Genre</span>
                    <span class="value-modern">
                      <span :class="contratDetails.customer?.gender === 'M' ? 'badge bg-light-primary text-primary' : 'badge bg-light-danger text-danger'" class="px-2 py-1">
                        {{ contratDetails.customer?.gender === 'M' ? 'Masculin' : 'Féminin' }}
                      </span>
                    </span>
                  </div>

                  <!-- Profession -->
                  <div class="data-item">
                    <span class="label-modern">Profession</span>
                    <span class="value-modern">{{ contratDetails.customer?.occupation || 'N/A' }}</span>
                  </div>

                  <!-- Address -->
                  <div class="data-item span-2">
                    <span class="label-modern">Adresse de Résidence</span>
                    <span class="value-modern">{{ contratDetails.customer?.address || 'N/A' }}</span>
                  </div>

                  <!-- Divider -->
                  <div class="span-full my-3 border-top-gray"></div>

                  <!-- Product -->
                  <div class="data-item">
                    <span class="label-modern">Produit</span>
                    <span class="value-modern product-highlight">{{ contratDetails.product?.libelle || 'BOUCLIER EMPRUNTEUR' }}</span>
                  </div>

                  <!-- Credit Type -->
                  <div class="data-item">
                    <span class="label-modern">Type de Crédit</span>
                    <span class="value-modern">{{ contratDetails.natureCredit?.libelle || 'Standard' }}</span>
                  </div>

                  <!-- Periodicity -->
                  <div class="data-item" v-if="contratDetails.natureCredit?.code !== 'CP' && contratDetails.idNatureCredit !== 2">
                    <span class="label-modern">Périodicité</span>
                    <span class="value-modern">{{ contratDetails.periodicite?.libelle || contratDetails.periodicity?.libelle || 'Mensuelle' }}</span>
                  </div>

                  <!-- Date d'effet -->
                  <div class="data-item">
                    <span class="label-modern">Date d'Effet</span>
                    <span class="value-modern date-highlight">{{ formatDate(contratDetails.dateEff) }}</span>
                  </div>

                  <!-- 1ere Échéance -->
                  <div class="data-item">
                    <span class="label-modern">1re Échéance</span>
                    <span class="value-modern">{{ formatDate(contratDetails.dateEch1) }}</span>
                  </div>

                  <!-- Échéance finale -->
                  <div class="data-item">
                    <span class="label-modern">Échéance Finale</span>
                    <span class="value-modern">{{ formatDate(contratDetails.dateEch) }}</span>
                  </div>

                  <!-- Compte Bancaire CP -->
                  <div class="data-item" v-if="contratDetails.numeroCompte || contratDetails.compteBancaire || contratDetails.refCompte">
                    <span class="label-modern">N° Compte Bancaire / Épargne</span>
                    <span class="value-modern font-monospace fw-bold text-dark">{{ contratDetails.numeroCompte || contratDetails.compteBancaire || contratDetails.refCompte }}</span>
                  </div>

                  <!-- Renouvellement Automatique CP -->
                  <div class="data-item" v-if="contratDetails.renouvellementAuto !== null && contratDetails.renouvellementAuto !== undefined">
                    <span class="label-modern">Renouvellement Automatique</span>
                    <span class="value-modern fw-bold" :class="contratDetails.renouvellementAuto ? 'text-success' : 'text-muted'">
                      {{ contratDetails.renouvellementAuto ? 'Oui (Reconduction tacite)' : 'Non' }}
                    </span>
                  </div>

                  <!-- Établissement / Employeur -->
                  <div class="data-item" v-if="contratDetails.etablissement">
                    <span class="label-modern">Établissement / Employeur</span>
                    <span class="value-modern">{{ contratDetails.etablissement }}</span>
                  </div>

                  <!-- Bénéficiaire -->
                  <div class="data-item" v-if="contratDetails.benef">
                    <span class="label-modern">Bénéficiaire</span>
                    <span class="value-modern fw-bold text-dark">{{ contratDetails.benef }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timeline milestones card (Compact & Modern) -->
            <div class="glass-card">
              <div class="card-header-modern d-flex justify-content-between align-items-center py-2.5 px-3">
                <div class="d-flex align-items-center">
                  <i class="flaticon-time" style="width: 28px; height: 28px; font-size: 0.85rem; margin-right: 8px;"></i>
                  <h5 style="font-size: 0.85rem;" class="mb-0">Milestones & Avancement</h5>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="text-muted fs-11 fw-semibold">
                    <b class="text-dark">{{ daysElapsed }}j</b> écoulés / <b class="text-dark">{{ totalDays }}j</b> total
                  </span>
                  <span 
                    class="badge px-2.5 py-1 fs-12 fw-bold" 
                    :class="isExpired ? 'bg-danger text-white' : progressPercentage >= 90 ? 'bg-warning text-dark' : 'bg-success text-white'"
                  >
                    {{ progressPercentage }}%
                  </span>
                </div>
              </div>

              <div class="card-body py-3 px-4">
                <!-- Slim Progress Bar -->
                <div class="progress mb-2.5" style="height: 5px; border-radius: 4px; background-color: #f1f5f9;">
                  <div 
                    class="progress-bar transition-all" 
                    role="progressbar" 
                    :style="{ width: progressPercentage + '%', backgroundColor: progressColor }"
                  ></div>
                </div>

                <!-- Horizontal 3 Key Dates -->
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-1">
                  <!-- Start date -->
                  <div class="d-flex align-items-center gap-2">
                    <span class="rounded-circle bg-success d-inline-block shadow-xs" style="width: 8px; height: 8px;"></span>
                    <div>
                      <span class="d-block text-muted text-uppercase fw-bold" style="font-size: 10px; letter-spacing: 0.3px;">Date d'effet</span>
                      <span class="fw-bold text-dark fs-12">{{ formatDate(contratDetails.dateEff) }}</span>
                    </div>
                  </div>

                  <!-- First payment date -->
                  <div class="d-flex align-items-center gap-2 text-center">
                    <span class="rounded-circle bg-warning d-inline-block shadow-xs" style="width: 8px; height: 8px;"></span>
                    <div>
                      <span class="d-block text-muted text-uppercase fw-bold" style="font-size: 10px; letter-spacing: 0.3px;">1re Échéance</span>
                      <span class="fw-bold text-dark fs-12">{{ formatDate(contratDetails.dateEch1) }}</span>
                    </div>
                  </div>

                  <!-- End date -->
                  <div class="d-flex align-items-center gap-2 text-end">
                    <div>
                      <span class="d-block text-muted text-uppercase fw-bold" style="font-size: 10px; letter-spacing: 0.3px;">Échéance Finale</span>
                      <span class="fw-bold fs-12" :class="isExpired ? 'text-danger' : 'text-dark'">{{ formatDate(contratDetails.dateEch) }}</span>
                    </div>
                    <span class="rounded-circle d-inline-block shadow-xs" :class="isExpired ? 'bg-danger' : 'bg-secondary'" style="width: 8px; height: 8px;"></span>
                  </div>
                </div>

                <div v-if="isExpired" class="mt-2 text-center">
                  <span class="badge bg-light-danger text-danger fs-11 fw-bold py-0.5 px-2">
                    <i class="flaticon-warning me-1"></i> Contrat arrivé à échéance
                  </span>
                </div>
              </div>
            </div>

            <!-- Section Bénéficiaires (CP) -->
            <div v-if="contratDetails.natureCredit?.code === 'CP' || (contratDetails.beneficiaries && contratDetails.beneficiaries.length > 0)" class="glass-card mt-4">
              <div class="card-header-modern d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                  <i class="flaticon-user me-2"></i>
                  <h5 class="mb-0">Bénéficiaires du Contrat</h5>
                </div>
                <button type="button" @click="openManageBeneficiariesModal" class="btn btn-sm btn-success d-flex align-items-center py-1">
                  <i class="flaticon-plus me-1" style="font-size: 12px;"></i> Gérer les bénéficiaires
                </button>
              </div>
              <div class="card-body p-4">
                <div class="table-responsive">
                  <table class="table table-borderless align-middle m-0">
                    <thead>
                      <tr class="border-bottom-gray">
                        <th class="label-modern py-2">Nom & Prénoms</th>
                        <th class="label-modern py-2">Lien de parenté</th>
                        <th class="label-modern py-2 text-end">Part (%)</th>
                        <th class="label-modern py-2 text-end" style="width: 100px;">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="benef in contratDetails.beneficiaries" :key="benef.id" class="border-bottom-gray">
                        <td class="value-modern py-3">{{ benef.nomPrenoms }}</td>
                        <td class="value-modern py-3"><span class="badge bg-light-primary text-primary">{{ benef.lienParente }}</span></td>
                        <td class="value-modern py-3 text-end fw-bold">{{ benef.pourcentage }}%</td>
                        <td class="py-3 text-end">
                          <button type="button" @click="openManageBeneficiariesModal" class="btn btn-sm btn-outline-success border-0 p-1 me-2" title="Modifier">
                            <i class="flaticon-pen" style="font-size: 14px;"></i>
                          </button>
                          <button type="button" @click="confirmDeleteBeneficiary(benef.id)" class="btn btn-sm btn-outline-danger border-0 p-1" title="Supprimer">
                            <i class="flaticon-delete" style="font-size: 14px;"></i>
                          </button>
                        </td>
                      </tr>
                      <tr v-if="!contratDetails.beneficiaries || contratDetails.beneficiaries.length === 0">
                        <td colspan="4" class="text-center text-muted py-4">Aucun bénéficiaire renseigné</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Section Membres Couverts (OBA) -->
            <div v-if="contratDetails.natureCredit?.code === 'OBA' || (contratDetails.insuredMembers && contratDetails.insuredMembers.length > 0)" class="glass-card mt-4">
              <div class="card-header-modern">
                <i class="flaticon-user"></i>
                <h5>Membres Assurés Couverts (OBA)</h5>
              </div>
              <div class="card-body p-4">
                <div class="table-responsive">
                  <table class="table table-borderless align-middle m-0">
                    <thead>
                      <tr class="border-bottom-gray">
                        <th class="label-modern py-2">Relation / Rôle</th>
                        <th class="label-modern py-2">Nom & Prénoms</th>
                        <th class="label-modern py-2 text-center">Date de Naissance</th>
                        <th class="label-modern py-2 text-center">Genre</th>
                        <th class="label-modern py-2 text-end">Capital (FCFA)</th>
                        <th class="label-modern py-2 text-end">Prime (FCFA)</th>
                        <th class="label-modern py-2 text-end" style="width: 100px;">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="member in contratDetails.insuredMembers" :key="member.id" class="border-bottom-gray">
                        <td class="value-modern py-3"><span class="badge bg-light-success text-success">{{ member.roleLabel }}</span></td>
                        <td class="value-modern py-3 fw-bold">{{ member.lastname }} {{ member.firstname }}</td>
                        <td class="value-modern py-3 text-center">{{ formatDate(member.birthdate) }}</td>
                        <td class="value-modern py-3 text-center">
                          <span :class="member.gender === 'M' ? 'text-primary' : 'text-danger'">
                            {{ member.gender === 'M' ? 'Masculin' : 'Féminin' }}
                          </span>
                        </td>
                        <td class="value-modern py-3 text-end">{{ formatMontant(member.capitalAssure) }}</td>
                        <td class="value-modern py-3 text-end fw-bold text-success">{{ formatMontant(member.prime) }}</td>
                        <td class="py-3 text-end">
                          <button type="button" @click="openEditInsuredMemberModal(member)" class="btn btn-sm btn-outline-success border-0 p-1 me-2" title="Modifier">
                            <i class="flaticon-pen" style="font-size: 14px;"></i>
                          </button>
                          <button type="button" @click="confirmDeleteInsuredMember(member.id)" class="btn btn-sm btn-outline-danger border-0 p-1" title="Supprimer">
                            <i class="flaticon-delete" style="font-size: 14px;"></i>
                          </button>
                        </td>
                      </tr>
                      <tr v-if="!contratDetails.insuredMembers || contratDetails.insuredMembers.length === 0">
                        <td colspan="7" class="text-center text-muted py-4">Aucun membre couvert additionnel</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

          <!-- RIGHT SIDE: Financial Widget & Traçabilité (1/3 width on large screens) -->
          <div class="col-lg-4 col-md-12">
            
            <!-- Financial breakdown widget -->
            <div class="finance-widget mb-4">
              <div class="finance-hero-total">
                <span class="total-label">Prime Totale TTC</span>
                <span class="total-amount">{{ formatMontant(contratDetails.puttc) }}</span>
                <span class="total-currency">FRANCS CFA</span>
              </div>
              <div class="finance-items">
                <div class="finance-item">
                  <span>Prime Décès</span>
                  <b>{{ formatMontant(contratDetails.pd) }} FCFA</b>
                </div>
                <div class="finance-item">
                  <span>Prime Perte d'Emploi</span>
                  <b>{{ formatMontant(contratDetails.pc) }} FCFA</b>
                </div>
                <div class="finance-item">
                  <span>Surprime</span>
                  <b>{{ formatMontant(contratDetails.surp) }} FCFA</b>
                </div>
                <div class="finance-item">
                  <span>Frais Médicaux</span>
                  <b>{{ formatMontant(contratDetails.fm) }} FCFA</b>
                </div>
                <div class="finance-item">
                  <span>Accessoires</span>
                  <b>{{ formatMontant(contratDetails.acc) }} FCFA</b>
                </div>
              </div>
              <div class="finance-meta">
                <div class="finance-meta-row">
                  <span>Capital</span>
                  <b>{{ formatMontant(contratDetails.capital) }} FCFA</b>
                </div>
                <div class="finance-meta-row">
                  <span>Taux appliqué</span>
                  <b>{{ contratDetails.taux || 'N/A' }}%</b>
                </div>
                <div class="finance-meta-row">
                  <span>Nature Crédit</span>
                  <b>{{ contratDetails.natureCredit?.libelle || 'Standard' }}</b>
                </div>
              </div>
            </div>

            <!-- Audit Trail & Traçabilité -->
            <div class="trace-card mb-4">
              <div class="trace-header">
                <div class="trace-header-icon">
                  <i class="flaticon-user"></i>
                </div>
                <h6>Traçabilité</h6>
              </div>
              <div class="trace-body">
                <div class="trace-item">
                  <div class="trace-dot bg-success"></div>
                  <div class="trace-content">
                    <div class="trace-label">Agence</div>
                    <div class="trace-value">{{ contratDetails.agency?.name || 'N/A' }}</div>
                  </div>
                </div>
                <div class="trace-item">
                  <div class="trace-dot bg-primary"></div>
                  <div class="trace-content w-100">
                    <div class="d-flex justify-content-between align-items-center">
                      <div class="trace-label">Saisi par</div>
                      <span v-if="contratDetails.createdAt" class="text-muted" style="font-size: 11px;">
                        <i class="flaticon-time me-1"></i>{{ formatDateTime(contratDetails.createdAt) }}
                      </span>
                    </div>
                    <div class="trace-value">{{ contratDetails.user?.lastname }} {{ contratDetails.user?.firstname }}</div>
                  </div>
                </div>
                <div class="trace-item" v-if="contratDetails.updatedBy || contratDetails.updatedAt">
                  <div class="trace-dot bg-warning"></div>
                  <div class="trace-content w-100">
                    <div class="d-flex justify-content-between align-items-center">
                      <div class="trace-label">Modifié par</div>
                      <span v-if="contratDetails.updatedAt" class="text-muted" style="font-size: 11px;">
                        <i class="flaticon-time me-1"></i>{{ formatDateTime(contratDetails.updatedAt) }}
                      </span>
                    </div>
                    <div class="trace-value">
                      <template v-if="contratDetails.updatedByUser">
                        {{ contratDetails.updatedByUser.lastname }} {{ contratDetails.updatedByUser.firstname }}
                      </template>
                      <template v-else-if="contratDetails.updatedBy">
                        Utilisateur ID {{ contratDetails.updatedBy }}
                      </template>
                      <template v-else>
                        {{ contratDetails.user?.lastname }} {{ contratDetails.user?.firstname }}
                      </template>
                    </div>
                  </div>
                </div>
              </div>
              <div class="audit-footer flex-column align-items-start gap-1">
                <span>Créé le: <b>{{ formatDateTime(contratDetails.createdAt) }}</b></span>
                <span class="text-secondary small">Dernière mise à jour: <b>{{ formatDateTime(contratDetails.updatedAt) }}</b></span>
              </div>
            </div>

            <!-- History changes widget -->
            <div class="trace-card">
              <div class="trace-header justify-content-between w-100">
                <div class="d-flex align-items-center gap-2">
                  <div class="trace-header-icon bg-light-info text-info">
                    <i class="flaticon-time"></i>
                  </div>
                  <h6>Historique modifications</h6>
                </div>
                <button 
                  v-if="contractHistory && contractHistory.length > 0"
                  class="btn btn-sm btn-outline-primary py-1 px-2 border-0"
                  @click="exportHistoryToPdf"
                  :disabled="isExportingHistory"
                  style="font-size: 10px; font-weight: bold; letter-spacing: 0.5px;">
                  <i v-if="!isExportingHistory" class="flaticon-file me-1"></i>
                  <span v-else class="spinner-border spinner-border-sm me-1" role="status" style="width:10px; height:10px;"></span>
                  EXPORTER PDF
                </button>
              </div>
              <div class="history-body">
                <div v-if="loadingHistory" class="text-center p-4">
                  <div class="spinner-border text-info spinner-border-sm" role="status">
                    <span class="visually-hidden">Chargement...</span>
                  </div>
                </div>
                <div v-else-if="errorHistory" class="p-3 text-center text-danger small">
                  {{ errorHistory }}
                </div>
                <div v-else-if="contractHistory.length === 0" class="p-4 text-center text-muted small">
                  Aucun historique disponible
                </div>
                <div v-else class="history-scrollable">
                  <div v-for="(item, idx) in contractHistory" :key="item.id || idx" class="history-log-item">
                    <div class="d-flex justify-content-between mb-1">
                      <span class="history-badge" :class="getHistoryActionClass(item.action)">
                        {{ getHistoryActionLabel(item.action) }}
                      </span>
                      <span class="history-log-date">{{ formatDateTime(item.createdAt) }}</span>
                    </div>
                    <div class="history-log-desc">{{ item.description }}</div>
                    <div v-if="item.changedByUser" class="history-log-user">
                      Par: {{ item.changedByUser.firstname }} {{ item.changedByUser.lastname }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    <!-- Edit Contract Modal Wrapper -->
    <CotationToContratModal
      ref="conversionModalRef"
      :visible="showConversionModal"
      :client-editable="true"
      modal-title="Modifier le contrat"
      :contract-to-edit="contratDetails"
      @conversion-success="handleConversionSuccess"
      @close="handleConversionClose"
      @update:visible="showConversionModal = $event"
    />

    <!-- Edit Assuré Modal -->
    <EditAssureModal
      :visible="showEditAssureModal"
      :contrat-details="contratDetails"
      @close="showEditAssureModal = false"
      @saved="loadContractDetails"
    />

    <!-- Edit Calcul Modal -->
    <EditCalculModal
      :visible="showEditCalculModal"
      :contrat-details="contratDetails"
      :nature-credits="natureCredits"
      @close="showEditCalculModal = false"
      @saved="loadContractDetails"
    />

    <!-- Admin Edit Contract Modal -->
    <AdminEditContractModal
      :visible="showAdminEditModal"
      :contrat-details="contratDetails"
      :nature-credits="natureCredits"
      @update:visible="showAdminEditModal = $event"
      @close="showAdminEditModal = false"
      @saved="loadContractDetails"
    />

    <!-- Interactive Beneficiaries Manager Modal -->
    <form @submit.prevent="submitInteractiveBeneficiaries">
      <Modal
        :isVisible="showManageBeneficiariesModal"
        title="Gestion des Bénéficiaires (PADME PROTECTION)"
        icon="flaticon-user"
        size="xlarge"
        @close="showManageBeneficiariesModal = false"
      >
        <div>
          <!-- Compact Modern Distribution Header -->
          <div class="p-2.5 px-3 mb-3 rounded-3 border bg-white shadow-xs">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="fw-bold text-dark fs-12 text-uppercase" style="letter-spacing: 0.3px;">Répartition du capital :</span>
                <span 
                  class="badge px-2 py-1 fs-12 fw-bold"
                  :class="interactiveTotalPct === 100 ? 'bg-success text-white' : interactiveTotalPct > 100 ? 'bg-danger text-white' : 'bg-warning text-dark'"
                >
                  {{ interactiveTotalPct }}% / 100%
                </span>
                
                <span v-if="interactiveTotalPct === 100" class="text-success fs-12 fw-semibold ms-1 d-inline-flex align-items-center">
                  <i class="flaticon-tick me-1"></i> Répartition valide (100%)
                </span>
                <span v-else-if="interactiveTotalPct < 100" class="text-dark fs-12 fw-medium ms-1 d-inline-flex align-items-center">
                  <i class="flaticon-warning text-warning me-1"></i> Reste <b class="text-warning ms-1">{{ 100 - interactiveTotalPct }}%</b>
                </span>
                <span v-else class="text-danger fs-12 fw-semibold ms-1 d-inline-flex align-items-center">
                  <i class="flaticon-warning me-1"></i> Dépassement (+{{ interactiveTotalPct - 100 }}%)
                </span>
              </div>

              <div class="d-flex align-items-center gap-2">
                <button 
                  v-if="interactiveTotalPct < 100"
                  type="button" 
                  class="btn btn-sm btn-outline-warning text-dark py-1 px-2 fs-11 fw-semibold border"
                  @click="allocateRemainingToLast"
                  title="Attribuer le solde restant au dernier bénéficiaire"
                >
                  + Solde au dernier
                </button>
                <button 
                  type="button" 
                  class="btn btn-sm btn-outline-primary py-1 px-2.5 fs-11 fw-semibold border bg-white"
                  @click="splitEvenlyInteractive"
                  title="Diviser équitablement 100% entre tous les bénéficiaires"
                >
                  <i class="fas fa-magic me-1"></i>Répartir équitablement
                </button>
              </div>
            </div>

            <div class="progress" style="height: 4px; border-radius: 4px; background-color: #f1f5f9;">
              <div 
                class="progress-bar transition-all" 
                role="progressbar" 
                :style="{ width: Math.min(100, interactiveTotalPct) + '%' }" 
                :class="interactiveTotalPct === 100 ? 'bg-success' : interactiveTotalPct > 100 ? 'bg-danger' : 'bg-warning'"
              ></div>
            </div>
          </div>

          <!-- Beneficiaries Table Header -->
          <div class="row g-2 align-items-center px-2 py-1 mb-1 text-muted text-uppercase fw-bold fs-11">
            <div class="col-auto text-center" style="width: 28px;">#</div>
            <div class="col-md-5">Nom & Prénoms <span class="text-danger">*</span></div>
            <div class="col-md-3">Lien de Parenté <span class="text-danger">*</span></div>
            <div class="col-md-2">Part (%) <span class="text-danger">*</span></div>
            <div class="col-auto" style="width: 28px;"></div>
          </div>

          <!-- Dynamic Beneficiaries Rows -->
          <div class="beneficiaries-list">
            <div 
              v-for="(b, idx) in interactiveBeneficiaries" 
              :key="idx" 
              class="row g-2 align-items-center p-2 mb-2 rounded border bg-white shadow-xs"
            >
              <div class="col-auto">
                <span class="badge rounded-circle bg-light-primary text-primary d-inline-flex align-items-center justify-content-center" style="width: 28px; height: 28px; font-size: 11px; font-weight: bold;">
                  {{ idx + 1 }}
                </span>
              </div>
              
              <div class="col-md-5">
                <input 
                  type="text" 
                  v-model="b.nomPrenoms" 
                  class="form-control form-control-sm text-uppercase" 
                  placeholder="Ex: KOFFI Jean" 
                  required 
                />
              </div>

              <div class="col-md-3">
                <select v-model="b.lienParente" class="form-select form-select-sm" required>
                  <option value="" disabled>-- Sélectionner --</option>
                  <option 
                    v-for="lp in liensParenteOptions" 
                    :key="lp.id || lp.code || lp.libelle" 
                    :value="lp.libelle || lp.code"
                  >
                    {{ lp.libelle }}
                  </option>
                </select>
              </div>

              <div class="col-md-2">
                <div class="input-group input-group-sm">
                  <input 
                    type="number" 
                    v-model.number="b.pourcentage" 
                    class="form-control text-center fw-bold" 
                    min="1" 
                    max="100" 
                    step="1" 
                    required 
                  />
                  <span class="input-group-text">%</span>
                </div>
              </div>

              <div class="col-auto d-flex align-items-center">
                <button 
                  type="button" 
                  class="btn btn-sm btn-outline-danger border-0 p-1" 
                  @click="removeInteractiveBeneficiary(idx)"
                  :disabled="interactiveBeneficiaries.length <= 1"
                  :title="interactiveBeneficiaries.length <= 1 ? 'Au moins un bénéficiaire obligatoire' : 'Retirer ce bénéficiaire'"
                >
                  <i class="flaticon-delete fs-14"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Add Button -->
          <div class="mt-3">
            <button 
              type="button" 
              class="btn btn-outline-success btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5"
              @click="addInteractiveBeneficiary"
            >
              <i class="flaticon-plus fs-12"></i>
              <span>Ajouter un autre bénéficiaire</span>
            </button>
          </div>
        </div>

        <template #footer>
          <button type="button" class="btn btn-outline-secondary px-4" @click="showManageBeneficiariesModal = false">
            Annuler
          </button>
          <button 
            type="submit" 
            class="btn btn-success px-4" 
            :disabled="interactiveTotalPct !== 100 || isSubmittingBeneficiaries"
          >
            <span v-if="isSubmittingBeneficiaries" class="spinner-border spinner-border-sm me-1" role="status"></span>
            Enregistrer les modifications
          </button>
        </template>
      </Modal>
    </form>

    <!-- Edit Insured Member Modal -->
    <form @submit.prevent="submitEditInsuredMember">
      <Modal
        :isVisible="showEditInsuredMemberModal"
        title="Modifier le Membre Assuré (OBA)"
        icon="flaticon-user"
        size="medium"
        @close="showEditInsuredMemberModal = false"
      >
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">Nom <span class="text-danger">*</span></label>
            <input type="text" v-model="editInsuredMemberForm.lastname" class="form-control" required />
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">Prénoms <span class="text-danger">*</span></label>
            <input type="text" v-model="editInsuredMemberForm.firstname" class="form-control" required />
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">Date de Naissance <span class="text-danger">*</span></label>
            <input type="date" v-model="editInsuredMemberForm.birthdate" class="form-control" required />
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">Genre <span class="text-danger">*</span></label>
            <select v-model="editInsuredMemberForm.gender" class="form-select" required>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
        </div>
        <template #footer>
          <button type="button" class="btn btn-outline-secondary px-4" @click="showEditInsuredMemberModal = false">
            Annuler
          </button>
          <button type="submit" class="btn btn-success px-4" :disabled="isSubmittingInsuredMember">
            <span v-if="isSubmittingInsuredMember" class="spinner-border spinner-border-sm me-1" role="status"></span>
            Enregistrer
          </button>
        </template>
      </Modal>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import BreadCrumb from '../../components/Common/BreadCrumb.vue';
import CotationToContratModal from '../../components/Common/CotationToContratModal.vue';
import AdminEditContractModal from '../../components/Contrat/AdminEditContractModal.vue';
import Modal from '../../components/Common/Modal.vue';
import EditAssureModal from '../../components/Contrat/EditAssureModal.vue';
import EditCalculModal from '../../components/Contrat/EditCalculModal.vue';
import ApiService from '../../services/ApiService';
import JwtService from '../../services/JwtService';
import { success, warning, error, extractFilenameFromResponse } from '../../utils/utils';

export default defineComponent({
  name: 'DetailsContratPage',
  components: {
    BreadCrumb,
    CotationToContratModal,
    AdminEditContractModal,
    Modal,
    EditAssureModal,
    EditCalculModal
  },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const contratId = computed(() => {
      const id = route.params.id;
      return id ? String(id) : null;
    });

    const contratDetails = ref<any>(null);
    const loading = ref(false);
    const errorMessage = ref<string | null>(null);

    // PDF States
    const isGeneratingPDF = ref(false);

    // Edit modal States
    const showConversionModal = ref(false);
    const showEditAssureModal = ref(false);
    const showEditCalculModal = ref(false);
    const conversionModalRef = ref<any>(null);

    // Beneficiary Edit States
    const showEditBeneficiaryModal = ref(false);
    const isSubmittingBeneficiary = ref(false);
    const isEditingBeneficiary = ref(false);
    const editBeneficiaryForm = ref({
      id: null as number | null,
      nomPrenoms: '',
      lienParente: '',
      pourcentage: 0
    });

    // Insured Member Edit States
    const showEditInsuredMemberModal = ref(false);
    const isSubmittingInsuredMember = ref(false);
    const editInsuredMemberForm = ref({
      id: null as number | null,
      lastname: '',
      firstname: '',
      birthdate: '',
      gender: 'M'
    });

    // History States
    const contractHistory = ref<any[]>([]);
    const loadingHistory = ref(false);
    const errorHistory = ref<string | null>(null);
    const isExportingHistory = ref(false);

    // Admin edit States
    const userRole = ref<number | null>(null);
    const showAdminEditModal = ref(false);
    const isSubmittingAdminEdit = ref(false);
    const natureCredits = ref<any[]>([]);
    const adminEditForm = ref<any>({
      reference: '',
      idNatureCredit: null,
      etablissement: '',
      dateEff: '',
      dateEch1: '',
      dateEch: '',
      duration: 0,
      capital: 0,
      taux: 0,
      pd: 0,
      pc: 0,
      surp: 0,
      fm: 0,
      acc: 0
    });

    // Computed properties
    const clientFullName = computed(() => {
      if (!contratDetails.value?.customer) return 'Assuré non spécifié';
      return `${contratDetails.value.customer.lastname.toUpperCase()} ${contratDetails.value.customer.firstname}`;
    });

    const clientInitials = computed(() => {
      if (!contratDetails.value?.customer) return 'A';
      const last = contratDetails.value.customer.lastname.charAt(0).toUpperCase();
      const first = contratDetails.value.customer.firstname.charAt(0).toUpperCase();
      return `${last}${first}`;
    });

    const isExpired = computed(() => {
      if (!contratDetails.value?.dateEch) return false;
      return new Date(contratDetails.value.dateEch).getTime() < Date.now();
    });

    const isRecent = computed(() => {
      if (!contratDetails.value?.createdAt) return false;
      const createdTime = new Date(contratDetails.value.createdAt).getTime();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      return (Date.now() - createdTime) < thirtyDaysInMs;
    });

    const isAdmin = computed(() => {
      return userRole.value === 1 || userRole.value === 5;
    });

    // Contrat hors convention
    const isHorsConvention = computed(() => {
      return !!contratDetails.value?.isHorsConvention;
    });

    const canModify = computed(() => {
      if (!contratDetails.value) return false;
      // Contrat échu ou hors convention : bouton Modifier désactivé pour tous
      if (isExpired.value || isHorsConvention.value) return false;
      // Admin et Super Admin : accès permanent à la modification avec recalcul
      if (isAdmin.value) return true;
      // Utilisateurs standard : actif uniquement pendant le premier mois après création
      return isRecent.value;
    });

    // Time calculations
    const totalDays = computed(() => {
      if (!contratDetails.value?.dateEff || !contratDetails.value?.dateEch) return 0;
      const start = new Date(contratDetails.value.dateEff).getTime();
      const end = new Date(contratDetails.value.dateEch).getTime();
      const diff = end - start;
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    });

    const daysElapsed = computed(() => {
      if (!contratDetails.value?.dateEff) return 0;
      const start = new Date(contratDetails.value.dateEff).getTime();
      const now = Math.min(Date.now(), new Date(contratDetails.value.dateEch || Date.now()).getTime());
      const diff = now - start;
      if (diff <= 0) return 0;
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    });

    const daysLeft = computed(() => {
      if (!contratDetails.value?.dateEch) return 0;
      const end = new Date(contratDetails.value.dateEch).getTime();
      const diff = end - Date.now();
      if (diff <= 0) return 0;
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    });

    const progressPercentage = computed(() => {
      if (totalDays.value <= 0) return 0;
      if (isExpired.value) return 100;
      const rawPct = (daysElapsed.value / totalDays.value) * 100;
      return Math.min(100, Math.max(0, Math.round(rawPct)));
    });

    const progressColor = computed(() => {
      if (isExpired.value) return '#ef4444'; // Red for expired
      if (progressPercentage.value >= 90) return '#f59e0b'; // Amber for ending soon
      return '#10b981'; // Premium green
    });

    // Actions
    async function loadContractDetails() {
      if (!contratId.value) {
        errorMessage.value = 'Identifiant du contrat invalide ou manquant';
        return;
      }

      loading.value = true;
      errorMessage.value = null;

      try {
        const response = await ApiService.get(`/contracts/${contratId.value}`);
        let contract = null;
        if (response.data?.data?.contract) {
          contract = response.data.data.contract;
        } else if (response.data?.contract) {
          contract = response.data.contract;
        } else if (response.data && response.data.id) {
          contract = response.data;
        }

        if (contract) {
          contratDetails.value = contract;
          loadContractHistory();
        } else {
          throw new Error('Contrat non trouvé dans la réponse du serveur');
        }
      } catch (err: any) {
        console.error('Erreur chargement détails contrat:', err);
        errorMessage.value = err?.response?.data?.message || err?.message || 'Erreur technique lors du chargement';
      } finally {
        loading.value = false;
      }
    }

    async function loadContractHistory() {
      if (!contratId.value) return;

      loadingHistory.value = true;
      errorHistory.value = null;

      try {
        const response = await ApiService.get(`/contracts/${contratId.value}/history`);
        const raw = response.data;
        // Handle: { data: { history: [] } } OR { history: [] } OR []
        if (raw?.data?.history) {
          contractHistory.value = raw.data.history;
        } else if (raw?.history) {
          contractHistory.value = raw.history;
        } else if (Array.isArray(raw?.data)) {
          contractHistory.value = raw.data;
        } else if (Array.isArray(raw)) {
          contractHistory.value = raw;
        } else {
          contractHistory.value = [];
        }
        console.log('[History] Chargé:', contractHistory.value.length, 'entrées');
      } catch (err: any) {
        console.error('Erreur chargement historique:', err);
        errorHistory.value = 'Impossible de charger l\'historique';
      } finally {
        loadingHistory.value = false;
      }
    }

    async function generateContractPDF() {
      if (!contratDetails.value?.id) return;
      isGeneratingPDF.value = true;

      try {
        const response = await ApiService.vueInstance.axios.get(`/contracts/${contratDetails.value.id}/pdf`, {
          responseType: 'blob',
          timeout: 120000,
          headers: {
            'Accept': 'application/pdf',
            'Authorization': `Bearer ${JwtService.getToken()}`
          }
        });

        if (!(response.data instanceof Blob)) {
          throw new Error('Format de fichier invalide');
        }

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const filename = extractFilenameFromResponse(response, `contrat_${contratDetails.value.reference}.pdf`);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);

        success('PDF généré avec succès !');
      } catch (err: any) {
        console.error('Erreur génération PDF:', err);
        error('Erreur lors de la génération du PDF.');
      } finally {
        isGeneratingPDF.value = false;
      }
    }

    async function exportHistoryToPdf() {
      if (!contratDetails.value?.id) return;
      isExportingHistory.value = true;

      try {
        const response = await ApiService.vueInstance.axios.get(
          `/contracts/${contratDetails.value.id}/history/pdf`,
          {
            responseType: 'blob',
            headers: {
              'Accept': 'application/pdf',
              'Authorization': `Bearer ${JwtService.getToken()}`
            }
          }
        );

        if (!(response.data instanceof Blob)) {
          throw new Error('Réponse invalide');
        }

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const filename = extractFilenameFromResponse(response, `historique_${contratDetails.value.reference}.pdf`);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);

        success('PDF de l\'historique exporté !');
      } catch (err: any) {
        console.error('Erreur export historique:', err);
        error('Erreur d\'export de l\'historique.');
      } finally {
        isExportingHistory.value = false;
      }
    }

    function openEditModal() {
      showConversionModal.value = true;
    }

    function handleConversionClose() {
      showConversionModal.value = false;
    }

    function handleConversionSuccess() {
      showConversionModal.value = false;
      success('Contrat mis à jour avec succès !');
      loadContractDetails();
    }

    // Formatter helpers
    function formatMontant(val: number | null | undefined): string {
      if (val == null) return '0';
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }

    function formatDate(dateStr: string | null | undefined): string {
      if (!dateStr) return '-';
      try {
        if (dateStr.includes('/')) return dateStr;
        return new Date(dateStr).toLocaleDateString('fr-FR');
      } catch {
        return dateStr;
      }
    }

    function formatDateTime(dateStr: string | null | undefined): string {
      if (!dateStr) return '-';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const datePart = date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const timePart = date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        return `${datePart} à ${timePart}`;
      } catch {
        return dateStr;
      }
    }

    function getHistoryActionLabel(action: string): string {
      const labels: Record<string, string> = {
        CREATE: 'Création',
        UPDATE: 'Modification',
        DELETE: 'Suppression'
      };
      return labels[action] || action;
    }

    function getHistoryActionClass(action: string): string {
      const classes: Record<string, string> = {
        CREATE: 'history-badge-create',
        UPDATE: 'history-badge-update',
        DELETE: 'history-badge-delete'
      };
      return classes[action] || 'history-badge-default';
    }

    // Helper function to format dates for input fields
    function formatDateForInput(dateStr: any): string {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      } catch {
        return '';
      }
    }

    async function loadUserRole() {
      try {
        const response = await ApiService.get('auth/profile');
        if (response.data && response.data.data && response.data.data.user) {
          const user = response.data.data.user;
          const roleMapping: { [key: string]: number } = {
            'ADMIN': 1,
            'MANAGER': 2,
            'AGENT': 3,
            'USER': 4,
            'SUPER ADMIN': 5,
            'AGENCY MANAGER': 6
          };
          if (user.role && user.role.libelle) {
            userRole.value = roleMapping[user.role.libelle] || null;
          } else if (user.idRole) {
            userRole.value = Number(user.idRole);
          }
        }
      } catch (err) {
        console.error('❌ Erreur lors du chargement du rôle utilisateur:', err);
      }
    }

    async function loadNatureCredits() {
      try {
        const response = await ApiService.get('/nature-credits');
        const responseData = response.data;

        // The interceptor may double-wrap: { code, data: { message, data: [...] } }
        // So we try multiple levels to find the actual array
        let credits: any[] | null = null;
        if (Array.isArray(responseData)) {
          credits = responseData; // direct array
        } else if (Array.isArray(responseData?.data)) {
          credits = responseData.data; // { data: [...] }
        } else if (Array.isArray(responseData?.data?.data)) {
          credits = responseData.data.data; // { data: { message, data: [...] } }
        }

        if (credits && credits.length > 0) {
          natureCredits.value = credits;
        } else {
          throw new Error('Format inattendu');
        }
      } catch (err) {
        console.error('❌ Erreur lors du chargement des natures de crédit:', err);
        natureCredits.value = [
          { id: 1, code: 'AMORT', libelle: 'Amortissable' },
          { id: 2, code: 'CONST', libelle: 'Constant' }
        ];
      }
    }

    const liensParenteOptions = ref<any[]>([
      { id: 1, code: 'PERE', libelle: 'PERE' },
      { id: 2, code: 'MERE', libelle: 'MERE' },
      { id: 3, code: 'ENFANT', libelle: 'ENFANT' },
      { id: 4, code: 'CONJOINT', libelle: 'CONJOINT(E)' },
      { id: 5, code: 'FRERE', libelle: 'FRERE' },
      { id: 6, code: 'SOEUR', libelle: 'SOEUR' },
      { id: 7, code: 'AUTRE', libelle: 'AUTRE' }
    ]);

    async function loadLiensParente() {
      try {
        const res = await ApiService.get('/lien-parente');
        const list = res.data?.liensParente || res.data?.data?.liensParente || res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          liensParenteOptions.value = list.filter((item: any) => item.isActive !== false);
        }
      } catch (err) {
        console.warn('Utilisation des liens de parenté par défaut');
      }
    }

    function openAdminEditModal() {
      if (!contratDetails.value) return;
      showAdminEditModal.value = true;
    }

    // Interactive Beneficiaries State
    const showManageBeneficiariesModal = ref(false);
    const isSubmittingBeneficiaries = ref(false);
    const interactiveBeneficiaries = ref<Array<{ id?: number; nomPrenoms: string; lienParente: string; pourcentage: number }>>([]);

    const interactiveTotalPct = computed(() => {
      if (!interactiveBeneficiaries.value || !Array.isArray(interactiveBeneficiaries.value)) return 0;
      return interactiveBeneficiaries.value.reduce((sum, b) => sum + (Number(b.pourcentage) || 0), 0);
    });

    function openManageBeneficiariesModal() {
      if (contratDetails.value?.beneficiaries && contratDetails.value.beneficiaries.length > 0) {
        interactiveBeneficiaries.value = contratDetails.value.beneficiaries.map((b: any) => ({
          id: b.id,
          nomPrenoms: b.nomPrenoms,
          lienParente: b.lienParente,
          pourcentage: Number(b.pourcentage)
        }));
      } else {
        interactiveBeneficiaries.value = [
          { nomPrenoms: '', lienParente: 'ENFANT', pourcentage: 100 }
        ];
      }
      showManageBeneficiariesModal.value = true;
    }

    function addInteractiveBeneficiary() {
      const rem = Math.max(0, 100 - interactiveTotalPct.value);
      interactiveBeneficiaries.value.push({
        nomPrenoms: '',
        lienParente: '',
        pourcentage: rem > 0 ? rem : 0
      });
    }

    function removeInteractiveBeneficiary(index: number) {
      if (interactiveBeneficiaries.value.length <= 1) {
        warning('Au moins un bénéficiaire est obligatoire.');
        return;
      }
      interactiveBeneficiaries.value.splice(index, 1);
    }

    function splitEvenlyInteractive() {
      const n = interactiveBeneficiaries.value.length;
      if (n === 0) return;
      const base = Math.floor(100 / n);
      const rem = 100 - (base * n);
      interactiveBeneficiaries.value.forEach((b, idx) => {
        b.pourcentage = base + (idx === 0 ? rem : 0);
      });
    }

    function allocateRemainingToLast() {
      const n = interactiveBeneficiaries.value.length;
      if (n === 0) return;
      const otherSum = interactiveBeneficiaries.value.slice(0, n - 1).reduce((sum, b) => sum + (Number(b.pourcentage) || 0), 0);
      const remaining = Math.max(0, 100 - otherSum);
      interactiveBeneficiaries.value[n - 1].pourcentage = remaining;
    }

    async function submitInteractiveBeneficiaries() {
      if (interactiveTotalPct.value !== 100) {
        error(`Le total des parts doit faire exactement 100% (actuel: ${interactiveTotalPct.value}%).`);
        return;
      }
      for (const b of interactiveBeneficiaries.value) {
        if (!b.nomPrenoms?.trim()) {
          error('Veuillez renseigner le nom et prénoms de chaque bénéficiaire.');
          return;
        }
        if (!b.lienParente) {
          error(`Veuillez sélectionner le lien de parenté pour ${b.nomPrenoms}.`);
          return;
        }
        if (!b.pourcentage || b.pourcentage <= 0) {
          error(`La part pour ${b.nomPrenoms} doit être supérieure à 0%.`);
          return;
        }
      }

      isSubmittingBeneficiaries.value = true;
      try {
        await ApiService.put(`/contracts/${contratId.value}/beneficiaries`, {
          beneficiaries: interactiveBeneficiaries.value
        });
        success('Bénéficiaires mis à jour avec succès !');
        showManageBeneficiariesModal.value = false;
        loadContractDetails();
      } catch (err: any) {
        console.error('❌ Erreur enregistrement bénéficiaires:', err);
        error(err?.response?.data?.message || err?.message || 'Erreur lors de l\'enregistrement');
      } finally {
        isSubmittingBeneficiaries.value = false;
      }
    }

    function confirmDeleteBeneficiary(id: number) {
      if (contratDetails.value?.beneficiaries && contratDetails.value.beneficiaries.length <= 1) {
        warning('Au moins un bénéficiaire est obligatoire sur le contrat. Vous ne pouvez pas supprimer le seul bénéficiaire.');
        return;
      }
      Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: 'Le bénéficiaire sera supprimé définitivement.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await ApiService.delete(`/contracts/beneficiary/${id}`);
            success('Bénéficiaire supprimé avec succès !');
            loadContractDetails();
          } catch (err: any) {
            console.error('❌ Erreur suppression bénéficiaire:', err);
            error(err?.response?.data?.message || err?.message || 'Erreur lors de la suppression');
          }
        }
      });
    }

    // Insured Member Edit/Delete functions
    function openEditInsuredMemberModal(member: any) {
      editInsuredMemberForm.value = {
        id: member.id,
        lastname: member.lastname,
        firstname: member.firstname,
        birthdate: formatDateForInput(member.birthdate),
        gender: member.gender || 'M'
      };
      showEditInsuredMemberModal.value = true;
    }

    async function submitEditInsuredMember() {
      isSubmittingInsuredMember.value = true;
      try {
        await ApiService.put(`/contracts/insured-member/${editInsuredMemberForm.value.id}`, {
          lastname: editInsuredMemberForm.value.lastname,
          firstname: editInsuredMemberForm.value.firstname,
          birthdate: editInsuredMemberForm.value.birthdate,
          gender: editInsuredMemberForm.value.gender
        });
        success('Membre assuré modifié avec succès !');
        showEditInsuredMemberModal.value = false;
        loadContractDetails();
      } catch (err: any) {
        console.error('❌ Erreur modification membre assuré:', err);
        error(err?.response?.data?.message || err?.message || 'Erreur lors de la modification');
      } finally {
        isSubmittingInsuredMember.value = false;
      }
    }

    function confirmDeleteInsuredMember(id: number) {
      Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: 'Le membre assuré sera supprimé et la prime globale du contrat sera recalculée.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await ApiService.delete(`/contracts/insured-member/${id}`);
            success('Membre assuré supprimé avec succès !');
            loadContractDetails();
          } catch (err: any) {
            console.error('❌ Erreur suppression membre assuré:', err);
            error(err?.response?.data?.message || err?.message || 'Erreur lors de la suppression');
          }
        }
      });
    }

    onMounted(() => {
      loadContractDetails();
      loadUserRole();
      loadNatureCredits();
      loadLiensParente();
    });

    return {
      contratDetails,
      loading,
      errorMessage,
      isGeneratingPDF,
      isExpired,
      isRecent,
      isAdmin,
      isHorsConvention,
      canModify,
      clientFullName,
      clientInitials,
      totalDays,
      daysElapsed,
      daysLeft,
      progressPercentage,
      progressColor,
      loadContractDetails,
      generateContractPDF,
      openEditModal,
      showConversionModal,
      conversionModalRef,
      handleConversionClose,
      handleConversionSuccess,
      formatMontant,
      formatDate,
      formatDateTime,
      
      // History
      contractHistory,
      loadingHistory,
      errorHistory,
      isExportingHistory,
      exportHistoryToPdf,
      getHistoryActionLabel,
      getHistoryActionClass,

      // Admin Edit Modal fields
      showAdminEditModal,
      natureCredits,
      openAdminEditModal,

      // Beneficiary & Insured Member
      showManageBeneficiariesModal,
      isSubmittingBeneficiaries,
      interactiveBeneficiaries,
      interactiveTotalPct,
      openManageBeneficiariesModal,
      addInteractiveBeneficiary,
      removeInteractiveBeneficiary,
      splitEvenlyInteractive,
      allocateRemainingToLast,
      submitInteractiveBeneficiaries,
      confirmDeleteBeneficiary,
      showEditInsuredMemberModal,
      isSubmittingInsuredMember,
      editInsuredMemberForm,
      openEditInsuredMemberModal,
      submitEditInsuredMember,
      confirmDeleteInsuredMember,
      showEditAssureModal,
      showEditCalculModal,
      liensParenteOptions
    };
  }
});
</script>

<style scoped>
:root {
  --accent-color: #10b981;
  --text-dark: #0f172a;
  --text-gray: #64748b;
  --bg-light: #f1f5f9;
  --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.content-fade {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== EXECUTIVE HERO HEADER ===== */
.cotation-header-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.client-avatar-badge {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  font-weight: 800;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  flex-shrink: 0;
}

.ref-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 3px 10px;
  border-radius: 6px;
  letter-spacing: 0.3px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.3px;
}

.status-pill.active {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.status-pill.active .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.status-pill.pending {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}

.status-pill.pending .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
}

.client-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
}

/* Action buttons */
.btn-action-primary {
  background: #10b981;
  color: #ffffff !important;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
  cursor: pointer;
}

.btn-action-primary:hover {
  background: #059669;
  transform: translateY(-1px);
}

.btn-action-pdf {
  background: #0f172a;
  color: #ffffff !important;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
  cursor: pointer;
}

.btn-action-pdf:hover {
  background: #1e293b;
  transform: translateY(-1px);
}

.btn-action-secondary {
  background: #f8fafc;
  color: #334155 !important;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.82rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;
}

.btn-action-secondary:hover {
  background: #f1f5f9;
  color: #0f172a !important;
}

/* Metrics Strip */
.cotation-metrics-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  padding: 16px 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.metric-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
}

.metric-val {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.metric-val .unit {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.text-emerald {
  color: #059669 !important;
}

.highlight-cell {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 8px 16px;
  border-radius: 8px;
}

.metric-divider {
  width: 1px;
  height: 36px;
  background: #e2e8f0;
}

/* ===== CARDS & DETAILS LAYOUT ===== */
.glass-card {
  background: #fff;
  border-radius: 0px;
  box-shadow: none;
  border: none;
  transition: all 0.25s ease;
  overflow: hidden;
}

.glass-card:hover {
  transform: none;
  box-shadow: none;
}

.card-header-modern {
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
}

.card-header-modern i {
  width: 32px;
  height: 32px;
  background: #ecfdf5;
  color: #10b981;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 1rem;
}

.card-header-modern h5 {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Data grid within Fiche */
.data-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px 24px;
}

.data-item {
  display: flex;
  flex-direction: column;
}

.data-grid .span-2 {
  grid-column: span 2;
}

.data-grid .span-full {
  grid-column: 1 / -1;
}

.label-modern {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.value-modern {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.name-highlight {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.product-highlight {
  color: #059669;
  font-weight: 700;
}

.date-highlight {
  color: #10b981;
}

.phone-link {
  color: #2563eb;
}

.border-top-gray {
  border-top: 1px solid #f1f5f9;
}

/* ===== PROGRESS & MILESTONES ===== */
.progress-bar-container {
  background: #f1f5f9;
  border-radius: 0px;
  height: 10px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 0px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.small-label {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
}

.milestone-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0px;
  padding: 14px 10px;
  height: 100%;
  transition: all 0.2s;
}

.milestone-box:hover {
  transform: none;
  background: #fff;
  box-shadow: none;
}

.milestone-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  color: #fff;
  font-size: 0.75rem;
}

.start-box { background: #f0fdf4; border-color: #bbf7d0; }
.start-icon { background: #10b981; }
.mid-box { background: #fffbeb; border-color: #fde68a; }
.mid-icon { background: #f59e0b; }
.end-box { background: #f8fafc; border-color: #e2e8f0; }
.end-icon { background: #64748b; }
.expired-box { background: #fef2f2; border-color: #fecaca; }
.expired-icon { background: #ef4444; }

.milestone-label {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.milestone-val {
  font-size: 0.85rem;
  font-weight: 800;
  color: #1e293b;
}

.start-box .milestone-val { color: #065f46; }
.mid-box .milestone-val { color: #92400e; }
.expired-box .milestone-val { color: #991b1b; }

/* ===== FINANCE WIDGET ===== */
.finance-widget {
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
  color: white;
  border-radius: 0px;
  overflow: hidden;
  box-shadow: none;
}

.finance-hero-total {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
}

.total-label {
  display: block;
  font-size: 0.65rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
  margin-bottom: 6px;
}

.total-amount {
  font-size: 2rem;
  font-weight: 800;
  color: #10b981;
  display: block;
  letter-spacing: -0.5px;
}

.total-currency {
  font-size: 0.65rem;
  color: #475569;
  font-weight: 800;
  letter-spacing: 1px;
}

.finance-items {
  padding: 16px 24px;
}

.finance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 0.82rem;
}

.finance-item:last-child {
  border-bottom: none;
}

.finance-item span {
  color: #94a3b8;
}

.finance-item b {
  color: #e2e8f0;
  font-weight: 600;
}

.finance-meta {
  padding: 14px 24px;
  background: rgba(0, 0, 0, 0.15);
}

.finance-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 6px;
}

.finance-meta-row:last-child {
  margin-bottom: 0;
}

.finance-meta-row b {
  color: #94a3b8;
}

/* ===== TRACE CARD & HISTORY ===== */
.trace-card {
  background: white;
  border-radius: 0px;
  box-shadow: none;
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.trace-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 12px;
}

.trace-header-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #ecfdf5;
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.bg-light-info { background-color: #f0f9ff; }
.text-info { color: #0284c7; }

.trace-header h6 {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #0f172a;
}

.trace-body {
  padding: 14px 20px;
}

.trace-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px solid #f8fafc;
}

.trace-item:last-child {
  border-bottom: none;
}

.trace-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.trace-content {
  display: flex;
  flex-direction: column;
}

.trace-value {
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
}

.audit-footer {
  background: #f8fafc;
  padding: 12px 20px;
  border-top: 1px solid #edf2f7;
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #94a3b8;
}

.audit-footer b {
  color: #64748b;
}

/* History Logs */
.history-body {
  padding: 10px 0;
}

.history-scrollable {
  max-height: 280px;
  overflow-y: auto;
  padding: 0 20px;
}

.history-log-item {
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.history-log-item:last-child {
  border-bottom: none;
}

.history-badge {
  font-size: 9px;
  font-weight: bold;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.history-badge-create { background-color: #d1fae5; color: #065f46; }
.history-badge-update { background-color: #e0f2fe; color: #0369a1; }
.history-badge-delete { background-color: #fee2e2; color: #991b1b; }
.history-badge-default { background-color: #f1f5f9; color: #475569; }

.history-log-date {
  font-size: 0.7rem;
  color: #94a3b8;
}

.history-log-desc {
  font-size: 0.8rem;
  font-weight: 500;
  color: #334155;
  margin-top: 4px;
}

.history-log-user {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 2px;
}

/* Responsive adjustments */
@media (max-width: 991px) {
  .contract-hero {
    padding: 20px;
  }
  
  .hero-divider-line {
    margin: 16px 0;
  }

  .hero-top-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .hero-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .hero-metrics {
    gap: 16px 0;
  }
  
  .hero-metric-item {
    min-width: 50%;
  }
  
  .hero-vdivider {
    display: none;
  }
  
  .data-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 575px) {
  .contract-hero {
    padding: 16px;
  }
  
  .hero-divider-line {
    margin: 12px 0;
  }
  
  .hero-identity {
    gap: 12px;
  }
  
  .avatar-initials {
    width: 50px;
    height: 50px;
    font-size: 1.1rem;
  }
  
  .hero-police-number {
    font-size: 1.25rem;
  }
  
  .hero-police-label {
    font-size: 0.65rem;
  }
  
  .hero-badge-status {
    padding: 2px 10px;
    font-size: 0.6rem;
  }
  
  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }
  
  .hero-actions .hero-btn-primary,
  .hero-actions .hero-btn-outline,
  .hero-actions .hero-btn-danger {
    flex: 1 1 calc(50% - 4px);
    justify-content: center;
    font-size: 0.72rem;
    padding: 8px 10px;
  }
  
  .data-grid {
    grid-template-columns: 1fr;
  }
  
  .data-grid .span-2 {
    grid-column: span 1;
  }
}

/* ===== FIX: Admin Modal select option text visibility ===== */
/* Ensures options are always readable (dark text on white bg) */
select.form-select,
select.form-select option {
  color: #212529 !important;
  background-color: #ffffff !important;
}
</style>
