<template>
  <div class="row">    
    <div class="col-md-2 col-xxl-2 col-sm-2 mb-10">
      </div>

      <div class="col-md-8 col-xxl-8 col-sm-8 mb-10">
        <div class="card mb-25 border-0 rounded-0">
          <div class="card-body p-15 p-sm-20 p-md-25 p-lg-30 letter-spacing">
            <h4 class="text-black fw-bold mb-10">Détails</h4>
            <table class="table">
              <tbody>
                <tr>
                  <td>Date d'envoi: </td>
                  <td>{{ format_date(notification?.createdAt)  }}</td>
                </tr>
                <tr>
                  <td>{{ notification?.message }} </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-md-2 col-xxl-2 col-sm-2 mb-10">
      </div>

  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import ApiService from "@/services/ApiService";
import { format_date, error } from "@/utils/utils";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "ViewNotificationContentPage",
  setup: () => {
    const route = useRoute();
    const notification = ref<Notification | null>();

    function getNotification(id: string) {
      return ApiService.get("/notifications/"+id)
        .then(({ data }) => {
          notification.value = data;
        })
        .catch(({ response }) => {
          error(response.data.message);
        });
    }
  function updateEstLu(id: string) {
      ApiService.put("/notifications/lu/"+ id,1)
        .then(({ data }) => {
          //
        })
        .catch(({ response }) => {
          //
        });
  }


      onMounted(() => {
        const id = route.params.id as string;
        if(id) {
          getNotification(id);
          updateEstLu(id);
        }
    });



    return { notification, format_date};
  },
});
</script>