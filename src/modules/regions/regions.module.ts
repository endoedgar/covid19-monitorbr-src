import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { StoreModule } from "@ngrx/store";
import { reducers } from "src/store";
import { EffectsModule } from "@ngrx/effects";
import { BodyReduxComponent } from "./body/body.component";
import { RegionsEffects } from "src/store/effects/region.effects";
import { RegionListComponent } from "./region-list/region-list.component";

import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTableModule } from "@angular/material/table";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSortModule } from "@angular/material/sort";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSelectModule } from "@angular/material/select";
import { MapComponent } from "./map/map.component";
import { TimeSeriesEffects } from "src/store/effects/timeseries.effects";

@NgModule({
  declarations: [BodyReduxComponent, RegionListComponent, MapComponent],
  imports: [
    CommonModule,
    StoreModule.forFeature("regions", reducers.regions),
    StoreModule.forFeature("timeseries", reducers.timeseries),
    EffectsModule.forFeature([RegionsEffects, TimeSeriesEffects]),
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
    MatSidenavModule,
    MatSelectModule
  ],
  entryComponents: []
})
export class RegionsModule {
  constructor() {}
}
