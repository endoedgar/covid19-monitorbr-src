import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of, combineLatest } from "rxjs";

import { environment } from "../environments/environment";
import { switchMap, map, toArray, reduce } from "rxjs/operators";
import { City } from "src/models/City";

@Injectable({ providedIn: "root" })
export class CityService {
  constructor(private httpClient : HttpClient) {}

  public getCities(): Observable<any> {
    const obs$ = this.httpClient.get("assets/data/municipios.json").pipe(
      switchMap((json : any) => json),
      map(
        (city: any) =>
          ({...city, confirmed: 0, deaths: 0})
      )
    );

    return obs$;
  }

  public getCitiesLeaf(): Observable<any> {
    const obs$ = this.getCities()
      .pipe(
        toArray()
      );
    return obs$;
  }
}
