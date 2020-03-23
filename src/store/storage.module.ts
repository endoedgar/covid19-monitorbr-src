import { NgModule } from "@angular/core";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { StoreDevtoolsModule } from "@ngrx/store-devtools";

import { reducers } from ".";
import { environment } from "src/environments/environment";

import { UIEffects } from "./effects/ui.effects";
import { CitiesEffects } from "./effects/city.effects";
import { TimeSeriesEffects } from './effects/timeseries.effects';

@NgModule({
  imports: [
    StoreModule.forRoot(reducers, {}),
    EffectsModule.forRoot([
      CitiesEffects,
      TimeSeriesEffects,
      UIEffects
    ]),
    environment.production ? [] : StoreDevtoolsModule.instrument()
  ],
  exports: [StoreModule]
})
export class StorageModule {}
