<template>
  <div class="card mb-25 border-0 rounded-0 bg-white letter-spacing">
    <!-- Header banner -->
    <div class="card-head box-shadow bg-white d-flex flex-column flex-md-row align-items-md-center justify-content-between p-15 p-sm-20 p-md-25 gap-3">
      <div class="d-flex align-items-center">
        <div class="me-15 bg-warning bg-opacity-10 p-3 rounded-circle d-flex align-items-center justify-content-center" style="width: 54px; height: 54px;">
          <i class="flaticon-book text-warning fs-28"></i>
        </div>
        <div>
          <h3 class="mb-0 fw-bold text-dark fs-18 fs-md-22">Guide d'Utilisation Officiel</h3>
          <p class="text-muted small mb-0 mt-1">Plateforme de Simulation Emprunteur &ndash; RENACA-BENIN &amp; L'Africaine Vie</p>
        </div>
      </div>
      <!-- Search Input -->
      <div class="search-box-wrapper">
        <div class="input-group">
          <span class="input-group-text bg-light border-0"><i class="flaticon-search text-muted"></i></span>
          <input 
            type="text" 
            v-model="searchQuery" 
            class="form-control bg-light border-0 fs-13" 
            placeholder="Rechercher une fonctionnalité ou une règle..."
          />
          <button v-if="searchQuery" class="btn btn-light border-0 btn-sm text-muted" @click="searchQuery = ''">
            <i class="flaticon-close"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="card-body p-15 p-sm-20 p-md-25">
      <div class="row g-4">
        <!-- Sidebar Navigation -->
        <div class="col-lg-3">
          <div class="nav flex-column nav-pills guide-nav-pills p-2 bg-light rounded-1 mb-4">
            <button 
              v-for="t in tabs" 
              :key="t.key"
              class="nav-link text-start d-flex align-items-center gap-3 p-12 mb-2 transition border-0 rounded-1"
              :class="{ active: activeTab === t.key }"
              @click="activeTab = t.key"
            >
              <div class="tab-icon-wrapper d-flex align-items-center justify-content-center" :style="{ color: t.color, background: t.color + '15' }">
                <i :class="t.icon + ' fs-20'"></i>
              </div>
              <span class="fw-semibold fs-14">{{ t.label }}</span>
            </button>
          </div>

          <!-- Quick Metrics rules widget -->
          <div class="rules-quick-widget card border-0 rounded-1 bg-light p-3">
            <h6 class="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
              <i class="ph-duotone ph-shield-check text-warning fs-18"></i>
              <span>Règles de Gestion Clés</span>
            </h6>
            <div class="rule-item mb-2 pb-2 border-bottom border-secondary border-opacity-10">
              <span class="d-block text-muted small">Capital maximum garanti</span>
              <strong class="text-dark fs-14">10 000 000 FCFA</strong>
            </div>
            <div class="rule-item mb-2 pb-2 border-bottom border-secondary border-opacity-10">
              <span class="d-block text-muted small">Âge limite de l'assuré (au terme)</span>
              <strong class="text-dark fs-14">70 ans révolus</strong>
            </div>
            <div class="rule-item mb-2 pb-2 border-bottom border-secondary border-opacity-10">
              <span class="d-block text-muted small">Âge minimum à l'adhésion</span>
              <strong class="text-dark fs-14">18 ans</strong>
            </div>
            <div class="rule-item">
              <span class="d-block text-muted small">Périodicités gérées</span>
              <strong class="text-dark fs-12">Mensuelle à Annuelle</strong>
            </div>
          </div>

          <!-- Contact box -->
          <div class="support-box card border-0 rounded-1 mt-3 p-3 text-center text-white" style="background: linear-gradient(135deg, #f1b434 0%, #d89b22 100%);">
            <i class="flaticon-envelope fs-28 mb-2"></i>
            <h6 class="fw-bold text-white mb-1">Besoin d'assistance ?</h6>
            <p class="small text-white opacity-75 mb-0">Contactez la direction technique de L'Africaine Vie ou votre administrateur.</p>
          </div>
        </div>

        <!-- Content Area -->
        <div class="col-lg-9">
          <!-- Search Results Banner -->
          <div v-if="searchQuery" class="alert alert-light border-0 shadow-sm mb-4">
            <span class="fs-14 text-dark">
              Résultats de recherche pour : <strong>"{{ searchQuery }}"</strong> 
              <span class="badge bg-secondary ms-2">{{ filteredFaqs.length + filteredStepsCount }} trouvé(s)</span>
            </span>
          </div>

          <div class="tab-content guide-tab-content p-10">
            <!-- 1. COTATIONS & SIMULATIONS -->
            <div v-if="activeTab === 'cotations'" class="tab-pane fade show active">
              <div class="d-flex align-items-center gap-3 mb-4">
                <div class="bg-indigo-subtle p-2 rounded text-indigo">
                  <i class="flaticon-form fs-32"></i>
                </div>
                <div>
                  <h4 class="fw-bold mb-0 text-dark">Simulations &amp; Cotations</h4>
                  <p class="text-muted small mb-0">Calculez les primes d'assurance emprunteur instantanément</p>
                </div>
              </div>
              
              <div class="feature-intro mb-4">
                <p class="text-muted fs-15">
                  Le module de simulation permet de calculer de manière instantanée les primes d'assurance emprunteur à facturer en fonction de la situation personnelle du prospect et des conditions de son financement. À la validation, il génère une <strong>fiche de cotation officielle en PDF</strong> et offre la possibilité de <strong>convertir la cotation directement en contrat d'assurance</strong>.
                </p>
              </div>

              <!-- Onglets Sub-navigation des 2 Natures de Crédit -->
              <div class="card border-0 shadow-sm mb-4 rounded-2 overflow-hidden">
                <div class="card-header bg-light border-bottom p-2">
                  <div class="nav nav-pills nav-fill gap-2">
                    <button
                      class="nav-link fw-bold fs-14 py-2 border-0 transition rounded-1"
                      :class="selectedNature === 'amortissable' ? 'bg-primary text-white shadow-sm' : 'bg-white text-dark border'"
                      @click="selectedNature = 'amortissable'"
                    >
                      <i class="flaticon-form me-1"></i> 1. Crédit Amortissable
                    </button>
                    <button
                      class="nav-link fw-bold fs-14 py-2 border-0 transition rounded-1"
                      :class="selectedNature === 'const' ? 'bg-success text-white shadow-sm' : 'bg-white text-dark border'"
                      @click="selectedNature = 'const'"
                    >
                      <i class="flaticon-document me-1"></i> 2. Capital Constant (CONST)
                    </button>
                  </div>
                </div>

                <div class="card-body p-3 p-md-4">
                  <!-- 1. CRÉDIT AMORTISSABLE -->
                  <div v-if="selectedNature === 'amortissable'">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                      <h6 class="fw-bold text-dark mb-0 fs-16"><i class="flaticon-check-mark text-primary me-2"></i>Guide &amp; Règles du Crédit Amortissable</h6>
                      <span class="badge bg-primary">Garantie Emprunteur Standard</span>
                    </div>
                    <p class="text-muted fs-14 mb-3">
                      Le Crédit Amortissable est destiné aux financements classiques. Les primes d'assurance couvrent les risques Décès et Invalidité Absolue et Définitive (IAD) sur le capital emprunté.
                    </p>
                    <div class="row g-3 mb-3">
                      <div class="col-md-6">
                        <div class="p-3 border rounded-1 bg-light h-100">
                          <strong class="d-block text-dark mb-1 fs-13"><i class="flaticon-check text-success me-1"></i>Contrôles de Saisie :</strong>
                          <ul class="text-muted fs-12 mb-0 ps-3 lh-base">
                            <li>Capital Maximum Garanti : <strong>10 000 000 FCFA</strong>.</li>
                            <li>Périodicités gérées : Mensuelle, Bimestrielle, Trimestrielle, Semestrielle, Annuelle / Constante.</li>
                            <li>Garantie Complémentaire Perte d'Emploi en option (OUI / NON).</li>
                          </ul>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="p-3 border rounded-1 bg-light h-100">
                          <strong class="d-block text-dark mb-1 fs-13"><i class="flaticon-check text-success me-1"></i>Limites d'Âge &amp; Exigences :</strong>
                          <ul class="text-muted fs-12 mb-0 ps-3 lh-base">
                            <li>Âge minimum d'adhésion : <strong>18 ans</strong>.</li>
                            <li>Âge maximum à l'échéance : <strong>70 ans révolus</strong>.</li>
                            <li>Plus l'assuré est âgé, plus la durée maximale autorisée diminue, afin que le crédit s'achève avant ses 70 ans révolus (formule : <strong>(70 − âge) × 12 mois</strong>, plafonnée à <strong>60 mois</strong>).</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 2. CAPITAL CONSTANT (CONST) -->
                  <div v-if="selectedNature === 'const'">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                      <h6 class="fw-bold text-dark mb-0 fs-16"><i class="flaticon-document text-success me-2"></i>Guide &amp; Règles du Capital Constant</h6>
                      <span class="badge bg-success">Garantie Emprunteur Standard</span>
                    </div>
                    <p class="text-muted fs-14 mb-3">
                      Le Capital Constant est destiné aux financements où le capital assuré reste fixe pendant toute la durée du crédit, contrairement au Crédit Amortissable dont le capital restant dû diminue à chaque échéance. Les primes couvrent les risques Décès pour solde du capital constant.
                    </p>
                    <div class="row g-3 mb-3">
                      <div class="col-md-6">
                        <div class="p-3 border rounded-1 bg-light h-100">
                          <strong class="d-block text-dark mb-1 fs-13"><i class="flaticon-check text-success me-1"></i>Contrôles de Saisie :</strong>
                          <ul class="text-muted fs-12 mb-0 ps-3 lh-base">
                            <li>Capital Maximum Garanti : <strong>20 000 000 FCFA</strong>.</li>
                            <li>Périodicités gérées : Mensuelle, Bimestrielle, Trimestrielle, Semestrielle, Annuelle / Constante.</li>
                            <li>Garantie Complémentaire Perte d'Emploi <strong>non disponible</strong> pour ce produit.</li>
                          </ul>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="p-3 border rounded-1 bg-light h-100">
                          <strong class="d-block text-dark mb-1 fs-13"><i class="flaticon-check text-success me-1"></i>Limites d'Âge &amp; Exigences :</strong>
                          <ul class="text-muted fs-12 mb-0 ps-3 lh-base">
                            <li>Âge minimum d'adhésion : <strong>18 ans</strong>.</li>
                            <li>Âge maximum à l'échéance : <strong>70 ans révolus</strong>.</li>
                            <li>Même formule de durée maximale que le Crédit Amortissable : <strong>(70 − âge) × 12 mois</strong>, plafonnée à <strong>60 mois</strong>.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <p class="small text-muted mb-0"><i class="flaticon-info me-1"></i>Les primes sont calculées automatiquement lors de la simulation, comme pour le Crédit Amortissable — il n'existe pas de grille tarifaire fixe pour ce produit.</p>
                  </div>
                </div>
              </div>

              <div class="guide-steps">
                <div class="guide-step d-flex gap-3 mb-4" v-if="matchesSearch('Création de la Simulation', 'Saisissez les données personnelles du prospect')">
                  <div class="step-number fw-bold">1</div>
                  <div>
                    <h5 class="fw-bold text-dark fs-15">Création et Saisie Initiale</h5>
                    <p class="text-muted small">
                      Cliquez sur <strong>Faire une cotation</strong> dans le menu de gauche. Choisissez d'abord la périodicité de remboursement dans le menu déroulant. Renseignez la date de naissance, le capital désiré et la durée en mois.
                    </p>
                  </div>
                </div>

                <div class="guide-step d-flex gap-3 mb-4" v-if="matchesSearch('Validation de l\'âge', 'L\'âge maximum est de 70 ans révolus à l\'échéance du crédit')">
                  <div class="step-number fw-bold">2</div>
                  <div>
                    <h5 class="fw-bold text-dark fs-15">Validation Automatique de l'Âge</h5>
                    <p class="text-muted small">
                      Le système calcule l'âge à partir de la date de naissance. L'âge d'adhésion minimum est de 18 ans. 
                      <strong>Calcul limite :</strong> L'âge de l'assuré à l'échéance du crédit ne doit pas dépasser <strong>70 ans</strong>. Si cette limite est dépassée, un message d'avertissement s'affiche et bloque la validation. Plus l'assuré est âgé, plus la durée maximale admissible diminue (formule : <strong>(70 − âge) × 12 mois</strong>, plafonnée à <strong>60 mois</strong>).
                    </p>
                  </div>
                </div>

                <div class="guide-step d-flex gap-3 mb-4" v-if="matchesSearch('Calcul et décomposition', 'Prime Décès, Perte d\'Emploi, Surprime, Accessoires')">
                  <div class="step-number fw-bold">3</div>
                  <div>
                    <h5 class="fw-bold text-dark fs-15">Calcul des Primes &amp; Tarification</h5>
                    <p class="text-muted small">
                      En cliquant sur le bouton <strong>Simuler</strong>, le système calcule et décompose les montants dus :
                    </p>
                    <div class="row g-2 mt-1 ps-2">
                      <div class="col-md-4"><span class="badge bg-indigo bg-opacity-10 text-indigo border-indigo-subtle w-100 p-2 text-start"><strong>PD :</strong> Prime Décès</span></div>
                      <div class="col-md-4"><span class="badge bg-indigo bg-opacity-10 text-indigo border-indigo-subtle w-100 p-2 text-start"><strong>SURP :</strong> Surprimes</span></div>
                      <div class="col-md-4"><span class="badge bg-indigo bg-opacity-10 text-indigo border-indigo-subtle w-100 p-2 text-start"><strong>ACC :</strong> Accessoires</span></div>
                      <div class="col-md-4"><span class="badge bg-indigo bg-opacity-10 text-indigo border-indigo-subtle w-100 p-2 text-start"><strong>FM :</strong> Frais Médicaux</span></div>
                      <div class="col-md-8"><span class="badge w-100 p-2 text-start" style="background-color: rgba(241, 180, 52, 0.1); color: #b58315; border: 1px solid rgba(241, 180, 52, 0.2);"><strong>PUTTC :</strong> Prime Unique TTC</span></div>
                    </div>
                  </div>
                </div>

                <div class="guide-step d-flex gap-3 mb-4" v-if="matchesSearch('Export PDF et conversion', 'Générez la fiche et cliquez sur Convertir en contrat')">
                  <div class="step-number fw-bold">4</div>
                  <div>
                    <h5 class="fw-bold text-dark fs-15">Export &amp; Transformation</h5>
                    <p class="text-muted small">
                      Le résultat s'affiche dans une fenêtre modale. Vous pouvez télécharger la <strong>fiche de cotation en format PDF</strong> avec les en-têtes et le logo officiel. Si le prospect valide l'offre, cliquez sur <strong>Convertir en Contrat</strong> pour ouvrir le formulaire d'adhésion finale pré-rempli.
                    </p>
                  </div>
                </div>
              </div>

              <div class="alert alert-info border-0 rounded-1 d-flex gap-3 mt-4">
                <i class="flaticon-info fs-24 text-info"></i>
                <div>
                  <h6 class="fw-bold mb-1 text-dark">Indicateurs de surprime</h6>
                  <p class="mb-0 small text-muted">
                    Les surprimes medicales ou professionnelles saisies lors de la cotation s'ajoutent automatiquement au taux de base. Le recapitulatif detaille chaque element du calcul.
                  </p>
                </div>
              </div>
            </div>

            <!-- 2. GESTION DES CONTRATS -->
            <div v-if="activeTab === 'contrats'" class="tab-pane fade show active">
              <div class="d-flex align-items-center gap-3 mb-4">
                <div class="bg-success-subtle p-2 rounded text-success">
                  <i class="flaticon-file-1 fs-32"></i>
                </div>
                <div>
                  <h4 class="fw-bold mb-0 text-dark">Gestion des Contrats</h4>
                  <p class="text-muted small mb-0">Gerez le cycle de vie complet des contrats et editez les Conditions Particulieres</p>
                </div>
              </div>
              
              <div class="feature-intro mb-4">
                <p class="text-muted fs-15">
                  La gestion des contrats constitue le cœur opérationnel. Un contrat formalise l'adhésion de l'emprunteur aux garanties décès et invalidité. C'est ici que vous complétez les informations juridiques, bancaires et médicales requises avant de valider la mise en vigueur définitive.
                </p>
              </div>

              <!-- Lifecycle badge documentation -->
              <div class="card border-0 bg-light mb-4 rounded-1">
                <div class="card-body p-3">
                  <h6 class="fw-bold text-dark mb-2"><i class="ph-duotone ph-arrows-clockwise text-success me-2"></i>Etapes du Cycle de Vie d'un Contrat :</h6>
                  <div class="d-flex flex-wrap gap-2 mt-2">
                    <span class="badge bg-secondary p-2"><i class="ph ph-pencil-line me-1"></i> SAISI / EN COURS</span>
                    <span class="badge bg-warning text-dark p-2"><i class="ph ph-clock me-1"></i> ATTENTE SIGNATURE</span>
                    <span class="badge bg-success p-2"><i class="ph ph-check-circle me-1"></i> ACTIF / EN VIGUEUR</span>
                    <span class="badge bg-danger p-2"><i class="ph ph-prohibit me-1"></i> RESILIE / SUSPENDU</span>
                    <span class="badge bg-dark p-2"><i class="ph ph-hourglass-high me-1"></i> ECHU / EXPIRE</span>
                  </div>
                </div>
              </div>

              <div class="guide-steps">
                <div class="guide-step d-flex gap-3 mb-4" v-if="matchesSearch('Recherche et filtres', 'Filtrez par agence, par date, par etat')">
                  <div class="step-number fw-bold bg-success-subtle text-success">1</div>
                  <div>
                    <h5 class="fw-bold text-dark fs-15">Recherche &amp; Suivi des Dossiers</h5>
                    <p class="text-muted small">
                      Utilisez la vue <strong>Liste des Contrats</strong> pour suivre vos dossiers. Un moteur de recherche intelligent vous permet de filtrer les dossiers par mot-cle (Nom, Prenom, Reference), par etat de validation, par agence d'origine, ou par tranche de date de creation.
                    </p>
                  </div>
                </div>

                <div class="guide-step d-flex gap-3 mb-4" v-if="matchesSearch('Finalisation du dossier', 'Saisissez la reference du compte, la clause beneficiaire')">
                  <div class="step-number fw-bold bg-success-subtle text-success">2</div>
                  <div>
                    <h5 class="fw-bold text-dark fs-15">Finalisation &amp; Informations Obligatoires</h5>
                    <p class="text-muted small">
                      Pour valider un contrat converti, ouvrez sa fiche detaillee et renseignez les informations suivantes :
                    </p>
                    <ul class="text-muted small ps-3 mb-2">
                      <li><strong>Reference Dossier :</strong> La reference du contrat (generee automatiquement si vous ne la renseignez pas).</li>
                      <li><strong>Date d'effet :</strong> Date de debut de prise d'effet des garanties.</li>
                      <li><strong>Date de 1ere echeance :</strong> Date du premier versement de remboursement.</li>
                      <li><strong>Clause Beneficiaire :</strong> L'Africaine Vie en couverture du solde restant du, puis les ayants droit en cas de surplus.</li>
                    </ul>
                  </div>
                </div>

                <div class="guide-step d-flex gap-3 mb-4" v-if="matchesSearch('Questionnaire medical', 'Validez le questionnaire medical et chargez les documents requis')">
                  <div class="step-number fw-bold bg-success-subtle text-success">3</div>
                  <div>
                    <h5 class="fw-bold text-dark fs-15">Validation Medicale &amp; Signatures</h5>
                    <p class="text-muted small">
                      Le systeme integre un questionnaire medical standardise. Renseignez les reponses declarees par l'assure. Si le questionnaire presente des alertes de sante, le systeme basculera le contrat en attente d'approbation medicale par la hierarchie. Vous pouvez également charger des pieces jointes justificatives.
                    </p>
                  </div>
                </div>

                <div class="guide-step d-flex gap-3 mb-4" v-if="matchesSearch('Edition des Conditions Particulieres', 'Generez les Conditions Particulieres au format PDF')">
                  <div class="step-number fw-bold bg-success-subtle text-success">4</div>
                  <div>
                    <h5 class="fw-bold text-dark fs-15">Generation des Conditions Particulieres</h5>
                    <p class="text-muted small">
                      Une fois le contrat mis en vigueur, vous pouvez editer et telecharger les <strong>Conditions Particulieres</strong> au format PDF. Ce document officiel comprend les informations de l'assure, le detail des garanties et primes, ainsi que les signatures electroniques scannees de L'Africaine Vie et de RENACA-BENIN.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. ETATS DE PRODUCTION & BI -->
            <div v-if="activeTab === 'production'" class="tab-pane fade show active">
              <div class="d-flex align-items-center gap-3 mb-4">
                <div class="bg-warning-subtle p-2 rounded text-warning">
                  <i class="flaticon-bar-chart fs-32"></i>
                </div>
                <div>
                  <h4 class="fw-bold mb-0 text-dark">Etats de Production &amp; Pilotage (BI)</h4>
                  <p class="text-muted small mb-0">Consolidez vos chiffres, telechargez les etats periodiques et analysez l'activite</p>
                </div>
              </div>

              <div class="feature-intro mb-4">
                <p class="text-muted fs-15">
                  Ce module rassemble les outils d'audit, de reporting et de business intelligence (BI). Il permet aux responsables d'agences et a la direction generale de suivre les indicateurs cles de performance (KPI) et d'exporter des rapports officiels extrêmement detailles.
                </p>
              </div>

              <!-- Metrics cards display -->
              <div class="row g-3 mb-4">
                <div class="col-md-6 col-lg-4">
                  <div class="card border-0 bg-light p-3 rounded-1">
                    <div class="d-flex align-items-center gap-3">
                      <div class="bg-warning bg-opacity-10 p-2 rounded text-warning">
                        <i class="ph ph-file-pdf fs-24"></i>
                      </div>
                      <div>
                        <span class="d-block text-muted small">Rapports PDF</span>
                        <span class="fw-bold text-dark fs-13">Mise en page officielle imprimable</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 col-lg-4">
                  <div class="card border-0 bg-light p-3 rounded-1">
                    <div class="d-flex align-items-center gap-3">
                      <div class="bg-warning bg-opacity-10 p-2 rounded text-warning">
                        <i class="ph ph-file-xls fs-24"></i>
                      </div>
                      <div>
                        <span class="d-block text-muted small">Classeurs Excel</span>
                        <span class="fw-bold text-dark fs-13">Onglets recapitulatifs &amp; listes</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 col-lg-4">
                  <div class="card border-0 bg-light p-3 rounded-1">
                    <div class="d-flex align-items-center gap-3">
                      <div class="bg-warning bg-opacity-10 p-2 rounded text-warning">
                        <i class="ph ph-lock fs-24"></i>
                      </div>
                      <div>
                        <span class="d-block text-muted small">Acces Securise BI</span>
                        <span class="fw-bold text-dark fs-13">Profils autorises uniquement</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="guide-steps">
                <div class="guide-step d-flex gap-3 mb-4" v-if="matchesSearch('Filtres d\'extraction', 'Selectionnez la periode du/au et l\'agence')">
                  <div class="step-number fw-bold bg-warning-subtle text-warning">1</div>
                  <div>
                    <h5 class="fw-bold text-dark fs-15">Filtres d'Extraction Periodique</h5>
                    <p class="text-muted small">
                      Accedez au menu <strong>Gestion des etats de production</strong>. Renseignez la periode d'extraction (date de debut et date de fin). Cliquez sur <strong>Rechercher</strong> pour obtenir la previsualisation immediate à l'ecran.
                    </p>
                  </div>
                </div>

                <div class="guide-step d-flex gap-3 mb-4" v-if="matchesSearch('Telechargement PDF et Excel', 'Exportez les rapports complets en format Excel ou PDF')">
                  <div class="step-number fw-bold bg-warning-subtle text-warning">2</div>
                  <div>
                    <h5 class="fw-bold text-dark fs-15">Telechargement des Rapports de Production</h5>
                    <p class="text-muted small">
                      Deux formats d'exportation professionnels sont disponibles :
                    </p>
                    <ul class="text-muted small ps-3 mb-2">
                      <li><strong>Export PDF :</strong> Genere un document structure et formate prêt a l'impression, comprenant les entetes institutionnelles et les totaux consolides.</li>
                      <li><strong>Export Excel :</strong> Genere un document Excel moderne avec des donnees formates. Il contient des onglets recapitulatifs graphiques et les listes brutes des contrats.</li>
                    </ul>
                  </div>
                </div>

                <div class="guide-step d-flex gap-3 mb-4" v-if="matchesSearch('Tableau de Bord BI', 'Vue d\'ensemble, Analyse Clients, Analyse Commerciale')">
                  <div class="step-number fw-bold bg-warning-subtle text-warning">3</div>
                  <div>
                    <h5 class="fw-bold text-dark fs-15">Tableau de Bord Decisionnel (BI)</h5>
                    <p class="text-muted small">
                      Le menu <strong>Analyse &amp; Pilotage</strong> regroupe trois volets d'analyse de l'activite (reserves par defaut aux profils habilites) :
                    </p>
                    <ul class="text-muted small ps-3 mb-2">
                      <li><strong>Vue d'Ensemble :</strong> KPIs generaux (Volume de contrats, total des primes percues, capital moyen) et graphique de progression mensuelle.</li>
                      <li><strong>Analyse Clients :</strong> Segmentation demographique du portefeuille clients : repartition par Genre (Sexe), par Tranche d'Âge, par Tranche de Capital Garanti et par Profession.</li>
                      <li><strong>Analyse Commerciale :</strong> Suivi des performances des agences (classement par volume), performances des conseillers et indicateur du taux de transformation des simulations en contrats fermes.</li>
                    </ul>
                  </div>
                </div>

                <div class="guide-step d-flex gap-3 mb-4" v-if="matchesSearch('Exports decisionnels enrichis', 'Boutons PDF et Excel sur les pages BI')">
                  <div class="step-number fw-bold bg-warning-subtle text-warning">4</div>
                  <div>
                    <h5 class="fw-bold text-dark fs-15">Exports de Pilotage Decisionnel</h5>
                    <p class="text-muted small">
                      Chacune des trois vues decisionnelles (Vue d'ensemble, Analyse Clients, Analyse Commerciale) integre des boutons d'export <strong>Excel</strong> et <strong>PDF</strong> dedies. Les fichiers exportes incluent des tableaux de statistiques formates aux couleurs de la charte de RENACA-BENIN.
                    </p>
                  </div>
                </div>
              </div>

              <div class="alert alert-warning border-0 rounded-1 d-flex gap-3 mt-4">
                <i class="flaticon-idea fs-24 text-warning"></i>
                <div>
                  <h6 class="fw-bold mb-1 text-dark">Insights Automatises</h6>
                  <p class="mb-0 small text-muted">
                    Pour faciliter le pilotage, le systeme genere en bas des tableaux de bord des insights automatiques (ex: alertes d'inactivite de certaines agences, alertes sur l'evolution mensuelle de la production).
                  </p>
                </div>
              </div>
            </div>

            <!-- 4. FAQ & troubleshooting (Real-time Filtered) -->
            <div v-if="activeTab === 'faq'" class="tab-pane fade show active">
              <div class="d-flex align-items-center gap-3 mb-4">
                <div class="bg-warning bg-opacity-10 p-2 rounded text-warning">
                  <i class="flaticon-info fs-32"></i>
                </div>
                <div>
                  <h4 class="fw-bold mb-0 text-dark">Foire Aux Questions (FAQ)</h4>
                  <p class="text-muted small mb-0">Trouvez rapidement des réponses aux questions et problèmes courants</p>
                </div>
              </div>

              <div v-if="filteredFaqs.length === 0" class="text-center py-5">
                <i class="flaticon-search fs-48 text-muted mb-2"></i>
                <h6 class="fw-bold text-muted">Aucun résultat trouvé pour votre recherche.</h6>
                <p class="text-muted small">Essayez avec d'autres mots-clés comme "âge", "capital", "pdf" ou "excel".</p>
              </div>

              <div class="faq-list" v-else>
                <div 
                  v-for="(faq, idx) in filteredFaqs" 
                  :key="idx" 
                  class="faq-item border rounded-1 p-3 mb-3 transition"
                  :class="faq.open ? 'bg-light border-warning-custom' : 'bg-white'"
                >
                  <div 
                    class="faq-question d-flex justify-content-between align-items-center cursor-pointer" 
                    @click="toggleFaq(faq)"
                  >
                    <h6 class="fw-bold mb-0 fs-14" :class="faq.open ? 'text-warning' : 'text-dark'">
                      <span class="badge bg-secondary-subtle text-secondary me-2 fs-10">{{ faq.category }}</span>
                      {{ faq.question }}
                    </h6>
                    <i class="flaticon fs-14" :class="faq.open ? 'flaticon-up-arrow text-warning' : 'flaticon-down-arrow text-muted'"></i>
                  </div>
                  <div v-if="faq.open" class="faq-answer mt-3 pt-3 border-top border-secondary border-opacity-10 text-muted fs-13 lh-base">
                    <span v-html="faq.answer"></span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
  open: boolean;
}

export default defineComponent({
  name: 'UserGuide',
  setup() {
    const activeTab = ref('cotations');
    const selectedNature = ref('amortissable');
    const searchQuery = ref('');

    const tabs = [
      { key: 'cotations', label: 'Simulations & Cotations', icon: 'flaticon-form', color: '#6366f1' },
      { key: 'contrats', label: 'Gestion des Contrats', icon: 'flaticon-file-1', color: '#10b981' },
      { key: 'production', label: 'États de Production & BI', icon: 'flaticon-bar-chart', color: '#f59e0b' },
      { key: 'faq', label: 'Questions Fréquentes (FAQ)', icon: 'flaticon-info', color: '#f1b434' },
    ];

    const faqs = ref<FaqItem[]>([
      {
        question: "Pourquoi le bouton 'Simuler' reste-t-il grisé ou désactivé ?",
        answer: "Le bouton s'active uniquement si tous les champs obligatoires sont valides et si les règles d'âge sont respectées. Vérifiez que : <ul><li>Le capital saisi est compris entre 1 et 10 000 000 FCFA.</li><li>La durée est saisie et inférieure ou égale à 60 mois (max 12 mois pour les clients de 65 à 70 ans).</li><li>L'âge du client au terme du contrat (Âge actuel + Durée en années) ne dépasse pas 70 ans. Si c'est le cas, réduisez la durée ou ajustez la date de naissance.</li></ul>",
        category: "Simulations",
        open: false
      },
      {
        question: "Comment puis-je modifier un contrat qui a déjà été validé ?",
        answer: "Par mesure de sécurité financière et de conformité, un contrat ayant le statut <strong>ACTIF / EN VIGUEUR</strong> ne peut plus être modifié directement par un conseiller de clientèle. Si une correction est nécessaire (erreur sur le nom, le montant, etc.), vous devez contacter un administrateur habilité pour modifier ou passer le contrat en statut saisi/correctif.",
        category: "Contrats",
        open: false
      },
      {
        question: "Qui a accès au menu d'Analyse & Pilotage (BI) ?",
        answer: "Le menu <strong>Analyse &amp; Pilotage</strong> contient des graphiques stratégiques et financiers. Tous les rôles d'utilisateurs (ADMIN, MANAGER et USER) ont accès à ce menu et à ses fonctionnalités sur leur tableau de bord.",
        category: "Sécurité",
        open: false
      },
      {
        question: "Pourquoi le format PDF téléchargé ne s'ouvre pas ou apparaît blanc ?",
        answer: "Les fichiers PDF sont générés côté serveur. Si le téléchargement échoue ou affiche un document vide, cela peut provenir d'un dysfonctionnement temporaire du serveur de rendu de L'Africaine Vie ou d'une indisponibilité du réseau. Réessayez après quelques instants. Si le problème persiste, signalez-le au service technique.",
        category: "Technique",
        open: false
      },
      {
        question: "Quelle est la différence entre l'export PDF et l'export Excel de production ?",
        answer: "L'export <strong>PDF</strong> génère un rapport officiel, synthétique et figé contenant les totaux réglementaires signés par l'agence. L'export <strong>Excel</strong> fournit un classeur complet et modifiable structuré en plusieurs feuilles (chiffres clés, statistiques par agence et liste exhaustive des contrats), idéal pour effectuer des tris ou des calculs personnalisés dans votre tableur.",
        category: "États de Production",
        open: false
      },
      {
        question: "Quelle est l'utilité de la garantie complémentaire ?",
        answer: "Conformément à la convention d'assurance, la garantie complémentaire est facultative et s'applique aux contrats en option (OUI / NON). Elle permet de couvrir des risques supplémentaires et s'ajoute à la prime de base.",
        category: "Règles Métier",
        open: false
      },
      {
        question: "Quelles sont les spécificités d'un contrat PADME PROTECTION (CP) ?",
        answer: "Le contrat <strong>PADME PROTECTION (CP)</strong> est rattaché à un compte d'épargne ou emprunteur. Il exige la saisie du <strong>N° de Compte bancaire</strong> et le choix de l'option de <strong>Renouvellement Automatique</strong>. Lors de l'édition du PDF, le système applique un modèle officiel dédié CP.",
        category: "Natures de Crédit",
        open: false
      },
      {
        question: "Comment fonctionne la souscription Obsèques Alafia (OBA) ?",
        answer: "Le produit <strong>Obsèques Alafia (OBA)</strong> permet de désigner et couvrir plusieurs membres de la famille de l'assuré principal : le <strong>Conjoint(e)</strong> et jusqu'à <strong>4 Ascendants</strong> (parents/beaux-parents). Pour chaque membre inclus, vous définissez les informations d'état civil et le capital garanti. Le système calcule la prime individuelle pour chaque bénéficiaire et additionne le tout dans la <strong>Prime Unique TTC (PUTTC)</strong> globale.",
        category: "Natures de Crédit",
        open: false
      }
    ]);

    // Helpers to support search query filter
    const matchesSearch = (title: string, content: string) => {
      if (!searchQuery.value) return true;
      const query = searchQuery.value.toLowerCase();
      return title.toLowerCase().includes(query) || content.toLowerCase().includes(query);
    };

    const toggleFaq = (faq: FaqItem) => {
      faq.open = !faq.open;
    };

    const filteredFaqs = computed(() => {
      if (!searchQuery.value) return faqs.value;
      const query = searchQuery.value.toLowerCase();
      return faqs.value.filter(f => 
        f.question.toLowerCase().includes(query) || 
        f.answer.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query)
      );
    });

    const filteredStepsCount = computed(() => {
      if (!searchQuery.value) return 0;
      let count = 0;
      // Tab 1 simulations
      if (matchesSearch('Création de la Simulation', 'Saisissez les données personnelles du prospect')) count++;
      if (matchesSearch('Validation de l\'âge', 'L\'âge maximum est de 70 ans révolus à l\'échéance du crédit')) count++;
      if (matchesSearch('Calcul et décomposition', 'Prime Décès, Perte d\'Emploi, Surprime, Accessoires')) count++;
      if (matchesSearch('Export PDF et conversion', 'Générez la fiche et cliquez sur Convertir en contrat')) count++;
      
      // Tab 2 contrats
      if (matchesSearch('Recherche et filtres', 'Filtrez par agence, par date, par etat')) count++;
      if (matchesSearch('Finalisation du dossier', 'Saisissez la reference du compte, la clause beneficiaire')) count++;
      if (matchesSearch('Questionnaire medical', 'Validez le questionnaire medical et chargez les documents requis')) count++;
      if (matchesSearch('Édition des Conditions Particulières', 'Genez les Conditions Particulieres CP au format PDF')) count++;

      // Tab 3 production
      if (matchesSearch('Filtres d\'extraction', 'Selectionnez la periode du/au et l\'agence')) count++;
      if (matchesSearch('Téléchargement PDF et Excel', 'Exportez les rapports complets en format Excel ou PDF')) count++;
      if (matchesSearch('Tableau de Bord BI', 'Vue d\'ensemble, Analyse Clients, Analyse Commerciale')) count++;
      if (matchesSearch('Exports décisionnels enrichis', 'Boutons PDF et Excel sur les pages BI')) count++;

      return count;
    });

    return {
      activeTab,
      selectedNature,
      searchQuery,
      tabs,
      faqs,
      toggleFaq,
      filteredFaqs,
      filteredStepsCount,
      matchesSearch
    };
  }
});
</script>

<style scoped>
.letter-spacing {
  letter-spacing: 0.5px;
}
.box-shadow {
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
}
.cursor-pointer {
  cursor: pointer;
}
.transition {
  transition: all 0.25s ease-in-out;
}
.bg-indigo-subtle {
  background-color: #e0e7ff;
}
.text-indigo {
  color: #4f46e5;
}
.border-indigo-subtle {
  border-color: #c7d2fe !important;
}

/* Sidebar navigation */
.guide-nav-pills .nav-link {
  background: transparent;
  color: #475569;
  border-radius: 4px;
}
.guide-nav-pills .nav-link.active {
  background: #ffffff !important;
  color: #f1b434 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.tab-icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.guide-nav-pills .nav-link.active .tab-icon-wrapper {
  background: #f1b43415 !important;
  color: #f1b434 !important;
}

.p-12 {
  padding: 12px;
}
.fs-28 { font-size: 28px; }
.fs-20 { font-size: 20px; }
.fs-32 { font-size: 32px; }
.fs-13 { font-size: 13px !important; }
.fs-14 { font-size: 14px !important; }
.fs-15 { font-size: 15px !important; }
.fs-10 { font-size: 10px !important; }

/* Steps timeline */
.guide-steps {
  position: relative;
  padding-left: 20px;
  margin-top: 25px;
}
.guide-steps::before {
  content: '';
  position: absolute;
  left: 31px;
  top: 15px;
  bottom: 15px;
  width: 2px;
  background: #e2e8f0;
  z-index: 1;
}
.guide-step {
  position: relative;
  z-index: 2;
}
.step-number {
  min-width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  z-index: 3;
}
.guide-step .step-number.bg-success-subtle {
  background-color: #d1fae5 !important;
  color: #059669 !important;
}
.guide-step .step-number.bg-warning-subtle {
  background-color: #fef3c7 !important;
  color: #d97706 !important;
}

.alert {
  padding: 15px;
}

.search-box-wrapper {
  min-width: 280px;
}

/* FAQ items */
.faq-item {
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}
.faq-item:hover {
  border-color: #f1b434;
  box-shadow: 0 4px 10px rgba(241, 180, 52, 0.08);
}
.faq-item.border-warning-custom {
  border-color: #f1b434 !important;
}
.faq-question {
  user-select: none;
}

/* Quick widgets */
.rules-quick-widget {
  border: 1px solid #e2e8f0;
}
.rule-item span {
  font-weight: 500;
}
</style>
