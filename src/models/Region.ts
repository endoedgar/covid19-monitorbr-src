import { LatLngExpression } from 'leaflet';

export enum RegionTipoEnum {
    CIDADE,
    ESTADO
}

export interface Region {
    codigo_ibge: number;
    nome: string;
    codigo_uf: number;

    tipo: RegionTipoEnum;
    sigla: string;
    representacao : {latitude: number;
        longitude: number;} | LatLngExpression[][];

    confirmed:number;
    deaths:number;
}