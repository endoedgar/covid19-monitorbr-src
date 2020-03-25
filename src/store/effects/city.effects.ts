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

import { CityService } from "../../services/city.service";
import { TimeSeriesService } from "../../services/timeseries.service";

import { Observable, of, merge, combineLatest, forkJoin, concat } from "rxjs";
import {
  GetCities,
  GetCitiesSuccess,
  GetCitiesFailure,
  SelectCity,
  ChangeMode,
  DeselectCity
} from "../actions/city.actions";
import { ShowMessage } from "../actions/ui.actions";
import { City } from "../../models/City";
import { MapModeEnum } from "../states/city.state";

@Injectable()
export class CitiesEffects {
  constructor(
    private actions: Actions,
    private cityService: CityService,
    private timeSeriesService: TimeSeriesService
  ) {}

  @Effect()
  GetCities: Observable<any> = this.actions.pipe(
    ofType(GetCities),
    switchMap(_ => {
      return concat(this.cityService.getStates()).pipe(
        map((cities : City[]) => {
          return GetCitiesSuccess({ cities });
        }),
        catchError(err => {
          return of(GetCitiesFailure({ err }));
        })
      )
    })
  );

  @Effect()
  showMessageOnFailures$: Observable<any> = this.actions.pipe(
    ofType(GetCitiesFailure),
    map(action => action.err),
    switchMap(err => {
      console.error(err);
      return of(ShowMessage({ message: err?.error?.message || err?.message }))
    }
    )
  );
}
