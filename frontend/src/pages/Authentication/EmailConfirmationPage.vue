<template>
  <!-- <BreadCrumb PageTitle="Email Confirmation" /> -->
  <EmailConfirmation />
</template>

<script lang="ts">
import { defineComponent } from "vue";

import EmailConfirmation from "../../components/Authentication/EmailConfirmation/EmailConfirmation.vue";

export default defineComponent({
  name: "EmailConfirmationPage",
  components: {
    EmailConfirmation,
  },
});
</script>