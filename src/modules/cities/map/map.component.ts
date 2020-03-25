import {
  AfterViewInit,
  Component,
  OnInit,
  Injector,
  ComponentFactoryResolver,
  ViewChild,
  AfterContentInit
} from "@angular/core";
import * as L from "leaflet";
import { NgElement, WithProperties } from "@angular/elements";
import { HttpClient } from "@angular/common/http";
import { Observable, forkJoin, Subscription, combineLatest, from } from "rxjs";
import { City } from "src/models/City";
import { AppState } from "src/store/states/app.state";
import { Store } from "@ngrx/store";
import {
  selectCitiesLoading$,
  getCitiesWithLatestCases$,
  getCurrentCity$
} from "src/store/selectors/city.selectors";
import { TimeSeriesService } from "src/services/timeseries.service";
import { GetCities, SelectCity, ChangeMode } from "src/store/actions/city.actions";
import { TimeSeries } from "src/models/TimeSeries";
import { GetTimeSeries } from "src/store/actions/timeseries.actions";
import { map, pairwise, scan, toArray, startWith } from "rxjs/operators";
import Chart from "chart.js";
import { MatSidenav } from "@angular/material/sidenav";
import { MapModeEnum } from 'src/store/states/city.state';

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
    : "#cea700";
}

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"]
})
export class MapComponent implements OnInit, AfterViewInit, AfterContentInit {
  loading$ = this.store.select(selectCitiesLoading$);
  city$ = this.store.select(getCurrentCity$);
  private map;
  city: City;
  subscriptions$: Subscription[];
  hightlightSelect;
  markersMunicipios: any[];
  municipios: City[];
  totalConfirmed: number;
  totalDeath: number;
  ultimaAtualizacao$: Observable<Date>;
  selected = "SELECT_CITY";
  @ViewChild("drawer") public sidenav: MatSidenav;

  constructor(
    private http: HttpClient,
    private store: Store<AppState>,
    private timeSeriesService: TimeSeriesService
  ) {
    this.ultimaAtualizacao$ = timeSeriesService.getUltimaAtualizacao();
  }

  public getJSON(jsonURL): Observable<any> {
    return this.http.get(jsonURL);
  }

  ngOnInit() {
    this.store.dispatch(GetCities());
    this.store.dispatch(GetTimeSeries());
    this.store.dispatch(ChangeMode({mode:MapModeEnum.SELECT_CITY}));
  }

  mudancaDeModo(event) {
    this.store.dispatch(ChangeMode({mode:event.value}));
  }

  addSidebar() {}

  addLegenda() {
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
    this.addSidebar();

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
      getCitiesWithLatestCases$(this.store).subscribe((municipios: City[]) => {
        this.municipios = municipios;
        this.initMap();

        // Correção para exibir no browser android
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
      }),

      this.store.select(getCurrentCity$).subscribe(city => {
        if (typeof city != "undefined") {
          const bolinha = this?.markersMunicipios[city?.codigo_ibge];
          if (typeof bolinha != "undefined") {
            this.mostraPopup(bolinha, this.municipios[city.codigo_ibge]);
          }
        }
      })
    ];
  }

  // TODO usar componente do Angular em vez de montar um em HTML
  async mostraPopup(layer, regiao) {
    this.sidenav.close();
    const ibge = regiao.codigo_ibge;
    let popupContent = `<h1>${regiao.nome}</h1>
      Confirmados: <b>0</b>
      `;

    if (regiao?.timeseries) {
      const ultimoCaso = regiao.timeseries[regiao.timeseries.length - 1];

      popupContent = `<h1>${regiao.nome}</h1>
      Confirmados: <b>${regiao.confirmed}</b><br/>
      Mortes: <b style='color: red;'>${regiao.deaths}</b><br/>
      <div style='margin-left:10px;'><canvas style='clear:both; 
      position: relative;' id='chart${ibge}'></canvas>Última atualização: <b style="color: red">${ultimoCaso.date}</b></div>`;
    }

    await layer
      .unbindPopup()
      .bindPopup(popupContent, { autoPan: true, maxWidth: "auto" })
      .openPopup();

    const canvas = <HTMLCanvasElement>document.getElementById(`chart${ibge}`);
    if (canvas) {
      const ctx = canvas.getContext("2d");

      const validDates = regiao.timeseries
        .filter(timeseries => Date.parse(timeseries.date))
        .map(timeseries => ({
          ...timeseries,
          date: new Date(Date.parse(timeseries.date))
        }));

      const dias = validDates
        .filter(
          timeseries =>
            timeseries.confirmeddiff > 0 || timeseries.deathsdiff > 0
        )
        .map(timeseries => ({
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
              return {
                x: value.x,
                confirmeddiff: value.confirmeddiff,
                deathsdiff: value.deathsdiff,
                confirmedsum: acc.confirmedsum + value.confirmeddiff,
                deathssum: acc.deathssum + value.deathsdiff
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

  private desenharRegiao(regiaoAtual: City, razao: number) {
    if ("latitude" in regiaoAtual.representacao) {
      // cidade
      return L.circleMarker(
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
      return L.polygon(regiaoAtual.representacao,
        {
          color: getColor(regiaoAtual.confirmed),
          fillColor: getColor(regiaoAtual.confirmed),
          weight: 0,
          fillOpacity: 0.9
        }
      );
    }
  }

  private async initMap() {

    this.markersMunicipios?.forEach(marker => this.map.removeLayer(marker));
    this.markersMunicipios = [];

    const maiorCaso = Object.keys(this.municipios).reduce(
      (prev, curr) =>
        prev < this.municipios[curr].confirmed
          ? this.municipios[curr].confirmed
          : prev,
      0
    );
    this.totalDeath = this.totalConfirmed = 0;
    Object.keys(this.municipios).forEach(ibge => {
      const municipioAtual = this.municipios[ibge];
      if (typeof municipioAtual != "undefined") {
        if (municipioAtual.confirmed > 0) {
          this.totalConfirmed += municipioAtual.confirmed;
          this.totalDeath += municipioAtual.deaths;
          const razao = municipioAtual.confirmed / maiorCaso;

          const marker = this.desenharRegiao(municipioAtual, razao)
            .on({
              mouseout: dehighlightFeature(municipioAtual),
              mouseover: highlightFeature,
              click: e => {
                this.store.dispatch(
                  SelectCity({ city: { ...municipioAtual } })
                );
              }
            })
            .addTo(this.map);
          this.markersMunicipios[municipioAtual.codigo_ibge] = marker;
        }
      }
    });

    function dehighlightFeature(municipioAtual) {
      return e => {
        var layer = e.target;

        layer.setStyle({
          color: getColor(municipioAtual.confirmed),
          fillColor: getColor(municipioAtual.confirmed)
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront();
        }
      };
    }

    function highlightFeature(e) {
      var layer = e.target;

      layer.setStyle({
        fillColor: "#777"
      });

      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }
    }
  }
}
