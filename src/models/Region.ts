import { LatLngExpression } from 'leaflet';

export enum RegionTipoEnum {
    CIDADE,
    ESTADO
}

export interface Region {
    codigo_ibge: number;
    nome: string;

    tipo: RegionTipoEnum;
    representacao : {latitude: number;
        longitude: number;} | LatLngExpression[][];

    confirmed:number;
    deaths:number;
}