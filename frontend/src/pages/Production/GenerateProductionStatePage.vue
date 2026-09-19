<!-- GenerateProductionStatePage.vue -->
<template>
  <div>
    <BreadCrumb PageTitle="Générer un état de production" />
    <GenerateProductionState />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import GenerateProductionState from "../../components/Production/GenerateProductionState.vue";

export default defineComponent({
  name: "GenerateProductionStatePage",
  components: {
    BreadCrumb,
    GenerateProductionState,
  },
});
</script>

