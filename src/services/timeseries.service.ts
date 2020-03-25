import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of, from } from "rxjs";

import { environment } from "../environments/environment";
//import timeseriesJson from "../assets/data/timeseries.json";
import { switchMap, map, toArray, filter, reduce } from "rxjs/operators";
import { City } from "src/models/City";
//import brazilCases from "src/assets/data/brazil-cases.json";

@Injectable({ providedIn: "root" })
export class TimeSeriesService {
  constructor(private httpClient : HttpClient) {}

  public getCases(): Observable<any> {
    const obs$ = this.httpClient.get("assets/data/20200324.json");
    
    //const obs$ = of(brazilCases).pipe(
    //  map(request => request.docs)
    //);
    return obs$;
  }
}
