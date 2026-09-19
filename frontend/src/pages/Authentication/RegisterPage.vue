<template>
  <!-- <BreadCrumb PageTitle="Register" /> -->
  <RegisterContent />
</template>

<script lang="ts">
import { defineComponent } from "vue";

import RegisterContent from "../../components/Authentication/Register/RegisterContent.vue";

export default defineComponent({
  name: "RegisterPage",
  components: {
    RegisterContent,
  },
});
</script>