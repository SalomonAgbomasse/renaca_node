<template>
  <div class="row">
    <div class="col-lg-12" v-for="course in courses" :key="course.id">
      <div
        :class="[
          'card mb-25 border-0 rounded-0 letter-spacing courses-list-box',
          course.bgClass,
        ]"
      >
        <div class="card-body">
          <div class="title position-relative mb-8 mb-md-10">
            
            <span :class="['badge bg-success position-relative rounded-circle', course.bgClassImage, ]"><i :class="[course.image,'fs-2']"></i></span>
            <h6 class="mb-0 text-black fw-bold">
              {{ course.title }}
            </h6>
          </div>
          <p class="fs-md-15 fs-lg-16 text-black-emphasis mb-15 fw-medium">
            {{ course.shortDesc }}
          </p>
          <router-link to=""  class="default-btn position-relative transition border-0 fw-medium text-white pt-8 pb-8 ps-20 pe-20 pt-md-8 pb-md-8 ps-md-25 pe-md-25 rounded-0 bg-success fs-md-15 fs-lg-16 d-inline-block me-10 mb-10 mb-lg-0 text-decoration-none"> {{ course.lessons }}</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import fundamentalCourses from "./fundamentalCourses.json";

export default defineComponent({
  name: "FundamentalCourses",
  data() {
    return {
      courses: fundamentalCourses,
    };
  },
});
</script>