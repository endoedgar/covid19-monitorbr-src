import { createReducer, on } from "@ngrx/store";

import {
  GetRegions,
  GetRegionsFailure,
  GetRegionsSuccess,
  SelectRegion,
  ChangeMode,
  DeselectRegion,
  SetDate
} from "../actions/region.actions";
import {
  initialRegionState,
  regionAdapter,
  MapModeEnum
} from "../states/region.state";

export const reducer = createReducer(
  initialRegionState,
  on(
    GetRegionsFailure,
    (state, action) => ({
      ...state,
      error: action.err,
      loading: false
    })
  ),
  on(GetRegions, (state, action) => ({
    ...state,
    error: null,
    loading: true,
    selectedRegionId: null,
    mapMode: MapModeEnum.SELECT_CITY
  })),
  on(GetRegionsSuccess, (state, action) =>  {
    return regionAdapter.setAll(action.regions, {
      ...state,
      error: null,
      loading: false
    })
  }
  ),
  on(SelectRegion, (state, action) => ({
    ...state,
    selectedRegionId: action.region.codigo_ibge
  })),
  on(DeselectRegion, (state, action) => ({
    ...state,
    selectedRegionId: null
  })),
  on(ChangeMode, (state, action) => ({
    ...state,
    mapMode: action.mode,
    selectedRegionId: null
  })),
  on(SetDate, (state, action) => ({
    ...state,
    date: action.date
  }))
);
