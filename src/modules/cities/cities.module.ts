import { NgModule } from "@angular/core";
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

@NgModule({
  declarations: [
    BodyReduxComponent,
    EsriMapComponent,
    CityListComponent
  ],
  imports: [
    CommonModule,
    StoreModule.forFeature("cities", reducers.city),
    EffectsModule.forFeature([CitiesEffects]),
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
    MatInputModule
  ]
})
export class CitiesModule { }
