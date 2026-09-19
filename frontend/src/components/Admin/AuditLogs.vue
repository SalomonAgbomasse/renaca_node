<template>
  <div class="card mb-25 border-0 rounded-4 shadow-soft bg-white anim-fade-in">
    <div
      class="card-head-premium p-4 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-3"
    >
      <div class="d-flex align-items-center gap-3">
        <div
          class="btn-group-premium"
          role="group"
          aria-label="Source des logs"
        >
          <button
            type="button"
            class="btn btn-tab-premium"
            :class="{ active: activeTab === 'db' }"
            @click="activeTab = 'db'; loadLogs()"
          >
            <i class="fas fa-database me-2"></i>Base de Données
          </button>
          <button
            type="button"
            class="btn btn-tab-premium"
            :class="{ active: activeTab === 'files' }"
            @click="activeTab = 'files'; loadFiles()"
          >
            <i class="fas fa-file-alt me-2"></i>Fichiers Journaliers
          </button>
        </div>

        <button
          class="btn btn-refresh-premium"
          type="button"
          @click="activeTab === 'db' ? loadLogs() : loadFiles()"
          :disabled="loading"
        >
          <i class="fas fa-sync-alt me-2" :class="{ 'fa-spin': loading }"></i>
          Actualiser
        </button>
      </div>

      <!-- Filtres -->
      <div class="d-flex align-items-center">
        <form
          v-if="activeTab === 'db'"
          class="d-flex align-items-end flex-wrap gap-2"
          @submit.prevent="onApplyFilters"
        >
          <div class="filter-item">
            <label class="form-label-premium">Utilisateur (ID)</label>
            <input
              v-model="filters.userId"
              type="number"
              min="0"
              class="form-control-premium"
              placeholder="Tous"
              style="width: 100px"
            />
          </div>

          <div class="filter-item">
            <label class="form-label-premium">Action</label>
            <input
              v-model="filters.action"
              type="text"
              class="form-control-premium"
              placeholder="Ex: LOGIN, UPDATE..."
              style="width: 180px"
            />
          </div>

          <div class="filter-item">
            <label class="form-label-premium">Du</label>
            <input
              v-model="filters.startDate"
              type="date"
              class="form-control-premium"
              style="width: 140px"
            />
          </div>

          <div class="filter-item">
            <label class="form-label-premium">Au</label>
            <input
              v-model="filters.endDate"
              type="date"
              class="form-control-premium"
              style="width: 140px"
            />
          </div>

          <div class="d-flex gap-2 ms-2">
            <button
              class="btn btn-primary-premium"
              type="submit"
              :disabled="loading"
            >
              <i class="fas fa-filter me-1"></i> Filtrer
            </button>

            <button
              class="btn btn-outline-premium"
              type="button"
              @click="onResetFilters"
              :disabled="loading"
            >
              RàZ
            </button>
          </div>
        </form>
        <div v-else class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center gap-2">
            <label class="form-label-premium mb-0">Max lecture</label>
            <select
              v-model.number="maxBytes"
              class="form-select-premium form-select-sm"
              @change="selectedFile && openFile(selectedFile.filename)"
            >
              <option :value="200000">200 KB</option>
              <option :value="500000">500 KB</option>
              <option :value="1000000">1 MB</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Skeleton loader -->
    <div v-if="loading" class="card-body p-4">
      <div class="table-responsive table-premium-container">
        <table class="table table-premium align-middle mb-0">
          <thead>
            <tr>
              <th scope="col" style="width: 170px">Date</th>
              <th scope="col" style="width: 100px">Utilisateur</th>
              <th scope="col" style="width: 90px">Méthode</th>
              <th scope="col">Endpoint</th>
              <th scope="col" style="width: 90px">Status</th>
              <th scope="col" style="width: 150px">Action</th>
              <th scope="col">Description</th>
              <th scope="col" style="width: 130px">Adresse IP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in 10" :key="i" class="skeleton-row">
              <td>
                <div class="skeleton-line" style="width: 140px;"></div>
                <div class="skeleton-badge mt-1" style="width: 60px; height: 16px;"></div>
              </td>
              <td><div class="skeleton-badge" style="width: 90px;"></div></td>
              <td><div class="skeleton-badge" style="width: 50px;"></div></td>
              <td><div class="skeleton-line" style="width: 200px;"></div></td>
              <td><div class="skeleton-badge" style="width: 50px;"></div></td>
              <td><div class="skeleton-line" style="width: 110px;"></div></td>
              <td><div class="skeleton-line" style="width: 180px;"></div></td>
              <td><div class="skeleton-line" style="width: 100px;"></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="card-body p-4">
      <!-- TAB DB -->
      <template v-if="activeTab === 'db'">
        <div class="table-responsive table-premium-container">
          <table class="table table-premium align-middle mb-0">
            <thead>
              <tr>
                <th scope="col" style="width: 170px">Date</th>
                <th scope="col" style="width: 100px">Utilisateur</th>
                <th scope="col" style="width: 90px">Méthode</th>
                <th scope="col">Endpoint</th>
                <th scope="col" style="width: 90px">Status</th>
                <th scope="col" style="width: 150px">Action</th>
                <th scope="col">Description</th>
                <th scope="col" style="width: 130px">Adresse IP</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="logs.length === 0">
                <td colspan="8" class="text-center text-muted py-5">
                  <i class="fas fa-history fa-3x text-light mb-3 d-block"></i>
                  Aucun log trouvé dans la base de données
                </td>
              </tr>
              <tr v-for="log in logs" :key="log.id" class="anim-row-in">
                <td class="fw-medium text-dark">
                  <div>
                    <span class="d-block">{{
                      formatDateTime(log.createdAt)
                    }}</span>
                    <small
                      v-if="log.duration != null"
                      class="duration-badge mt-1 d-inline-block"
                    >
                      <i class="far fa-clock me-1"></i
                      >{{ formatDuration(log.duration) }}
                    </small>
                  </div>
                </td>

                <td>
                  <span v-if="log.user" class="badge-user" :title="'ID: #' + log.userId">
                    <i class="fas fa-user-circle me-1"></i>{{ log.user.firstname }} {{ log.user.lastname }}
                  </span>
                  <span v-else-if="log.userId" class="badge-user">
                    <i class="fas fa-user-circle me-1"></i>#{{ log.userId }}
                  </span>
                  <span v-else class="badge-system">
                    <i class="fas fa-robot me-1"></i>Système
                  </span>
                </td>

                <td>
                  <span
                    class="badge-method"
                    :class="getMethodBadgeClass(log.method)"
                  >
                    {{ (log.method || "").toUpperCase() }}
                  </span>
                </td>

                <td>
                  <code class="endpoint-code">{{ log.endpoint }}</code>
                </td>

                <td>
                  <span
                    class="badge-status"
                    :class="getStatusBadgeClass(log.statusCode)"
                  >
                    {{ log.statusCode ?? "-" }}
                  </span>
                </td>

                <td>
                  <span class="badge-action-label">{{ log.action }}</span>
                </td>

                <td class="text-dark">
                  <span class="fw-semibold">{{ log.description || "-" }}</span>
                </td>

                <td class="text-secondary small">
                  <i class="fas fa-network-wired me-1 opacity-75"></i
                  >{{ log.ipAddress || "-" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          class="pagination-area d-md-flex mt-4 justify-content-between align-items-center"
          v-if="totalElements > 0"
        >
          <PaginationComponent
            :page="page"
            :totalPages="totalPages"
            :totalElements="totalElements"
            :limit="limit"
            @paginate="handlePaginate"
          />
        </div>
      </template>

      <!-- TAB FILES -->
      <template v-else>
        <div class="row g-4">
          <div class="col-lg-4">
            <div class="file-list-card p-3 rounded-4 shadow-soft">
              <div
                class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom"
              >
                <span class="fw-bold text-dark"
                  ><i class="fas fa-folder-open me-2 text-primary"></i>Fichiers
                  journaux</span
                >
                <span class="badge bg-primary rounded-pill">{{
                  files.length
                }}</span>
              </div>
              <div v-if="filesLoading" class="text-center py-4">
                <div
                  class="spinner-border spinner-border-sm text-primary"
                  role="status"
                ></div>
              </div>
              <div
                v-else-if="files.length === 0"
                class="text-center py-4 text-muted small"
              >
                Aucun fichier journal trouvé
              </div>
              <div v-else class="file-buttons-container">
                <button
                  v-for="f in files"
                  :key="f.filename"
                  type="button"
                  class="btn-file-item"
                  :class="{ active: selectedFile?.filename === f.filename }"
                  @click="openFile(f.filename)"
                >
                  <span class="text-truncate flex-grow-1 text-start">
                    <i class="far fa-file-code me-2"></i>{{ f.date }}
                  </span>
                  <span class="file-size-badge">
                    {{ formatSize(f.size) }}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div class="col-lg-8">
            <div class="file-content-card p-3 rounded-4 shadow-soft">
              <div
                class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom"
              >
                <div>
                  <div class="d-flex align-items-center gap-2">
                    <span class="fw-bold text-dark me-2">
                      <i class="fas fa-terminal me-2 text-success"></i>Journal d'activité
                    </span>
                    <div v-if="selectedFile" class="btn-group btn-group-sm rounded-3 shadow-sm" role="group" style="padding: 2px; background-color: #f1f3f9;">
                      <button
                        type="button"
                        class="btn btn-sm btn-tab-premium py-1 px-2 border-0"
                        :class="{ active: viewMode === 'structured' }"
                        style="font-size: 0.75rem;"
                        @click="viewMode = 'structured'"
                      >
                        <i class="fas fa-list me-1"></i>Visuel
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-tab-premium py-1 px-2 border-0"
                        :class="{ active: viewMode === 'raw' }"
                        style="font-size: 0.75rem;"
                        @click="viewMode = 'raw'"
                      >
                        <i class="fas fa-code me-1"></i>Brut
                      </button>
                    </div>
                  </div>
                  <div
                    v-if="selectedFile"
                    class="text-muted small mt-1 font-monospace"
                  >
                    {{ selectedFile.filename }}
                    <span
                      v-if="selectedFile.truncated"
                      class="ms-2 badge bg-warning text-dark font-sans"
                    >
                      Tronqué (Derniers {{ formatSize(maxBytes) }})
                    </span>
                  </div>
                </div>
                <button
                  v-if="selectedFile"
                  type="button"
                  class="btn btn-sm btn-outline-primary shadow-sm rounded-3 px-3"
                  @click="openRawInNewTab"
                >
                  <i class="fas fa-external-link-alt me-1"></i> Ouvrir Brut
                </button>
              </div>

              <div v-if="fileContentLoading" class="text-center py-5">
                <div class="spinner-border text-success" role="status"></div>
                <p class="mt-2 text-muted small">
                  Lecture du fichier journal...
                </p>
              </div>
              <div
                v-else-if="!selectedFile"
                class="empty-file-viewer py-5 text-center text-muted"
              >
                <i class="fas fa-file-signature fa-3x mb-3 text-light"></i>
                <p class="mb-0">
                  Sélectionnez un fichier dans la liste de gauche pour afficher
                  les logs.
                </p>
              </div>
              <template v-else>
                <!-- Vue Structurée -->
                <div v-if="viewMode === 'structured'" class="structured-log-viewer text-dark">
                  <div class="table-responsive table-premium-container border-0 rounded-3 shadow-sm bg-light p-2" style="max-height: 520px; overflow-y: auto;">
                    <table class="table table-sm align-middle mb-0 text-dark table-hover">
                      <thead>
                        <tr>
                          <th scope="col" style="width: 100px; color: #4a5568; font-size: 0.72rem; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e0;">Heure</th>
                          <th scope="col" style="width: 150px; color: #4a5568; font-size: 0.72rem; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e0;">Utilisateur</th>
                          <th scope="col" style="width: 130px; color: #4a5568; font-size: 0.72rem; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e0;">Action</th>
                          <th scope="col" style="color: #4a5568; font-size: 0.72rem; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e0;">Description</th>
                          <th scope="col" style="width: 80px; color: #4a5568; font-size: 0.72rem; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e0;">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="parsedFileLogs.length === 0">
                          <td colspan="5" class="text-center text-muted py-4">
                            Aucune ligne d'activité valide trouvée dans ce fichier
                          </td>
                        </tr>
                        <tr v-for="(fLog, index) in parsedFileLogs" :key="index">
                          <template v-if="fLog.isRaw">
                            <td colspan="5" class="font-monospace text-muted small py-2 break-all-word">
                              {{ fLog.content }}
                            </td>
                          </template>
                          <template v-else>
                            <td class="small text-secondary fw-semibold">
                              {{ formatFileTime(fLog.timestamp) }}
                            </td>
                            <td>
                              <span v-if="fLog.user" class="badge-user py-1 px-2" :title="'ID: #' + fLog.userId">
                                <i class="fas fa-user-circle me-1"></i>{{ fLog.user }}
                              </span>
                              <span v-else-if="fLog.userId" class="badge-user py-1 px-2">
                                <i class="fas fa-user-circle me-1"></i>#{{ fLog.userId }}
                              </span>
                              <span v-else class="badge-system py-1 px-2">
                                <i class="fas fa-robot me-1"></i>Système
                              </span>
                            </td>
                            <td>
                              <span class="badge-action-label py-1 px-2 bg-white text-dark border rounded small d-inline-block">{{ fLog.action }}</span>
                            </td>
                            <td class="text-dark">
                              <span class="fw-semibold">{{ fLog.description || (fLog.method + ' ' + fLog.endpoint) }}</span>
                            </td>
                            <td>
                              <span class="badge-status py-1 px-2 rounded font-monospace small" :class="getStatusBadgeClass(fLog.statusCode)">
                                {{ fLog.statusCode || '-' }}
                              </span>
                            </td>
                          </template>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Vue Brute -->
                <pre v-else class="log-viewer-pane">{{
                  selectedFile.content
                }}</pre>
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref, computed } from "vue";
import ApiService from "../../services/ApiService";
import PaginationComponent from "../Utilities/Pagination.vue";

interface AuditLog {
  id: number;
  userId: number | null;
  user?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  } | null;
  method: string;
  endpoint: string;
  action: string;
  description: string | null;
  statusCode: number | null;
  ipAddress: string | null;
  duration: number | null;
  createdAt: string;
}

export default defineComponent({
  name: "AuditLogs",
  components: { PaginationComponent },
  setup() {
    const activeTab = ref<"db" | "files">("db");

    const logs = ref<AuditLog[]>([]);
    const loading = ref(false);
    const totalElements = ref(0);
    const limit = ref(50);
    const page = ref(1);

    const filters = reactive<{
      userId: string;
      action: string;
      startDate: string | null;
      endDate: string | null;
    }>({
      userId: "",
      action: "",
      startDate: null,
      endDate: null,
    });

    const totalPages = computed(() =>
      totalElements.value === 0
        ? 1
        : Math.ceil(totalElements.value / limit.value)
    );

    // ---- FILE LOGS ----
    const filesLoading = ref(false);
    const fileContentLoading = ref(false);
    const maxBytes = ref(500000);
    const files = ref<
      Array<{ filename: string; date: string; size: number; updatedAt: string }>
    >([]);
    const selectedFile = ref<{
      filename: string;
      size: number;
      content: string;
      truncated: boolean;
    } | null>(null);

    const viewMode = ref<"structured" | "raw">("structured");

    const parsedFileLogs = computed(() => {
      if (!selectedFile.value || !selectedFile.value.content) return [];
      const lines = selectedFile.value.content.split("\n");
      const list: any[] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          list.push(parsed);
        } catch {
          list.push({ isRaw: true, content: line });
        }
      }
      return list;
    });

    const formatFileTime = (val: string): string => {
      if (!val) return "";
      try {
        const date = new Date(val);
        return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      } catch {
        return val;
      }
    };

    const buildQueryParams = () => {
      const offset = (page.value - 1) * limit.value;
      const params: Record<string, any> = {
        limit: limit.value,
        offset,
      };

      if (filters.userId) {
        const parsed = parseInt(filters.userId, 10);
        if (!Number.isNaN(parsed)) params.userId = parsed;
      }
      if (filters.action) params.action = filters.action;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      return params;
    };

    const loadLogs = async () => {
      loading.value = true;
      try {
        const params = buildQueryParams();
        const response = await ApiService.query("/audit-logs/all", params);
        const payload = response.data;
        const inner = payload?.data ?? payload;

        const dataObj = (inner && typeof inner === "object" && "logs" in inner) ? inner : (inner?.data ?? inner);
        logs.value = dataObj?.logs || [];
        totalElements.value = dataObj?.total ?? logs.value.length;
      } catch (error) {
        console.error("Erreur lors du chargement des logs", error);
      } finally {
        loading.value = false;
      }
    };

    const loadFiles = async () => {
      filesLoading.value = true;
      try {
        const response = await ApiService.get("/audit-logs/files");
        const payload = response.data;
        const inner = payload?.data ?? payload;

        const dataObj = (inner && typeof inner === "object" && "files" in inner) ? inner : (inner?.data ?? inner);
        files.value = dataObj?.files || [];
        if (files.value.length > 0 && !selectedFile.value) {
          openFile(files.value[0].filename);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des fichiers de logs", error);
      } finally {
        filesLoading.value = false;
      }
    };

    const openFile = async (filename: string) => {
      fileContentLoading.value = true;
      try {
        const response = await ApiService.query(`/audit-logs/files/${filename}`, {
          maxBytes: maxBytes.value,
        });
        const payload = response.data;
        const inner = payload?.data ?? payload;

        const dataObj = (inner && typeof inner === "object" && "content" in inner) ? inner : (inner?.data ?? inner);
        selectedFile.value = dataObj;
      } catch (error) {
        console.error("Erreur lors de la lecture du fichier de log", error);
      } finally {
        fileContentLoading.value = false;
      }
    };

    const openRawInNewTab = () => {
      if (!selectedFile.value) return;
      const url = `/api/audit-logs/files/${selectedFile.value.filename}?maxBytes=${maxBytes.value}`;
      window.open(url, "_blank");
    };

    const handlePaginate = ({
      page_: newPage,
    }: {
      page_: number;
      limit_: number;
    }) => {
      page.value = newPage;
      loadLogs();
    };

    const onApplyFilters = () => {
      page.value = 1;
      loadLogs();
    };

    const onResetFilters = () => {
      filters.userId = "";
      filters.action = "";
      filters.startDate = null;
      filters.endDate = null;
      page.value = 1;
      loadLogs();
    };

    const formatDateTime = (
      value: string | Date | null | undefined
    ): string => {
      if (!value) return "-";
      try {
        const date = typeof value === "string" ? new Date(value) : value;
        return date.toLocaleString("fr-FR");
      } catch {
        return String(value);
      }
    };

    const formatDuration = (duration: number | null | undefined): string => {
      if (duration == null) return "";
      if (duration < 1000) return `${duration} ms`;
      return `${(duration / 1000).toFixed(2)} s`;
    };

    const getMethodBadgeClass = (method: string | null | undefined): string => {
      const m = (method || "").toUpperCase();
      if (m === "GET") return "bg-info-soft text-info";
      if (m === "POST") return "bg-success-soft text-success";
      if (m === "PUT" || m === "PATCH") return "bg-warning-soft text-warning";
      if (m === "DELETE") return "bg-danger-soft text-danger";
      return "bg-light text-muted";
    };

    const getStatusBadgeClass = (status: number | null | undefined): string => {
      if (status == null) return "bg-light text-muted";
      if (status >= 200 && status < 300) return "status-success";
      if (status >= 300 && status < 400) return "status-redirect";
      if (status >= 400 && status < 500) return "status-client-error";
      if (status >= 500) return "status-server-error";
      return "bg-light text-muted";
    };

    onMounted(loadLogs);

    const formatSize = (bytes: number): string => {
      if (!Number.isFinite(bytes)) return "-";
      if (bytes < 1024) return `${bytes} o`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return {
      activeTab,
      logs,
      loading,
      totalElements,
      limit,
      page,
      totalPages,
      filters,
      loadLogs,
      loadFiles,
      files,
      filesLoading,
      selectedFile,
      fileContentLoading,
      openFile,
      maxBytes,
      openRawInNewTab,
      onApplyFilters,
      onResetFilters,
      handlePaginate,
      formatDateTime,
      formatDuration,
      getMethodBadgeClass,
      getStatusBadgeClass,
      formatSize,
      viewMode,
      parsedFileLogs,
      formatFileTime,
    };
  },
});
</script>

<style scoped>
.shadow-soft {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.anim-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-head-premium {
  background: linear-gradient(
    135deg,
    rgba(101, 96, 240, 0.02) 0%,
    rgba(101, 96, 240, 0) 100%
  );
}

.btn-group-premium {
  display: inline-flex;
  background-color: #f1f3f9;
  padding: 4px;
  border-radius: 12px;
}

.btn-tab-premium {
  border: none;
  background: transparent;
  color: #5c6a85;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.25s ease;
}

.btn-tab-premium:hover {
  color: var(--splash-primary-color);
}

.btn-tab-premium.active {
  background-color: white;
  color: var(--splash-primary-color);
  box-shadow: 0 2px 8px rgba(101, 96, 240, 0.15);
}

.btn-refresh-premium {
  border: 1px solid #e2e8f0;
  background-color: white;
  color: #4a5568;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 8px 16px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease;
}

.btn-refresh-premium:hover:not(:disabled) {
  background-color: #f7fafc;
  color: var(--splash-primary-color);
  border-color: var(--splash-primary-color);
}

.form-label-premium {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.form-control-premium,
.form-select-premium {
  height: 38px;
  border: 1px solid #cbd5e0;
  background-color: #f7fafc;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.85rem;
  color: #2d3748;
  font-weight: 500;
  outline: none;
  transition: all 0.2s ease;
}

.form-control-premium:focus,
.form-select-premium:focus {
  border-color: var(--splash-primary-color);
  background-color: white;
  box-shadow: 0 0 0 3px rgba(101, 96, 240, 0.15);
}

.btn-primary-premium {
  background-color: var(--splash-primary-color);
  border: none;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  height: 38px;
  padding: 0 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(101, 96, 240, 0.2);
}

.btn-primary-premium:hover:not(:disabled) {
  background-color: var(--splash-primary-active-color);
  transform: translateY(-1px);
}

.btn-outline-premium {
  background-color: transparent;
  border: 1px solid #cbd5e0;
  color: #4a5568;
  font-weight: 600;
  font-size: 0.85rem;
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-outline-premium:hover {
  background-color: #edf2f7;
  color: #2d3748;
}

/* Table Premium styling */
.table-premium-container {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.table-premium {
  width: 100%;
}

.table-premium thead {
  background-color: #f7fafc;
}

.table-premium th {
  font-weight: 700;
  color: #4a5568;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  padding: 14px 16px;
  border-bottom: 2px solid #edf2f7;
}

.table-premium td {
  padding: 14px 16px;
  border-bottom: 1px solid #edf2f7;
  font-size: 0.85rem;
}

.table-premium tbody tr:hover {
  background-color: rgba(101, 96, 240, 0.015);
}

.anim-row-in {
  animation: rowIn 0.3s ease-out both;
}

@keyframes rowIn {
  from {
    opacity: 0;
    transform: translateX(-5px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.duration-badge {
  background-color: #edf2f7;
  color: #4a5568;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
}

.badge-user {
  background-color: #ebf8ff;
  color: #2b6cb0;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.78rem;
}

.badge-system {
  background-color: #f7fafc;
  color: #718096;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.78rem;
}

.badge-method {
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  display: inline-block;
  text-align: center;
  min-width: 60px;
}

.bg-info-soft {
  background-color: rgba(13, 202, 240, 0.1);
}
.bg-success-soft {
  background-color: rgba(25, 135, 84, 0.1);
}
.bg-warning-soft {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-danger-soft {
  background-color: rgba(220, 53, 69, 0.1);
}

.endpoint-code {
  font-family: Consolas, Monaco, monospace;
  background-color: #f7fafc;
  color: #d63384;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  word-break: break-all;
}

.badge-status {
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.78rem;
}

.status-success {
  background-color: #c6f6d5;
  color: #22543d;
}
.status-redirect {
  background-color: #e0fcff;
  color: #0b6c7f;
}
.status-client-error {
  background-color: #feebc8;
  color: #744210;
}
.status-server-error {
  background-color: #fed7d7;
  color: #742a2a;
}

.badge-action-label {
  background-color: #e2e8f0;
  color: #4a5568;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.72rem;
}

/* File tabs styling */
.file-list-card,
.file-content-card {
  border: 1px solid #e2e8f0;
  background-color: white;
  min-height: 400px;
}

.file-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 450px;
  overflow-y: auto;
}

.btn-file-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background-color: #f7fafc;
  border: 1px solid #edf2f7;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #4a5568;
  transition: all 0.2s ease;
}

.btn-file-item:hover {
  background-color: #edf2f7;
  color: var(--splash-primary-color);
  border-color: rgba(101, 96, 240, 0.2);
}

.btn-file-item.active {
  background-color: rgba(101, 96, 240, 0.08);
  color: var(--splash-primary-color);
  border-color: var(--splash-primary-color);
}

.file-size-badge {
  background-color: white;
  border: 1px solid #cbd5e0;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #718096;
}

.btn-file-item.active .file-size-badge {
  background-color: var(--splash-primary-color);
  color: white;
  border-color: var(--splash-primary-color);
}

.log-viewer-pane {
  background-color: #1a202c;
  color: #cbd5e0;
  padding: 16px;
  border-radius: 10px;
  font-family: "Fira Code", Consolas, Monaco, monospace;
  font-size: 0.82rem;
  max-height: 520px;
  overflow: auto;
  white-space: pre-wrap;
  border: 1px solid #2d3748;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
}

.empty-file-viewer {
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  background-color: #f7fafc;
}
</style>
