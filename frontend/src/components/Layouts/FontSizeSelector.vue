<template>
  <div class="dropdown font-size-dropdown">
    <button
      class="btn-font-toggle transition d-inline-flex align-items-center justify-content-center position-relative border-0 rounded-circle bg-light"
      id="fontSizeDropdown"
      type="button"
      data-bs-toggle="dropdown"
      data-bs-auto-close="outside"
      aria-expanded="false"
      title="Ajuster la taille du texte"
    >
      <span class="font-icon fw-bold">A<span class="sub-a">a</span></span>
    </button>

    <div class="dropdown-menu dropdown-menu-end p-2 shadow-sm border-0 rounded-3 font-picker-popup">
      <div class="d-flex justify-content-between align-items-center mb-2 px-1">
        <span class="picker-title fw-bold text-dark d-flex align-items-center">
          <i class="flaticon-edit me-1 text-success"></i>
          Taille de police
        </span>
        <span class="badge bg-success rounded-pill px-2 py-0 fs-11">{{ currentFontSize }}px</span>
      </div>

      <!-- Contrôles rapides +/- et Slider -->
      <div class="d-flex align-items-center justify-content-between gap-1 mb-2 bg-light p-1 rounded-2">
        <button 
          class="btn-circle-action"
          @click="decreaseFont"
          :disabled="currentFontSize <= minFontSize"
          title="Diminuer (A-)"
        >
          A-
        </button>

        <!-- Slider -->
        <input
          type="range"
          class="form-range flex-grow-1 mx-1 custom-range-slider"
          :min="minFontSize"
          :max="maxFontSize"
          :step="1"
          v-model.number="currentFontSize"
          @input="applyFontSize(currentFontSize)"
        />

        <button 
          class="btn-circle-action"
          @click="increaseFont"
          :disabled="currentFontSize >= maxFontSize"
          title="Augmenter (A+)"
        >
          A+
        </button>
      </div>

      <!-- Boutons prédéfinis -->
      <div class="mb-2">
        <div class="d-flex justify-content-between align-items-center mb-1 px-1">
          <span class="text-muted text-uppercase fw-semibold" style="font-size: 10px; letter-spacing: 0.5px;">PRÉRÉGLAGES</span>
        </div>
        <div class="btn-group btn-group-sm w-100 preset-group" role="group">
          <button
            v-for="preset in presets"
            :key="preset.size"
            type="button"
            class="btn preset-btn"
            :class="currentFontSize === preset.size ? 'btn-success active-preset' : 'btn-outline-secondary'"
            @click="setFontSize(preset.size)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- Bouton réinitialiser -->
      <div class="text-center pt-1 border-top">
        <button 
          class="btn btn-link btn-reset p-0 text-muted"
          @click="resetFontSize"
        >
          <i class="flaticon-refresh me-1"></i> Rétablir par défaut ({{ defaultFontSize }}px)
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "FontSizeSelector",

  data() {
    return {
      currentFontSize: 16,
      defaultFontSize: 16,
      minFontSize: 12,
      maxFontSize: 24,
      presets: [
        { label: "Normal", size: 14 },
        { label: "Moyen", size: 16 },
        { label: "Grand", size: 18 },
        { label: "Très Grand", size: 20 },
      ],
    };
  },

  methods: {
    setFontSize(size: number) {
      this.currentFontSize = Math.min(Math.max(size, this.minFontSize), this.maxFontSize);
      this.applyFontSize(this.currentFontSize);
    },

    increaseFont() {
      if (this.currentFontSize < this.maxFontSize) {
        this.setFontSize(this.currentFontSize + 1);
      }
    },

    decreaseFont() {
      if (this.currentFontSize > this.minFontSize) {
        this.setFontSize(this.currentFontSize - 1);
      }
    },

    resetFontSize() {
      this.setFontSize(this.defaultFontSize);
    },

    applyFontSize(size: number) {
      document.documentElement.style.setProperty("--app-font-size", `${size}px`);
      localStorage.setItem("app_font_size", size.toString());
    },
  },

  mounted() {
    const savedSize = localStorage.getItem("app_font_size");
    if (savedSize) {
      const parsed = parseInt(savedSize, 10);
      if (!isNaN(parsed) && parsed >= this.minFontSize && parsed <= this.maxFontSize) {
        this.currentFontSize = parsed;
      }
    }
    this.applyFontSize(this.currentFontSize);
  },
});
</script>

<style scoped>
.btn-font-toggle {
  width: 36px;
  height: 36px;
  cursor: pointer;
  color: #2b2a3f;
  background-color: #f4f3f8;
  border: 1px solid #e2e1ec;
  font-size: 14px;
  line-height: 1;
}

.btn-font-toggle:hover {
  background-color: #33b04a;
  color: #ffffff;
  border-color: #33b04a;
}

.font-icon {
  display: inline-flex;
  align-items: baseline;
  letter-spacing: -1px;
}

.sub-a {
  font-size: 10px;
  font-weight: normal;
  margin-left: 1px;
}

/* Menu popup compact */
.font-picker-popup {
  width: 240px !important;
  min-width: 240px !important;
  max-width: 240px !important;
  font-size: 12px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  z-index: 1050;
}

.picker-title {
  font-size: 12px !important;
}

.btn-circle-action {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid #d0cfdd;
  background: #ffffff;
  color: #4a4863;
  font-size: 11px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-circle-action:hover:not(:disabled) {
  background: #33b04a;
  color: #ffffff;
  border-color: #33b04a;
}

.btn-circle-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.custom-range-slider {
  height: 4px;
  cursor: pointer;
  accent-color: #33b04a;
}

.preset-group {
  display: flex;
  width: 100%;
}

.preset-btn {
  flex: 1 1 0;
  font-size: 10.5px !important;
  padding: 3px 2px !important;
  line-height: 1.2 !important;
  white-space: nowrap !important;
  text-align: center;
}

.active-preset {
  background-color: #33b04a !important;
  border-color: #33b04a !important;
  color: #ffffff !important;
  font-weight: 600;
}

.btn-reset {
  font-size: 11px !important;
  text-decoration: none !important;
  cursor: pointer;
}

.btn-reset:hover {
  color: #33b04a !important;
}
</style>
