import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import {
  map,
  switchMap,
  catchError,
} from "rxjs/operators";

import { TimeSeriesService } from "../../services/timeseries.service";
import { Observable, of } from "rxjs";
import {
  GetTimeSeries,
  GetTimeSeriesSuccess,
  GetTimeSeriesFailure,
} from "../actions/timeseries.actions";
import { ShowMessage } from "../actions/ui.actions";

@Injectable()
export class TimeSeriesEffects {
  constructor(
    private actions: Actions,
    private timeSeriesService: TimeSeriesService
  ) {}

  @Effect()
  GetTimeSeries: Observable<any> = this.actions.pipe(
    ofType(GetTimeSeries),
    switchMap(action => {
      return this.timeSeriesService.getCases().pipe(
        map(timeseries => {
          return GetTimeSeriesSuccess({ timeseries });
        }),
        catchError(err => {
          return of(GetTimeSeriesFailure({ err }));
        })
      );
    })
  );
  
  @Effect()
  showMessageOnFailures$: Observable<any> = this.actions.pipe(
    ofType(
      GetTimeSeriesFailure
    ),
    map(action => action.err),
    switchMap(err =>
      of(ShowMessage({ message: err.error.message || err.message }))
    )
  );
}
