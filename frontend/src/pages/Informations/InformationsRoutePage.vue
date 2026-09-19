<template>
  <div>
    <BreadCrumb PageTitle="Informations" />
    <InformationsPage />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import InformationsPage from "../../components/Informations/InformationsPage.vue";

export default defineComponent({
  name: "InformationsRoutePage",
  components: {
    BreadCrumb,
    InformationsPage,
  },
});
</script>
