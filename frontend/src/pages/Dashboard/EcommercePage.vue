<template>
  <div>
    <WelcomeDashboard />

    <TotalSalesChart />

    <DashboardPerformanceWidgets />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import WelcomeDashboard from "../../components/Dashboard/Ecommerce/WelcomeDashboard.vue";
import TotalSalesChart from "../../components/Dashboard/Ecommerce/TotalSalesChart.vue";
import DashboardPerformanceWidgets from "../../components/Dashboard/Ecommerce/DashboardPerformanceWidgets.vue";

export default defineComponent({
  name: "EcommercePage",
  components: {
    WelcomeDashboard,
    TotalSalesChart,
    DashboardPerformanceWidgets,
  },
});
</script>
