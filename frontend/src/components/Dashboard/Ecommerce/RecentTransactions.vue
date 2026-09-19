<template>
  <div class="card bg-white border-0 rounded-3 mb-4">
    <div class="card-body p-4">
      <div
        class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3 mb-lg-4"
      >
        <h3 class="mb-0">Recent Transactions</h3>

        <div class="dropdown action-opt">
          <button
            class="btn bg-transparent p-0"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i class="material-symbols-outlined">more_horiz</i>
          </button>

          <ul
            class="dropdown-menu dropdown-menu-end bg-white border box-shadow"
          >
            <li>
              <a class="dropdown-item" href="javascript:;">
                <i class="material-symbols-outlined">schedule</i>
                Today
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="javascript:;">
                <i class="material-symbols-outlined">pie_chart</i>
                Last 7 Days
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="javascript:;">
                <i class="material-symbols-outlined">refresh</i>
                Last Month
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="javascript:;">
                <i class="material-symbols-outlined">calendar_month</i>
                Last 1 Year
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="javascript:;">
                <i class="material-symbols-outlined">bar_chart</i>
                All Time
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="javascript:;">
                <i class="material-symbols-outlined">visibility</i>
                View
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="javascript:;">
                <i class="material-symbols-outlined">delete</i>
                Delete
              </a>
            </li>
          </ul>
        </div>
      </div>

      <ul class="ps-0 mb-0 list-unstyled">
        <li
          v-for="(transaction, index) in transactions"
          :key="index"
          :class="[
            'd-flex align-items-center justify-content-between',
            transaction.className,
          ]"
        >
          <div class="d-flex align-items-center">
            <div class="flex-shrink-0">
              <i
                class="material-symbols-outlined icon-circle"
                :class="[
                  transaction.iconColor,
                  transaction.iconBgColor,
                  'bg-opacity-10',
                  'text-center',
                  'rounded-circle',
                  'wh-40',
                  'lh-40',
                ]"
              >
                {{ transaction.icon }}
              </i>
            </div>
            <div class="flex-grow-1 ms-2">
              <h6 class="fw-medium fs16 mb-0">{{ transaction.name }}</h6>
              <span class="fs-12">{{ transaction.date }}</span>
            </div>
          </div>
          <span
            :class="[
              'fs-14 fw-medium',
              transaction.amount > 0 ? 'text-success' : 'text-danger',
            ]"
          >
            {{
              transaction.amount > 0
                ? `+${transaction.amount}`
                : transaction.amount
            }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "RecentTransactions",
  setup() {
    const transactions = [
      {
        name: "Master Card",
        date: "23 Dec 2023 - 3:20 pm",
        amount: 1520,
        icon: "credit_card",
        className: "mb-3 pb-3",
        iconColor: "text-primary",
        iconBgColor: "bg-primary",
      },
      {
        name: "Paypal",
        date: "23 Dec 2023 - 3:20 pm",
        amount: -2250,
        icon: "redeem",
        className: "mb-3 pb-3",
        iconColor: "text-danger",
        iconBgColor: "bg-danger",
      },
      {
        name: "Wise",
        date: "23 Dec 2023 - 3:20 pm",
        amount: 3560,
        icon: "account_balance",
        className: "mb-3 pb-3",
        iconColor: "text-primary-div",
        iconBgColor: "bg-primary-div",
      },
      {
        name: "Payoneer",
        date: "23 Dec 2023 - 3:20 pm",
        amount: 6500,
        icon: "currency_ruble",
        className: "mb-3 pb-3",
        iconColor: "text-info",
        iconBgColor: "bg-info",
      },
      {
        name: "Credit Card",
        date: "23 Dec 2023 - 3:20 pm",
        amount: 4320,
        icon: "credit_score",
        className: "",
        iconColor: "text-primary",
        iconBgColor: "bg-primary",
      },
    ];

    return {
      transactions,
    };
  },
});
</script>
