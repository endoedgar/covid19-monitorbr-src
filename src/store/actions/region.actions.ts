import { createAction, props } from "@ngrx/store";
import { Region } from "../../models/Region";
import { MapModeEnum } from '../states/region.state';

export const GetRegions = createAction("[REGION] GetRegions");

export const GetRegionsSuccess = createAction(
  "[REGION] GetRegions Success",
  props<{ regions: Region[] }>()
);

export const GetRegionsFailure = createAction(
  "[REGION] GetRegions Failure",
  props<{ err: any }>()
);

export const SelectRegion = createAction(
  "[REGION] Select Region",
  props<{ region: Region }>()
);

export const DeselectRegion = createAction(
  "[REGION] Deselect Region"
);

export const ChangeMode = createAction(
  "[REGION] Change Region Map Mode",
  props<{ mode: MapModeEnum }>()
);

export const RegionActionTypes = {
  GetRegions,
  GetRegionsSuccess,
  GetRegionsFailure,

  DeselectRegion,
  SelectRegion
};
