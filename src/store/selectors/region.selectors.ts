import { createFeatureSelector, createSelector } from "@ngrx/store";
import {
  regionAdapter,
  RegionState,
  MapModeEnum,
} from "../states/region.state";

import { selectAllTimeSeries$ } from "./timeseries.selectors";
import { combineLatest } from "rxjs";
import { Region, RegionTipoEnum } from "src/models/Region";
import { TimeSeries } from "src/models/TimeSeries";
import moment from "moment-timezone";

export const {
  selectAll: _selectAllRegions,
  selectEntities: _selectRegionsEntities,
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
  (state) => state.entities[state.selectedRegionId]
);

export const selectRegionsLoading$ = createSelector(
  selectRegionState$,
  (state) => state.loading
);

export const selectRegionsMapMode$ = createSelector(
  selectRegionState$,
  (state) => state.mapMode
);

export const selectRegionsDate$ = createSelector(
  selectRegionState$,
  (state) => state.date
);

export const selectMapRegion$ = createSelector(
  selectRegionState$,
  (state) => state.mapRegion
);

export const selectSelectedMapRegion$ = createSelector(
  selectRegionState$,
  selectAllRegions$,
  (state, regions) =>
    state.mapRegion != null
      ? regions.find((r) => r.sigla == state.mapRegion)
      : undefined
);

export const getRegionsWithLatestCases$ = (store) =>
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
      allTimeSeries.forEach((timeseries) => {
        const region = regions[timeseries.city_ibge_code];
        if (
          selectedMapRegion != null &&
          region?.codigo_uf != selectedMapRegion?.codigo_ibge &&
          region?.codigo_ibge != selectedMapRegion.codigo_ibge
        )
          return;
        if (
          typeof region != "undefined" &&
          timeseries.date.isSameOrBefore(date, "day")
        ) {
          if (
            ([
              MapModeEnum.SELECT_CITY,
              MapModeEnum.SELECT_CITY_PER_DAY,
              MapModeEnum.SELECT_CITY_PER_100K,
            ].includes(currentMode) &&
              region.tipo == RegionTipoEnum.CIDADE) ||
            ([
              MapModeEnum.SELECT_STATE,
              MapModeEnum.SELECT_STATE_PER_DAY,
              MapModeEnum.SELECT_STATE_PER_100K,
            ].includes(currentMode) &&
              region.tipo == RegionTipoEnum.ESTADO)
          ) {
            if (
              typeof returnedRegions[timeseries.city_ibge_code] == "undefined"
            )
              returnedRegions[timeseries.city_ibge_code] = {
                ...region,
                timeseries: [],
              };
            const rRegion = returnedRegions[timeseries.city_ibge_code];
            rRegion.estimated_population = timeseries.estimated_population;

            switch (currentMode) {
              case MapModeEnum.SELECT_CITY:
              case MapModeEnum.SELECT_STATE:
                rRegion.confirmed += timeseries.confirmeddiff;
                rRegion.deaths += timeseries.deathsdiff;
                break;
              case MapModeEnum.SELECT_CITY_PER_DAY:
              case MapModeEnum.SELECT_STATE_PER_DAY:
                rRegion.confirmed = timeseries.confirmeddiff;
                rRegion.deaths = timeseries.deathsdiff;
                break;
              case MapModeEnum.SELECT_CITY_PER_100K:
              case MapModeEnum.SELECT_STATE_PER_100K:
                rRegion.confirmed =
                  Math.round((100000 *
                  (timeseries.confirmed / rRegion.estimated_population))*10000)/10000;
                  rRegion.deaths =
                  Math.round((100000 *
                  (timeseries.deaths / rRegion.estimated_population))*10000)/10000;
                break;
              default:
                rRegion.confirmed = rRegion.deaths = 0;
            }
            rRegion.timeseries.push(timeseries);
          }
        }
      });
      return returnedRegions;
    }
  );

export const getRegionWithLatestCases$ = (store) =>
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
      if (!region) return {};
      let returnedRegion = {
        ...region,
        timeseries: [],
      };
      allTimeSeries
        .filter((timeSeries) => timeSeries.city_ibge_code == region.codigo_ibge)
        .forEach((timeseries) => {
          if (timeseries.date.isSameOrBefore(date, "day")) {
            returnedRegion.estimated_population =
              timeseries.estimated_population;
            switch (currentMode) {
              case MapModeEnum.SELECT_CITY:
              case MapModeEnum.SELECT_STATE:
                returnedRegion.confirmed += timeseries.confirmeddiff;
                returnedRegion.deaths += timeseries.deathsdiff;
                break;
              case MapModeEnum.SELECT_CITY_PER_DAY:
              case MapModeEnum.SELECT_STATE_PER_DAY:
                returnedRegion.confirmed = timeseries.confirmeddiff;
                returnedRegion.deaths = timeseries.deathsdiff;
                break;
              case MapModeEnum.SELECT_CITY_PER_100K:
              case MapModeEnum.SELECT_STATE_PER_100K:
                returnedRegion.confirmed =
                  Math.round((100000 *
                  (timeseries.confirmed / returnedRegion.estimated_population))*10000)/10000;
                returnedRegion.deaths =
                  Math.round((100000 *
                  (timeseries.deaths / returnedRegion.estimated_population))*10000)/10000;
                break;
              default:
                returnedRegion.confirmed = returnedRegion.deaths = 0;
            }
            returnedRegion.timeseries.push(timeseries);
          }
        });

      return returnedRegion;
    }
  );
