import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { Store } from "@ngrx/store";
import { AppState } from "src/store/states/app.state";
import { MatTableDataSource } from "@angular/material/table";
import {
  selectRegionsLoading$,
  getCurrentRegion$,
  selectRegionsMapMode$,
  getRegionsWithLatestCases$
} from "src/store/selectors/region.selectors";
import {
  SelectRegion
} from "src/store/actions/region.actions";
import { MatPaginator } from "@angular/material/paginator";
import { Region } from "src/models/Region";
import { Subscription } from "rxjs";
import { MatSort, MatSortable } from "@angular/material/sort";

@Component({
  selector: "app-region-list",
  templateUrl: "./region-list.component.html",
  styleUrls: ["./region-list.component.scss"]
})
export class RegionListComponent implements OnInit, OnDestroy {
  subscriptions$: Subscription[];
  dataSource: MatTableDataSource<Region>;
  displayedColumns: string[] = ["nome", "confirmed", "deaths"];

  loading$ = this.store.select(selectRegionsLoading$);
  region$ = this.store.select(getCurrentRegion$);
  mapMode$ = this.store.select(selectRegionsMapMode$);

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
        getRegionsWithLatestCases$(this.store).subscribe(regions => {
          const objectArray = [];
          Object.keys(regions).forEach(k => objectArray.push(regions[k]));
          this.dataSource.data = objectArray;
          this.dataSource.sort = this.sort;
        })
      ];
    });
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach(s$ => s$.unsubscribe());
  }

  openRegion(row) {
    this.store.dispatch(SelectRegion({ region: row }));
  }

  applyFilter(event: Event) {
    if (this.dataSource) {
      const filterValue = (event.target as HTMLInputElement).value;
      this.dataSource.filter = filterValue.trim().toLowerCase();
    }
  }
}
