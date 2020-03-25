import { createAction, props } from "@ngrx/store";
import { TimeSeries } from "src/models/TimeSeries";

export const GetTimeSeries = createAction(
  "[TIMESERIES] GetTimeseries"
);

export const GetTimeSeriesSuccess = createAction(
  "[TIMESERIES] GetTimeseries Success",
  props<{ timeseries: TimeSeries[] }>()
);

export const GetTimeSeriesFailure = createAction(
  "[TIMESERIES] GetTimeseries Failure",
  props<{ err: any }>()
);

export const TimeSeriesActionTypes = {
  GetTimeSeries,
  GetTimeSeriesSuccess,
  GetTimeSeriesFailure
};
