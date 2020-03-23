import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { AppState } from "src/store/states/app.state";
import { MatTableDataSource } from "@angular/material/table";
import {
  selectAllCities$,
  selectCitiesLoading$,
  getCurrentCity$,
  selectCitiesMapMode$
} from "src/store/selectors/city.selectors";
import {
  GetCities,
  ChangeMode,
  SelectCity
} from "src/store/actions/city.actions";
import { MatPaginator } from "@angular/material/paginator";
import { MapModeEnum } from "src/store/states/city.state";
import { City } from "src/models/City";
import { Subscription } from "rxjs";
import { MatSort, MatSortable, Sort } from "@angular/material/sort";

@Component({
  selector: "app-city-list",
  templateUrl: "./city-list.component.html",
  styleUrls: ["./city-list.component.scss"]
})
export class CityListComponent implements OnInit, OnDestroy {
  subscriptions$: Subscription[];
  dataSource: MatTableDataSource<City>;
  displayedColumns: string[] = ["nome", "confirmed", "deaths", "recovery"];
  loading$ = this.store.select(selectCitiesLoading$);
  facility$ = this.store.select(getCurrentCity$);
  mapMode$ = this.store.select(selectCitiesMapMode$);
  mapMode: MapModeEnum;
  facility: City;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private store: Store<AppState>) {}

  ngOnInit() {
    //this.store.dispatch(GetCities());
    this.subscriptions$ = [
      this.store.select(selectAllCities$).subscribe(cities => {
        this.dataSource = new MatTableDataSource(cities);
      })
    ];
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;

    setTimeout(_ => {
      this.sort.sort({ id: "deaths", start: "desc" } as MatSortable);
      this.dataSource.sort = this.sort;
    });
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach(s$ => s$.unsubscribe());
  }

  openCity(row) {
    this.store.dispatch(ChangeMode({ mode: MapModeEnum.SELECT_CITY }));
    this.store.dispatch(SelectCity({ city: row }));
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
