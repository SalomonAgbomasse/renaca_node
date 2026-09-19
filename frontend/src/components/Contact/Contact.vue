<template>
  <div class="card mb-25 border-0 rounded-0 bg-white">
    <div class="card-body p-15 p-sm-20 p-md-25 p-lg-30 letter-spacing">

      <!-- Navigation par onglets -->
      <ul class="nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-6 mb-4">
        <li class="nav-item">
          <a class="nav-link text-active-primary pb-4" :class="{ active: activeTab === 'infos' }"
            @click="activeTab = 'infos'" style="cursor:pointer;">
            <i class="flaticon-info me-2"></i>Informations de contact
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link text-active-primary pb-4" :class="{ active: activeTab === 'formulaire' }"
            @click="activeTab = 'formulaire'" style="cursor:pointer;">
            <i class="flaticon-envelope me-2"></i>Signaler un problème
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link text-active-primary pb-4" :class="{ active: activeTab === 'tickets' }"
            @click="onTicketsTab" style="cursor:pointer;">
            <i class="flaticon-list me-2"></i>
            Gestion des Tickets
            <span v-if="nbOpenTickets > 0" class="badge bg-danger ms-1">{{ nbOpenTickets }}</span>
          </a>
        </li>
      </ul>

      <!-- ══ Onglet Informations ══ -->
      <div v-if="activeTab === 'infos'" class="tab-content">
        <div class="row g-4">

          <div class="col-xl-4 col-md-6">
            <div class="info-panel h-100">
              <div class="info-panel-title">
                <div class="info-panel-icon green"><i class="flaticon-buildings"></i></div>
                <div>
                  <h6 class="info-panel-heading">Coordonnées générales</h6>
                  <p class="info-panel-sub">L'Africaine Vie Bénin</p>
                </div>
              </div>
              <ul class="info-list">
                <li class="info-list-item">
                  <div class="info-list-icon-wrap green"><i class="flaticon-location"></i></div>
                  <div>
                    <span class="info-list-label">Adresse</span>
                    <span class="info-list-val">Cotonou Cadjèhou, Bénin<br>Lot 19 Patte d'Oie – 01 BP 2040<br>En face des tours administratives</span>
                  </div>
                </li>
                <li class="info-list-item">
                  <div class="info-list-icon-wrap green"><i class="flaticon-telephone"></i></div>
                  <div>
                    <span class="info-list-label">Téléphone</span>
                    <span class="info-list-val">
                      <a href="tel:+22921303993" class="coord-link">+229 21 30 39 93</a><br>
                      <a href="tel:+22921300291" class="coord-link">+229 21 30 02 91</a><br>
                      <a href="tel:+22996994351" class="coord-link">+229 96 99 43 51</a>
                    </span>
                  </div>
                </li>
                <li class="info-list-item">
                  <div class="info-list-icon-wrap green"><i class="flaticon-envelope"></i></div>
                  <div>
                    <span class="info-list-label">Email</span>
                    <span class="info-list-val">
                      <a href="mailto:africainevie@lafricaineviebenin.com" class="coord-link">africainevie@lafricaineviebenin.com</a>
                    </span>
                  </div>
                </li>
                <li class="info-list-item" style="border-bottom:none;padding-bottom:0;margin-bottom:0;">
                  <div class="info-list-icon-wrap green"><i class="flaticon-clock"></i></div>
                  <div>
                    <span class="info-list-label">Heures d'ouverture</span>
                    <span class="info-list-val">Lun – Ven : 8h00 – 17h30</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div class="col-xl-4 col-md-6">
            <div class="info-panel h-100">
              <div class="info-panel-title">
                <div class="info-panel-icon yellow"><i class="flaticon-team"></i></div>
                <div>
                  <h6 class="info-panel-heading">Contacts directs</h6>
                  <p class="info-panel-sub">Personnes à contacter</p>
                </div>
              </div>
              <div class="person-card">
                <div class="person-avatar green">IT</div>
                <div class="person-info">
                  <p class="person-name">Service Informatique</p>
                  <div class="person-line"><i class="flaticon-telephone"></i><a href="tel:+2290158954286" class="person-link">+229 01 58 95 42 86</a></div>
                  <div class="person-line"><i class="flaticon-envelope"></i><a href="mailto:sagbomasse@lafricaineviebenin.com" class="person-link">sagbomasse@lafricaineviebenin.com</a></div>
                  <div class="person-line"><i class="flaticon-telephone"></i><a href="tel:+2290196331767" class="person-link">+229 01 96 33 17 67</a></div>
                  <div class="person-line"><i class="flaticon-envelope"></i><a href="mailto:ggouclouno@lafricaineviebenin.com" class="person-link">ggouclouno@lafricaineviebenin.com</a></div>
                </div>
              </div>
              <div class="person-card">
                <div class="person-avatar yellow">BA</div>
                <div class="person-info">
                  <p class="person-name">Service Bancassurance</p>
                  <div class="person-line"><i class="flaticon-telephone"></i><a href="tel:+2290196994328" class="person-link">+229 01 96 99 43 28</a></div>
                  <div class="person-line"><i class="flaticon-envelope"></i><a href="mailto:cadeossi@lafricaineviebenin.com" class="person-link">cadeossi@lafricaineviebenin.com</a></div>
                </div>
              </div>
              <div class="person-card" style="margin-bottom:0;">
                <div class="person-avatar dark">PR</div>
                <div class="person-info">
                  <p class="person-name">Service Production</p>
                  <div class="person-line"><i class="flaticon-telephone"></i><a href="tel:+2290195120982" class="person-link">+229 01 95 12 09 82</a></div>
                  <div class="person-line"><i class="flaticon-envelope"></i><a href="mailto:ladanmahamba@lafricaineviebenin.com" class="person-link">ladanmahamba@lafricaineviebenin.com</a></div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-4 col-md-12">
            <div class="info-panel h-100">
              <div class="info-panel-title">
                <div class="info-panel-icon green"><i class="flaticon-user-1"></i></div>
                <div>
                  <h6 class="info-panel-heading">Vos informations</h6>
                  <p class="info-panel-sub">Compte connecté</p>
                </div>
              </div>
              <div v-if="authStore.user">
                <div class="my-profile-header">
                  <div class="my-profile-avatar">
                    {{ (authStore.user.firstname || '?')[0].toUpperCase() }}{{ (authStore.user.lastname || '')[0]?.toUpperCase() || '' }}
                  </div>
                  <div>
                    <p class="my-profile-name">{{ authStore.user.firstname }} {{ authStore.user.lastname }}</p>
                    <span class="my-profile-badge"><i class="flaticon-check-circle me-1" style="font-size:.75rem;vertical-align:middle;"></i>En ligne</span>
                  </div>
                </div>
                <ul class="info-list">
                  <li class="info-list-item" v-if="authStore.user.email">
                    <div class="info-list-icon-wrap green"><i class="flaticon-envelope"></i></div>
                    <div><span class="info-list-label">Email</span><span class="info-list-val">{{ authStore.user.email }}</span></div>
                  </li>
                  <li class="info-list-item" v-if="authStore.user.phone">
                    <div class="info-list-icon-wrap green"><i class="flaticon-telephone"></i></div>
                    <div><span class="info-list-label">Téléphone</span><span class="info-list-val">{{ authStore.user.phone }}</span></div>
                  </li>
                  <li class="info-list-item" v-if="(authStore.user as any).fonction" style="border-bottom:none;padding-bottom:0;margin-bottom:0;">
                    <div class="info-list-icon-wrap green"><i class="flaticon-briefcase"></i></div>
                    <div><span class="info-list-label">Fonction</span><span class="info-list-val">{{ (authStore.user as any).fonction }}</span></div>
                  </li>
                </ul>
              </div>
              <p v-else class="text-muted mt-3" style="font-size:.85rem;">Non connecté</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ Onglet Formulaire ══ -->
      <div v-if="activeTab === 'formulaire'" class="tab-content">
        <div class="row mb-4">
          <div class="col-12">
            <p class="text-muted">Remplissez le formulaire ci-dessous pour signaler un problème. Tous les administrateurs seront notifiés.</p>
          </div>
        </div>
        <Form ref="contactForm" @submit="submitTicket" :validation-schema="ticketSchema" :initial-values="initialValues">
          <div class="row">
            <div class="col-md-6">
              <div class="form-group mb-15 mb-sm-20 mb-md-25">
                <label class="d-block text-black fw-semibold mb-10">Sujet <span class="text-danger">*</span></label>
                <Field name="sujet" v-slot="{ field }">
                  <input v-bind="field" type="text" class="form-control shadow-none fs-md-15 text-black" placeholder="Résumé du problème" />
                </Field>
                <ErrorMessage name="sujet" class="text-danger" />
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group mb-15 mb-sm-20 mb-md-25">
                <label class="d-block text-black fw-semibold mb-10">Priorité</label>
                <Field name="priority" v-slot="{ field }">
                  <select v-bind="field" class="form-control shadow-none fs-md-15 text-black">
                    <option selected value="">----- Sélectionner la priorité -----</option>
                    <option value="NORMALE">Normale</option>
                    <option value="BASSE">Basse</option>
                    <option value="HAUTE">Haute</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </Field>
                <ErrorMessage name="priority" class="text-danger" />
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-12">
              <div class="form-group mb-15 mb-sm-20 mb-md-25">
                <label class="d-block text-black fw-semibold mb-10">Description <span class="text-danger">*</span></label>
                <Field name="description" v-slot="{ field }">
                  <textarea v-bind="field" rows="5" class="form-control shadow-none fs-md-15 text-black" placeholder="Décrivez le problème en détail..."></textarea>
                </Field>
                <ErrorMessage name="description" class="text-danger" />
              </div>
            </div>
          </div>
          <div class="row mb-4">
            <div class="col-12">
              <div class="form-group mb-15 mb-sm-20 mb-md-25">
                <label class="d-block text-black fw-semibold mb-10">Joindre des fichiers (optionnel)</label>
                <input type="file" ref="fileInput" @change="handleFileChange" accept=".jpg,.jpeg,.png,.gif,.pdf" multiple class="form-control shadow-none fs-md-15 text-black" />
                <small class="text-muted">Formats acceptés : JPG, PNG, GIF, PDF (Max 10MB par fichier, max 10 fichiers)</small>
                <div v-if="selectedFiles.length > 0" class="mt-3">
                  <div v-for="(file, index) in selectedFiles" :key="index" class="d-flex align-items-center justify-content-between mb-2 p-2 bg-light rounded">
                    <div class="d-flex align-items-center">
                      <i class="flaticon-file-1 me-2 text-muted"></i>
                      <span class="text-black">{{ file.name }}</span>
                      <small class="text-muted ms-2">({{ formatFileSize(file.size) }})</small>
                    </div>
                    <button type="button" @click="removeFile(index)" class="btn btn-sm btn-outline-danger d-flex align-items-center gap-1">
                      <i class="flaticon-close"></i><span class="d-none d-sm-inline">Retirer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-12">
              <div class="form-group mb-0">
                <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                  <span v-else><i class="flaticon-envelope me-2"></i></span>
                  {{ isSubmitting ? 'Envoi en cours...' : 'Envoyer le ticket' }}
                </button>
                <button type="button" @click="resetForm" class="btn btn-secondary ms-2">
                  <i class="flaticon-refresh me-2"></i>Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </Form>
      </div>

      <!-- ══ Onglet Gestion des Tickets ══ -->
      <div v-if="activeTab === 'tickets'" class="tab-content">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h5 class="fw-bold text-dark mb-0 fs-16">
            <i class="flaticon-list text-primary me-2"></i>Gestion des Tickets de Support
          </h5>
          <div class="d-flex align-items-center gap-2">
            <input type="text" v-model="searchTerm" class="form-control form-control-sm shadow-none" placeholder="Rechercher..." style="width:220px;" />
            <button class="btn btn-sm btn-outline-primary" @click="loadTickets" title="Actualiser">
              <i class="flaticon-refresh"></i>
            </button>
          </div>
        </div>

        <div v-if="ticketsLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div>
        </div>

        <div v-else class="table-responsive">
          <table class="table text-nowrap align-middle mb-0">
            <thead>
              <tr>
                <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Sujet</th>
                <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3 d-none d-md-table-cell">Créé par</th>
                <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Statut</th>
                <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3 d-none d-lg-table-cell">Priorité</th>
                <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3 d-none d-md-table-cell">Contact</th>
                <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3 d-none d-lg-table-cell">Date création</th>
                <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3 d-none d-md-table-cell">Fichiers</th>
                <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredTickets.length === 0">
                <td colspan="8" class="text-center text-muted py-4">Aucun ticket trouvé</td>
              </tr>
              <tr v-for="(ticket, index) in filteredTickets" :key="`ticket-${ticket.id || index}`">
                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <div class="text-truncate" style="max-width:200px;" :title="ticket.sujet"><strong>{{ ticket.sujet }}</strong></div>
                  <small class="text-muted d-block mt-1" style="max-width:200px;">{{ truncateText(ticket.description, 50) }}</small>
                </td>
                <td class="shadow-none lh-1 fw-medium text-black-emphasis d-none d-md-table-cell">
                  <div v-if="ticket.user">
                    <strong>{{ ticket.user.firstname }} {{ ticket.user.lastname }}</strong><br>
                    <small class="text-muted">{{ ticket.user.email }}</small>
                  </div>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                  <span :class="getStatusClass(ticket.status)" class="badge">{{ getStatusText(ticket.status) }}</span>
                </td>
                <td class="shadow-none lh-1 fw-medium text-black-emphasis d-none d-lg-table-cell">
                  <span :class="getPriorityClass(ticket.priority)" class="badge">{{ getPriorityText(ticket.priority) }}</span>
                </td>
                <td class="shadow-none lh-1 fw-medium text-black-emphasis d-none d-md-table-cell">
                  <div v-if="ticket.email || ticket.telephone">
                    <div v-if="ticket.email" class="mb-1"><i class="flaticon-envelope me-1"></i><small>{{ ticket.email }}</small></div>
                    <div v-if="ticket.telephone"><i class="flaticon-telephone me-1"></i><small>{{ ticket.telephone }}</small></div>
                  </div>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="shadow-none lh-1 fw-medium text-black-emphasis d-none d-lg-table-cell">{{ formatDate(ticket.createdAt) }}</td>
                <td class="shadow-none lh-1 fw-medium text-black-emphasis d-none d-md-table-cell">
                  <div v-if="ticket.fichiers && parseFiles(ticket.fichiers).length > 0" class="d-flex flex-wrap gap-1">
                    <button v-for="(file, fi) in parseFiles(ticket.fichiers)" :key="fi" type="button"
                      class="btn btn-sm btn-outline-primary p-1" :title="getFileName(file)"
                      style="min-width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;"
                      @click="openFileViewer(file)">
                      <i class="flaticon-file-1" style="font-size:0.75rem;"></i>
                    </button>
                  </div>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="shadow-none lh-1 fw-medium">
                  <div class="action-buttons-group">
                    <button type="button" class="btn-action btn-action-view" @click="voirDetails(ticket)" title="Voir détails"><i class="flaticon-eye"></i></button>
                    <button v-if="ticket.status !== 'FERME'" type="button" class="btn-action btn-action-edit" @click="openEditModal(ticket)" title="Modifier"><i class="flaticon-edit"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>

  <!-- Modal détails ticket -->
  <Teleport to="body">
    <template v-if="showDetailsModal">
      <div class="mtk-backdrop" @click.self="closeDetailsModal">
        <div class="mtk-modal" role="dialog" aria-modal="true">
          <header class="mtk-header">
            <div class="mtk-title">
              <span class="mtk-chip">Ticket #{{ selectedTicket?.id }}</span>
              <h5>Détails du ticket</h5>
            </div>
            <button type="button" class="btn-close" @click="closeDetailsModal" aria-label="Fermer"></button>
          </header>
          <section v-if="selectedTicket" class="mtk-body">
            <div class="row g-3 mb-3">
              <div class="col-lg-7">
                <p class="mtk-label">Sujet</p>
                <p class="mtk-value">{{ selectedTicket.sujet }}</p>
                <p class="mtk-label mt-3 mb-1">Description</p>
                <p class="mtk-desc">{{ selectedTicket.description }}</p>
                <div class="mtk-section" v-if="selectedTicket.reponse">
                  <p class="mtk-label mb-1">Réponse de l'équipe</p>
                  <p class="mtk-desc">{{ selectedTicket.reponse }}</p>
                  <p class="mtk-meta" v-if="selectedTicket.reponduParUser">
                    Répondu par <strong>{{ selectedTicket.reponduParUser.firstname }} {{ selectedTicket.reponduParUser.lastname }}</strong>
                    le {{ formatDate(selectedTicket.dateReponse) }}
                  </p>
                </div>
              </div>
              <div class="col-lg-5">
                <div class="mb-2"><p class="mtk-label mb-1">Statut</p><span :class="['badge', getStatusClass(selectedTicket.status)]">{{ getStatusText(selectedTicket.status) }}</span></div>
                <div class="mb-2"><p class="mtk-label mb-1">Priorité</p><span :class="['badge', getPriorityClass(selectedTicket.priority)]">{{ getPriorityText(selectedTicket.priority) }}</span></div>
                <div class="mb-2"><p class="mtk-label mb-1">Créé le</p><p class="mtk-value mb-0">{{ formatDate(selectedTicket.createdAt) }}</p></div>
                <div class="mb-2" v-if="selectedTicket.user">
                  <p class="mtk-label mb-1">Créé par</p>
                  <p class="mtk-value mb-0">{{ selectedTicket.user.firstname }} {{ selectedTicket.user.lastname }}<br><span class="text-muted" style="font-size:0.78rem;">{{ selectedTicket.user.email }}</span></p>
                </div>
              </div>
            </div>
            <div class="mtk-section" v-if="selectedTicket.fichiers && parseFiles(selectedTicket.fichiers).length > 0">
              <p class="mtk-label mb-2">Fichiers joints</p>
              <div class="d-flex flex-wrap gap-2">
                <button v-for="(file, fi) in parseFiles(selectedTicket.fichiers)" :key="fi" type="button" class="mtk-file-chip mtk-file-chip-button" @click="openFileViewer(file)">
                  <i class="flaticon-file-1 me-1"></i>{{ getFileName(file) }}
                </button>
              </div>
            </div>
          </section>
          <footer class="mtk-footer">
            <button type="button" class="btn btn-secondary" @click="closeDetailsModal">Fermer</button>
          </footer>
        </div>
      </div>
    </template>
  </Teleport>

  <!-- Modal édition ticket -->
  <Teleport to="body">
    <template v-if="showEditModal">
      <div class="modal-backdrop fade show" style="z-index:1040;"></div>
      <div class="modal fade show" style="display:block;z-index:1055;" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Modifier le ticket #{{ selectedTicket?.id }}</h5>
              <button type="button" class="btn-close" @click="closeEditModal"></button>
            </div>
            <div class="modal-body" v-if="selectedTicket">
              <div class="mb-3">
                <label class="form-label">Statut</label>
                <select v-model="editForm.status" class="form-control">
                  <option value="OUVERT">Ouvert</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="RESOLU">Résolu</option>
                  <option value="FERME">Fermé</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Priorité</label>
                <select v-model="editForm.priority" class="form-control">
                  <option value="BASSE">Basse</option>
                  <option value="NORMALE">Normale</option>
                  <option value="HAUTE">Haute</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Réponse</label>
                <textarea v-model="editForm.reponse" rows="5" class="form-control" placeholder="Votre réponse..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeEditModal">Annuler</button>
              <button type="button" class="btn btn-primary" @click="saveTicket" :disabled="isSaving">
                <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Teleport>

  <!-- Visualiseur de fichiers -->
  <Teleport to="body">
    <template v-if="showFileViewer">
      <div class="mtk-backdrop" @click.self="closeFileViewer">
        <div class="mtk-modal mtk-file-viewer" role="dialog" aria-modal="true">
          <header class="mtk-header">
            <div class="mtk-title">
              <span class="mtk-chip">Prévisualisation</span>
              <h5>{{ currentFileName }}</h5>
            </div>
            <button type="button" class="btn-close" @click="closeFileViewer" aria-label="Fermer"></button>
          </header>
          <section class="mtk-body mtk-file-body">
            <div v-if="currentFileType === 'image'" class="file-preview-center">
              <img :src="currentFileUrl" :alt="currentFileName" class="file-preview-image" />
            </div>
            <div v-else-if="currentFileType === 'pdf'" class="file-preview-center">
              <iframe :src="currentFileUrl" style="width:100%;height:70vh;border:none;" title="Aperçu PDF"></iframe>
            </div>
            <div v-else class="text-center p-4">
              <p class="mtk-desc mb-3">Ce type de fichier ne peut pas être prévisualisé ici.</p>
              <a :href="currentFileUrl" target="_blank" class="btn btn-primary btn-sm">Ouvrir dans un nouvel onglet</a>
            </div>
          </section>
        </div>
      </div>
    </template>
  </Teleport>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, Teleport } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import ApiService from '../../services/ApiService';
import Swal from 'sweetalert2';
import { useAuthStore } from '../../services/auth';

export default defineComponent({
  name: 'Contact',
  components: { Form, Field, ErrorMessage },
  setup() {
    const authStore = useAuthStore();

    // ── Onglet actif ──
    const activeTab = ref<string>('infos');

    // ─────────────── Formulaire signalement ───────────────
    const contactForm = ref<any>(null);
    const fileInput = ref<HTMLInputElement | null>(null);
    const selectedFiles = ref<File[]>([]);
    const isSubmitting = ref(false);

    const ticketSchema = yup.object({
      sujet: yup.string().required('Le sujet est obligatoire').max(255),
      description: yup.string().required('La description est obligatoire'),
      priority: yup.string().oneOf(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE', ''], 'Priorité invalide')
    });
    const initialValues = { sujet: '', description: '', priority: 'NORMALE' };

    const handleFileChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;
      const maxFiles = 10, maxSize = 10 * 1024 * 1024;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/pdf'];
      if (selectedFiles.value.length + files.length > maxFiles) {
        Swal.fire({ icon: 'error', title: 'Erreur', text: `Max ${maxFiles} fichiers au total.` }); return;
      }
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!allowedTypes.includes(file.type)) { Swal.fire({ icon: 'error', title: 'Erreur', text: `"${file.name}" n'est pas autorisé.` }); continue; }
        if (file.size > maxSize) { Swal.fire({ icon: 'error', title: 'Erreur', text: `"${file.name}" est trop volumineux (max 10MB).` }); continue; }
        selectedFiles.value.push(file);
      }
      if (target) target.value = '';
    };
    const removeFile = (index: number) => { selectedFiles.value.splice(index, 1); };
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };
    const resetForm = () => {
      if (contactForm.value) contactForm.value.resetForm();
      selectedFiles.value = [];
      if (fileInput.value) fileInput.value.value = '';
    };
    const submitTicket = async (values: any) => {
      try {
        isSubmitting.value = true;
        if (!authStore.user?.id) { Swal.fire({ icon: 'error', title: 'Erreur', text: 'Vous devez être connecté.' }); return; }
        const ticketData = { ...values, email: authStore.user?.email || null, telephone: (authStore.user as any)?.phone || null };
        const response = await ApiService.post('/tickets', ticketData);
        let ticket = response.data.data;
        if (selectedFiles.value.length > 0 && ticket.id) {
          const formData = new FormData();
          selectedFiles.value.forEach(file => formData.append('files', file));
          try {
            const up = await ApiService.postWithConfig(`/tickets/${ticket.id}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (up.data?.data) ticket = up.data.data;
          } catch { Swal.fire({ icon: 'warning', title: 'Ticket créé', text: 'Certains fichiers n\'ont pas pu être uploadés.' }); }
        }
        Swal.fire({ icon: 'success', title: 'Ticket créé', text: 'Ticket créé avec succès. Les administrateurs ont été notifiés.', confirmButtonText: 'OK' }).then(() => { resetForm(); loadTickets(); });
      } catch (error: any) {
        Swal.fire({ icon: 'error', title: 'Erreur', text: error.response?.data?.message || 'Une erreur est survenue.' });
      } finally { isSubmitting.value = false; }
    };

    // ─────────────── Gestion des tickets ───────────────
    const ticketsLoading = ref(false);
    const tickets = ref<any[]>([]);
    const searchTerm = ref('');
    const showDetailsModal = ref(false);
    const showEditModal = ref(false);
    const selectedTicket = ref<any>(null);
    const isSaving = ref(false);
    const editForm = ref({ status: '', priority: '', reponse: '' });

    const filteredTickets = computed(() => {
      if (!searchTerm.value) return tickets.value;
      const term = searchTerm.value.toLowerCase();
      return tickets.value.filter(t =>
        t.sujet?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.user?.firstname?.toLowerCase().includes(term) ||
        t.user?.lastname?.toLowerCase().includes(term) ||
        t.email?.toLowerCase().includes(term) ||
        t.telephone?.includes(term)
      );
    });

    const nbOpenTickets = computed(() => tickets.value.filter(t => t.status === 'OUVERT').length);

    const loadTickets = async () => {
      try {
        ticketsLoading.value = true;
        const response = await ApiService.get('/tickets');
        tickets.value = response.data.data || [];
      } catch (error: any) {
        console.error('Erreur chargement tickets:', error);
      } finally { ticketsLoading.value = false; }
    };

    const onTicketsTab = async () => { activeTab.value = 'tickets'; if (tickets.value.length === 0) await loadTickets(); };

    const voirDetails = (ticket: any) => { selectedTicket.value = ticket; showDetailsModal.value = true; document.body.classList.add('modal-open'); };
    const closeDetailsModal = () => { showDetailsModal.value = false; selectedTicket.value = null; document.body.classList.remove('modal-open'); };

    const openEditModal = (ticket: any) => {
      selectedTicket.value = ticket;
      editForm.value = { status: ticket.status, priority: ticket.priority, reponse: ticket.reponse || '' };
      showEditModal.value = true; document.body.classList.add('modal-open');
    };
    const closeEditModal = () => { showEditModal.value = false; selectedTicket.value = null; editForm.value = { status: '', priority: '', reponse: '' }; document.body.classList.remove('modal-open'); };

    const saveTicket = async () => {
      if (!selectedTicket.value) return;
      try {
        isSaving.value = true;
        await ApiService.patch(`/tickets/${selectedTicket.value.id}`, { ...editForm.value });
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Ticket mis à jour avec succès.' });
        await loadTickets(); closeEditModal();
      } catch (error: any) {
        Swal.fire({ icon: 'error', title: 'Erreur', text: error.response?.data?.message || 'Impossible de mettre à jour le ticket.' });
      } finally { isSaving.value = false; }
    };

    const getStatusClass = (s: string) => ({ OUVERT: 'bg-warning', EN_COURS: 'bg-info', RESOLU: 'bg-success', FERME: 'bg-secondary' }[s] || 'bg-secondary');
    const getStatusText = (s: string) => ({ OUVERT: 'Ouvert', EN_COURS: 'En cours', RESOLU: 'Résolu', FERME: 'Fermé' }[s] || s);
    const getPriorityClass = (p: string) => ({ BASSE: 'bg-secondary', NORMALE: 'bg-primary', HAUTE: 'bg-warning', URGENTE: 'bg-danger' }[p] || 'bg-secondary');
    const getPriorityText = (p: string) => ({ BASSE: 'Basse', NORMALE: 'Normale', HAUTE: 'Haute', URGENTE: 'Urgente' }[p] || p);
    const formatDate = (date: string | Date) => { if (!date) return '-'; const d = new Date(date); return d.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); };
    const truncateText = (text: string, max: number) => !text ? '' : text.length > max ? text.substring(0, max) + '...' : text;

    const parseFiles = (filesJson: string | string[] | null | undefined): string[] => {
      if (!filesJson) return [];
      if (Array.isArray(filesJson)) return filesJson.filter(f => !!f);
      if (typeof filesJson !== 'string') return [];
      try { const p = JSON.parse(filesJson); return Array.isArray(p) ? p.filter(f => !!f) : [filesJson]; } catch { return filesJson ? [filesJson] : []; }
    };
    const getFileName = (filePath: string) => filePath.split('/').pop() || 'Fichier';
    const getFileUrl = (filePath: string) => { const c = filePath.startsWith('/') ? filePath.slice(1) : filePath; return `/api/${c}`; };

    const showFileViewer = ref(false);
    const currentFileUrl = ref('');
    const currentFileName = ref('');
    const currentFileType = ref<'image' | 'pdf' | 'other'>('other');
    const openFileViewer = (filePath: string) => {
      const url = getFileUrl(filePath), name = getFileName(filePath);
      currentFileUrl.value = url; currentFileName.value = name;
      const l = name.toLowerCase();
      currentFileType.value = (l.endsWith('.png') || l.endsWith('.jpg') || l.endsWith('.jpeg') || l.endsWith('.gif')) ? 'image' : l.endsWith('.pdf') ? 'pdf' : 'other';
      showFileViewer.value = true; document.body.classList.add('modal-open');
    };
    const closeFileViewer = () => { showFileViewer.value = false; currentFileUrl.value = ''; currentFileName.value = ''; document.body.classList.remove('modal-open'); };

    onMounted(async () => { if (!authStore.isAuthenticated) await authStore.verifyAuth(); });

    return {
      authStore, activeTab, onTicketsTab,
      contactForm, fileInput, selectedFiles, isSubmitting, ticketSchema, initialValues,
      handleFileChange, removeFile, formatFileSize, resetForm, submitTicket,
      ticketsLoading, tickets, searchTerm, filteredTickets, nbOpenTickets, loadTickets,
      showDetailsModal, showEditModal, selectedTicket, isSaving, editForm,
      voirDetails, closeDetailsModal, openEditModal, closeEditModal, saveTicket,
      getStatusClass, getStatusText, getPriorityClass, getPriorityText,
      formatDate, truncateText, parseFiles, getFileName, getFileUrl,
      showFileViewer, currentFileUrl, currentFileName, currentFileType, openFileViewer, closeFileViewer
    };
  }
});
</script>

<style scoped>
/* ── PANEL ── */
.info-panel { background:#fff;border:1px solid #ebebeb;border-radius:14px;padding:1.4rem 1.5rem;box-shadow:0 2px 12px rgba(0,0,0,.04); }
.info-panel-title { display:flex;align-items:center;gap:.85rem;margin-bottom:1.4rem;padding-bottom:1rem;border-bottom:1px solid #f0f0f0; }
.info-panel-icon { width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0; }
.info-panel-icon.green { background:#eaf7ed;color:#33b04a; }
.info-panel-icon.yellow { background:#fefce8;color:#b8a700; }
.info-panel-icon.dark { background:#f0efef;color:#231f20; }
.info-panel-heading { font-size:.92rem;font-weight:700;color:#231f20;margin:0;line-height:1.2; }
.info-panel-sub { font-size:.72rem;color:#aaa;margin:2px 0 0; }
/* ── LISTE ── */
.info-list { list-style:none;padding:0;margin:0; }
.info-list-item { display:flex;align-items:flex-start;gap:.85rem;padding-bottom:.9rem;margin-bottom:.9rem;border-bottom:1px solid #f5f5f5; }
.info-list-icon-wrap { width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0;margin-top:2px; }
.info-list-icon-wrap.green { background:#eaf7ed;color:#33b04a; }
.info-list-label { display:block;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#bbb;margin-bottom:2px; }
.info-list-val { display:block;font-size:.83rem;color:#333;line-height:1.6; }
/* ── PERSONNES ── */
.person-card { display:flex;align-items:flex-start;gap:.9rem;padding:.85rem;border-radius:10px;background:#fafafa;border:1px solid #f0f0f0;margin-bottom:.7rem;transition:box-shadow .2s; }
.person-card:hover { box-shadow:0 3px 12px rgba(0,0,0,.07); }
.person-avatar { width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;flex-shrink:0; }
.person-avatar.green { background:#eaf7ed;color:#33b04a; }
.person-avatar.yellow { background:#fefce8;color:#b8a700; }
.person-avatar.dark { background:#f0efef;color:#231f20; }
.person-info { flex:1;min-width:0; }
.person-name { font-size:.83rem;font-weight:700;color:#231f20;margin:0 0 .35rem; }
.person-line { display:flex;align-items:center;gap:.45rem;font-size:.77rem;color:#888;margin-bottom:.15rem; }
.person-line i { font-size:.68rem;color:#33b04a;width:12px;flex-shrink:0; }
/* ── PROFIL ── */
.my-profile-header { display:flex;align-items:center;gap:.85rem;padding:.85rem;background:linear-gradient(135deg,#eaf7ed,#f4fef6);border-radius:10px;margin-bottom:1.1rem;border:1px solid #d5f0db; }
.my-profile-avatar { width:46px;height:46px;border-radius:50%;background:#33b04a;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.95rem;flex-shrink:0;box-shadow:0 2px 8px rgba(51,176,74,.35); }
.my-profile-name { font-size:.9rem;font-weight:700;color:#231f20;margin:0 0 3px; }
.my-profile-badge { font-size:.7rem;color:#33b04a;font-weight:600; }
/* ── LIENS ── */
.coord-link { color:#333;text-decoration:none;transition:color .15s; }
.coord-link:hover { color:#33b04a;text-decoration:underline; }
.person-link { color:#555;text-decoration:none;font-size:.77rem;transition:color .15s; }
.person-link:hover { color:#33b04a;text-decoration:underline; }
/* ── FORMULAIRE ── */
.form-group { margin-bottom:1.5rem; }
/* ── TABLE TICKETS ── */
.action-buttons-group { display:flex;gap:.5rem; }
.btn-action { width:32px;height:32px;padding:0;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center; }
.btn-action-view { color:#0d6efd; }
.btn-action-edit { color:#198754; }
/* ── MODALES TICKETS ── */
.mtk-backdrop { position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1055;display:flex;align-items:center;justify-content:center;padding:1rem; }
.mtk-modal { background:#fff;border-radius:14px;max-width:820px;width:100%;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.45); }
.mtk-header { padding:1rem 1.25rem;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between; }
.mtk-title h5 { margin:0;font-size:1rem;font-weight:700; }
.mtk-chip { display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#777; }
.mtk-body { padding:1.25rem 1.5rem 1rem;overflow-y:auto; }
.mtk-label { font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#999; }
.mtk-value { font-size:.86rem;color:#222; }
.mtk-desc { font-size:.86rem;color:#444;line-height:1.6; }
.mtk-meta { font-size:.78rem;color:#888; }
.mtk-section { margin-top:1rem;padding-top:.8rem;border-top:1px solid #f0f0f0; }
.mtk-file-chip { display:inline-flex;align-items:center;gap:.25rem;padding:.35rem .7rem;border-radius:999px;font-size:.78rem;text-decoration:none;background:#f3f6ff;color:#1b4f72; }
.mtk-file-chip:hover { background:#e0ebff; }
.mtk-file-chip-button { border:none;cursor:pointer; }
.mtk-footer { padding:.75rem 1.5rem 1rem;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end; }
.mtk-file-viewer .mtk-body.mtk-file-body { padding:0; }
.file-preview-center { display:flex;align-items:center;justify-content:center;padding:1rem 1.5rem 1.25rem; }
.file-preview-image { max-width:100%;max-height:70vh;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.25); }
@media (max-width:576px) { .mtk-modal { max-width:100%;border-radius:12px; } }
</style>
