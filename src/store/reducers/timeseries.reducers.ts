import { createReducer, on } from "@ngrx/store";

import {
  GetTimeSeries,
  GetTimeSeriesFailure,
  GetTimeSeriesSuccess,
} from "../actions/timeseries.actions";
import {
  initialTimeSeriesState,
  timeSeriesAdapter,
} from "../states/timeseries.state";

export const reducer = createReducer(
  initialTimeSeriesState,
  on(
    GetTimeSeriesFailure,
    (state, action) => ({
      ...state,
      error: action.err,
      loading: false
    })
  ),
  on(GetTimeSeries, (state, action) => ({
    ...state,
    error: null,
    loading: true
  })),
  on(GetTimeSeriesSuccess, (state, action) => {
    return timeSeriesAdapter.setAll(action.timeseries, {
      ...state,
      error: null,
      loading: false,
      ultimaAtualizacao: action.lastUpdate
    })
  }
  )
);
