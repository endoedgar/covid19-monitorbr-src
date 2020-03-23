import { createAction, props } from "@ngrx/store";
import { City } from "../../models/City";
import { TimeSeries } from "src/models/TimeSeries";

export const GetTimeSeriesByCity = createAction(
  "[TIMESERIES] GetTimeseriesByCity",
  props<{ city: City }>()
);

export const GetTimeSeriesByCitySuccess = createAction(
  "[TIMESERIES] GetTimeseriesByCity Success",
  props<{ timeseries: TimeSeries[] }>()
);

export const GetTimeSeriesByCityFailure = createAction(
  "[TIMESERIES] GetTimeseriesByCity Failure",
  props<{ err: any }>()
);

export const CityActionTypes = {
  GetTimeSeriesByCity,
  GetTimeSeriesByCitySuccess,
  GetTimeSeriesByCityFailure
};
