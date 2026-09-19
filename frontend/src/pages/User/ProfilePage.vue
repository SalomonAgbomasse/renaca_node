<template>
  <div>
    <BreadCrumb PageTitle="Mon Profil" />
    <Profile />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import BreadCrumb from '../../components/Common/BreadCrumb.vue';
import Profile from '../../components/User/Profile.vue';

export default defineComponent({
  name: 'ProfilePage',
  components: {
    BreadCrumb,
    Profile
  }
});
</script> 