<template>
  <div class="card mb-25 border-0 rounded-0 bg-white">
    <div class="card-body p-15 p-sm-20 p-sm-25 p-lg-30 letter-spacing">
      <div
        class="mb-20 d-sm-flex align-items-center justify-content-between letter-spacing"
      >
        <h5 class="card-title fw-bold mb-0">Notifications</h5>
        <div
          class="card-select mt-10 mt-sm-0 d-inline-block d-sm-flex align-items-center ps-10 pe-10 pt-5 pb-5"
        >
          <span class="fw-medium text-muted me-8">Trier</span>
          <select
            class="form-select shadow-none text-black border-0 ps-0 pt-0 pb-0 pe-20 fs-14 fw-medium"
          >
            <option value="1" class="fw-medium" selected>Aujourd'hui</option>
            <option value="2" class="fw-medium">Cette semaine</option>
            <option value="3" class="fw-medium">Ce mois</option>
          </select>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table text-nowrap align-middle mb-0">
          <thead>
            <tr>
              <th
                scope="col"
                class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0 ps-0"
              >
                Message
              </th>
              <th
                scope="col"
                class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0 ps-0"
              >
                Date d'envoi
              </th>
              <th
                scope="col"
                class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0 text-end pe-0"
              >Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(notification, index) in notifications" :key="index">
              <td class="shadow-none lh-1 fw-medium text-black-emphasis ps-0">
                <a
                  href="#"
                  class="text-decoration-none text-black"
                >
                {{ notification.message }}
                </a>
              </td>
              <td class="shadow-none lh-1 fw-medium text-muted">{{ format_date(notification.createdAt)  }}</td>
              <td
                class="shadow-none lh-1 fw-medium text-body-tertiary text-end pe-0"
              >
              <div class="dropdown">
                  <span class="badge text-white bg-primary fs-15 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                      Actions
                      <i class="flaticon-chevron-2 position-relative ms-5 top-2 fs-15"></i>
                  </span>
                  <ul class="dropdown-menu">
                    <li>
                      <router-link 
                      class="dropdown-item d-flex align-items-center"
                        :to="{ name: 'ViewNotificationContentPage', params: { id: notification.id } }"
                      >
                      <i class="flaticon-view position-relative ms-5 fs-12"></i>
                      Lire
                      </router-link>
                    </li>
                  </ul>
              </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import ApiService from "@/services/ApiService";
import { format_date, error } from "@/utils/utils";

export default defineComponent({
  name: "NotificationsContent",
  components: {},
  setup: () => {
    const notifications = ref<Array<Notification>>([]);

    onMounted(() => {
        getAllNotifications();
    });

    function getAllNotifications() {
      return ApiService.get("/notifications")
        .then(({ data }) => {
          notifications.value = data.data;
          return data.data;
        })
        .catch(({ response }) => {
          error(response.data.msg);
        });
    }

    return { format_date, notifications, getAllNotifications };
  },
});
</script>