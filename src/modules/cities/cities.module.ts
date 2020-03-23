import { NgModule, Injector } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { StoreModule } from "@ngrx/store";
import { reducers } from 'src/store';
import { EffectsModule } from "@ngrx/effects";
import { BodyReduxComponent } from "./body/body.component";
import { EsriMapComponent } from "./esri-map/esri-map.component";
import { CitiesEffects } from 'src/store/effects/city.effects'
import { CityListComponent } from './city-list/city-list.component';

import {MatCardModule} from '@angular/material/card';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatDialogModule} from '@angular/material/dialog';
import {MatSortModule} from '@angular/material/sort';
import {MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule } from '@angular/material/input';
import {MatSidenavModule } from '@angular/material/sidenav';
import { MapComponent } from './map/map.component';
import { TimeSeries } from 'src/models/TimeSeries';
import { TimeSeriesEffects } from 'src/store/effects/timeseries.effects';
import { PopupCityChartComponent } from './popup-city-chart/popup-city-chart.component';
import { createCustomElement } from "@angular/elements";

@NgModule({
  declarations: [
    BodyReduxComponent,
    EsriMapComponent,
    CityListComponent,
    MapComponent,
    PopupCityChartComponent
  ],
  imports: [
    CommonModule,
    StoreModule.forFeature("cities", reducers.cities),
    StoreModule.forFeature("timeseries", reducers.timeseries),
    EffectsModule.forFeature([CitiesEffects, TimeSeriesEffects]),
    RouterModule.forChild([{ path: "", component: BodyReduxComponent }]),
    FormsModule,
    ReactiveFormsModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule
  ],
  entryComponents: [PopupCityChartComponent],
})
export class CitiesModule {
  constructor(injector: Injector) {
    const PopupElement = createCustomElement(PopupCityChartComponent, {injector});
    customElements.define('app-popup-city-chart-element', PopupElement);
  }
}
