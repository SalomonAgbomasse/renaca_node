<template>
  <div class="card bg-white border-0 rounded-3 mb-4">
    <div class="card-body p-4">
      <div
        class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3 mb-lg-4"
      >
        <h3 class="mb-0">Recent Orders</h3>
        <div class="d-flex">
          <form class="position-relative table-src-form" @submit.prevent>
            <input
              type="text"
              class="form-control"
              placeholder="Search here"
              v-model="searchTerm"
            />
            <i
              class="material-symbols-outlined position-absolute top-50 start-0 translate-middle-y"
            >
              search
            </i>
          </form>
          <select
            class="form-select month-select form-control"
            aria-label="Default select example"
          >
            <option selected>Show All</option>
            <option value="1">Weekly</option>
            <option value="2">Monthly</option>
            <option value="3">Yearly</option>
          </select>
        </div>
      </div>

      <div class="default-table-area recent-orders">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th scope="col">Order ID</th>
                <th scope="col">Customer</th>
                <th scope="col">Created</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in paginatedItems" :key="item.orderID">
                <td>{{ item.orderID }}</td>
                <td>
                  <RouterLink
                    to="/my-profile"
                    class="d-flex align-items-center"
                  >
                    <img
                      :src="item.customer.image"
                      class="wh-40 rounded-3"
                      alt="user"
                    />
                    <div class="ms-2 ps-1">
                      <h6 class="fw-medium fs-14">
                        {{ item.customer.name }}
                      </h6>
                    </div>
                  </RouterLink>
                </td>
                <td>{{ item.created }}</td>
                <td>${{ item.total }}</td>
                <td>
                  <span
                    class="badge bg-opacity-10 p-2 fs-12 fw-normal"
                    :class="computeClass(item.status)"
                  >
                    {{ item.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="d-flex justify-content-center justify-content-sm-between align-items-center text-center flex-wrap gap-2 showing-wrap"
        >
          <span class="fs-12 fw-medium">
            Showing {{ startItem + 1 }} to {{ endItem }} of
            {{ filteredItems.length }} Results
          </span>

          <nav aria-label="Page navigation example">
            <ul class="pagination mb-0 justify-content-center">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <a class="page-link icon" href="#" @click.prevent="prevPage">
                  <i class="material-symbols-outlined">keyboard_arrow_left</i>
                </a>
              </li>
              <li
                v-for="page in totalPages"
                :key="page"
                class="page-item"
                :class="{ active: currentPage === page }"
              >
                <a class="page-link" href="#" @click.prevent="goToPage(page)">
                  {{ page }}
                </a>
              </li>
              <li
                class="page-item"
                :class="{ disabled: currentPage === totalPages }"
              >
                <a class="page-link icon" href="#" @click.prevent="nextPage">
                  <i class="material-symbols-outlined">keyboard_arrow_right</i>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";

interface Customer {
  image: string;
  name: string;
}

interface Item {
  orderID: string;
  customer: Customer;
  created: string;
  total: string;
  status: string;
}

export default defineComponent({
  name: "RecentOrders",
  setup() {
    const items = ref<Item[]>([
      {
        orderID: "#JAN-2345",
        customer: {
          image: "/src/assets/images/user/user1.jpg",
          name: "Sarah Johnson",
        },
        created: "20 Jun, 2024",
        total: "10,490",
        status: "Shipped",
      },
      {
        orderID: "#JAN-1323",
        customer: {
          image: "/src/assets/images/user/user2.jpg",
          name: "Michael Smith",
        },
        created: "19 Jun, 2024",
        total: "6,575",
        status: "Confirmed",
      },
      {
        orderID: "#DEC-1234",
        customer: {
          image: "/src/assets/images/user/user3.jpg",
          name: "Emily Brown",
        },
        created: "18 Jun, 2024",
        total: "12,870",
        status: "Pending",
      },
      {
        orderID: "#DEC-3567",
        customer: {
          image: "/src/assets/images/user/user4.jpg",
          name: "Jason Lee",
        },
        created: "17 Jun, 2024",
        total: "7,895",
        status: "Shipped",
      },
      {
        orderID: "#DEC-1098",
        customer: {
          image: "/src/assets/images/user/user5.jpg",
          name: "Ashley Davis",
        },
        created: "16 Jun, 2024",
        total: "4,680",
        status: "Rejected",
      },
      {
        orderID: "#DEC-3567",
        customer: {
          image: "/src/assets/images/user/user4.jpg",
          name: "Jason Lee",
        },
        created: "17 Jun, 2024",
        total: "7,895",
        status: "Shipped",
      },
      {
        orderID: "#DEC-1098",
        customer: {
          image: "/src/assets/images/user/user5.jpg",
          name: "Ashley Davis",
        },
        created: "16 Jun, 2024",
        total: "4,680",
        status: "Rejected",
      },
      {
        orderID: "#JAN-2345",
        customer: {
          image: "/src/assets/images/user/user5.jpg",
          name: "Sarah Johnson",
        },
        created: "20 Jun, 2024",
        total: "10,490",
        status: "Shipped",
      },
      {
        orderID: "#JAN-1323",
        customer: {
          image: "/src/assets/images/user/user4.jpg",
          name: "Michael Smith",
        },
        created: "19 Jun, 2024",
        total: "6,575",
        status: "Confirmed",
      },
      {
        orderID: "#DEC-1234",
        customer: {
          image: "/src/assets/images/user/user3.jpg",
          name: "Emily Brown",
        },
        created: "18 Jun, 2024",
        total: "12,870",
        status: "Pending",
      },
      {
        orderID: "#DEC-3567",
        customer: {
          image: "/src/assets/images/user/user2.jpg",
          name: "Jason Lee",
        },
        created: "17 Jun, 2024",
        total: "7,895",
        status: "Shipped",
      },
      {
        orderID: "#DEC-1098",
        customer: {
          image: "/src/assets/images/user/user1.jpg",
          name: "Ashley Davis",
        },
        created: "16 Jun, 2024",
        total: "4,680",
        status: "Rejected",
      },
    ]);

    const searchTerm = ref("");
    const currentPage = ref(1);
    const itemsPerPage = ref(5);

    const totalPages = computed(() =>
      Math.ceil(filteredItems.value.length / itemsPerPage.value)
    );

    const startItem = computed(
      () => (currentPage.value - 1) * itemsPerPage.value
    );
    const endItem = computed(() =>
      Math.min(startItem.value + itemsPerPage.value, filteredItems.value.length)
    );

    const paginatedItems = computed(() => {
      return filteredItems.value.slice(startItem.value, endItem.value);
    });

    const filteredItems = computed(() => {
      return items.value.filter(
        (item: {
          orderID: string;
          customer: { name: string };
          created: string;
          total: string;
          status: string;
        }) =>
          item.orderID.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
          item.customer.name
            .toLowerCase()
            .includes(searchTerm.value.toLowerCase()) ||
          item.created.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
          item.total.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
          item.status.toLowerCase().includes(searchTerm.value.toLowerCase())
      );
    });

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };

    const goToPage = (page: number) => {
      currentPage.value = page;
    };

    const computeClass = (status: string) => {
      return {
        shipped: status === "Shipped",
        confirmed: status === "Confirmed",
        pending: status === "Pending",
        rejected: status === "Rejected",
      };
    };

    return {
      searchTerm,
      filteredItems,
      paginatedItems,
      computeClass,
      currentPage,
      totalPages,
      nextPage,
      prevPage,
      goToPage,
      startItem,
      endItem,
    };
  },
});
</script>
