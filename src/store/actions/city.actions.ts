import { createAction, props } from "@ngrx/store";
import { City } from "../../models/City";
import { MapModeEnum } from '../states/city.state';

export const GetCities = createAction("[CITY] GetCities");

export const GetCitiesSuccess = createAction(
  "[CITY] GetCities Success",
  props<{ cities: City[] }>()
);

export const GetCitiesFailure = createAction(
  "[CITY] GetCities Failure",
  props<{ err: any }>()
);

export const SelectCity = createAction(
  "[CITY] Select City",
  props<{ city: City }>()
);

export const DeselectCity = createAction(
  "[CITY] Deselect City"
);

export const ChangeMode = createAction(
  "[CITY] Change City Map Mode",
  props<{ mode: MapModeEnum }>()
);

export const CityActionTypes = {
  GetCities,
  GetCitiesSuccess,
  GetCitiesFailure,

  DeselectCity,
  SelectCity
};
