import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import {
  map,
  switchMap,
  catchError,
  tap,
  concatMapTo,
  mergeMap,
  filter,
  pairwise
} from "rxjs/operators";

import { TimeSeriesService } from "../../services/timeseries.service";
import { Observable, of, merge } from "rxjs";
import {
  GetTimeSeriesByCity,
  GetTimeSeriesByCitySuccess,
  GetTimeSeriesByCityFailure,
} from "../actions/timeseries.actions";
import { ShowMessage } from "../actions/ui.actions";
import { City } from "../../models/City";
import { TimeSeries } from 'src/models/TimeSeries';

@Injectable()
export class TimeSeriesEffects {
  constructor(
    private actions: Actions,
    private timeSeriesService: TimeSeriesService
  ) {}

  @Effect()
  GetTimeSeries: Observable<any> = this.actions.pipe(
    ofType(GetTimeSeriesByCity),
    switchMap(action => {
      return this.timeSeriesService.getTimeSeriesByCity(action.city).pipe(
        map(timeseries => {
          return GetTimeSeriesByCitySuccess({ timeseries });
        }),
        catchError(err => {
          return of(GetTimeSeriesByCityFailure({ err }));
        })
      );
    })
  );
  
  @Effect()
  showMessageOnFailures$: Observable<any> = this.actions.pipe(
    ofType(
      GetTimeSeriesByCityFailure
    ),
    map(action => action.err),
    switchMap(err =>
      of(ShowMessage({ message: err.error.message || err.message }))
    )
  );
}
