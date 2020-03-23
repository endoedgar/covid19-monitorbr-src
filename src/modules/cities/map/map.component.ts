import { AfterViewInit, Component, OnInit, Injector, ComponentFactoryResolver } from "@angular/core";
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
import { map, pairwise, scan } from "rxjs/operators";
import { Content } from "@angular/compiler/src/render3/r3_ast";
import { PopupCityChartComponent } from "../popup-city-chart/popup-city-chart.component";

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
  debug;

  getCitiesWithLatestCases$ = combineLatest(
    this.store.select(selectAllCities$),
    this.store.select(selectAllTimeSeries$),
    (cities: City[], allTimeSeries: TimeSeries[]) => {
      console.log("ESTOU AQUI");
      const retornar = cities
        .map(city => {
          const timeseries = allTimeSeries.filter(
            timeserie => timeserie.city_cod == city.codigo_ibge
          );

          const totalCases = timeseries.reduce(
            (prev, curr) => prev + curr.cases,
            0
          );
          return {
            ...city,
            totalCases,
            timeseries
          };
        })
        .reduce((prev, current) => {
          return { ...prev, [current.codigo_ibge]: current };
        }, {});
      return retornar;
    }
  );

  constructor(private http: HttpClient, private store: Store<AppState>, private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector) {}

  public getJSON(jsonURL): Observable<any> {
    return this.http.get(jsonURL);
  }

  ngOnInit() {
    this.store.dispatch(GetCities());
    this.store.dispatch(GetTimeSeries());
  }

  ngAfterViewInit(): void {
    this.map = L.map("map", {
      center: [-13.5748266, -49.6352299],
      zoom: 4,
      preferCanvas: true
    });

    const tiles = L.tileLayer(
      "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }
    );

    tiles.addTo(this.map);

    this.getJSON("assets/data/brazil.json").subscribe(brasil => {
      L.geoJSON(brasil, {
        style: function(feature) {
          const a = feature.properties && feature.properties.style;
          return { ...a, weight: 1, fillOpacity: 0 };
        }
      }).addTo(this.map);
    });

    this.getCitiesWithLatestCases$.subscribe(municipios => {
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
        fillOpacity: 0
      };

      if (municipio == undefined) {
      } else {
        if (municipio?.timeseries.length) {
          addProperties.color = "#e38b4f";
          addProperties.fillOpacity = 0.8;
        }
        if (!self.debug) {
          self.debug = true;
          console.log(municipio, feature.properties.id);
        }
      }
      return { ...a, ...addProperties, weight: 0 };
    }

    function onEachFeature(feature, layer) {
      const municipio = municipios[feature.properties.id];
      let popupContent = `<h1>${feature.properties.name}</h1>
        Confirmados: <b>0</b>
        `;

      if (municipio?.timeseries?.length) {
        municipio.timeseries.unshift({ cases: 0, date: null });
        const ultimoCaso =
          municipio.timeseries[municipio.timeseries.length - 1];
        console.log(municipio.timeseries);
        popupContent = `<h1>${feature.properties.name}</h1>
        Confirmados: <b>${municipio.totalCases}</b><br/>
        Última atualização: <b style="color: red">${ultimoCaso.date}</b>
        <table><tr><th>Data</th><th>Casos</th><th>Novos</th></tr>`;

        from(municipio.timeseries)
          .pipe(
            scan(
              (acc: any, curr: any) => {
                return {
                  cases: acc.cases + curr.cases,
                  date: curr.date
                };
              },
              { cases: 0, date: null }
            ),
            pairwise(),
            map(pair => {
              return `<tr><td>${pair[1].date}</td><td>${
                pair[1].cases
              }</td><td>${pair[1].cases - pair[0].cases}</td></tr>`;
            })
          )
          .subscribe(content => (popupContent += content));
        popupContent += "</table>";
      }

      if (feature.properties && feature.properties.popupContent) {
        popupContent += feature.properties.popupContent;
      }

      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight
      });

      let createCustomPopup = (function() { 
        const factory = this.componentFactoryResolver.resolveComponentFactory(PopupCityChartComponent);
        const component = factory.create(this.injector);
    
        //Set the component inputs manually 
        component.instance.municipio = municipio;
        //component.instance.someinput2 = "example";
    
        //Subscribe to the components outputs manually (if any)        
        //component.instance.someoutput.subscribe(() => console.log("output handler fired"));
    
        //Manually invoke change detection, automatic wont work, but this is Ok if the component doesn't change
        component.changeDetectorRef.detectChanges();
    
        return component.location.nativeElement;
    }).bind(self);

      layer.bindPopup(createCustomPopup());

      //layer.bindPopup(popupContent);
    }

    let geoJSON;
    this.getJSON("assets/data/geojs-100-mun.json").subscribe(municipiosJSON => {
      geoJSON = L.geoJSON(municipiosJSON, {
        style: style,

        onEachFeature: onEachFeature
      }).addTo(this.map);
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
