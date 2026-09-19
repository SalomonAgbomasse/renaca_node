<template>
  <!-- <BreadCrumb PageTitle="Login" /> -->
  <LoginForm />
</template>

<script lang="ts">
import { defineComponent } from "vue";

import LoginForm from "../../components/Authentication/Login/LoginForm.vue";

export default defineComponent({
  name: "LoginPage",
  components: {
    LoginForm,
  },
});
</script>