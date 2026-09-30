/**
 * Gestionnaire dynamique de la taille de police globale de l'application
 */
export function applyGlobalFontSize(size: number): void {
  const safeSize = Math.min(Math.max(size, 12), 24);
  const scale = Number((safeSize / 16).toFixed(4));

  document.documentElement.style.setProperty("--app-font-size", `${safeSize}px`);
  document.documentElement.style.setProperty("--app-font-scale", `${scale}`);
  document.documentElement.style.setProperty("--bs-body-font-size", `${safeSize}px`);
  document.documentElement.style.fontSize = `${safeSize}px`;

  if (document.body) {
    document.body.style.fontSize = `${safeSize}px`;
  }
  const appEl = document.getElementById("app");
  if (appEl) {
    appEl.style.fontSize = `${safeSize}px`;
  }

  // Injecter ou mettre à jour la balise <style id="app-font-size-override">
  let styleTag = document.getElementById("app-font-size-override") as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "app-font-size-override";
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = `
    :root {
      --app-font-size: ${safeSize}px !important;
      --app-font-scale: ${scale} !important;
      --bs-body-font-size: ${safeSize}px !important;
    }
    html, body, #app {
      font-size: ${safeSize}px !important;
    }
    
    /* Éléments de contenu de l'application */
    .main-content,
    .main-content .card,
    .main-content .card-body,
    .main-content table,
    .main-content td,
    .main-content th,
    .main-content p,
    .main-content label,
    .main-content .form-label,
    .main-content .form-control,
    .main-content .form-select,
    .main-content .form-check-label,
    .main-content .dropdown-item,
    .main-content a:not(.btn-font-toggle):not([class*="flaticon-"]):not([class*="ph-"]):not([class*="fa-"]),
    .main-content span:not([class*="flaticon-"]):not([class*="ph-"]):not([class*="fa-"]):not(.badge),
    .modal-content,
    .modal-body,
    .modal-body table,
    .modal-body td,
    .modal-body th,
    .modal-body p,
    .modal-body label,
    .modal-body .form-label,
    .modal-body .form-control,
    .modal-body .form-select,
    .modal-body .form-check-label,
    .modal-body span:not([class*="flaticon-"]):not([class*="ph-"]):not([class*="fa-"]):not(.badge) {
      font-size: calc(15px * ${scale}) !important;
    }

    /* Remplacement dynamique des classes utilitaires fs- */
    .fs-10 { font-size: calc(10px * ${scale}) !important; }
    .fs-11 { font-size: calc(11px * ${scale}) !important; }
    .fs-12 { font-size: calc(12px * ${scale}) !important; }
    .fs-13 { font-size: calc(13px * ${scale}) !important; }
    .fs-14 { font-size: calc(14px * ${scale}) !important; }
    .fs-15 { font-size: calc(15px * ${scale}) !important; }
    .fs-16 { font-size: calc(16px * ${scale}) !important; }
    .fs-17 { font-size: calc(17px * ${scale}) !important; }
    .fs-18 { font-size: calc(18px * ${scale}) !important; }
    .fs-20 { font-size: calc(20px * ${scale}) !important; }
    .fs-7  { font-size: calc(12px * ${scale}) !important; }
    .fs-8  { font-size: calc(11px * ${scale}) !important; }

    /* Protéger le popup du sélecteur de police pour ne pas le déformer */
    .font-picker-popup,
    .font-picker-popup * {
      font-size: 12px !important;
    }
    .font-picker-popup .badge {
      font-size: 11px !important;
    }
    .font-picker-popup .picker-title {
      font-size: 12px !important;
    }
    .font-picker-popup .preset-btn {
      font-size: 10.5px !important;
    }
    .btn-font-toggle {
      font-size: 14px !important;
    }
    .btn-font-toggle .sub-a {
      font-size: 10px !important;
    }
  `;

  try {
    localStorage.setItem("app_font_size", safeSize.toString());
  } catch (e) {
    console.warn("Impossible d'enregistrer la taille de police dans localStorage:", e);
  }
}

export function getSavedFontSize(defaultSize = 16): number {
  try {
    const saved = localStorage.getItem("app_font_size");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 12 && parsed <= 24) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Erreur lecture localStorage font size:", e);
  }
  return defaultSize;
}
