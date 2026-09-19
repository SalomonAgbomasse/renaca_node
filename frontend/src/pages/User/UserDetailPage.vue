<template>
  <div>
    <BreadCrumb PageTitle="Détails de l'utilisateur" />
    <UserDetail />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import UserDetail from "../../components/User/UserDetail.vue";

export default defineComponent({
  name: "UserDetailPage",
  components: {
    BreadCrumb,
    UserDetail,
  },
});
</script>
