<template>
  <div>
    <BreadCrumb PageTitle="Logs d'audit" />
    <AuditLogs />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BreadCrumb from "../components/Common/BreadCrumb.vue";
import AuditLogs from "../components/Admin/AuditLogs.vue";

export default defineComponent({
  name: "AdminAuditLogsPage",
  components: {
    BreadCrumb,
    AuditLogs,
  },
});
</script>
