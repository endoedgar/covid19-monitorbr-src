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


export const selectCitiesEntities$ = createSelector(
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