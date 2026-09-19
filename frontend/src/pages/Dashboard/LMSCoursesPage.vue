<template>
  <div>
    //<WhatHappening />

    <div class="row">
      <div class="col-xxl-4">
        <FundamentalCourses />
      </div>
      <div class="col-xxl-8">
        <TodaysEvent />
      </div>
      <div class="col-xxl-4">
        <CategoriesCourses />
      </div>
      <div class="col-xxl-8">
        <CoursesClass />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";

import WhatHappening from "../../components/Dashboard/LMSCourses/WhatHappening.vue";
import TodaysEvent from "../../components/Dashboard/LMSCourses/TodaysEvent.vue";
import CategoriesCourses from "../../components/Dashboard/LMSCourses/CategoriesCourses/index.vue";
import CoursesClass from "../../components/Dashboard/LMSCourses/CoursesClass/index.vue";
import FundamentalCourses from "../../components/Dashboard/LMSCourses/FundamentalCourses/index.vue";

export default defineComponent({
  name: "LMSCoursesPage",
  components: {
    WhatHappening,
    TodaysEvent,
    CategoriesCourses,
    CoursesClass,
    FundamentalCourses,
  },
});
</script>