import { createReducer, on } from "@ngrx/store";

import {
  GetCities,
  GetCitiesFailure,
  GetCitiesSuccess,
  SelectCity,
  ChangeMode,
  DeselectCity
} from "../actions/city.actions";
import {
  initialCityState,
  cityAdapter,
  MapModeEnum
} from "../states/city.state";

export const reducer = createReducer(
  initialCityState,
  on(
    GetCitiesFailure,
    (state, action) => ({
      ...state,
      error: action.err,
      loading: false
    })
  ),
  on(GetCities, (state, action) => ({
    ...state,
    error: null,
    loading: true,
    selectedFacilityId: null,
    mapMode: MapModeEnum.SELECT_CITY
  })),
  on(GetCitiesSuccess, (state, action) =>  {
    return cityAdapter.setAll(action.cities, {
      ...state,
      error: null,
      loading: false
    })
  }
  ),
  on(SelectCity, (state, action) => ({
    ...state,
    selectedCityId: action.city.codigo_ibge
  })),
  on(DeselectCity, (state, action) => ({
    ...state,
    selectedCityId: null
  })),
  on(ChangeMode, (state, action) => ({
    ...state,
    mapMode: action.mode,
    selectedCityId: null
  }))
);
