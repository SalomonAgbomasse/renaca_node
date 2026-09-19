<!-- EditUserPage.vue -->
<template>
  <div>
    <BreadCrumb PageTitle="Modifier un utilisateur" />
    <AddUser :userId="userId" />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRoute } from "vue-router";
import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import AddUser from "../../components/User/AddUser.vue";

export default defineComponent({
  name: "EditUserPage",
  components: {
    BreadCrumb,
    AddUser,
  },
      setup() {
    const route = useRoute();
    
    // Le paramètre doit correspondre à celui défini dans la route (:id)
    const userId = computed(() => route.params.id as string);
    
    return {
      userId,
    };
  },
});
</script>