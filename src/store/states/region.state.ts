import { Region } from "../../models/Region";
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';

export enum MapModeEnum {
  SELECT_CITY = "SELECT_CITY",
  SELECT_STATE = "SELECT_STATE",
  SELECT_CITY_PER_DAY = "SELECT_CITY_PER_DAY",
  SELECT_STATE_PER_DAY = "SELECT_STATE_PER_DAY",
};

export const MapModeEnum2LabelMapping: Record<MapModeEnum, string> = {
  [MapModeEnum.SELECT_CITY]: "Municipal / Total",
  [MapModeEnum.SELECT_STATE]: "Estadual / Total",
  [MapModeEnum.SELECT_CITY_PER_DAY]: "Municipal / Dia",
  [MapModeEnum.SELECT_STATE_PER_DAY]: "Estadual / Dia",
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
