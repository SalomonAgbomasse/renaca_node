<template>
  <div class="card mb-25 border-0 rounded-0 bg-white website-visitors">
    <div class="card-body p-15 p-sm-20 p-sm-25 p-lg-30 letter-spacing">
      <div
        class="mb-lg-15 d-sm-flex align-items-center justify-content-between"
      >
        <h6 class="card-title fw-bold mb-0">EVOLUTION DES CONTRATS PAR ANNEE</h6>
       
      </div>
      <div id="websiteVisitorsChart" class="chart">
        <apexchart
          type="bar"
          height="300"
          :options="websiteVisitorsChart"
          :series="website"
        ></apexchart>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent,ref,onMounted } from "vue";
import axios from 'axios';

export default defineComponent({
  name: "WebsiteVisitors",
  setup: () => {
    const donnees = ref<Array<number>>([]);
    const annees = ref<Array<number>>([]);
    const references = ref([]);
    const fetchReference =async () => {
      try {
        const response = await axios.post(`/abonnement/annuel`,{});
        references.value = response.data.data;
        return references.value;
      } catch (error) {
        //
      }
    }
    
    
    onMounted(async () => {
      await fetchReference();
      references.value.forEach((element: any) => {
        ajouterNouvellesValeurs(element.annee, parseInt(element.nombreAbonnement));
      });
    });
    function ajouterNouvellesValeurs(anne:number, valeur:number) {
      // Utiliser la méthode value pour accéder au tableau interne et push pour ajouter de nouvelles valeurs
      donnees.value.push(valeur);
      annees.value.push(anne);
    }

    return {
      donnees,
      annees,
      references,
      website: [
        {
          name: "Abonnements",
          data: donnees.value,
        },
      ],
      websiteVisitorsChart: {
        chart: {
          toolbar: {
            show: true,
          },
        },
        plotOptions: {
          bar: {
            borderRadius:0,
            horizontal: false,
            columnWidth: "30%",
            endingShape: "rounded",
          },
        },
        dataLabels: {
          enabled: true,
        },
        colors: ["#f3c148"],
        stroke: {
          show: true,
        },
        xaxis: {
          categories: annees.value,
          labels: {
            show: true,
            style: {
              fontFamily: "Red Hat Display, sans-serif",
              colors: "#9C9AB6",
              fontSize: "14px",
              fontWeight: 500,
            },
          },
        },
        yaxis: {
          show: true,
          tickAmount: 8,
          labels: {
            show: true,
            style: {
              fontFamily: "Red Hat Display, sans-serif",
              colors: "#9C9AB6",
              fontSize: "14px",
              fontWeight: 500,
            },
          },
        },
        fill: {
          opacity: 1,
        },
        tooltip: {
          style: {
            fontSize: "14px",
            fontFamily: "Red Hat Display, sans-serif",
          },
        },
        grid: {
          show: true,
          strokeDashArray: 5,
          borderColor: "#d9e9ef",
        },
      },
    };
  },
});
</script>