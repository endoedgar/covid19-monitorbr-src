import { createFeatureSelector, createSelector } from '@ngrx/store';
import { cityAdapter, CityState } from '../states/city.state';

import { selectAllTimeSeries$ } from './timeseries.selectors'
import { combineLatest } from 'rxjs';
import { City } from 'src/models/City';
import { TimeSeries } from 'src/models/TimeSeries';

export const {
    selectAll: _selectAllCities,
    selectEntities: _selectCitiesEntities
} = cityAdapter.getSelectors();

export const selectCityState$ = createFeatureSelector<CityState>("cities");

export const selectAllCities$ = createSelector(
    selectCityState$,
    _selectAllCities
);


export const selectAllCitiesEntities$ = createSelector(
    selectCityState$,
    _selectCitiesEntities
);
export const getCurrentCityId$ = createSelector(
    selectCityState$,
    (state : CityState) => state.selectedCityId
);

export const getCurrentCity$ = createSelector(
    selectCityState$,
    getCurrentCityId$,
    state => state.entities[state.selectedCityId]
);

export const selectCitiesLoading$ = createSelector(
    selectCityState$,
    state => state.loading
);

export const selectCitiesMapMode$ = createSelector(
    selectCityState$,
    state => state.mapMode
);

var timer = function(name) {
    var start = new Date();
    return {
      stop: function() {
        var end = new Date();
        var time = end.getTime() - start.getTime();
        console.log("Timer:", name, "finished in", time, "ms");
      }
    };
  };

export const getCitiesWithLatestCases$ = (store) => combineLatest(
    store.select(selectAllCitiesEntities$),
    store.select(selectAllTimeSeries$),
    (cities: City[], allTimeSeries: TimeSeries[]) => {
      const t = timer("combineLatest");
      const returnedCities = {};
      allTimeSeries.forEach(
        timeseries => {
          const city = cities[timeseries.city_ibge_code];
          if(typeof city != 'undefined') {
            if(typeof returnedCities[timeseries.city_ibge_code] == 'undefined')
              returnedCities[timeseries.city_ibge_code] = {...city, timeseries: []};
            const rCity = returnedCities[timeseries.city_ibge_code]
            rCity.confirmed += timeseries.confirmeddiff;
            rCity.deaths += timeseries.deathsdiff;
            rCity.timeseries.push(timeseries);
          }
        }
      );

      return returnedCities;
    }
  );