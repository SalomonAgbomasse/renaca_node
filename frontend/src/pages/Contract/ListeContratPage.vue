<!-- ListeGarantiesPage.vue -->
<template>
  <div>
    <BreadCrumb PageTitle="Liste des contrats" />
    <ListeContrat/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import ListeContrat from "../../components/Contrat/ListeContrat.vue";

export default defineComponent({
  name: "ListeContratPage",
  components: {
    BreadCrumb,
    ListeContrat,
  },
});
</script>
