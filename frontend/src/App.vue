<template>
  <div>
    <!-- Application principale -->
    <RouterView />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { RouterView } from "vue-router";

export default defineComponent({
  name: "App",
  components: {
    RouterView
  },
  mounted() {
    document.body.classList.add("bg-body-secondary");
  },
});
</script>