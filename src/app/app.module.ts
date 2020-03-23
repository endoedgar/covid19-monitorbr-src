import { BrowserModule } from "@angular/platform-browser";
import { NgModule, Injector } from "@angular/core";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";
import { StorageModule } from "src/store/storage.module";
import { StoreDevtoolsModule } from "@ngrx/store-devtools";
import { environment } from "../environments/environment";
import { HttpClientModule } from "@angular/common/http";
import { ChartsModule } from "ng2-charts";

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    EffectsModule.forRoot([]),
    StorageModule,
    HttpClientModule,
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production
    }),
    ChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
