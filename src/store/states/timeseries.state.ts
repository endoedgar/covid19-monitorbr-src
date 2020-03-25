import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { TimeSeries } from 'src/models/TimeSeries';

export interface TimeSeriesState extends EntityState<TimeSeries> {
  loading : boolean;
  error : any;
}

export const timeSeriesAdapter: EntityAdapter<TimeSeries> = createEntityAdapter<TimeSeries>({
  selectId: instance => instance.city_ibge_code + " " + instance.date
});

export const initialTimeSeriesState: TimeSeriesState = timeSeriesAdapter.getInitialState({
  loading: false,
  error: null
});
