<template>
  <div class="card mb-25 border-0 rounded-0 bg-white letter-spacing">
    <!-- En-tête de la carte -->
    <div class="card-head box-shadow bg-white p-15 p-sm-20 p-md-25 border-bottom">
      <h4 class="mb-1 text-black-emphasis fw-bold">Documents requis pour la déclaration des sinistres</h4>
      <p class="text-body-secondary mb-0 fs-14">
        Afin de garantir un traitement rapide et fluide de vos dossiers auprès de L'Africaine Vie SA, 
        veuillez rassembler l'ensemble des pièces requises indiquées ci-dessous selon la nature du sinistre.
      </p>
    </div>

    <!-- Corps de la carte -->
    <div class="card-body p-15 p-sm-20 p-md-25">
      <div class="row g-4 mb-4">

        <!-- ── INVALIDITÉ ABSOLUE ET DÉFINITIVE (IAD) ── -->
        <div class="col-lg-6">
          <div class="border p-3 p-md-4 rounded-2 bg-body-tertiary h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                <div>
                  <span class="badge bg-warning text-dark mb-1 fw-bold">Sinistre IAD</span>
                  <h5 class="mb-0 fw-bold text-black-emphasis fs-16">Invalidité Absolue et Définitive</h5>
                </div>
                <i class="flaticon-file-1 fs-1 text-warning"></i>
              </div>

              <p class="text-body-secondary fs-13 mb-3">
                Pièces et justificatifs indispensables pour l'ouverture d'un dossier d'Invalidité Absolue et Définitive.
              </p>

              <div class="table-responsive">
                <table class="table table-sm table-borderless align-middle mb-0">
                  <tbody>
                    <tr class="border-bottom">
                      <td class="py-2 ps-0">
                        <div class="fw-semibold text-black-emphasis fs-14">Pièce d'identité</div>
                        <small class="text-body-secondary fs-12">PDF, Images (png, jpeg, jpg)</small>
                      </td>
                      <td class="text-end py-2 pe-0" style="width: 100px;">
                        <span class="badge bg-danger">Obligatoire</span>
                      </td>
                    </tr>
                    <tr class="border-bottom">
                      <td class="py-2 ps-0">
                        <div class="fw-semibold text-black-emphasis fs-14">BIA (Bulletin Individuel d'Adhésion)</div>
                        <small class="text-body-secondary fs-12">PDF, Images (png, jpeg, jpg)</small>
                      </td>
                      <td class="text-end py-2 pe-0">
                        <span class="badge bg-danger">Obligatoire</span>
                      </td>
                    </tr>
                    <tr class="border-bottom">
                      <td class="py-2 ps-0">
                        <div class="fw-semibold text-black-emphasis fs-14">Déclaration du sinistre</div>
                        <small class="text-body-secondary fs-12">Selon disponibilité du dossier</small>
                      </td>
                      <td class="text-end py-2 pe-0">
                        <span class="badge bg-secondary">Facultatif</span>
                      </td>
                    </tr>
                    <tr class="border-bottom">
                      <td class="py-2 ps-0">
                        <div class="fw-semibold text-black-emphasis fs-14">Certificat médical</div>
                        <small class="text-body-secondary fs-12">Selon disponibilité du dossier</small>
                      </td>
                      <td class="text-end py-2 pe-0">
                        <span class="badge bg-secondary">Facultatif</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="py-2 ps-0">
                        <div class="fw-semibold text-black-emphasis fs-14">Tableau d'amortissement</div>
                        <small class="text-body-secondary fs-12">Selon disponibilité du dossier</small>
                      </td>
                      <td class="text-end py-2 pe-0">
                        <span class="badge bg-secondary">Facultatif</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="mt-4 pt-2 text-end">
              <router-link to="/contact" class="btn btn-outline-warning btn-sm fw-bold">
                Déclarer un sinistre IAD <i class="flaticon-right-arrow ms-1"></i>
              </router-link>
            </div>
          </div>
        </div>

        <!-- ── DÉCÈS TOUTES CAUSES ── -->
        <div class="col-lg-6">
          <div class="border p-3 p-md-4 rounded-2 bg-body-tertiary h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                <div>
                  <span class="badge bg-danger mb-1 fw-bold">Sinistre Décès</span>
                  <h5 class="mb-0 fw-bold text-black-emphasis fs-16">Décès Toutes Causes</h5>
                </div>
                <i class="flaticon-warning-1 fs-1 text-danger"></i>
              </div>

              <p class="text-body-secondary fs-13 mb-3">
                Pièces et justificatifs indispensables pour l'ouverture d'un dossier de Décès Toutes Causes.
              </p>

              <div class="table-responsive">
                <table class="table table-sm table-borderless align-middle mb-0">
                  <tbody>
                    <tr class="border-bottom">
                      <td class="py-2 ps-0">
                        <div class="fw-semibold text-black-emphasis fs-14">Pièce d'identité</div>
                        <small class="text-body-secondary fs-12">PDF, Images (png, jpeg, jpg)</small>
                      </td>
                      <td class="text-end py-2 pe-0" style="width: 100px;">
                        <span class="badge bg-danger">Obligatoire</span>
                      </td>
                    </tr>
                    <tr class="border-bottom">
                      <td class="py-2 ps-0">
                        <div class="fw-semibold text-black-emphasis fs-14">BIA (Bulletin Individuel d'Adhésion)</div>
                        <small class="text-body-secondary fs-12">PDF, Images (png, jpeg, jpg)</small>
                      </td>
                      <td class="text-end py-2 pe-0">
                        <span class="badge bg-danger">Obligatoire</span>
                      </td>
                    </tr>
                    <tr class="border-bottom">
                      <td class="py-2 ps-0">
                        <div class="fw-semibold text-black-emphasis fs-14">Déclaration du sinistre</div>
                        <small class="text-body-secondary fs-12">Selon disponibilité du dossier</small>
                      </td>
                      <td class="text-end py-2 pe-0">
                        <span class="badge bg-secondary">Facultatif</span>
                      </td>
                    </tr>
                    <tr class="border-bottom">
                      <td class="py-2 ps-0">
                        <div class="fw-semibold text-black-emphasis fs-14">Déclaration de décès</div>
                        <small class="text-body-secondary fs-12">Selon disponibilité du dossier</small>
                      </td>
                      <td class="text-end py-2 pe-0">
                        <span class="badge bg-secondary">Facultatif</span>
                      </td>
                    </tr>
                    <tr class="border-bottom">
                      <td class="py-2 ps-0">
                        <div class="fw-semibold text-black-emphasis fs-14">Tableau d'amortissement</div>
                        <small class="text-body-secondary fs-12">Selon disponibilité du dossier</small>
                      </td>
                      <td class="text-end py-2 pe-0">
                        <span class="badge bg-secondary">Facultatif</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="py-2 ps-0">
                        <div class="fw-semibold text-black-emphasis fs-14">Acte de décès</div>
                        <small class="text-body-secondary fs-12">Selon disponibilité du dossier</small>
                      </td>
                      <td class="text-end py-2 pe-0">
                        <span class="badge bg-secondary">Facultatif</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="mt-4 pt-2 text-end">
              <router-link to="/contact" class="btn btn-outline-danger btn-sm fw-bold">
                Déclarer un sinistre Décès <i class="flaticon-right-arrow ms-1"></i>
              </router-link>
            </div>
          </div>
        </div>

      </div>

      <!-- Encart d'assistance -->
      <div class="p-3 rounded-2 bg-body-tertiary border d-flex align-items-center gap-3">
        <i class="flaticon-info text-success fs-2 flex-shrink-0"></i>
        <div>
          <strong class="d-block mb-1 fs-14 text-black-emphasis">Besoin d'assistance ?</strong>
          <span class="fs-13 text-body-secondary">
            Pour toute question concernant la constitution de votre dossier de sinistre, vous pouvez contacter le service Bancassurance au 
            <a href="tel:+2290196994328" class="fw-bold text-success text-decoration-none">+229 01 96 99 43 28</a> 
            ou par e-mail à 
            <a href="mailto:cadeossi@lafricaineviebenin.com" class="fw-bold text-success text-decoration-none">cadeossi@lafricaineviebenin.com</a>.
          </span>
        </div>
      </div>

    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'InformationsPage',
});
</script>
