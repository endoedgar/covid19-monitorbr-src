import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { AppState } from "src/store/states/app.state";
import { MatTableDataSource } from "@angular/material/table";
import {
  selectAllCities$,
  selectCitiesLoading$,
  getCurrentCity$,
  selectCitiesMapMode$,
  getCitiesWithLatestCases$
} from "src/store/selectors/city.selectors";
import {
  GetCities,
  ChangeMode,
  SelectCity
} from "src/store/actions/city.actions";
import { MatPaginator } from "@angular/material/paginator";
import { MapModeEnum, MapModeEnum2LabelMapping } from "src/store/states/city.state";
import { City } from "src/models/City";
import { Subscription, combineLatest } from "rxjs";
import { MatSort, MatSortable, Sort } from "@angular/material/sort";
import { selectAllTimeSeries$ } from "src/store/selectors/timeseries.selectors";
import { TimeSeries } from "src/models/TimeSeries";

@Component({
  selector: "app-city-list",
  templateUrl: "./city-list.component.html",
  styleUrls: ["./city-list.component.scss"]
})
export class CityListComponent implements OnInit, OnDestroy {
  subscriptions$: Subscription[];
  dataSource: MatTableDataSource<City>;
  displayedColumns: string[] = ["nome", "confirmed", "deaths"];

  loading$ = this.store.select(selectCitiesLoading$);
  facility$ = this.store.select(getCurrentCity$);
  mapMode$ = this.store.select(selectCitiesMapMode$);

  modoSelecionado = "SELECT_CITY";

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private store: Store<AppState>) {}

  ngOnInit() { }

  ngAfterViewInit() {
    setTimeout(_ => {
      this.dataSource = this.dataSource = new MatTableDataSource();
      this.dataSource.paginator = this.paginator;
      this.sort.sort({ id: "confirmed", start: "desc" } as MatSortable);
      this.subscriptions$ = [
        getCitiesWithLatestCases$(this.store).subscribe(cities => {
          const objectArray = [];
          Object.keys(cities).forEach(k => objectArray.push(cities[k]));
          this.dataSource.data = objectArray;
          this.dataSource.sort = this.sort;
        })
      ];
    });
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach(s$ => s$.unsubscribe());
  }

  openCity(row) {
    this.store.dispatch(SelectCity({ city: row }));
  }

  applyFilter(event: Event) {
    if (this.dataSource) {
      const filterValue = (event.target as HTMLInputElement).value;
      this.dataSource.filter = filterValue.trim().toLowerCase();
    }
  }
}
