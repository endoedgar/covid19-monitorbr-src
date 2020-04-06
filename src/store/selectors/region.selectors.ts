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
import moment from "moment-timezone";

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

export const selectMapRegion$ = createSelector(
  selectRegionState$,
  state => state.mapRegion
);

export const selectSelectedMapRegion$ = createSelector(
  selectRegionState$,
  selectAllRegions$,
  (state,regions) => state.mapRegion != null ? regions.find(r => r.sigla == state.mapRegion) : undefined
);

export const getRegionsWithLatestCases$ = store =>
  combineLatest(
    store.select(selectAllRegionsEntities$),
    store.select(selectAllTimeSeries$),
    store.select(selectRegionsMapMode$),
    store.select(selectRegionsDate$),
    store.select(selectSelectedMapRegion$),
    (
      regions: Region[],
      allTimeSeries: TimeSeries[],
      currentMode: MapModeEnum,
      date: moment.Moment,
      selectedMapRegion: Region
    ) => {
      const returnedRegions = {};
      allTimeSeries.forEach(timeseries => {
        const region = regions[timeseries.city_ibge_code];
        if(selectedMapRegion != null && (region?.codigo_uf != selectedMapRegion?.codigo_ibge && region?.codigo_ibge != selectedMapRegion.codigo_ibge))
          return;
        if (typeof region != "undefined" && timeseries.date.isSameOrBefore(date, 'day')) {
          if (
            ([
              MapModeEnum.SELECT_CITY,
              MapModeEnum.SELECT_CITY_PER_DAY
            ].includes(currentMode) &&
              region.tipo == RegionTipoEnum.CIDADE) ||
            ([
              MapModeEnum.SELECT_STATE,
              MapModeEnum.SELECT_STATE_PER_DAY
            ].includes(currentMode) &&
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

            if (
              [MapModeEnum.SELECT_CITY, MapModeEnum.SELECT_STATE].includes(
                currentMode
              )
            ) {
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

export const getRegionWithLatestCases$ = store =>
  combineLatest(
    store.select(getCurrentRegion$),
    store.select(selectAllTimeSeries$),
    store.select(selectRegionsMapMode$),
    store.select(selectRegionsDate$),
    (
      region: Region,
      allTimeSeries: TimeSeries[],
      currentMode: MapModeEnum,
      date: moment.Moment
    ) => {
      if(!region)
        return {}
      let returnedRegion = {
        ...region,
        timeseries: []
      };
      allTimeSeries
        .filter(timeSeries => timeSeries.city_ibge_code == region.codigo_ibge)
        .forEach(timeseries => {
          if (timeseries.date.isSameOrBefore(date,'day')) {
            if (
              [MapModeEnum.SELECT_CITY, MapModeEnum.SELECT_STATE].includes(
                currentMode
              )
            ) {
              returnedRegion.confirmed += timeseries.confirmeddiff;
              returnedRegion.deaths += timeseries.deathsdiff;
            } else {
              returnedRegion.confirmed = timeseries.confirmeddiff;
              returnedRegion.deaths = timeseries.deathsdiff;
            }
            returnedRegion.timeseries.push(timeseries);
          }
        });

      return returnedRegion;
    }
  );
