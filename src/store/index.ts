import { ActionReducerMap } from '@ngrx/store';

import * as region from "./reducers/region.reducers";
import * as timeseries from "./reducers/timeseries.reducers";

import { AppState } from './states/app.state';

export const reducers : ActionReducerMap<AppState> = {
    regions: region.reducer,
    timeseries: timeseries.reducer
};