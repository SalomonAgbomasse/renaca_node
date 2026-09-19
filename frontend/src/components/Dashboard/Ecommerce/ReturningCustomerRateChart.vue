<template>
  <div class="card bg-white border-0 rounded-3 mb-4">
    <div class="card-body p-4">
      <div
        class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3 mb-lg-4"
      >
        <h3 class="mb-0">Returning Customer Rate</h3>
        <select
          class="form-select month-select form-control"
          aria-label="Default select example"
        >
          <option selected>Month</option>
          <option value="1">Weekly</option>
          <option value="2">Monthly</option>
          <option value="3">Yearly</option>
        </select>
      </div>

      <apexchart
        v-if="isClient"
        type="line"
        height="300"
        :options="returningCustomerRate"
        :series="rates"
      ></apexchart>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";

export default defineComponent({
  name: "ReturningCustomerRateChart",
  setup() {
    const isClient = ref(false);
    const rates = ref([
      {
        name: "Fifth Time",
        data: [70, 23, 40, 30, 62, 52, 90, 20, 60, 53, 65, 70],
      },
      {
        name: "Fourth Time",
        data: [15, 58, 45, 38, 70, 50, 55, 60, 78, 40, 35, 35],
      },
    ]);
    const returningCustomerRate = ref({
      chart: {
        height: 300,
        type: "line",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      colors: ["#605DFF", "#AD63F6"],
      stroke: {
        curve: "smooth",
        width: 2,
      },
      grid: {
        borderColor: "#F6F7F9",
      },
      markers: {
        size: 4,
        strokeWidth: 0,
        shape: ["circle", "square"],
        hover: {
          size: 5,
        },
      },
      xaxis: {
        categories: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        axisTicks: {
          show: false,
          color: "#B1BBC8",
        },
        axisBorder: {
          show: false,
          color: "#B1BBC8",
        },
        labels: {
          show: true,
          style: {
            colors: "#8695AA",
            fontSize: "12px",
          },
        },
      },
      yaxis: {
        tickAmount: 5,
        max: 100,
        min: 0,
        labels: {
          formatter: (val: string) => {
            return val + "%";
          },
          style: {
            colors: "#64748B",
            fontSize: "12px",
          },
        },
      },
      legend: {
        show: true,
        position: "top",
        fontSize: "12px",
        horizontalAlign: "center",
        itemMargin: {
          horizontal: 8,
          vertical: 0,
        },
        labels: {
          colors: "#64748B",
        },
        markers: {
          width: 9,
          height: 9,
          offsetX: -2,
          offsetY: -0.5,
          shape: "diamond",
        },
      },
    });

    onMounted(() => {
      isClient.value = true;
    });

    return {
      isClient,
      rates,
      returningCustomerRate,
    };
  },
});
</script>
