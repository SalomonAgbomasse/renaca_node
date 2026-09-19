export enum ContractType {
  STANDARD = 'STANDARD',
  HORS_CONVENTION = 'HORS_CONVENTION',
  COTATION_CONVERTED = 'COTATION_CONVERTED',
  IMPORTED = 'IMPORTED',
  RENEWED = 'RENEWED',
  MODIFIED = 'MODIFIED',
  HLA = 'HLA'
}

export const ContractTypeLabels = {
  [ContractType.STANDARD]: 'Contrat Standard',
  [ContractType.HORS_CONVENTION]: 'Contrat Hors Convention',
  [ContractType.COTATION_CONVERTED]: 'Contrat Converti depuis Cotation',
  [ContractType.IMPORTED]: 'Contrat Importé',
  [ContractType.RENEWED]: 'Contrat Renouvelé',
  [ContractType.MODIFIED]: 'Contrat Modifié',
  [ContractType.HLA]: 'Contrat HLA'
};

export const ContractTypeBadges = {
  [ContractType.STANDARD]: 'badge bg-primary',
  [ContractType.HORS_CONVENTION]: 'badge bg-warning',
  [ContractType.COTATION_CONVERTED]: 'badge bg-success',
  [ContractType.IMPORTED]: 'badge bg-info',
  [ContractType.RENEWED]: 'badge bg-secondary',
  [ContractType.MODIFIED]: 'badge bg-dark',
  [ContractType.HLA]: 'badge bg-warning'
};
