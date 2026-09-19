<!-- EditProductionPage.vue -->
<template>
    <div>
      <BreadCrumb PageTitle="Modifier un état de production" />
      <AddProductionState :id="productionId" />
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, computed } from "vue";
  import { useRoute } from "vue-router";
  import BreadCrumb from "../../components/Common/BreadCrumb.vue";
  import AddProductionState from "../../components/Production/GenerateProductionState.vue";
  
  export default defineComponent({
    name: "EditProductionPage",
    components: {
      BreadCrumb,
      AddProductionState,
    },
    setup() {
      const route = useRoute();
      
      const productionId = computed(() => route.params.code as string);
      
      return {
        productionId,
      };
    },
  });
  </script>