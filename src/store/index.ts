import { ActionReducerMap } from '@ngrx/store';

import * as city from "./reducers/city.reducers";
import * as timeseries from "./reducers/timeseries.reducers";

import { AppState } from './states/app.state';

export const reducers : ActionReducerMap<AppState> = {
    city: city.reducer,
    timeseries: timeseries.reducer
};