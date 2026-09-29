import { ref } from 'vue';
import ApiService from '../services/ApiService';
import JwtService from '../services/JwtService';
import { extractFilenameFromResponse, success, error } from '../utils/utils';

export function usePdfViewer() {
  const viewerVisible = ref(false);
  const viewerPdfUrl = ref('');
  const viewerLoading = ref(false);
  const viewerErrorMessage = ref('');
  const viewerTitle = ref('');
  const viewerSubtitle = ref('');
  const viewerDocumentKey = ref('');
  const viewerFilename = ref('');
  let currentBlob: Blob | null = null;

  function closeViewer() {
    viewerVisible.value = false;
    if (viewerPdfUrl.value) {
      window.URL.revokeObjectURL(viewerPdfUrl.value);
      viewerPdfUrl.value = '';
    }
    currentBlob = null;
  }

  function handleViewerDownload() {
    if (!viewerPdfUrl.value) return;
    const link = document.createElement('a');
    link.href = viewerPdfUrl.value;
    link.download = viewerFilename.value || 'document.pdf';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Téléchargement du PDF lancé !');
  }

  /**
   * Ouvre un PDF dans le visionneur via une URL d'API (ex: /contracts/12/pdf)
   */
  async function openPdfFromApi(
    apiUrl: string,
    options?: {
      title?: string;
      subtitle?: string;
      documentKey?: string;
      defaultFilename?: string;
    }
  ) {
    viewerVisible.value = true;
    viewerLoading.value = true;
    viewerErrorMessage.value = '';
    viewerTitle.value = options?.title || 'Visualisation du Document';
    viewerSubtitle.value = options?.subtitle || '';
    viewerDocumentKey.value = options?.documentKey || '';
    viewerFilename.value = options?.defaultFilename || 'document.pdf';

    if (viewerPdfUrl.value) {
      window.URL.revokeObjectURL(viewerPdfUrl.value);
      viewerPdfUrl.value = '';
    }
    currentBlob = null;

    try {
      const response = await ApiService.vueInstance.axios.get(apiUrl, {
        responseType: 'blob',
        timeout: 120000,
        headers: {
          'Accept': 'application/pdf',
          'Authorization': `Bearer ${JwtService.getToken()}`
        }
      });

      if (!(response.data instanceof Blob)) {
        throw new Error('Format de fichier invalide');
      }

      currentBlob = new Blob([response.data], { type: 'application/pdf' });
      viewerPdfUrl.value = window.URL.createObjectURL(currentBlob);
      if (options?.defaultFilename) {
        viewerFilename.value = extractFilenameFromResponse(response, options.defaultFilename);
      }
    } catch (err: any) {
      console.error('Erreur chargement PDF visionneur:', err);
      viewerErrorMessage.value = err?.response?.data?.message || err?.message || 'Erreur lors du chargement du document PDF.';
    } finally {
      viewerLoading.value = false;
    }
  }

  /**
   * Ouvre directement le PDF d'un contrat par son objet contrat
   */
  async function openContractPdf(contract: { id?: number; uuid?: string; reference?: string; police?: string; customer?: any }) {
    if (!contract?.id && !contract?.uuid) return;
    const targetId = contract.id || contract.uuid;
    const ref = contract.reference || contract.police || `contrat_${targetId}`;
    const client = contract.customer ? `${contract.customer.lastname || ''} ${contract.customer.firstname || ''}`.trim() : '';

    await openPdfFromApi(`/contracts/${targetId}/pdf`, {
      title: client ? `Bulletin d'Adhésion (BIA) : ${client}` : `Contrat ${ref}`,
      subtitle: contract.police ? `Police N° ${contract.police}` : `Réf : ${ref}`,
      documentKey: contract.police || contract.uuid || String(targetId),
      defaultFilename: `contrat_${ref}.pdf`
    });
  }

  /**
   * Ouvre directement le PDF de l'historique d'un contrat
   */
  async function openContractHistoryPdf(contract: { id?: number; uuid?: string; reference?: string; police?: string }) {
    if (!contract?.id && !contract?.uuid) return;
    const targetId = contract.id || contract.uuid;
    const ref = contract.reference || contract.police || `contrat_${targetId}`;

    await openPdfFromApi(`/contracts/${targetId}/history/pdf`, {
      title: `Historique des modifications : ${ref}`,
      subtitle: contract.police ? `Police N° ${contract.police}` : '',
      documentKey: ref,
      defaultFilename: `historique_${ref}.pdf`
    });
  }

  return {
    viewerVisible,
    viewerPdfUrl,
    viewerLoading,
    viewerErrorMessage,
    viewerTitle,
    viewerSubtitle,
    viewerDocumentKey,
    viewerFilename,
    closeViewer,
    handleViewerDownload,
    openPdfFromApi,
    openContractPdf,
    openContractHistoryPdf
  };
}
