<template>
  <div class="card mb-25 border-0 rounded-0 text-white welcome-box ">
    <div class="card-body pe-15 pe-sm-20 pe-md-0 pb-0 pt-15 pt-sm-20">
      <div class="row align-items-center">
        <div class="col-lg-8 col-md-8">
          <div class="title position-relative">
            <h3 class="fw-semibold mb-8 mt-15 text-white">
              Bonjour, <span class="fw-bold">{{ userName ? userName : "" }}</span>
            </h3>
            <span class="d-block  text-white fs-md-15 fs-lg-16">
              Voici ce qui se passe dans votre entreprise aujourd’hui
            </span>
          </div>
          <ul class="ps-0 mt-20 mb-20 text-white">
            <li v-for="(sol, index) in soldes" :key="index"
              class="d-inline-block text-uppercase fw-medium fs-13  position-relative"
            >
              Total {{ sol.RedStatut == "Payée" ? " Réabonnnement" : sol.RedStatut == "En attente" ? "Redevance" : sol.RedStatut }}
              <span class="d-block fw-black lh-1 mt-5 mt-md-10">
                {{ separateur(sol.Montant)}}
              </span>
            </li>
           
          </ul>
        </div>
        <div class="col-lg-4 col-md-4 text-center mt-15 mt-md-0">
          <!-- <img
            src="../../../assets/images/welcome/welcome1.png"
            alt="welcome-image"
          /> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import stateStore from "../../../utils/store";
import { useRouter } from "vue-router";
import JwtService from "../../../services/JwtService";
import { separateur } from "../../../utils/utils";
import { useAuthStore, User } from "../../../services/auth";  
import axios from 'axios';

interface Solde {
  RedStatut: string;
  Montant: number;
}

export default defineComponent({
  name: "WhatHappening",
  components:{

  },
  setup() {
    const stateStoreInstance = stateStore;
    const isSticky = ref(false);
    const router = useRouter();
    const store = useAuthStore();
    const user = ref<User>();

    const soldes = ref<Solde[]>([]);
    const getAbonpayeImpaye = async () =>{
      try{
        const response = await axios.get(`/etats/point/redevances`);
        soldes.value = response.data.data;
        return soldes.value;
      }catch (error) {
        //
      }
    }
    const userName = ref("");
    const userEmail = ref("");
    onMounted(() => {
      getAbonpayeImpaye();
      user.value = store.user;
      if(JwtService.getUser()){
        userName.value = JwtService.getUserName()!;
        userEmail.value = JwtService.getUserEmail()!;
      }
    });



    return {
      separateur,
      soldes,
      userName,
      userEmail,
      isSticky,
      stateStoreInstance,
      user
    };
  },
});
</script>