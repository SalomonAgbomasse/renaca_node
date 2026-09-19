<template>
  <div>
    <BreadCrumb PageTitle="Détails de l'agence" />
    <AgencyDetail />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import AgencyDetail from "../../components/Agence/AgencyDetail.vue";

export default defineComponent({
  name: "AgencyDetailPage",
  components: {
    BreadCrumb,
    AgencyDetail,
  },
});
</script>
