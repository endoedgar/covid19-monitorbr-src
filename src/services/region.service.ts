import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { switchMap, map } from "rxjs/operators";

import { Region, RegionTipoEnum } from "src/models/Region";

@Injectable({ providedIn: "root" })
export class RegionService {
  constructor(private httpClient: HttpClient) {}

  public getCities(): Observable<Region> {
    const obs$ = this.httpClient.get("assets/data/municipios.json").pipe(
      switchMap((json: any) => json),
      map((city: any) => {
        return {
          nome: city.nome,
          codigo_ibge: city.codigo_ibge,
          confirmed: 0,
          deaths: 0,
          sigla: null,
          codigo_uf: city.codigo_uf,
          tipo: RegionTipoEnum.CIDADE,
          representacao: { longitude: city.longitude, latitude: city.latitude }
        };
      })
    );

    return obs$;
  }

  public getStates(): Observable<Region> {
    const obs$ = this.httpClient.get("assets/data/brazil-states.geojson").pipe(
      switchMap((json: any) => json.features),
      map((state: any) => ({
        nome: state.properties.name,
        codigo_ibge: state.properties.codigo_ibg,
        tipo: RegionTipoEnum.ESTADO,
        codigo_uf: null,
        sigla: state.properties.sigla,
        representacao: state.geometry.coordinates.map(polygon =>
          polygon.map(lines => lines.map(vec => [vec[1], vec[0]]))
        ),
        confirmed: 0,
        deaths: 0
      }))
    );

    return obs$;
  }
}
