import { CityState } from './city.state';
import { TimeSeriesState } from './timeseries.state';

export interface AppState {
  cities: CityState,
  timeseries: TimeSeriesState
}