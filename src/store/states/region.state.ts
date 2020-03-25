import { Region } from "../../models/Region";
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';

export enum MapModeEnum {
  SELECT_CITY = "SELECT_CITY",
  SELECT_STATE = "SELECT_STATE"
};

export const MapModeEnum2LabelMapping: Record<MapModeEnum, string> = {
  [MapModeEnum.SELECT_CITY]: "Municipal",
  [MapModeEnum.SELECT_STATE]: "Estadual"
};

export interface RegionState extends EntityState<Region> {
  loading : boolean;
  error : any;
  selectedRegionId : number;
  mapMode : MapModeEnum;
}

export const regionAdapter: EntityAdapter<Region> = createEntityAdapter<Region>({
  selectId: instance => instance.codigo_ibge
});

export const initialRegionState: RegionState = regionAdapter.getInitialState({
  loading: false,
  error: null,
  selectedRegionId: null,
  mapMode: MapModeEnum.SELECT_CITY
});
