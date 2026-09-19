<!-- ListeGarantiesPage.vue -->
<template>
  <div>
    <BreadCrumb PageTitle="Liste des agences" />
    <ListeAgence/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import ListeAgence from "../../components/Agence/ListeAgence.vue";

export default defineComponent({
  name: "ListeAgencePage",
  components: {
    BreadCrumb,
    ListeAgence,
  },
});
</script>
