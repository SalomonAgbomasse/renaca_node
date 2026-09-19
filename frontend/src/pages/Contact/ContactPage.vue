<template>
  <div>
    <BreadCrumb PageTitle="Contact / Signaler un problème" />
    <Contact />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import Contact from "../../components/Contact/Contact.vue";

export default defineComponent({
  name: "ContactPage",
  components: {
    BreadCrumb,
    Contact,
  },
});
</script>
