import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";

import { environment } from "../environments/environment";
import municipiosJson from "../assets/data/geojs-35-mun.json";
import { switchMap, map, toArray } from 'rxjs/operators';
import { City } from 'src/models/City';

@Injectable({ providedIn: "root" })
export class CityService {
  constructor() {}

  public getCities(): Observable<any> {
    const obs$ =  of(municipiosJson)
    .pipe(
      switchMap(geojson => geojson.features),
      map((feature : any) => <City>({
        codigo_ibge: feature.properties.id,
        nome: feature.properties.name,
        geometria: feature.geometry.coordinates
      })),
      toArray()
    )
    return obs$;
  }
}
