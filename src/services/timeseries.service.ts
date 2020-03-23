import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of, from } from "rxjs";

import { environment } from "../environments/environment";
import timeseriesJson from "../assets/data/timeseries.json";
import { switchMap, map, toArray, filter, reduce } from "rxjs/operators";
import { City } from "src/models/City";

@Injectable({ providedIn: "root" })
export class TimeSeriesService {
  constructor() {}

  public getTimeSeriesByCity(city: City): Observable<any> {
    let obs$ = of(timeseriesJson);
    /*.pipe(
      switchMap(geojson => geojson.features),
      map((feature : any) => <City>({
        codigo_ibge: feature.properties.id,
        nome: feature.properties.name,
        geometria: feature.geometry.coordinates
      })),
      toArray()
    )*/

    obs$ = of();
    return obs$;
  }

  public getLatestData(): Observable<any> {
    let obs$ = from(timeseriesJson)
      .pipe(
        filter(
          (timeSeries: any) => timeSeries.ibge != null && timeSeries.ibge != 0
        ),
        map(timeSeries => ({
          ibge: timeSeries.ibge,
          date:
            timeSeries.dates[
              Object.keys(timeSeries.dates)[
                Object.keys(timeSeries.dates).length - 1
              ]
            ]
        })),
        reduce((acc: any, curr: any) => ({ ...acc, [curr.ibge]: {...curr.date} }))
      )
    return obs$;
  }
}
