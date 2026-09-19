export function error(message: string): void;
export function success(message: string): void;

export function getDatePlusXDays(x: number): string;
export function getUrlApiForFiles(dossier: string | null, nomFichier: string | null): string;
export function getUrlApiForFile(nomFichier: string | null): string;
export function AddBaseUrl(url: string | null): string;
export function hideModal(modalEl: HTMLElement | null): void;
export function showModal(modalEl: HTMLElement | null): void;
export function format_date(value: string | Date): string | undefined;
export function format_Date(date: string | Date): string | undefined;
export function separateur(montant: number): string | undefined;
export function removeModalBackdrop(): void;
export function getAssetPath(path: string): string;
export function suppression(id: string, element: any, route: string, entite: string): void; 