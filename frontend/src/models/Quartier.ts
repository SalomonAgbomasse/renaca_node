export interface Quartier {
    id: number;
    libelle: string;
    arrondissement?: {
        id: number;
        libelle: string;
    };
    setFieldValue?: (field: string, value: any) => void;
}