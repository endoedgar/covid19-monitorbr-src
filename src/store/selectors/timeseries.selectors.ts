import { createFeatureSelector, createSelector } from '@ngrx/store';
import { timeSeriesAdapter, TimeSeriesState } from '../states/timeseries.state';
import { TimeSeries } from 'src/models/TimeSeries';

export const {
    selectAll: _selectAllTimeSeries,
    selectEntities: _selectCitiesEntities
} = timeSeriesAdapter.getSelectors();

export const selectTimeSeriesState$ = createFeatureSelector<TimeSeriesState>("timeseries");

export const selectAllTimeSeries$ = createSelector(
    selectTimeSeriesState$,
    _selectAllTimeSeries
);

export const selectAllTimeSeriesEntities$ = createSelector(
    selectTimeSeriesState$,
    _selectCitiesEntities
);

export const selectTimeSeriesLoading$ = createSelector(
    selectTimeSeriesState$,
    state => state.loading
);

export const selectTimeSeriesUltimaAtualizacao$ = createSelector(
    selectTimeSeriesState$,
    state => state.ultimaAtualizacao
)