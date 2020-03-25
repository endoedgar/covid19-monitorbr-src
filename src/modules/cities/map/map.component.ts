import {
  AfterViewInit,
  Component,
  OnInit,
  Injector,
  ComponentFactoryResolver
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
  selectCitiesEntities$,
  getCurrentCity$,
  selectAllCities$
} from "src/store/selectors/city.selectors";
import { GetCities } from "src/store/actions/city.actions";
import { selectAllTimeSeries$ } from "src/store/selectors/timeseries.selectors";
import { TimeSeries } from "src/models/TimeSeries";
import { GetTimeSeries } from "src/store/actions/timeseries.actions";
import { map, pairwise, scan, toArray } from "rxjs/operators";
import Chart from "chart.js";

var timer = function(name) {
  var start = new Date();
  return {
    stop: function() {
      var end = new Date();
      var time = end.getTime() - start.getTime();
      console.log("Timer:", name, "finished in", time, "ms");
    }
  };
};

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
export class MapComponent implements OnInit, AfterViewInit {
  loading$ = this.store.select(selectCitiesLoading$);
  city$ = this.store.select(getCurrentCity$);
  private map;
  city: City;
  subscriptions$: Subscription[];
  hightlightSelect;

  getCitiesWithLatestCases$ = combineLatest(
    this.store.select(selectAllCities$),
    this.store.select(selectAllTimeSeries$),
    (cities: City[], allTimeSeries: TimeSeries[]) => {
      const t = timer("combineLatest");
      const retornar = cities
        .map(city => {
          const timeseries = allTimeSeries.filter(
            timeserie => timeserie.city_ibge_code == city.codigo_ibge
          );

          const total = timeseries.reduce(
            (prev, curr) => ({
              totalCases: prev.totalCases + curr.confirmeddiff,
              totalDeaths: prev.totalDeaths + curr.deathsdiff
            }),
            { totalCases: 0, totalDeaths: 0 }
          );

          return {
            ...city,
            totalCases: total.totalCases,
            totalDeaths: total.totalDeaths,
            timeseries
          };
        })
        .reduce((prev, current) => {
          return { ...prev, [current.codigo_ibge]: current };
        }, {});
      t.stop();

      console.log(JSON.stringify(retornar));
      return retornar;
    }
  );

  getCitiesWithLatestCasesFast$ = this.getJSON("assets/data/data.json");

  constructor(
    private http: HttpClient,
    private store: Store<AppState>,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) {}

  public getJSON(jsonURL): Observable<any> {
    return this.http.get(jsonURL);
  }

  ngOnInit() {
    this.store.dispatch(GetCities());
    this.store.dispatch(GetTimeSeries());
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

    // desenhar fronteiras do brasil
    this.getJSON("assets/data/brazil.json").subscribe(brasil => {
      L.geoJSON(brasil, {
        style: function(feature) {
          const a = feature.properties && feature.properties.style;
          return { ...a, weight: 1, fillOpacity: 0 };
        }
      }).addTo(this.map);
    });

    this.getCitiesWithLatestCasesFast$.subscribe(municipios => {
      this.initMap(municipios);
    });
  }

  private async initMap(municipios) {
    const self = this;

    function style(feature) {
      const municipio = municipios[feature.properties.id];

      const a = feature.properties && feature.properties.style;
      let addProperties: any;
      addProperties = {
        fillOpacity: 0,
        weight: 0
      };

      if (municipio == undefined) {
      } else {
        if (municipio?.timeseries.length) {
          addProperties.color = getColor(municipio.totalCases);
          addProperties.fillOpacity = 0.8;
          addProperties.weight = 1;
          addProperties.color = getColor(municipio.totalCases);
        }
      }
      return { ...a, ...addProperties };
    }

    async function click(layer, municipio, ibge) {
      let popupContent = `<h1>${municipio.name}</h1>
        Confirmados: <b>0</b>
        `;

      if (municipio?.timeseries?.length) {
        municipio.timeseries.unshift({ cases: 0, date: null });
        const ultimoCaso =
          municipio.timeseries[municipio.timeseries.length - 1];

        popupContent = `<h1>${municipio.nome}</h1>
        Confirmados: <b>${municipio.totalCases}</b><br/>
        Última atualização: <b style="color: red">${ultimoCaso.date}</b>
        <table><tr><th>Data</th><th>Casos</th><th>Novos</th></tr>`;

        popupContent = `<h1>${municipio.nome}</h1>
        Confirmados: <b>${municipio.totalCases}</b><br/>
        Mortes: <b style='color: red;'>${municipio.totalDeaths}</b><br/>
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

        const validDates = municipio.timeseries
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

            console.log(confirmed);

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

    async function clickFeature(event) {
      const ibge = event.target.feature.properties.id;
      const municipio = municipios[ibge];
      const layer = event.target;

      click(layer, municipio, ibge)
    }

    function onEachFeature(feature, layer) {
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: clickFeature
      });
    }

    let geoJSON;

    /*this.getJSON("assets/data/geojs-100-mun.json").subscribe(municipiosJSON => {

      geoJSON = L.geoJSON(municipiosJSON, {
        style: style,

        onEachFeature: onEachFeature
      }).addTo(this.map);
    });*/

    this.getJSON("assets/data/municipios.json").subscribe(municipiosJSON => {
      const maiorCaso = parseFloat(
        Object.keys(municipios).reduce(
          (prev, curr) =>
            prev < municipios[curr].totalCases
              ? municipios[curr].totalCases
              : prev,
          0
        )
      );

      municipiosJSON.forEach(municipio => {
        const municipioAtual = municipios[municipio.codigo_ibge];
        if (typeof municipioAtual != "undefined") {
          if (municipioAtual.totalCases > 0) {
            const razao = (municipioAtual.totalCases / maiorCaso)
            console.log(municipioAtual, razao);
            L.circle([municipio.latitude, municipio.longitude], {
              color: getColor(municipioAtual.totalCases),
              radius: Math.max(
                50.0,
                300000.0 * razao
              )
            }).addTo(this.map).on("click", (e) => { console.log(e); click(e.target, municipioAtual, municipioAtual.codigo_ibge) });
          }
        }
      });
    });

    function highlightFeature(e) {
      var layer = e.target;

      layer.setStyle({
        weight: 1,
        color: "#777",
        dashArray: "",
        fillOpacity: 0.7
      });

      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }
    }

    function resetHighlight(e) {
      geoJSON.resetStyle(e.target);
    }
  }
}
