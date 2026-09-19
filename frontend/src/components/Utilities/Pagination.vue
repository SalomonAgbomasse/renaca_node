<template>
  <div class="pagination-container d-flex justify-content-between align-items-center flex-wrap gap-2 w-100 py-2">
    <!-- Section gauche: Infos et Sélecteur du nombre d'éléments par page -->
    <div class="pagination-left d-flex align-items-center flex-wrap gap-3">
      <p class="mb-0 text-muted fs-13">
        <span v-if="totalElements > 0">
          Affichage de <span class="fw-bold text-dark">{{ ((page - 1) * limit) + 1 }}</span> 
          à <span class="fw-bold text-dark">{{ ((limit * page) > totalElements) ? totalElements : (limit * page) }}</span>
          sur <span class="fw-bold text-dark">{{ totalElements }}</span> enregistrement(s)
        </span>
        <span v-else>
          Aucun enregistrement trouvé
        </span>
      </p>

      <!-- Sélecteur d'éléments par page -->
      <div v-if="totalElements > 0" class="d-flex align-items-center gap-2 page-size-selector">
        <label for="pageSizeSelect" class="text-muted fs-13 mb-0 text-nowrap">Afficher</label>
        <select 
          id="pageSizeSelect"
          :value="limit" 
          @change="onLimitChange($event)"
          class="form-select form-select-sm custom-limit-select"
          aria-label="Nombre d'éléments par page"
        >
          <option v-for="size in pageSizes" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
        <span class="text-muted fs-13 text-nowrap">par page</span>
      </div>
    </div>

    <!-- Section droite: Contrôles de navigation pagination -->
    <div class="pagination-controls text-end flex-shrink-0" v-if="totalPages > 1">
      <nav aria-label="Pagination">
        <ul class="pagination pagination-sm mb-0 align-items-center gap-1">
          <!-- Page précédente -->
          <li class="page-item" :class="{ disabled: page === 1 }">
            <button 
              type="button" 
              class="page-link custom-page-btn" 
              :disabled="page === 1"
              @click="pagination(page - 1, limit)" 
              aria-label="Précédent"
            >
              <i class="flaticon-chevron-1"></i>
            </button>
          </li>

          <!-- Numéros de page -->
          <li 
            v-for="(n, idx) in pageNumbers" 
            :key="idx" 
            class="page-item"
            :class="{ active: n === page, disabled: n === '...' }"
          >
            <span v-if="n === '...'" class="page-link ellipsis-item">...</span>
            <button 
              v-else
              type="button"
              class="page-link custom-page-btn"
              :class="{ 'active-page': n === page }"
              @click="pagination(n, limit)"
            >
              {{ n }}
            </button>
          </li>

          <!-- Page suivante -->
          <li class="page-item" :class="{ disabled: page === totalPages }">
            <button 
              type="button" 
              class="page-link custom-page-btn" 
              :disabled="page === totalPages"
              @click="pagination(page + 1, limit)" 
              aria-label="Suivant"
            >
              <i class="flaticon-chevron"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'PaginationComponent',
  emits: ['paginate', 'update:limit'],
  props: {
    page: {
      type: Number,
      default: 1
    },
    totalPages: {
      type: Number,
      default: 0
    },
    limit: {
      type: Number,
      default: 10
    },
    totalElements: {
      type: Number,
      default: 0
    },
    pageSizes: {
      type: Array,
      default: () => [10, 25, 50, 100]
    }
  },
  setup(props, { emit }) {
    const pageNumbers = computed(() => {
      let numbers = [];
      let start = props.page - 2 > 0 ? props.page - 2 : 1;
      let end = props.page + 2 <= props.totalPages ? props.page + 2 : props.totalPages;

      if (start > 1) {
        numbers.push('<<', 1);
        if (start > 2) numbers.push('...');
      }

      for (let i = start; i <= end; i++) {
        numbers.push(i);
      }

      if (end < props.totalPages) {
        if (end < props.totalPages - 1) numbers.push('...');
        numbers.push(props.totalPages, '>>');
      }

      return numbers;
    });

    const pagination = (page_, limit_) => {
      if (typeof page_ === 'string') {
        switch (page_) {
          case '<<':
            emit('paginate', { page_: 1, limit_: limit_ });
            break;
          case '>>':
            emit('paginate', { page_: props.totalPages, limit_: limit_ });
            break;
        }
      } else if (typeof page_ === 'number') {
        emit('paginate', { page_: page_, limit_: limit_ });
      }
    };

    const onLimitChange = (event) => {
      const newLimit = parseInt(event.target.value, 10) || 10;
      emit('update:limit', newLimit);
      // Toujours revenir à la première page lors du changement de limite par page
      emit('paginate', { page_: 1, limit_: newLimit });
    };

    return { 
      pageNumbers, 
      pagination,
      onLimitChange
    };
  },
};
</script>

<style scoped>
.pagination-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
}

.fs-13 {
  font-size: 13px !important;
}

.custom-limit-select {
  width: auto !important;
  min-width: 80px !important;
  height: 32px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
  color: #1e293b !important;
  background-color: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 6px !important;
  padding: 4px 30px 4px 12px !important;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  text-align: left !important;
}

.custom-limit-select:hover {
  border-color: #94a3b8;
  background-color: #ffffff;
}

.custom-limit-select:focus {
  border-color: #059669;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
  outline: none;
}

.custom-page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px !important;
  margin: 0 1px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  text-decoration: none;
}

.custom-page-btn:hover:not(:disabled) {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
}

.custom-page-btn:disabled,
.page-item.disabled .custom-page-btn {
  color: #cbd5e1;
  background-color: #f8fafc;
  border-color: #f1f5f9;
  cursor: not-allowed;
}

.active-page,
.page-item.active .custom-page-btn {
  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
  border-color: #047857 !important;
  color: #ffffff !important;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(5, 150, 105, 0.25);
}

.ellipsis-item {
  border: none;
  background: transparent;
  color: #94a3b8;
  padding: 0 4px;
  line-height: 32px;
}

@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column !important;
    align-items: center !important;
    gap: 12px;
  }
  
  .pagination-left {
    justify-content: center !important;
    text-align: center !important;
  }
  
  .pagination-controls {
    text-align: center !important;
  }
}
</style>