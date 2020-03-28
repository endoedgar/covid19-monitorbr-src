import { createFeatureSelector, createSelector } from "@ngrx/store";
import {
  regionAdapter,
  RegionState,
  MapModeEnum
} from "../states/region.state";

import { selectAllTimeSeries$ } from "./timeseries.selectors";
import { combineLatest } from "rxjs";
import { Region, RegionTipoEnum } from "src/models/Region";
import { TimeSeries } from "src/models/TimeSeries";

export const {
  selectAll: _selectAllRegions,
  selectEntities: _selectRegionsEntities
} = regionAdapter.getSelectors();

export const selectRegionState$ = createFeatureSelector<RegionState>("regions");

export const selectAllRegions$ = createSelector(
  selectRegionState$,
  _selectAllRegions
);

export const selectAllRegionsEntities$ = createSelector(
  selectRegionState$,
  _selectRegionsEntities
);
export const getCurrentRegionId$ = createSelector(
  selectRegionState$,
  (state: RegionState) => state.selectedRegionId
);

export const getCurrentRegion$ = createSelector(
  selectRegionState$,
  getCurrentRegionId$,
  state => state.entities[state.selectedRegionId]
);

export const selectRegionsLoading$ = createSelector(
  selectRegionState$,
  state => state.loading
);

export const selectRegionsMapMode$ = createSelector(
  selectRegionState$,
  state => state.mapMode
);

export const selectRegionsDate$ = createSelector(
  selectRegionState$,
  state => state.date
);

export const getRegionsWithLatestCases$ = store =>
  combineLatest(
    store.select(selectAllRegionsEntities$),
    store.select(selectAllTimeSeries$),
    store.select(selectRegionsMapMode$),
    store.select(selectRegionsDate$),
    (
      regions: Region[],
      allTimeSeries: TimeSeries[],
      currentMode: MapModeEnum,
      date: Date
    ) => {
      const returnedRegions = {};
      allTimeSeries.forEach(timeseries => {
        const region = regions[timeseries.city_ibge_code];
        if (typeof region != "undefined" && new Date(timeseries.date) < date) {
          if (
            ([MapModeEnum.SELECT_CITY, MapModeEnum.SELECT_CITY_PER_DAY].includes(currentMode) &&
              region.tipo == RegionTipoEnum.CIDADE) ||
            ([MapModeEnum.SELECT_STATE, MapModeEnum.SELECT_STATE_PER_DAY].includes(currentMode) &&
              region.tipo == RegionTipoEnum.ESTADO)
          ) {
            if (
              typeof returnedRegions[timeseries.city_ibge_code] == "undefined"
            )
              returnedRegions[timeseries.city_ibge_code] = {
                ...region,
                timeseries: []
              };
            const rRegion = returnedRegions[timeseries.city_ibge_code];

            if([MapModeEnum.SELECT_CITY, MapModeEnum.SELECT_STATE].includes(currentMode)) {
              rRegion.confirmed += timeseries.confirmeddiff;
              rRegion.deaths += timeseries.deathsdiff;
            } else {
              rRegion.confirmed = timeseries.confirmeddiff;
              rRegion.deaths = timeseries.deathsdiff;
            }
            rRegion.timeseries.push(timeseries);
          }
        }
      });

      return returnedRegions;
    }
  );
