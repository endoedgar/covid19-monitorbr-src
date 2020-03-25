import { LatLngExpression } from 'leaflet';

export interface City {
    codigo_ibge: number;
    nome: string;

    representacao : {latitude: number;
        longitude: number;} | LatLngExpression[];

    confirmed:number;
    deaths:number;
}