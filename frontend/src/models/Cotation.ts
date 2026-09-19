export interface Contrat {
  id: number;
  code: string;
  numero: string;
  dateSignature: string;
  dateDebut: string;
  dateFin: string;
  montant: number;
  statut: 'ACTIF' | 'INACTIF' | 'SUSPENDU';
  idUser: number;
  idAgency: number;
  idCustomer: number;
  idProduct: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  };
  agency?: {
    id: number;
    name: string;
  };
  customer?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  };
  product?: {
    id: number;
    name: string;
    description?: string;
  };
}

export interface ContratFormData {
  code: string;
  numero: string;
  dateSignature: string;
  dateDebut: string;
  dateFin: string;
  montant: number;
  statut: 'ACTIF' | 'INACTIF' | 'SUSPENDU';
  idUser: number;
  idAgency: number;
  idCustomer: number;
  idProduct: number;
} 