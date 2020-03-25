import { City } from "../../models/City";
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';

export enum MapModeEnum {
  SELECT_CITY = "SELECT_CITY",
  SELECT_STATE = "SELECT_STATE"
};

export const MapModeEnum2LabelMapping: Record<MapModeEnum, string> = {
  [MapModeEnum.SELECT_CITY]: "Municipal",
  [MapModeEnum.SELECT_STATE]: "Estadual"
};

export interface CityState extends EntityState<City> {
  loading : boolean;
  error : any;
  selectedCityId : number;
  mapMode : MapModeEnum;
}

export const cityAdapter: EntityAdapter<City> = createEntityAdapter<City>({
  selectId: instance => instance.codigo_ibge
});

export const initialCityState: CityState = cityAdapter.getInitialState({
  loading: false,
  error: null,
  selectedCityId: null,
  mapMode: MapModeEnum.SELECT_CITY
});
