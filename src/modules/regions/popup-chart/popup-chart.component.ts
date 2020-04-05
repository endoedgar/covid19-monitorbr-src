import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild
} from "@angular/core";
import { Store } from "@ngrx/store";
import { AppState } from "src/store/states/app.state";
import {
  selectRegionsMapMode$,
  getRegionWithLatestCases$,
  selectSelectedMapRegion$
} from "src/store/selectors/region.selectors";
import { Subscription, from } from "rxjs";
import moment from "moment-timezone";
import Chart from "chart.js";
import { scan, toArray } from "rxjs/operators";
import { MapModeEnum } from "src/store/states/region.state";
import { TranslateService } from "@ngx-translate/core";
import estados from "src/assets/data/estados.json";
import { Router } from '@angular/router';

@Component({
  selector: "app-popup-chart",
  templateUrl: "./popup-chart.component.html",
  styleUrls: ["./popup-chart.component.css"]
})
export class PopupChartComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscriptions$: Subscription[];
  public region;

  @ViewChild("chart")
  public chartCanvas;

  public lastUpdate;
  public mapMode: MapModeEnum;
  public estadosPorCodigo;
  public selectedMapRegion;

  constructor(
    private store: Store<AppState>,
    public translate: TranslateService,
    private router: Router
  ) {
    this.estadosPorCodigo = estados.reduce((prev, current) => ({...prev, [current.codigo_uf]: current}), {});
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach(s => s.unsubscribe());
  }

  mudarEstado(estado) {
    const sigla = (this.selectedMapRegion) ? this.selectedMapRegion.sigla : "BR";

    this.router.navigateByUrl(this.router.url.replace(sigla, (this.selectedMapRegion?.sigla == estado.uf) ? "BR" : estado.uf));
  }

  ngAfterViewInit(): void {
    const canvas = this.chartCanvas.nativeElement;

    const ctx = canvas.getContext("2d");

    const validDates = this.region.timeseries
      .filter(timeseries => Date.parse(timeseries.date))
      .map(timeseries => ({
        ...timeseries,
        date: new Date(Date.parse(timeseries.date))
      }));

    const dias = validDates.map(timeseries => ({
      x: timeseries.date,
      confirmeddiff: timeseries.confirmeddiff,
      deathsdiff: timeseries.deathsdiff
    }));

    type dia_data = {
      x: Date;
      confirmeddiff: number;
      deathsdiff: number;
      confirmedsum: number;
      deathssum: number;
    };
    from(dias)
      .pipe(
        scan(
          (acc: dia_data, value: dia_data) => {
            const dados = {
              x: value.x,
              confirmeddiff: value.confirmeddiff,
              deathsdiff: value.deathsdiff
            };

            return ![
              MapModeEnum.SELECT_CITY_PER_DAY,
              MapModeEnum.SELECT_STATE_PER_DAY
            ].includes(this.mapMode)
              ? {
                  ...dados,
                  confirmedsum: acc.confirmedsum + value.confirmeddiff,
                  deathssum: acc.deathssum + value.deathsdiff
                }
              : {
                  ...dados,
                  confirmedsum: value.confirmeddiff,
                  deathssum: value.deathsdiff
                };
          },
          {
            x: null,
            confirmeddiff: 0,
            deathsdiff: 0,
            confirmedsum: 0,
            deathssum: 0
          }
        ),
        toArray()
      )
      .subscribe(dadosGerais => {
        const confirmed = [];
        const confirmedSum = [];
        const deaths = [];
        const deathsSum = [];

        dadosGerais.forEach(dadoGeral => {
          function s(dados) {
            return { x: dadoGeral.x, y: dados };
          }

          confirmed.push(s(dadoGeral.confirmeddiff));
          confirmedSum.push(s(dadoGeral.confirmedsum));
          deaths.push(s(dadoGeral.deathsdiff));
          deathsSum.push(s(dadoGeral.deathssum));
        });

        let myChart = new Chart(ctx, {
          type: "line",
          data: {
            datasets: [
              {
                label: this.translate.instant("regionlist.confirmed"),
                data: confirmedSum
              },
              {
                label: this.translate.instant("regionlist.deaths"),
                data: deathsSum,
                backgroundColor: "#FF9999"
              }
            ]
          },
          options: {
            scales: {
              xAxes: [
                {
                  type: "time",
                  time: {
                    minUnit: "day",
                    tooltipFormat: "L",
                    displayFormats: {
                      quarter: "D MMM"
                    }
                  }
                }
              ]
            },
            responsive: true
          }
        });
      });
  }

  ngOnInit(): void {
    this.subscriptions$ = [
      this.store.select(selectRegionsMapMode$).subscribe(mapMode => {
        this.mapMode = mapMode;
      }),
      getRegionWithLatestCases$(this.store).subscribe(
        region => (this.region = region)
      ),
      this.store.select(selectSelectedMapRegion$).subscribe(region => this.selectedMapRegion = region)
    ];

    if (this.region?.timeseries) {
      const ultimoCaso = this.region.timeseries[
        this.region.timeseries.length - 1
      ];
      this.lastUpdate = moment(ultimoCaso.date).format("LL");
    }
  }
}
