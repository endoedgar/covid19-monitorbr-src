import { City } from "../../models/City";
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';

export enum MapModeEnum {
  NONE = "NONE",
  SELECT_CITY = "SELECT_CITY",
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
  mapMode: MapModeEnum.NONE
});
