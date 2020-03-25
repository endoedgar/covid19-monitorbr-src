import { RegionState } from './region.state';
import { TimeSeriesState } from './timeseries.state';

export interface AppState {
  regions: RegionState,
  timeseries: TimeSeriesState
}