import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AppState } from 'src/store/states/app.state';
import { Store } from '@ngrx/store';
import { ChangeMapRegion, ChangeMode, SetDate } from 'src/store/actions/region.actions';
import { MapModeEnum } from 'src/store/states/region.state';
import moment from "moment-timezone";
import { selectRegionsDate$, selectRegionsMapMode$, getCurrentRegion$, selectMapRegion$ } from 'src/store/selectors/region.selectors';

@Injectable()
export class RouteGuard implements CanActivate {
  private mapDate;
  private mapMode;
  private mapRegion;
  
  constructor(private store: Store<AppState>) {
    this.store.select(selectRegionsDate$).subscribe(mapDate => {
      this.mapDate = moment(mapDate).format("YYYY-MM-DD");
    });
    this.store.select(selectRegionsMapMode$).subscribe(mapMode => {
      this.mapMode = mapMode;
    });
    this.store.select(selectMapRegion$).subscribe(region => {
      this.mapRegion = region;
    })
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean|UrlTree>|Promise<boolean|UrlTree>|boolean|UrlTree {
    if(route.params?.state) {
      const region = route.params.state
      if(this.mapRegion != region) {
        if(region?.length)
          this.store.dispatch(ChangeMapRegion({ region }));
      }
    } else {
      this.store.dispatch(ChangeMapRegion({ region: null }));
    }

    if(route.params?.date) {
      const date = moment(route.params.date)
      if(this.mapDate != date) {
        if(date.isValid())
          this.store.dispatch(SetDate({ date }));
        else {
          this.store.dispatch(SetDate({ date: moment().utc() }));
        }
      }
    } else {
      this.store.dispatch(SetDate({ date: moment().utc() }));
    }

    if(route.params?.mode) {
      const mode = route.params.mode;
      if(this.mapMode != mode) {
        if(mode?.length) {
          const modeEnum = MapModeEnum[mode];
          this.store.dispatch(ChangeMode({mode: modeEnum}))
        }
      }
    }
    return true;
  }
}