<!-- ListeGarantiesPage.vue -->
<template>
  <div>
    <BreadCrumb PageTitle="Liste des contrats échus" />
    <ListeContratEchus/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import ListeContratEchus from "../../components/Contrat/ListeContratEchus.vue";

export default defineComponent({
  name: "ListeContratEchusPage",
  components: {
    BreadCrumb,
    ListeContratEchus,
  },
});
</script>
