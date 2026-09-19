<template>
  <div class="card mb-25 border-0 rounded-0 bg-white">
    <div
      class="card-body p-15 p-sm-20 p-sm-25 pt-lg-30 pb-lg-30 ps-lg-25 pe-lg-25 letter-spacing"
    >
      <div class="mb-10 mb-md-25 d-flex justify-content-between">
        <div class="title">
          <h5 class="card-title fw-bold mb-7">BP infos</h5>
          <span class="d-block text-black fw-medium">Pour vous, nous travaillons</span>
        </div>
        <div class="todays-event-swiper-pagination"></div>
      </div>
      <swiper
        :slides-per-view="1"
        :loop="true"
        :autoplay="{
          delay: 4000,
          disableOnInteraction: true,
        }"
        :pagination="{
          clickable: true,
        }"
        :modules="modules"
        class="todaysEventSwiper"
      >
        <swiper-slide v-for="course in courses" :key="course.id">
          <div>
            <div class="row ms-0 me-0 align-items-center">
              <div class="col-lg-4 ps-0 pe-0 pb-25">
                <img :src="course.image" alt="course-image" />
              </div>
              <div class="col-lg-8 ps-0 pe-0">
                <div class="content">
                  <router-link
                    to="/event-details"
                    class=" fw-bold text-decoration-none text-black fs-3 ms-10">
                    {{ course.title }}
                  </router-link>
                  <span class="mt-8 pb-10 text-black fw-medium d-flex align-items-center">
                    <span class="w-6 h-6 bg-white rounded-circle me-8" ></span>
                    {{ course.speakers }}
                  </span>
                 
                  <div  class="ms-10 pt-15 pt-md-15 " >
                    <router-link to="" class="default-btn transition border-0 fw-medium text-white pt-10 pb-10 ps-25 pe-25 pt-md-11 pb-md-11 ps-md-35 pe-md-35 rounded-1 fs-md-15 fs-lg-16">Lire la suite</router-link>
                  </div>
                </div>
              </div>
            </div>
            <!-- <span
              class="fw-medium text-secondary mt-10 mt-md-25 mb-5 mb-md-8 d-block"
            >
              Start
              <span class="fw-bold text-black">
                in {{ course.start }} mins
              </span>
            </span> -->
            <!-- <div
              class="progress"
              role="progressbar"
              :aria-valuenow="course.progress"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="progress-bar"
                :style="{ width: course.progress + '%' }"
              ></div>
            </div> -->
           
          </div>
        </swiper-slide>
      </swiper>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay, Pagination } from "swiper/modules";

export default defineComponent({
  name: "TodaysEvent",
  components: {
    Swiper,
    SwiperSlide,
  },
  data() {
    return {
      courses: [
        {
          id: 1,
          image: require("../../../assets/images/courses/course-mini1.jpg"),
          title: "Fundamental UI/UX Design Course",
          speakers: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
          topics: "5",
          start: "7",
          progress: "60",
        },
        {
          id: 2,
          image: require("../../../assets/images/courses/course-mini2.jpg"),
          title: "How To Create Banner Social Media",
          speakers: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
          topics: "4",
          start: "2",
          progress: "80",
        },
        {
          id: 3,
          image: require("../../../assets/images/courses/course-mini1.jpg"),
          title: "Fundamental UI/UX Design Course",
          speakers: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
          topics: "6",
          start: "5",
          progress: "90",
        },
      ],
    };
  },
  setup() {
    return {
      modules: [Autoplay, Pagination],
    };
  },
});
</script>