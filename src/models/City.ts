export interface City {
    codigo_ibge: number;
    nome: string;
    latitude: number;
    longitude: number;
    geometria:number[][][];

    confirmed:number;
    deaths:number;
}