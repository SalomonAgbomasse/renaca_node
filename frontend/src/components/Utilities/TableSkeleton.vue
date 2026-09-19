<template>
  <tbody>
    <tr v-for="i in rows" :key="i" class="skeleton-row">
      <td v-for="(col, j) in columns" :key="j" :style="col.tdStyle || ''">
        <!-- Avatar + texte (première colonne si avatarCol) -->
        <div v-if="col.type === 'avatar'" class="d-flex align-items-center">
          <div class="skeleton-circle me-3"></div>
          <div>
            <div class="skeleton-line" style="width: 130px;"></div>
            <div class="skeleton-line mt-1" style="width: 90px; height: 10px;"></div>
          </div>
        </div>
        <!-- Badge -->
        <div v-else-if="col.type === 'badge'" class="skeleton-badge"></div>
        <!-- Boutons d'action -->
        <div v-else-if="col.type === 'actions'" class="d-flex gap-1">
          <div class="skeleton-btn"></div>
          <div class="skeleton-btn"></div>
        </div>
        <!-- Texte simple (défaut) -->
        <div v-else class="skeleton-line" :style="{ width: col.width || '100px' }"></div>
      </td>
    </tr>
  </tbody>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export interface SkeletonColumn {
  type?: 'avatar' | 'badge' | 'actions' | 'text';
  width?: string;
  tdStyle?: string;
}

export default defineComponent({
  name: 'TableSkeleton',
  props: {
    rows: {
      type: Number,
      default: 8,
    },
    columns: {
      type: Array as PropType<SkeletonColumn[]>,
      required: true,
    },
  },
});
</script>

<style scoped>
@keyframes skeleton-shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
}

.skeleton-row td {
  padding-top: 14px;
  padding-bottom: 14px;
  vertical-align: middle;
}

.skeleton-line,
.skeleton-badge,
.skeleton-circle,
.skeleton-btn {
  background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
  background-size: 600px 100%;
  animation: skeleton-shimmer 1.4s infinite linear;
  border-radius: 4px;
}

.skeleton-line {
  height: 14px;
  width: 100%;
}

.skeleton-badge {
  height: 22px;
  width: 72px;
  border-radius: 12px;
}

.skeleton-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
}
</style>
