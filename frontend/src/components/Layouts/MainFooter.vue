<template>
  <div class="flex-grow-1"></div>

  <footer
    class="footer-area text-center text-md-start bg-white ps-15 pe-15 pt-20 pb-20 ps-md-40 pe-md-40 pt-md-25 pb-md-25"
  >

    <div class="row align-items-center">
      <div class="col-md-6 col-lg-6">
        <p class="text-body-secondary fw-medium mb-0">
          Tous droits réservés à © <span class="fw-bold text-primary">L'Africaine Vie Bénin SA</span>
        <!--  . Design by 
          <a
            href="#"
            class="text-decoration-none fw-bold transition"
            target="_blank"
            >FNGC</a
          >-->
        </p>
      </div>
      <div class="col-md-6 col-lg-6 text-md-end">
        <ul class="footer-menu ps-0 mb-0 list-unstyled fw-medium">
          <li class="d-inline-block">
            <router-link
              to="/privacy-policy"
              class="text-decoration-none text-body-secondary transition"
            >
            Politique de confidentialité
            </router-link>
          </li>
          <li class="d-inline-block">
            <router-link
              to="/terms-conditions"
              class="text-decoration-none text-body-secondary transition"
            >
             Conditions générales
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>

<script lang="ts">
export default {
  name: "MainFooter",
};
</script>