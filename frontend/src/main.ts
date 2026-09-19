import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createBootstrap } from "bootstrap-vue-next";
import VueApexCharts from "vue3-apexcharts";
import { QuillEditor } from '@vueup/vue-quill'
import Vue3Prism from 'vue3-prism/lib/Vue3Prism.common.js'
import ApiService from "./services/ApiService";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue-next/dist/bootstrap-vue-next.css";
import "swiper/css";
import "swiper/css/bundle";
import "flatpickr/dist/flatpickr.css";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import "@vueup/vue-quill/dist/vue-quill.bubble.css";
import "vue3-prism/lib/Vue3Prism.css";
import "sweetalert2/dist/sweetalert2.css";
import "@vueform/multiselect/themes/default.css";
import "./assets/custom.scss";
import "sweetalert2/dist/sweetalert2.min.css";

// Initialiser la taille de police personnalisée sauvegardée
const savedFontSize = localStorage.getItem("app_font_size");
if (savedFontSize) {
  document.documentElement.style.setProperty("--app-font-size", `${savedFontSize}px`);
}

import { initVeeValidate } from "./utils/vee-validate";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";

const i18n = createI18n({
  numberFormats: {
    "fr-FR": {
      currency: {
        style: "currency",
        currency: "FR",
        notation: "standard",
      },
      decimal: {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
      percent: {
        style: "percent",
        useGrouping: false,
      },
    },
  },
});
const app = createApp(App);
app.use(i18n);
app.use(router);
app.use(createPinia());
app.use(VueApexCharts as any);
app.use(createBootstrap());

app.component('QuillEditor', QuillEditor);

const prismPlugin = (Vue3Prism as any).default || Vue3Prism;
if (typeof prismPlugin === 'function' || (prismPlugin && typeof prismPlugin.install === 'function')) {
  app.use(prismPlugin);
}

initVeeValidate();
ApiService.init(app);

// L'authentification est maintenant gérée via cookies HttpOnly
// Plus besoin de vérifier localStorage

app.mount("#app");

