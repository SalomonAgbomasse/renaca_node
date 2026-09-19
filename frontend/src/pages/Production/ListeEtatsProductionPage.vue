<!-- ListeEtatsProductionPage.vue -->
<template>
  <div>
    <BreadCrumb PageTitle="Liste des états de production" />
    <ListeEtatsProduction/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import ListeEtatsProduction from "../../components/Production/ListeEtatsProduction.vue";

export default defineComponent({
  name: "ListeEtatsProductionPage",
  components: {
    BreadCrumb,
    ListeEtatsProduction,
  },
});
</script>
