import { Contrat } from "./Contrat";

export interface Agency {
    id: number;
    name: string;
    location: string;
    phone: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;

    users?: any[];
    contracts?: Contrat[];
    usersCount?: number;
    contractsCount?: number;

    setFieldValue: (field: string, value: any) => void;
}
