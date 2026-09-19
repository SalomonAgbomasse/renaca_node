<!-- ListeGarantiesPage.vue -->
<template>
  <div>
    <BreadCrumb PageTitle="Liste des clients" />
    <ListeCustomer/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import ListeCustomer from "../../components/Customer/ListeCustomer.vue";

export default defineComponent({
  name: "ListeCustomerPage",
  components: {
    BreadCrumb,
    ListeCustomer,
  },
});
</script>
