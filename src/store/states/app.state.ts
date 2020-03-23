import { CityState } from './city.state';
import { TimeSeriesState } from './timeseries.state';

export interface AppState {
  city: CityState,
  timeseries: TimeSeriesState
}