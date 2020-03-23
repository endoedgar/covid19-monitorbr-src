import { createFeatureSelector, createSelector } from '@ngrx/store';
import { timeSeriesAdapter, TimeSeriesState } from '../states/timeseries.state';
import { TimeSeries } from 'src/models/TimeSeries';

export const {
    selectAll: _selectAllTimeSeries
} = timeSeriesAdapter.getSelectors();

export const selectTimeSeriesState$ = createFeatureSelector<TimeSeriesState>("timeseries");

export const selectAllCities$ = createSelector(
    selectTimeSeriesState$,
    _selectAllTimeSeries
);

export const selectTimeSeriesLoading$ = createSelector(
    selectTimeSeriesState$,
    state => state.loading
);