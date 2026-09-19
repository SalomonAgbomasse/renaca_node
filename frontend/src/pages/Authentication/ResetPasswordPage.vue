<template>
  <!-- <BreadCrumb PageTitle="Reset Password" /> -->
  <ResetPassword />
</template>

<script lang="ts">
import { defineComponent } from "vue";

import ResetPassword from "../../components/Authentication/ResetPassword/ResetPassword.vue";

export default defineComponent({
  name: "ResetPasswordPage",
  components: {
    ResetPassword,
  },
});
</script>