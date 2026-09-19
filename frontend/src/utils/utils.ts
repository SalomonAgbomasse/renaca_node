import { Modal } from "bootstrap";
import ApiService from "@/services/ApiService";
import Swal from "sweetalert2";
import tinymce from 'tinymce';
import moment from 'moment';

const initTinyMCE = (target, config) => {
  return tinymce.init({
    target,
    ...config,
  });
};

const  getDatePlusXDays = (x: number)=>{
  const currentDate = new Date();
  const futureDate = new Date();
  
  futureDate.setDate(currentDate.getDate() + x);
  // Obtenez les composants de la date
  const year = futureDate.getFullYear();
  const month = (futureDate.getMonth() + 1).toString().padStart(2, '0'); // Les mois commencent à 0
  const day = futureDate.getDate().toString().padStart(2, '0');

  // Formattez la date comme "YYYY-MM-DD"
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

const getUrlApiForFiles = (dossier:string|null, nomFichier:string|null)=>{
  if(dossier){
    return `${ApiService.vueInstance.axios.defaults.baseURL?.split("api")[0]}uploads/${dossier}/${nomFichier}`;
  }else{
    return `${ApiService.vueInstance.axios.defaults.baseURL?.split("api")[0]}uploads/Erreur404.pdf`;
  }
}

const getUrlApiForFile = ( nomFichier:string|null)=>{
  if(nomFichier){
    return `${ApiService.vueInstance.axios.defaults.baseURL?.split("api")[0]}uploads/${nomFichier}`;
  }else{
    return `${ApiService.vueInstance.axios.defaults.baseURL?.split("api")[0]}uploads/Erreur404.pdf`;
  }
}
const AddBaseUrl = ( url:string|null)=>{
  if(url){
    return `${ApiService.vueInstance.axios.defaults.baseURL?.split("api")[0]}${url}`;
  }else{
    return `${ApiService.vueInstance.axios.defaults.baseURL?.split("api")[0]}uploads/Erreur404.pdf`;
  }
}



const destroyTinyMCE = (editor) => {
  if (editor) {
    editor.destroy();
  }
};

const getTypeComte = (key) => {
  let prefix="";
  switch (key) {
        case "1":
            prefix = "Compte principal";
          break;

        case "2":
            prefix = "Compte Commission";
          break;

        case "3":
            prefix = "Compte Responsable financière";
          break;

        case "4":
            prefix = "Compte Caisse";
          break;

        case "5":
            prefix = "Compte AIB";
          break;

        case "6":
            prefix = "Compte TVA";
          break;

        default:
            break;
        }
    return prefix;
}


const hideModal = (modalEl: HTMLElement | null): void => {
  if (!modalEl) {
    return;
  }
  
  const myModal = Modal.getInstance(modalEl);
  myModal?.hide();
};

const showModal = (modalEl: HTMLElement | null): void => {
  if (!modalEl) {
    return;
  }
  const myModal = new Modal(modalEl);
  myModal?.show()
};



const  success = (message: string) => {
  Swal.fire({
    title: 'Succès',
    text: message,
    icon: "success",
    toast: true,
    timer: 8000,
    position: 'top-right',
    showConfirmButton: false,
    customClass: {
      popup: 'swal-high-z-index'
    }
  });
}

const warning = (message: string) => {
  Swal.fire({
    title: 'Attention',
    text: message,
    icon: "warning",
    toast: true,
    timer: 8000,
    position: 'top-right',
    showConfirmButton: false,
    customClass: {
      popup: 'swal-high-z-index'
    }
  });
}

const error = (message: string) => {
  // Notification SweetAlert2 avec z-index forcé
  Swal.fire({
    title: 'Erreur',
    text: message,
    icon: "error",
    toast: true,
    timer: 10000,
    position: 'top-right',
    showConfirmButton: false,
    customClass: {
      popup: 'swal-high-z-index',
      container: 'swal-high-z-index'
    },
    target: document.body,
    didOpen: () => {
      // Forcer le z-index après ouverture
      const swalContainer = document.querySelector('.swal2-container');
      const swalPopup = document.querySelector('.swal2-popup');
      if (swalContainer) {
        (swalContainer as HTMLElement).style.zIndex = '999999';
      }
      if (swalPopup) {
        (swalPopup as HTMLElement).style.zIndex = '999999';
      }
    }
  });

  // Notification de secours personnalisée
  createCustomNotification(message, 'error');
}

// Fonction de notification personnalisée
const createCustomNotification = (message: string, type: 'success' | 'error') => {
  const notification = document.createElement('div');
  notification.className = `custom-notification custom-notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
      <span>${type === 'error' ? 'Erreur' : 'Succès'}</span>
      <p>${message}</p>
    </div>
    <button class="notification-close">&times;</button>
  `;

  // Ajouter au body
  document.body.appendChild(notification);

  // Fermer automatiquement après 5 secondes
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);

  // Fermer manuellement
  const closeBtn = notification.querySelector('.notification-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });
  }
}

const format_date = (value: any) => {
  if (value) {
    return moment(value).format('DD-MM-YYYY HH:mm:ss');
  }
};

const format_Date = (date: any) => {
  if (date) {
    return moment(date).format('DD-MM-YYYY');
  }
};

const separateur = (montant)=>{ 
  if(montant){
    return montant.toLocaleString('fr-FR');
  }
}

const removeModalBackdrop = (): void => {
  if (document.querySelectorAll(".modal-backdrop.fade.show").length) {
    document.querySelectorAll(".modal-backdrop.fade.show").forEach((item) => {
      item.remove();
    });
  }
};


const getAssetPath = (path: string): string => {
    return '' + path;
};

// function getAllCategorieAbonnes(route:string,element:any) {
//   return ApiService.get(`/${route}`)
//   .then(({ data }) => {
//     console.log(data);
//     element.value = data.data
//   })
//   .catch(({ response }) => {
//     console.log(response)
//   });
// } 

const suppression = (id:string,element:any, route:string, entite:string) => {
  Swal.fire({
      text: "Vous êtes sur le point de supprimer " + entite +". Etes-vous sûr ?",
      icon: "warning",
      buttonsStyling: true,
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: `Annuler`,
      heightAuto: false,
      customClass: {
        confirmButton: "btn btn-danger",
      },
    }).then((result) => {
      if (result.isConfirmed) {
      ApiService.delete(`/${route}/${id}`)
        .then(({ data }) => {
            Swal.fire({
              title: 'Succès',
              text: data.message,
              icon: "success",
              toast: true,
              timer: 5000,
              position: 'top-right',
              showConfirmButton: false,
            });
            for(let i = 0; i < element.length; i++) {
              if (element[i].id === id) {
                element.splice(i, 1);
              }
            }
        }).catch(({ response }) => {
          Swal.fire({
            text: response.data.message, //'Oups il y a un problème',//
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Réssayer à nouveau!",
            heightAuto: false,
            customClass: {
              confirmButton: "btn fw-semobold btn-light-danger",
            },
          });
      });
        } else if (result.isDenied) {
          Swal.fire("La suppression n'est pas passée", "", "info");
        }
      });
};

/**
 * Calcule la date d'échéance d'un contrat en fonction de la date de première échéance,
 * la durée totale, la périodicité et le différé.
 * 
 * Formule : Date d'échéance = Date première échéance + Durée totale (mois) - 1 période
 * 
 * @param datePremiereEcheance - Date de la première échéance (format YYYY-MM-DD)
 * @param dureeMois - Durée totale du contrat en mois
 * @param nombreMoisPeriodicite - Nombre de mois par période (1=Mensuelle, 2=Bimestrielle, 3=Trimestrielle, etc.)
 * @param differeMois - Durée du différé en mois (0 à 6, optionnel, défaut: 0)
 * @returns Date d'échéance au format YYYY-MM-DD
 */
const calculateDateEcheance = (
  datePremiereEcheance: string,
  dureeMois: number,
  nombreMoisPeriodicite: number,
  differeMois: number = 0
): string => {
  if (!datePremiereEcheance || !dureeMois || !nombreMoisPeriodicite) {
    return '';
  }

  try {
    const datePremiere = new Date(datePremiereEcheance);
    
    // Vérifier que la date est valide
    if (isNaN(datePremiere.getTime())) {
      console.error('Date de première échéance invalide:', datePremiereEcheance);
      return '';
    }

    // Calculer la date d'échéance : date première échéance + durée totale - 1 période
    // Le différé doit être ajouté à la durée totale pour obtenir la durée réelle du contrat
    const dateEcheance = new Date(datePremiere);
    
    // Ajouter la durée totale en mois + le différé
    const dureeTotaleAvecDiffere = dureeMois + differeMois;
    dateEcheance.setMonth(dateEcheance.getMonth() + dureeTotaleAvecDiffere);
    
    // Soustraire une période (1 échéance)
    dateEcheance.setMonth(dateEcheance.getMonth() - nombreMoisPeriodicite);

    // Formater la date au format YYYY-MM-DD
    const year = dateEcheance.getFullYear();
    const month = String(dateEcheance.getMonth() + 1).padStart(2, '0');
    const day = String(dateEcheance.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erreur lors du calcul de la date d\'échéance:', error);
    return '';
  }
};

/**
 * Extrait le nom de fichier du header Content-Disposition de la réponse HTTP
 * @param response - Réponse axios avec headers
 * @param fallbackFilename - Nom de fichier par défaut si le header n'est pas trouvé
 * @returns Le nom de fichier extrait ou le nom par défaut
 */
const extractFilenameFromResponse = (response: any, fallbackFilename: string = 'document.pdf'): string => {
  try {
    // Récupérer le header Content-Disposition
    const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
    
    if (!contentDisposition) {
      console.warn('⚠️ Header Content-Disposition non trouvé, utilisation du nom par défaut');
      return fallbackFilename;
    }

    // Extraire le nom de fichier du header
    // Format possible: attachment; filename="CONTRACT_NOM_PRENOM_YYYYMMDD_HHMMSS.pdf"
    // ou: attachment; filename=CONTRACT_NOM_PRENOM_YYYYMMDD_HHMMSS.pdf
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    
    if (filenameMatch && filenameMatch[1]) {
      // Nettoyer le nom de fichier (enlever les guillemets si présents)
      let filename = filenameMatch[1].replace(/['"]/g, '');
      
      // Décoder les caractères encodés (ex: %20 pour espace)
      try {
        filename = decodeURIComponent(filename);
      } catch (e) {
        // Si le décodage échoue, utiliser le nom tel quel
        console.warn('⚠️ Erreur lors du décodage du nom de fichier:', e);
      }
      
      return filename || fallbackFilename;
    }
    
    console.warn('⚠️ Impossible d\'extraire le nom de fichier du header Content-Disposition');
    return fallbackFilename;
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction du nom de fichier:', error);
    return fallbackFilename;
  }
};

const formatMontant = (val?: any): string => {
  const n = Number(val);
  if (isNaN(n)) return '0';
  return n.toLocaleString('fr-FR');
};

export { AddBaseUrl,getUrlApiForFile,getUrlApiForFiles,getDatePlusXDays,getTypeComte, removeModalBackdrop,suppression,separateur, hideModal, getAssetPath,format_Date, showModal, format_date, success, warning, error,initTinyMCE,destroyTinyMCE, calculateDateEcheance, extractFilenameFromResponse, formatMontant };

