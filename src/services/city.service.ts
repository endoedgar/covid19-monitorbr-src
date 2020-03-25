import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of, combineLatest } from "rxjs";

import { environment } from "../environments/environment";
import { switchMap, map, toArray, reduce } from "rxjs/operators";
import { City } from "src/models/City";

@Injectable({ providedIn: "root" })
export class CityService {
  constructor(private httpClient: HttpClient) {}

  public getCities(): Observable<City[]> {
    const obs$ = this.httpClient.get("assets/data/municipios.json").pipe(
      switchMap((json: any) => json),
      map((city: any) => ({
        nome: city.name,
        codigo_ibge: city.codigo_ibge,
        confirmed: 0,
        deaths: 0,
        representacao: { longitude: city.longitude, latitude: city.latitude }
      })),
      toArray()
    );

    return obs$;
  }

  public getStates(): Observable<City[]> {
    const obs$ = this.httpClient.get("assets/data/brazil-states.geojson").pipe(
      switchMap((json: any) => json.features),
      map((state: any) => ({
        nome: state.properties.name,
        codigo_ibge: state.properties.codigo_ibg,
        representacao: state.geometry.coordinates[0],
        confirmed: 0,
        deaths: 0
      })),
      toArray()
    );

    return obs$;
  }
}
