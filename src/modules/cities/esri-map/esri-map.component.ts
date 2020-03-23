import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { loadModules } from "esri-loader";
import {
  selectCityState$,
  getCurrentCity$,
  selectCitiesMapMode$
} from "src/store/selectors/city.selectors";
import { Store } from "@ngrx/store";
import { AppState } from "src/store/states/app.state";
import { MatDialog } from "@angular/material/dialog";
import {
  selectCitiesLoading$,
  selectAllCities$
} from "src/store/selectors/city.selectors";
import { combineLatest, fromEvent, concat, Subscription } from "rxjs";
import { City } from "src/models/City";
import { withLatestFrom, map } from "rxjs/operators";
import { SelectCity, GetCities } from "src/store/actions/city.actions";
import { MapModeEnum } from "src/store/states/city.state";

@Component({
  selector: "app-esri-map-redux",
  templateUrl: "./esri-map.component.html",
  styleUrls: ["./esri-map.component.scss"]
})
export class EsriMapComponent implements OnInit {
  loading$ = this.store.select(selectCitiesLoading$);
  mapMode$ = this.store.select(selectCitiesMapMode$);
  city$ = this.store.select(getCurrentCity$);

  public mapView: __esri.MapView;
  getState = this.store.select(selectCityState$);
  dialogRef;

  Map: typeof import("esri/Map");
  MapView: typeof import("esri/views/MapView");
  Graphic: typeof import("esri/Graphic");
  GraphicsLayer: typeof import("esri/layers/GraphicsLayer");
  GeoJSONLayer: typeof import("esri/layers/GeoJSONLayer");
  Color: typeof import("esri/Color");
  Polygon: typeof import("esri/geometry/Polygon");
  Legend: typeof import("esri/widgets/Legend");
  BasemapGallery: typeof import("esri/widgets/BasemapGallery");
  Point: typeof import("esri/geometry/Point");
  Expand: typeof import("esri/widgets/Expand");
  subscriptions$: Subscription[];
  mapMode: MapModeEnum;
  city: City;
  hightlightSelect;
  isResponsiveSize;

  legend: __esri.Legend;
  expandLegend: __esri.Expand;

  cityFeatures: __esri.Graphic[];

  // this is needed to be able to create the MapView at the DOM element in this component
  @ViewChild("mapViewNode") private mapViewEl: ElementRef;
  @ViewChild("legend") private legendEl: ElementRef;

  readonly severityColors = [
    [85, 221, 0, 0.8],
    [153, 221, 0, 0.8],
    [221, 221, 0, 0.8],
    [221, 153, 0, 0.8],
    [221, 85, 0, 0.8],
    [221, 0, 0, 0.8],
    [187, 0, 0, 0.8],
    [153, 0, 0, 0.8],
    [119, 0, 0, 0.8],
    [85, 0, 0, 0.8],
    [51, 0, 0, 0.8],
    [0, 0, 0, 1]
  ];

  constructor(public dialog: MatDialog, private store: Store<AppState>) {}

  public async initModules(): Promise<any> {
    // use esri-loader to load JSAPI modules
    return new Promise(async (resolve, reject) => {
      try {
        const [
          Map,
          MapView,
          Graphic,
          GraphicsLayer,
          Color,
          Popup,
          PopupTemplate,
          GeoJSONLayer,
          Polygon,
          Legend,
          BasemapGallery,
          Point,
          Expand
        ] = await loadModules(
          [
            "esri/Map",
            "esri/views/MapView",
            "esri/Graphic",
            "esri/layers/GraphicsLayer",
            "esri/Color",
            "esri/widgets/Popup",
            "esri/PopupTemplate",
            "esri/layers/GeoJSONLayer",
            "esri/geometry/Polygon",
            "esri/widgets/Legend",
            "esri/widgets/BasemapGallery",
            "esri/geometry/Point",
            "esri/widgets/Expand"
          ],
          {
            version: "4.14"
          }
        );

        this.Map = Map;
        this.MapView = MapView;
        this.Graphic = Graphic;
        this.GraphicsLayer = GraphicsLayer;
        this.Color = Color;
        this.GeoJSONLayer = GeoJSONLayer;
        this.Polygon = Polygon;
        this.Legend = Legend;
        this.BasemapGallery = BasemapGallery;
        this.Point = Point;
        this.Expand = Expand;

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  private setTitleMobile(isMobile) {
    if (isMobile) {
      document.querySelector("#titleDiv").classList.add("invisible");
      this.mapView.padding = {
        top: 0
      };
    } else {
      document.querySelector("#titleDiv").classList.remove("invisible");
      this.mapView.padding = {
        //top: 55
      };
    }
  }

  private setLegendMobile(isMobile) {
    var toAdd = isMobile ? this.expandLegend : this.legend;
    var toRemove = isMobile ? this.legend : this.expandLegend;

    this.mapView.ui.remove(toRemove);
    this.mapView.ui.add(toAdd, "top-right");
  }

  private updateView(isMobile) {
    this.setTitleMobile(isMobile);
    this.setLegendMobile(isMobile);
  }

  public async ngOnInit() {
    console.log("ngOnInit");
    const self = this;
    try {
      this.store.dispatch(GetCities());
      await this.initModules();

      const template = {
        title: "{nome}",
        content: function(feature) {
          const attrs = feature.graphic.attributes;
          console.log(attrs);
          const div = document.createElement("div");
          div.innerHTML = `Confirmados: <b>${attrs.confirmed || 0}</b><br/>
          Mortes: <b style="color:red">${attrs.deaths || 0}</b>`;
          return div;
        },
        fieldInfos: [
          {
            fieldName: "nome"
          },
          {
            fieldName: "deaths"
          },
          {
            fieldName: "confirmed"
          }
        ]
      };

      const Glayer = new this.GraphicsLayer({
        graphics: []
      });

      this.mapView = new this.MapView({
        container: this.mapViewEl.nativeElement,
        center: [-48.6717591, -22.7777422],
        zoom: 6,
        map: new this.Map({
          basemap: "dark-gray-vector"
        }),
        constraints: {
          snapToZoom: false
        }
      });

      this.legend = new this.Legend({
        view: this.mapView,
        container: this.legendEl.nativeElement
      });

      this.expandLegend = new this.Expand({
        view: this.mapView,
        content: this.legendEl.nativeElement
      });

      this.isResponsiveSize = this.mapView.widthBreakpoint === "xsmall";
      this.updateView(this.isResponsiveSize);

      this.mapView.watch("widthBreakpoint", function(breakpoint) {
        switch (breakpoint) {
          case "xsmall":
            self.updateView(true);
            break;
          case "small":
          case "medium":
          case "large":
          case "xlarge":
            self.updateView(false);
            break;
          default:
        }
      });

      //this.mapView.ui.add(this.legend, "bottom-right");

      this.mapView.map.add(Glayer);

      const layerView = await this.mapView.whenLayerView(Glayer);

      // Each time something happens on Facility State including map mode
      combineLatest(this.store.select(selectAllCities$)).subscribe(
        ([municipiosSP]) => {
          console.log("Load new data and redraw graphics");
          this.mapView.popup.autoOpenEnabled = true;
          this.mapView.popup.close();

          Glayer.graphics.removeAll();
          this.cityFeatures = [];
          const graphs = municipiosSP.map(city => {
            const polygon = new this.Polygon({
              rings: city.geometria
            });

            let color = [0,0,0,0];

            const simpleFillPolugon = {
              type: "simple-fill",
              color: [227, 139, 79, city.confirmed > 0 ? 1 : 0], // orange, opacity 80%
              outline: {
                color: [128, 128, 128],
                width: 1
              }
            };

            const graphic = new this.Graphic({
              attributes: city,
              geometry: polygon,
              symbol: simpleFillPolugon,
              popupTemplate: template
            });
            this.cityFeatures[city.codigo_ibge] = graphic;

            return graphic;
          });
          Glayer.graphics.addMany(graphs);
        }
      );

      /*this.mapView.on("click", async function(event) {
        const response = await self.mapView.hitTest(event);
        if (response.results.length) {
          const city: City = response.results[0].graphic.attributes;

          self.store.dispatch(SelectCity({ city }));
        }
      });

      this.subscriptions$ = [
        this.city$.subscribe(async city => {
          if (this.hightlightSelect) {
            this.hightlightSelect.remove();
            this.hightlightSelect = null;
          }
          if (city) {
            // this.mapView.zoom = 13;  // Sets the zoom LOD to 13
            const selectedCityFeature = this.cityFeatures[city.codigo_ibge];
            const obj = {
              //target: this.cityFeatures[city.codigo_ibge],
              //center: selectedCityFeature,
              scale: this.mapView.scale,
              zoom: this.mapView.zoom
            };

            this.hightlightSelect = layerView.highlight(
              this.cityFeatures[city.codigo_ibge]
            );
            //this.mapView.highlight(city.codigo_ibge);
            //const ops = {  duration: 1000, easing: "easeInOutQuad"};
            await this.mapView.goTo(obj); // Sets the center point of the view at a specified lon/lat
            this.mapView.popup.open({
              features: [selectedCityFeature],
              location: selectedCityFeature.geometry.extent.center
            });
          }
        }),
        this.mapMode$.subscribe(mapMode => {
          this.mapMode = mapMode;
        })
      ];*/
    } catch (err) {
      console.error(err);
    }
  }
}
