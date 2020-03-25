import { LatLngExpression } from 'leaflet';

export enum CityTipoEnum {
    CIDADE,
    ESTADO
}

export interface City {
    codigo_ibge: number;
    nome: string;

    tipo: CityTipoEnum;
    representacao : {latitude: number;
        longitude: number;} | LatLngExpression[][];

    confirmed:number;
    deaths:number;
}