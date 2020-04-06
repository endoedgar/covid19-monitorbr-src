import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { map, switchMap, catchError } from "rxjs/operators";
import moment from "moment-timezone";

import { TimeSeriesService } from "../../services/timeseries.service";
import { Observable, of } from "rxjs";
import {
  GetTimeSeries,
  GetTimeSeriesSuccess,
  GetTimeSeriesFailure
} from "../actions/timeseries.actions";
import { ShowMessage } from "../actions/ui.actions";
import { TranslateService } from "@ngx-translate/core";

@Injectable()
export class TimeSeriesEffects {
  constructor(
    private actions: Actions,
    private timeSeriesService: TimeSeriesService,
    private translate: TranslateService
  ) {}

  @Effect()
  GetTimeSeries: Observable<any> = this.actions.pipe(
    ofType(GetTimeSeries),
    switchMap(action => {
      return this.timeSeriesService.getCases().pipe(
        map(timeseries => {
          return GetTimeSeriesSuccess({
            timeseries,
            lastUpdate: this.timeSeriesService.getUltimaAtualizacao()
          });
        }),
        catchError(err => {
          return of(GetTimeSeriesFailure({ err }));
        })
      );
    })
  );

  @Effect()
  showMessageOnSuccess$: Observable<any> = this.actions.pipe(
    ofType(GetTimeSeriesSuccess),
    switchMap(dados => {
      return of(
        ShowMessage({
          message: this.translate.instant("map.dataLoaded", {
            lastUpdate: moment(dados.lastUpdate).local().format("LLL")
          })
        })
      );
    })
  );

  @Effect()
  showMessageOnFailures$: Observable<any> = this.actions.pipe(
    ofType(GetTimeSeriesFailure),
    map(action => action.err),
    switchMap(err =>
      of(ShowMessage({ message: err.error.message || err.message }))
    )
  );
}
