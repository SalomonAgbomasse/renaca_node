<!-- EditGarantiePage.vue -->
<template>
  <div>
    <BreadCrumb PageTitle="Modifier une cotation" />
    <AddCotation :id="contratId" />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRoute } from "vue-router";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import AddCotation from "../../components/Cotation/AddCotation.vue";

export default defineComponent({
  name: "EditCotationPage",
  components: {
    BreadCrumb,
    AddCotation,
  },
  setup() {
    const route = useRoute();
    
    const contratId = computed(() => route.params.code as string);
    
    return {
      contratId,
    };
  },
});
</script>