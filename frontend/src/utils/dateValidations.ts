import * as Yup from 'yup';
import { error } from './utils';

/**
 * Valide que la date de première échéance n'est pas antérieure à la date d'effet
 * @param datePremiereEcheance - Date de première échéance (format YYYY-MM-DD)
 * @param dateEffet - Date d'effet (format YYYY-MM-DD)
 * @returns true si valide, false sinon
 */
export const isDatePremiereEcheanceValid = (
  datePremiereEcheance: string,
  dateEffet: string
): boolean => {
  if (!datePremiereEcheance || !dateEffet) {
    return true; // Laisser les autres validations gérer les valeurs vides
  }

  try {
    const datePremiere = new Date(datePremiereEcheance);
    const dateEffetObj = new Date(dateEffet);
    
    datePremiere.setHours(0, 0, 0, 0);
    dateEffetObj.setHours(0, 0, 0, 0);
    
    return datePremiere >= dateEffetObj;
  } catch {
    return false;
  }
};

/**
 * Valide que la date d'échéance n'est pas antérieure à la date de première échéance (minimum égale)
 * @param dateEcheance - Date d'échéance (format YYYY-MM-DD)
 * @param datePremiereEcheance - Date de première échéance (format YYYY-MM-DD)
 * @returns true si valide, false sinon
 */
export const isDateEcheanceValid = (
  dateEcheance: string,
  datePremiereEcheance: string
): boolean => {
  if (!dateEcheance || !datePremiereEcheance) {
    return true; // Laisser les autres validations gérer les valeurs vides
  }

  try {
    const dateEch = new Date(dateEcheance);
    const datePremiere = new Date(datePremiereEcheance);
    
    dateEch.setHours(0, 0, 0, 0);
    datePremiere.setHours(0, 0, 0, 0);
    
    return dateEch >= datePremiere;
  } catch {
    return false;
  }
};

/**
 * Corrige automatiquement la date de première échéance si elle est antérieure à la date d'effet
 * @param datePremiereEcheance - Date de première échéance à valider/corriger
 * @param dateEffet - Date d'effet de référence
 * @returns Date corrigée au format YYYY-MM-DD
 */
export const correctDatePremiereEcheance = (
  datePremiereEcheance: string,
  dateEffet: string
): string => {
  if (!datePremiereEcheance || !dateEffet) {
    return datePremiereEcheance;
  }

  if (!isDatePremiereEcheanceValid(datePremiereEcheance, dateEffet)) {
    // Retourner la date d'effet comme date corrigée
    return dateEffet;
  }

  return datePremiereEcheance;
};

/**
 * Corrige automatiquement la date d'échéance si elle est antérieure à la date de première échéance
 * @param dateEcheance - Date d'échéance à valider/corriger
 * @param datePremiereEcheance - Date de première échéance de référence
 * @returns Date corrigée au format YYYY-MM-DD
 */
export const correctDateEcheance = (
  dateEcheance: string,
  datePremiereEcheance: string
): string => {
  if (!dateEcheance || !datePremiereEcheance) {
    return dateEcheance;
  }

  if (!isDateEcheanceValid(dateEcheance, datePremiereEcheance)) {
    return datePremiereEcheance;
  }

  return dateEcheance;
};

/**
 * Calcule la date minimale pour la date d'échéance (date de première échéance)
 * @param datePremiereEcheance - Date de première échéance
 * @param dateEffet - Date d'effet (fallback si datePremiereEcheance n'est pas disponible)
 * @param todayDate - Date du jour (fallback si aucune autre date n'est disponible)
 * @returns Date minimale au format YYYY-MM-DD
 */
export const getMinDateEcheance = (
  datePremiereEcheance?: string,
  dateEffet?: string,
  todayDate?: string
): string => {
  if (datePremiereEcheance) {
    return datePremiereEcheance;
  }
  
  if (dateEffet) {
    return dateEffet;
  }
  
  return todayDate || new Date().toISOString().split('T')[0];
};

/**
 * Handler de validation pour la date de première échéance
 * À utiliser avec @change ou @blur sur un champ de date
 * @param event - Événement de changement du champ
 * @param formData - Objet contenant les données du formulaire avec dateEffet et datePremiereEcheance
 * @param onCorrected - Callback optionnel appelé quand la date est corrigée
 */
export const handleValidateDatePremiereEcheance = (
  event: Event,
  formData: { dateEffet?: string; datePremiereEcheance?: string },
  onCorrected?: (correctedDate: string) => void
): void => {
  // Ne pas valider ni afficher d'alerte pendant la frappe (événement input)
  if (event.type === 'input') {
    return;
  }

  const target = event.target as HTMLInputElement;
  const selectedDate = target.value;
  
  if (!formData.dateEffet || !selectedDate) {
    return;
  }
  
  // Vérifier si l'année est complète (>= 1900)
  const selectedYear = new Date(selectedDate).getFullYear();
  if (isNaN(selectedYear) || selectedYear < 1900) {
    return;
  }
  
  const dateCorrigee = correctDatePremiereEcheance(selectedDate, formData.dateEffet);
  
  if (dateCorrigee !== selectedDate) {
    target.value = dateCorrigee;
    if (formData.datePremiereEcheance !== undefined) {
      formData.datePremiereEcheance = dateCorrigee;
    }
    
    if (onCorrected) {
      onCorrected(dateCorrigee);
    }
    
    error('La date de première échéance ne peut pas être antérieure à la date d\'effet. Date corrigée.');
  }
};

/**
 * Handler de validation pour la date d'échéance
 * À utiliser avec @change ou @blur sur un champ de date
 * @param event - Événement de changement du champ
 * @param formData - Objet contenant les données du formulaire avec datePremiereEcheance et dateEch1
 * @param onCorrected - Callback optionnel appelé quand la date est corrigée
 */
export const handleValidateDateEcheance = (
  event: Event,
  formData: { datePremiereEcheance?: string; dateEch1?: string },
  onCorrected?: (correctedDate: string) => void
): void => {
  // Ne pas valider ni afficher d'alerte pendant la frappe (événement input)
  if (event.type === 'input') {
    return;
  }

  const target = event.target as HTMLInputElement;
  const selectedDate = target.value;
  
  if (!formData.datePremiereEcheance || !selectedDate) {
    return;
  }
  
  // Vérifier si l'année est complète (>= 1900)
  const selectedYear = new Date(selectedDate).getFullYear();
  if (isNaN(selectedYear) || selectedYear < 1900) {
    return;
  }

  const dateCorrigee = correctDateEcheance(selectedDate, formData.datePremiereEcheance);
  
  if (dateCorrigee !== selectedDate) {
    target.value = dateCorrigee;
    if (formData.dateEch1 !== undefined) {
      formData.dateEch1 = dateCorrigee;
    }
    
    if (onCorrected) {
      onCorrected(dateCorrigee);
    }
    
    error('La date d\'échéance ne peut pas être antérieure à la date de première échéance. Date corrigée.');
  }
};

/**
 * Schéma Yup pour valider la date d'effet (ne peut pas être dans le passé)
 */
export const dateEffetSchema = Yup.string()
  .required('La date d\'effet est obligatoire')
  .test('not-past', 'La date d\'effet ne peut pas être antérieure à aujourd\'hui', function(value) {
    if (!value) return true;
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  });

/**
 * Schéma Yup pour valider la date de première échéance (doit être >= date d'effet)
 * @param parentPath - Chemin vers l'objet parent contenant dateEffet (ex: 'contrat' ou '')
 */
export const datePremiereEcheanceSchema = (parentPath: string = '') => {
  return Yup.string()
    .required('La date de première échéance est obligatoire')
    .test('after-date-effet', 'La date de première échéance ne peut pas être antérieure à la date d\'effet', function(value) {
      if (!value) return true;
      
      // Construire le chemin vers dateEffet
      const pathParts = parentPath ? parentPath.split('.') : [];
      let formData = this.parent;
      
      // Naviguer vers l'objet parent si nécessaire
      for (const part of pathParts) {
        formData = formData?.[part];
      }
      
      const dateEffet = formData?.dateEffet;
      if (!dateEffet) return true;
      
      return isDatePremiereEcheanceValid(value, dateEffet);
    });
};

/**
 * Schéma Yup pour valider la date d'échéance (doit être >= date de première échéance)
 * @param parentPath - Chemin vers l'objet parent contenant datePremiereEcheance (ex: 'contrat' ou '')
 */
export const dateEcheanceSchema = (parentPath: string = '') => {
  return Yup.string()
    .required('La date d\'échéance est obligatoire')
    .test('after-premiere-echeance', 'La date d\'échéance ne peut pas être antérieure à la date de première échéance', function(value) {
      if (!value) return true;
      
      // Construire le chemin vers datePremiereEcheance
      const pathParts = parentPath ? parentPath.split('.') : [];
      let formData = this.parent;
      
      // Naviguer vers l'objet parent si nécessaire
      for (const part of pathParts) {
        formData = formData?.[part];
      }
      
      const datePremiereEcheance = formData?.datePremiereEcheance;
      if (!datePremiereEcheance) return true;
      
      return isDateEcheanceValid(value, datePremiereEcheance);
    });
};


