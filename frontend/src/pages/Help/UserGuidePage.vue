<template>
  <div>
    <BreadCrumb PageTitle="Guide d'Utilisation" />
    <UserGuide />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import UserGuide from "../../components/Help/UserGuide.vue";

export default defineComponent({
  name: "UserGuidePage",
  components: {
    BreadCrumb,
    UserGuide,
  },
});
</script>
