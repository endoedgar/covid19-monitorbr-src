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

import moment from 'moment';

@Injectable({ providedIn: "root" })
export class TimeSeriesService {
  private _ultimaAtualizacaoDados: moment.Moment;

  constructor(private httpClient: HttpClient) {
    this._ultimaAtualizacaoDados =  null;
  }

  public getUltimaAtualizacao() : moment.Moment {
    return this._ultimaAtualizacaoDados;
  }

  pegar(url) {
    const getData = url => this.httpClient.get(url);
    const obs$ = getData(url).pipe(
      /*map((response: any) => response.tables),
      tap(tables => {
        this._ultimaAtualizacaoDados = new Date(tables.find(table => table.name == "caso").import_date);
      }),
      switchMap(tables =>
        getData(tables.find(table => table.name == "caso").data_url+"?page_size=10000")
      ),
      expand((response: any) =>
        of(null).pipe(
          delay(500),
          switchMap(() => {
            return response.next ? getData(response.next) : of();
          })
        )
      ),*/
      flatMap((o: any) => {
        this._ultimaAtualizacaoDados = moment.utc(o.ultimaAtualizacaoDados);
        return o.results
      }),
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
            (acc, value:any) => {
              const newValue = { ...value };
              if(value.deaths < acc.deaths)
                console.log(`Mortes diminuiram do dia ${acc.date}: ${acc.deaths} para ${value.date}: ${value.deaths}. (IBGE: ${value.city_ibge_code})`);
              newValue.deaths = Math.max(acc.deaths, value.deaths);
              newValue.confirmed = Math.max(acc.confirmed, value.confirmed);
              newValue.estimated_population = value.estimated_population_2019;
              newValue.date = moment(value.date);
              return newValue;
            },
            { deaths: 0, confirmed: 0, date: null, city_ibge_code: null }
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
