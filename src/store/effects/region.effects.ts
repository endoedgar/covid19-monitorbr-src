import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { map, switchMap, catchError, toArray } from "rxjs/operators";

import { RegionService } from "../../services/region.service";
import { TimeSeriesService } from "../../services/timeseries.service";

import { Observable, of, merge } from "rxjs";
import {
  GetRegions,
  GetRegionsSuccess,
  GetRegionsFailure
} from "../actions/region.actions";
import { ShowMessage } from "../actions/ui.actions";
import { Region } from "../../models/Region";
import { MapModeEnum } from "../states/region.state";

@Injectable()
export class RegionsEffects {
  constructor(
    private actions: Actions,
    private regionService: RegionService,
    private timeSeriesService: TimeSeriesService
  ) {}

  @Effect()
  GetRegions: Observable<any> = this.actions.pipe(
    ofType(GetRegions),
    switchMap(_ => {
      return merge(
        this.regionService.getStates(),
        this.regionService.getCities()
      ).pipe(
        toArray(),
        map((regions: Region[]) => {
          return GetRegionsSuccess({ regions });
        }),
        catchError(err => {
          return of(GetRegionsFailure({ err }));
        })
      );
    })
  );

  @Effect()
  showMessageOnFailures$: Observable<any> = this.actions.pipe(
    ofType(GetRegionsFailure),
    map(action => action.err),
    switchMap(err => {
      console.error(err);
      return of(ShowMessage({ message: err?.error?.message || err?.message }));
    })
  );
}
