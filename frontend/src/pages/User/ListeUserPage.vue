<!-- ListeGarantiesPage.vue -->
<template>
  <div>
    <BreadCrumb PageTitle="Liste des utilisateurs" />
    <ListeUser/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import ListeUser from "../../components/User/ListeUser.vue";

export default defineComponent({
  name: "ListeUserPage",
  components: {
    BreadCrumb,
    ListeUser,
  },
});
</script>
