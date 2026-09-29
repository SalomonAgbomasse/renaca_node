<template>
  <div>
    <!-- Application principale -->
    <RouterView />

    <!-- Widget Conseiller IA RENACA -->
    <AiAssistantWidget />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { RouterView } from "vue-router";
import AiAssistantWidget from "./components/Ai/AiAssistantWidget.vue";

export default defineComponent({
  name: "App",
  components: {
    RouterView,
    AiAssistantWidget,
  },
  mounted() {
    document.body.classList.add("bg-body-secondary");
  },
});
</script>