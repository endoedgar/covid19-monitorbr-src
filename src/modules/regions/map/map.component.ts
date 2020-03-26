import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  AfterContentInit,
  OnDestroy
} from "@angular/core";
import * as L from "leaflet";
import { HttpClient } from "@angular/common/http";
import { Observable, Subscription, from } from "rxjs";
import { Region } from "src/models/Region";
import { AppState } from "src/store/states/app.state";
import { Store } from "@ngrx/store";
import {
  selectRegionsLoading$,
  getRegionsWithLatestCases$,
  getCurrentRegion$,
  selectRegionsMapMode$
} from "src/store/selectors/region.selectors";
import { TimeSeriesService } from "src/services/timeseries.service";
import {
  GetRegions,
  SelectRegion,
  ChangeMode,
  DeselectRegion
} from "src/store/actions/region.actions";
import { GetTimeSeries } from "src/store/actions/timeseries.actions";
import { scan, toArray } from "rxjs/operators";
import Chart from "chart.js";
import { MatSidenav } from "@angular/material/sidenav";
import { MapModeEnum } from "src/store/states/region.state";
import { DatePipe } from '@angular/common';
import moment from 'moment-timezone';

// função que colore as bolinhas e estados
function getColor(d) {
  return d > 1000
    ? "#3f0012"
    : d > 500
    ? "#5e0012"
    : d > 200
    ? "#710c0d"
    : d > 100
    ? "#901a02"
    : d > 50
    ? "#901a02"
    : d > 20
    ? "#a35e00"
    : d > 10
    ? "#a35e00"
    : d > 0
    ? "#cea700"
    : "#00000000";
}

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"]
})
export class MapComponent
  implements OnInit, OnDestroy, AfterViewInit, AfterContentInit {
  private loading$ = this.store.select(selectRegionsLoading$);
  private mapMode$ = this.store.select(selectRegionsMapMode$);

  private map: L.Map;
  private subscriptions$: Subscription[];
  private mapMode: MapModeEnum;

  private markersRegioes: L.Path[];
  private regioes: Region[];

  public totalConfirmed: number;
  public totalDeath: number;
  public selected = "SELECT_CITY";
  public ultimaAtualizacao$: Observable<Date>;
  @ViewChild("drawer") public sidenav: MatSidenav;

  constructor(
    private http: HttpClient,
    private store: Store<AppState>,
    private timeSeriesService: TimeSeriesService,
    private datePipe: DatePipe
  ) {
    this.ultimaAtualizacao$ = timeSeriesService.getUltimaAtualizacao();
  }
  ngOnDestroy(): void {
    this.subscriptions$.forEach($s => $s.unsubscribe());
    this.subscriptions$ = null;
  }

  public getJSON(jsonURL): Observable<any> {
    return this.http.get(jsonURL);
  }

  ngOnInit() {
    this.store.dispatch(GetRegions());
    this.store.dispatch(GetTimeSeries());
    this.store.dispatch(ChangeMode({ mode: MapModeEnum.SELECT_CITY }));

    moment.tz.setDefault("UTC");
  }

  mudancaDeModo(event) {
    this.store.dispatch(ChangeMode({ mode: event.value }));
  }

  private addLegenda() {
    const legend = new L.Control({ position: "bottomright" });

    legend.onAdd = function(map) {
      const div = L.DomUtil.create("div", "info legend"),
        grades = [0, 10, 20, 50, 100, 200, 500, 1000],
        labels = [];

      for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
          '<i style="background:' +
          getColor(grades[i] + 1) +
          '"></i> ' +
          grades[i] +
          (grades[i + 1] ? "&ndash;" + grades[i + 1] + "<br>" : "+");
      }

      return div;
    };

    legend.addTo(this.map);
  }

  ngAfterViewInit(): void {
    this.map = L.map("map", {
      center: [-13.5748266, -49.6352299],
      zoom: 4,
      preferCanvas: true
    });

    this.addLegenda();

    const tiles = L.tileLayer(
      "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }
    );

    tiles.addTo(this.map);
  }

  ngAfterContentInit(): void {
    this.subscriptions$ = [
      this.mapMode$.subscribe(mapMode => (this.mapMode = mapMode)),
      // desenhar fronteiras do brasil
      this.getJSON("assets/data/brazil.json").subscribe(brasil => {
        L.geoJSON(brasil, {
          style: function(feature) {
            const a = feature.properties && feature.properties.style;
            return { ...a, weight: 1, fillOpacity: 0 };
          }
        })
          .addTo(this.map)
          .bringToBack();
      }),

      getRegionsWithLatestCases$(this.store).subscribe((regioes: Region[]) => {
        this.regioes = regioes;
        this.initMap();

        // Correção para exibir no browser android
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
      }),

      this.store.select(getCurrentRegion$).subscribe(region => {
        if (region != null) {
          const marker = this.markersRegioes[region?.codigo_ibge];
          if (marker != null) {
            this.mostraPopup(marker, this.regioes[region.codigo_ibge]);
          }
        }
      })
    ];
  }

  // TODO usar componente do Angular em vez de montar um em HTML
  async mostraPopup(layer: L.Path, regiao) {
    this.sidenav.close();
    let popupContent = `<h1>${regiao.nome}</h1>
      Confirmados: <b>0</b>
      `;

    const divCanvasId = `chart${Math.random()}`;
    if (regiao?.timeseries) {
      const ultimoCaso = regiao.timeseries[regiao.timeseries.length - 1];

      popupContent = `<h1>${regiao.nome}</h1>
      Confirmados: <b>${regiao.confirmed}</b><br/>
      Mortes: <b style='color: red;'>${regiao.deaths}</b><br/>
      <div style='margin-left:10px;'><canvas style='clear:both; 
      position: relative;' id='${divCanvasId}'></canvas>Última atualização: <b style="color: red">${this.datePipe.transform(ultimoCaso.date)}</b></div>`;
    }

    layer.unbindPopup().bindPopup(popupContent, { autoPan: true }).openPopup();

    const canvas = <HTMLCanvasElement>document.getElementById(divCanvasId);
    if (canvas) {
      const ctx = canvas.getContext("2d");

      const validDates = regiao.timeseries
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
                  label: "Confirmados",
                  data: confirmedSum
                },
                {
                  label: "Mortes",
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
  }

  private desenharRegiao(regiaoAtual: Region, razao: number) {
    let marker : L.Path;
    if ("latitude" in regiaoAtual.representacao) {
      // cidade
      marker = L.circleMarker(
        [
          regiaoAtual.representacao.latitude,
          regiaoAtual.representacao.longitude
        ],
        {
          color: getColor(regiaoAtual.confirmed),
          fillColor: getColor(regiaoAtual.confirmed),
          weight: 0,
          radius: Math.max(5, 50.0 * razao),
          fillOpacity: 0.9
        }
      );
    } else {
      // estado
      marker = L.polygon(regiaoAtual.representacao, {
        color: getColor(regiaoAtual.confirmed),
        fillColor: getColor(regiaoAtual.confirmed),
        weight: 3,
        fillOpacity: 0.9
      });
    }

    marker.bindTooltip(
      `<h2>${regiaoAtual.nome}</h2>
      Confirmados: ${regiaoAtual.confirmed}<br/>
      Mortos: ${regiaoAtual.deaths}
      `
    )

    return marker;
  }

  private limparMarkers() {
    this.markersRegioes?.forEach(marker => this.map.removeLayer(marker));
    this.markersRegioes = [];
  }

  private adicionarRegioesAoMapa() {
    const maiorCaso = Object.keys(this.regioes).reduce(
      (prev, curr) =>
        prev < this.regioes[curr].confirmed
          ? this.regioes[curr].confirmed
          : prev,
      0
    );

    this.totalDeath = this.totalConfirmed = 0;

    Object.keys(this.regioes).forEach(ibge => {
      const regiaoAtual = this.regioes[ibge];
      if (typeof regiaoAtual != "undefined") {
        //if (regiaoAtual.confirmed > 0) {
        this.totalConfirmed += regiaoAtual.confirmed;
        this.totalDeath += regiaoAtual.deaths;
        const razao = regiaoAtual.confirmed / maiorCaso;

        const bringMarkerToFront = marker => {
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            marker.bringToFront();
          }
        };
        const marker = this.desenharRegiao(regiaoAtual, razao)
          .on({
            mouseout: ({ target: marker }) => {
              marker.setStyle({
                color: getColor(regiaoAtual.confirmed),
                fillColor: getColor(regiaoAtual.confirmed)
              });
              bringMarkerToFront(marker);
            },
            mouseover: ({ target: marker }) => {
              marker.setStyle({
                fillColor: "#777"
              });
              bringMarkerToFront(marker);
            },
            click: _ => {
              this.store.dispatch(DeselectRegion());
              this.store.dispatch(SelectRegion({ region: { ...regiaoAtual } }));
            }
          })
          .addTo(this.map);
        this.markersRegioes[regiaoAtual.codigo_ibge] = marker;
        // }
      }
    });
  }

  private async initMap() {
    this.limparMarkers();
    this.adicionarRegioesAoMapa();
  }
}