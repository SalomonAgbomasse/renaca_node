<template>
  <!--begin::System Layout-->
  <div class="d-flex flex-column flex-root" id="kt_app_root">
    <router-view></router-view>
  </div>
  <!--end::System Layout-->
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue";

export default defineComponent({
  name: "system-layout",
  components: {},
  setup() {
    onMounted(() => {
      document.body.classList.add("app-blank");
      document.body.classList.add("bgi-size-cover");
      document.body.classList.add("bgi-position-center");
      document.body.classList.add("bgi-no-repeat");
    });
  },
});
</script>
