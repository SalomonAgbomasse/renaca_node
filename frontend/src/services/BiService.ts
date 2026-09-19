import ApiService from './ApiService';

export interface BiFilters {
  dateDebut?: string;
  dateFin?: string;
  agenceId?: number | string;
  userId?: number | string;
  natureCreditId?: number | string;
  contractType?: string;
}

const toParams = (filters: BiFilters & Record<string, any>) => {
  const p: Record<string, string> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p[k] = String(v);
  });
  return new URLSearchParams(p).toString();
};

const BiService = {
  // Vue d'ensemble
  async getKPIsOverview(filters: BiFilters = {}) {
    return ApiService.get(`/bi/kpis-overview?${toParams(filters)}`);
  },

  async getMonthlyEvolution(months = 12, filters: BiFilters = {}) {
    return ApiService.get(`/bi/monthly-evolution?months=${months}&${toParams(filters)}`);
  },

  // Clients
  async getClientSegmentation(axe: 'age' | 'gender' | 'occupation' | 'capital', filters: BiFilters = {}) {
    return ApiService.get(`/bi/clients/segmentation?axe=${axe}&${toParams(filters)}`);
  },

  // Commercial
  async getAgencesPerformance(filters: BiFilters = {}) {
    return ApiService.get(`/bi/commercial/agences?${toParams(filters)}`);
  },

  async getConseillersPerformance(filters: BiFilters = {}) {
    return ApiService.get(`/bi/commercial/conseillers?${toParams(filters)}`);
  },

  async getNatureCreditAnalysis(filters: BiFilters = {}) {
    return ApiService.get(`/bi/commercial/nature-credit?${toParams(filters)}`);
  },

  // Insights
  async getAutoInsights() {
    return ApiService.get('/bi/insights');
  },

  // Seuils d'alerte
  async getAlertThresholds() {
    return ApiService.get('/bi/alert-thresholds');
  },

  async updateAlertThreshold(id: number, data: { thresholdValue?: number; severity?: string; isActive?: boolean }) {
    return ApiService.put(`/bi/alert-thresholds/${id}`, data);
  },

  // Export
  async getExportData(type: 'contrats' | 'clients' | 'commercial', filters: BiFilters = {}) {
    return ApiService.get(`/bi/export?type=${type}&${toParams(filters)}`);
  },

  async exportExcel(type: 'overview' | 'clients' | 'commercial', filters: BiFilters = {}) {
    return ApiService.getWithConfig(`/bi/export/excel?type=${type}&${toParams(filters)}`, { responseType: 'blob' });
  },

  async exportPdf(type: 'overview' | 'clients' | 'commercial', filters: BiFilters = {}) {
    return ApiService.getWithConfig(`/bi/export/pdf?type=${type}&${toParams(filters)}`, { responseType: 'blob' });
  },
};

export default BiService;
