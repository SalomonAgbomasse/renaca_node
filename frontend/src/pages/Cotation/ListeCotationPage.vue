<!-- ListeGarantiesPage.vue -->
<template>
  <div>
    <BreadCrumb PageTitle="Liste des cotations" />
    <ListeCotation/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import ListeCotation from "../../components/Cotation/ListeCotation.vue";

export default defineComponent({
  name: "ListeContratPage",
  components: {
    BreadCrumb,
    ListeCotation,
  },
});
</script>
