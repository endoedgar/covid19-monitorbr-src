import { createFeatureSelector, createSelector } from '@ngrx/store';
import { cityAdapter, CityState } from '../states/city.state';

export const {
    selectAll: _selectAllFacilities
} = cityAdapter.getSelectors();

export const selectCityState$ = createFeatureSelector<CityState>("city");

export const selectAllCities$ = createSelector(
    selectCityState$,
    _selectAllFacilities
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