<template>
  <div class="card bg-white border-0 rounded-3 mb-4">
    <div class="card-body p-4">
      <div
        class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3 mb-lg-4"
      >
        <h3 class="mb-0">Top Selling Products</h3>
        <select
          class="form-select month-select form-control"
          aria-label="Default select example"
        >
          <option selected>Today</option>
          <option value="1">Weekly</option>
          <option value="2">Monthly</option>
          <option value="3">Yearly</option>
        </select>
      </div>

      <div class="default-table-area top-selling-products">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Price</th>
                <th scope="col">Order</th>
                <th scope="col">Stock</th>
                <th scope="col">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in paginatedItems" :key="item.id">
                <td>
                  <RouterLink
                    to="/ecommerce/product-details"
                    class="d-flex align-items-center"
                  >
                    <img
                      :src="item.product.image"
                      class="wh-40 rounded-3"
                      alt="product-1"
                    />
                    <div class="ms-2 ps-1">
                      <h6 class="fw-medium fs-14">
                        {{ item.product.name }}
                      </h6>
                      <span class="fs-12 text-body">
                        {{ item.product.date }}
                      </span>
                    </div>
                  </RouterLink>
                </td>
                <td>${{ item.price }}</td>
                <td>{{ item.order }}</td>
                <td :class="computeClass(item.stock)">{{ item.stock }}</td>
                <td>${{ item.amount }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="d-flex justify-content-center justify-content-sm-between align-items-center text-center flex-wrap gap-2 showing-wrap"
        >
          <span class="fs-12 fw-medium">
            Showing {{ startItem + 1 }} to {{ endItem }} of
            {{ items.length }} Results
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
import { computed, defineComponent, ref } from "vue";

interface Product {
  image: string;
  name: string;
  date: string;
}

interface Item {
  id: number;
  product: Product;
  price: string;
  order: number;
  stock: string | number;
  amount: string;
}

export default defineComponent({
  name: "TopSellingProducts",
  setup() {
    const items = ref<Item[]>([
      {
        id: 1,
        product: {
          image: "/src/assets/images/products/product1.jpg",
          name: "Smart Band",
          date: "15 Jun 2024",
        },
        price: "35.00",
        order: 75,
        stock: 750,
        amount: "2,625",
      },
      {
        id: 2,
        product: {
          image: "/src/assets/images/products/product2.jpg",
          name: "Headphone",
          date: "14 Jun 2024",
        },
        price: "49.00",
        order: 25,
        stock: 825,
        amount: "1,225",
      },
      {
        id: 3,
        product: {
          image: "/src/assets/images/products/product3.jpg",
          name: "iPhone 15 Plus",
          date: "13 Jun 2024",
        },
        price: "99.00",
        order: 55,
        stock: "Stock Out",
        amount: "5,445",
      },
      {
        id: 4,
        product: {
          image: "/src/assets/images/products/product4.jpg",
          name: "Bluetooth Speaker",
          date: "12 Jun 2024",
        },
        price: "59.00",
        order: 40,
        stock: 535,
        amount: "2,360",
      },
      {
        id: 5,
        product: {
          image: "/src/assets/images/products/product5.jpg",
          name: "Airbuds 2nd Gen",
          date: "11 Jun 2024",
        },
        price: "79.00",
        order: 56,
        stock: 460,
        amount: "4,424",
      },
      {
        id: 6,
        product: {
          image: "/src/assets/images/products/product2.jpg",
          name: "Headphone",
          date: "10 Jun 2024",
        },
        price: "49.00",
        order: 25,
        stock: 825,
        amount: "1,225",
      },
      {
        id: 7,
        product: {
          image: "/src/assets/images/products/product1.jpg",
          name: "Smart Band",
          date: "15 Jun 2024",
        },
        price: "35.00",
        order: 75,
        stock: 750,
        amount: "2,625",
      },
      {
        id: 8,
        product: {
          image: "/src/assets/images/products/product2.jpg",
          name: "Headphone",
          date: "14 Jun 2024",
        },
        price: "49.00",
        order: 25,
        stock: 825,
        amount: "1,225",
      },
      {
        id: 9,
        product: {
          image: "/src/assets/images/products/product3.jpg",
          name: "iPhone 15 Plus",
          date: "13 Jun 2024",
        },
        price: "99.00",
        order: 55,
        stock: "Stock Out",
        amount: "5,445",
      },
      {
        id: 10,
        product: {
          image: "/src/assets/images/products/product4.jpg",
          name: "Bluetooth Speaker",
          date: "12 Jun 2024",
        },
        price: "59.00",
        order: 40,
        stock: 535,
        amount: "2,360",
      },
      {
        id: 11,
        product: {
          image: "/src/assets/images/products/product5.jpg",
          name: "Airbuds 2nd Gen",
          date: "11 Jun 2024",
        },
        price: "79.00",
        order: 56,
        stock: 460,
        amount: "4,424",
      },
      {
        id: 12,
        product: {
          image: "/src/assets/images/products/product2.jpg",
          name: "Headphone",
          date: "10 Jun 2024",
        },
        price: "49.00",
        order: 25,
        stock: 825,
        amount: "1,225",
      },
    ]);

    const wordOutOfStock = ref("Stock Out");

    const computeClass = (classValue: string | number) => {
      return {
        "text-danger": wordOutOfStock.value === classValue,
      };
    };

    const itemsPerPage = ref(5);
    const currentPage = ref(1);

    const totalPages = computed(() =>
      Math.ceil(items.value.length / itemsPerPage.value)
    );

    const paginatedItems = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value;
      const end = start + itemsPerPage.value;
      return items.value.slice(start, end);
    });

    const startItem = computed(
      () => (currentPage.value - 1) * itemsPerPage.value
    );
    const endItem = computed(() =>
      Math.min(currentPage.value * itemsPerPage.value, items.value.length)
    );

    const goToPage = (page: number) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
      }
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };

    return {
      items,
      computeClass,
      currentPage,
      paginatedItems,
      totalPages,
      goToPage,
      prevPage,
      nextPage,
      startItem,
      endItem,
    };
  },
});
</script>
