<!-- AddCotationPage.vue -->
<template>
  <div>
    <BreadCrumb PageTitle="Faire une cotation" />
    <AddCotation />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import AddCotation from "../../components/Cotation/AddCotation.vue";

export default defineComponent({
  name: "AddCotationPage",
  components: {
    BreadCrumb,
    AddCotation,
  },
});
</script>

