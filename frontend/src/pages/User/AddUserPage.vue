<!-- AddUserPage.vue -->
<template>
  <div>
    <BreadCrumb PageTitle="Ajouter un utilisateur" />
    <AddUser />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import AddUser from "../../components/User/AddUser.vue";

export default defineComponent({
  name: "AddUserPage",
  components: {
    BreadCrumb,
    AddUser,
  },
});
</script>

