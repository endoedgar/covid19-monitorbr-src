export interface City {
    codigo_ibge: number;
    nome: string;
    geometria:number[][][];

    confirmed:number;
    deaths:number;
    recovery:number;
    suspects: number;
}