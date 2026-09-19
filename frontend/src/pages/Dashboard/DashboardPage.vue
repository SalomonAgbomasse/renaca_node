<template>
  <div>
    <DashboardMain />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import BreadCrumb from '../../components/Common/BreadCrumb.vue';
import DashboardMain from '../../components/Dashboard/DashboardMain.vue';

export default defineComponent({
  name: 'DashboardPage',
  components: {
    BreadCrumb,
    DashboardMain
  },
  setup() {
    const breadcrumbItems = [
      {
        text: 'Tableau de Bord',
        to: '/tableau_bord',
        active: true
      }
    ];

    return {
      breadcrumbItems
    };
  }
});
</script>

<style scoped>
.dashboard-page {
  background-color: #f8f9fa;
  min-height: 100vh;
}
</style>
