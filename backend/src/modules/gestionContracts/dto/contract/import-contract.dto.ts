export class ImportContractRowDto {
  // Client principal
  nomClient: string;
  prenomClient: string;
  dateNaissanceClient: string;
  genreClient: string;
  professionClient?: string;
  telephoneClient: string;
  emailClient?: string;
  adresseClient?: string;

  // Contrat
  police: string;
  reference: string;
  dateEffet: string;
  dureeMois: number;
  natureCredit: string;
  capital: number;
  etablissement?: string;
  compteBancaire?: string;
  numeroCompte?: string;

  // Membre OBA: Conjoint
  conjointChecked?: string;
  conjointNom?: string;
  conjointPrenom?: string;
  conjointDateNaissance?: string;
  conjointGenre?: string;
  conjointCapital?: number;

  // Membre OBA: Père de l'Assuré
  pereAssureChecked?: string;
  pereAssureNom?: string;
  pereAssurePrenom?: string;
  pereAssureDateNaissance?: string;
  pereAssureCapital?: number;

  // Membre OBA: Mère de l'Assuré
  mereAssureChecked?: string;
  mereAssureNom?: string;
  mereAssurePrenom?: string;
  mereAssureDateNaissance?: string;
  mereAssureCapital?: number;

  // Membre OBA: Père du Conjoint
  pereConjointChecked?: string;
  pereConjointNom?: string;
  pereConjointPrenom?: string;
  pereConjointDateNaissance?: string;
  pereConjointCapital?: number;

  // Membre OBA: Mère du Conjoint
  mereConjointChecked?: string;
  mereConjointNom?: string;
  mereConjointPrenom?: string;
  mereConjointDateNaissance?: string;
  mereConjointCapital?: number;
}
