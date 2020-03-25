import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  Observable,
  of,
  from,
  BehaviorSubject
} from "rxjs";
import { environment } from "../environments/environment";
import {
  switchMap,
  map,
  toArray,
  groupBy,
  mergeMap,
  startWith,
  scan,
  pairwise,
  flatMap,
  expand,
  tap,
  delay
} from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class TimeSeriesService {
  private _ultimaAtualizacaoDados: BehaviorSubject<Date>;

  constructor(private httpClient: HttpClient) {
    this._ultimaAtualizacaoDados = new BehaviorSubject<Date>(null);
  }

  public getUltimaAtualizacao() : BehaviorSubject<Date> {
    return this._ultimaAtualizacaoDados;
  }

  pegar(url) {
    const getData = url => this.httpClient.get(url);
    const obs$ = getData(url).pipe(
      map((response: any) => response.tables),
      tap(tables => {
        this._ultimaAtualizacaoDados.next(
          new Date(tables.find(table => table.name == "caso").import_date)
        );
      }),
      switchMap(tables =>
        getData(tables.find(table => table.name == "caso").data_url)
      ),
      expand((response: any) =>
        of(null).pipe(
          delay(500),
          switchMap(() => {
            return response.next ? getData(response.next) : of();
          })
        )
      ),
      flatMap((o: any) => o.results),
      toArray(),
      switchMap((array: any[]) => {
        return from(
          array.sort((a, b) => {
            a = Date.parse(a.date);
            b = Date.parse(b.date);
            if (!a) return -1;
            if (!b) return 1;
            return a - b;
          })
        );
      }),
      groupBy(citycase => citycase.city_ibge_code),
      mergeMap(city =>
        city.pipe(
          startWith({ deaths: 0, confirmed: 0 }),
          scan(
            (acc, value) => {
              const newValue = { ...value };
              newValue.deaths = Math.max(acc.deaths, value.deaths);
              newValue.confirmed = Math.max(acc.confirmed, value.confirmed);
              return newValue;
            },
            { deaths: 0, confirmed: 0 }
          ),
          pairwise(),
          map(pair => {
            return {
              ...pair[1],
              confirmeddiff: pair[1].confirmed - pair[0].confirmed,
              deathsdiff: pair[1].deaths - pair[0].deaths
            };
          })
        )
      ),
      toArray()
    );
    return obs$;
  }

  public getCases(): Observable<any> {
    const obs$ = this.pegar(environment.apiUrl);

    return obs$;
  }
}
