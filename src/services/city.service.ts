import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of, combineLatest } from "rxjs";

import { environment } from "../environments/environment";
import { switchMap, map, toArray, reduce } from "rxjs/operators";
import { City, CityTipoEnum } from "src/models/City";
import { LatLngExpression } from 'leaflet';

@Injectable({ providedIn: "root" })
export class CityService {
  constructor(private httpClient: HttpClient) {}

  public getCities(): Observable<City> {
    const obs$ = this.httpClient.get("assets/data/municipios.json").pipe(
      switchMap((json: any) => json),
      map((city: any) => {
        return ({
        nome: city.nome,
        codigo_ibge: city.codigo_ibge,
        confirmed: 0,
        deaths: 0,
        tipo: CityTipoEnum.CIDADE,
        representacao: { longitude: city.longitude, latitude: city.latitude }
      })})
    );

    return obs$;
  }

  public getStates(): Observable<City> {
    const obs$ = this.httpClient.get("assets/data/brazil-states.geojson").pipe(
      switchMap((json: any) => json.features),
      map((state: any) => ({
        nome: state.properties.name,
        codigo_ibge: state.properties.codigo_ibg,
        tipo: CityTipoEnum.ESTADO,
        representacao: state.geometry.coordinates.map(polygon => polygon.map(lines => lines.map(vec => [vec[1], vec[0]]))),
        confirmed: 0,
        deaths: 0
      }))
    );

    return obs$;
  }
}
