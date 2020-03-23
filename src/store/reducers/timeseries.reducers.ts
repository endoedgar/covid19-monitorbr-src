import { createReducer, on } from "@ngrx/store";

import {
  GetTimeSeriesByCity,
  GetTimeSeriesByCityFailure,
  GetTimeSeriesByCitySuccess,
} from "../actions/timeseries.actions";
import {
  initialTimeSeriesState,
  timeSeriesAdapter,
} from "../states/timeseries.state";

export const reducer = createReducer(
  initialTimeSeriesState,
  on(
    GetTimeSeriesByCityFailure,
    (state, action) => ({
      ...state,
      error: action.err,
      loading: false
    })
  ),
  on(GetTimeSeriesByCity, (state, action) => ({
    ...state,
    error: null,
    loading: true
  })),
  on(GetTimeSeriesByCitySuccess, (state, action) => 
    timeSeriesAdapter.addAll(action.timeseries, {
      ...state,
      error: null,
      loading: false
    })
  )
);
