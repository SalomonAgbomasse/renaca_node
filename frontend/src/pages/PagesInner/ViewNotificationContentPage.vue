<template>
  <BreadCrumb PageTitle="Notification" />
  <ViewNotificationContent />
</template>

<script lang="ts">
import { defineComponent } from "vue";

import BreadCrumb from "../../components/Common/BreadCrumb.vue";
import ViewNotificationContent from "../../components/PagesInner/Notifications/ViewNotificationContent.vue";

export default defineComponent({
  name: "ViewNotificationContentPage",
  components: {
    BreadCrumb,
    ViewNotificationContent,
  },
});
</script>