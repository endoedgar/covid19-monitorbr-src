import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  AfterContentInit,
  OnDestroy,
  ElementRef,
  ChangeDetectorRef,
  ComponentFactoryResolver,
  Injector,
  ComponentRef
} from "@angular/core";
import * as L from "leaflet";
import { HttpClient } from "@angular/common/http";
import { Observable, Subscription, from, merge } from "rxjs";
import { Region } from "src/models/Region";
import { AppState } from "src/store/states/app.state";
import { Store } from "@ngrx/store";
import {
  selectRegionsLoading$,
  getRegionsWithLatestCases$,
  getCurrentRegion$,
  selectRegionsMapMode$,
  selectRegionsDate$,
  selectMapRegion$,
  selectSelectedMapRegion$
} from "src/store/selectors/region.selectors";
import { TimeSeriesService } from "src/services/timeseries.service";
import {
  GetRegions,
  SelectRegion,
  ChangeMode,
  DeselectRegion,
  SetDate,
  ChangeMapRegion
} from "src/store/actions/region.actions";
import { GetTimeSeries } from "src/store/actions/timeseries.actions";
import { scan, toArray, flatMap } from "rxjs/operators";
import { MatSidenav } from "@angular/material/sidenav";
import {
  MapModeEnum,
  MapModeEnum2LabelMapping
} from "src/store/states/region.state";
import moment from "moment-timezone";
import { MatDialogConfig, MatDialog } from "@angular/material/dialog";
import { AvisoInicialComponent } from "../aviso-inicial/aviso-inicial.component";
import {
  selectTimeSeriesLoading$,
  selectTimeSeriesUltimaAtualizacao$
} from "src/store/selectors/timeseries.selectors";
import { TranslateService } from "@ngx-translate/core";
import { PopupChartComponent } from "../popup-chart/popup-chart.component";
import { ActivatedRoute } from "@angular/router";

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
  objectKeys = Object.keys;
  public ultimaAtualizacao$ = this.store.select(
    selectTimeSeriesUltimaAtualizacao$
  );
  public ultimaAtualizacao;
  public loading$ = this.store.select(selectTimeSeriesLoading$);
  private mapDate$ = this.store.select(selectRegionsDate$);
  public getSelectedMapRegion$ = this.store.select(selectSelectedMapRegion$);
  public mapMode: MapModeEnum;

  @ViewChild('map', {static: true}) protected mapDivRef: ElementRef;
  protected mapDiv: HTMLDivElement;
  private map: L.Map;
  private subscriptions$: Subscription[];

  private markersRegioes: L.Path[] = [];
  private regioes: Region[];
  public options = [];

  public totalConfirmed: number;
  public totalDeath: number;
  public modesMapped = MapModeEnum2LabelMapping;
  public availableDates = [];
  public mapDate: moment.Moment;
  public objectIsExtensible = Object.isExtensible;
  public popupComponent: ComponentRef<PopupChartComponent>;
  @ViewChild("drawer") public sidenav: MatSidenav;

  constructor(
    private http: HttpClient,
    private store: Store<AppState>,
    private timeSeriesService: TimeSeriesService,
    public translate: TranslateService,
    private dialog: MatDialog,
    private elRef: ElementRef,
    private cdRef: ChangeDetectorRef,
    private resolver: ComponentFactoryResolver,
    private injector: Injector,
    private activeRoute: ActivatedRoute
  ) {
    const firstDay = moment("2020-02-26").startOf("day");
    const vetSize = moment().diff(firstDay, "days") + 1;
    this.availableDates = Array(vetSize)
      .fill(0)
      .map((x, i) =>
        moment(firstDay)
          .add(vetSize - 1 - i, "days")
          .startOf("day")
      );
    this.store.dispatch(SetDate({ date: this.availableDates[0] }));
  }
  ngOnDestroy(): void {
    console.log("destruingo");
    this.subscriptions$.forEach($s => $s.unsubscribe());
    this.subscriptions$ = null;
    if (this.map) {
      this.markersRegioes.forEach(m => m.remove());
      this.map.off();
      this.map.remove();
      this.map = null;
    }
  }

  useLanguage(language: string) {
    this.translate.use(language);
    this.obterDados();
  }

  public getJSON(jsonURL): Observable<any> {
    return this.http.get(jsonURL);
  }

  public obterDados() {
    this.store.dispatch(GetTimeSeries());
    this.store.dispatch(ChangeMode({ mode: MapModeEnum.SELECT_CITY }));
  }

  ngOnInit() {
    this.store.dispatch(GetRegions());
    this.abreAvisoInicial(false);
    this.obterDados();
    moment.tz.setDefault("UTC");
    this.mapDiv = this.mapDivRef.nativeElement;
    //this.store.dispatch(ChangeMapRegion({ region: null }));

    this.activeRoute.params.subscribe(routeParams => {
      const state = routeParams["state"];
      if (state?.length)
        this.store.dispatch(ChangeMapRegion({ region: state }));
    });
  }

  mudancaDeModo(event) {
    this.store.dispatch(ChangeMode({ mode: event.value }));
  }

  mudancaDeData(event) {
    this.store.dispatch(SetDate({ date: event.value }));
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

  private geoJSONFronteira: L.GeoJSON;

  ngAfterViewInit(): void {
    if (!this.map) {
      console.log("recriando mapa")
      this.map = L.map("map", {
        center: [-13.5748266, -49.6352299],
        zoom: 4,

      });

      const tiles = L.tileLayer(
        "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
      );

      this.addLegenda();
      tiles.addTo(this.map);
    }

    this.getSelectedMapRegion$.subscribe((region: any) => {
      if (this.geoJSONFronteira) {
        this.geoJSONFronteira.remove();
        this.geoJSONFronteira = null;
      }

      if (region?.sigla != null) {
        this.getJSON("assets/data/brazil-states.geojson").subscribe(brasil => {
          this.geoJSONFronteira = L.geoJSON(brasil, {
            style: function(feature) {
              const a = feature.properties && feature.properties.style;
              return { ...a, weight: 1, fillOpacity: 0 };
            },
            filter: feature => feature.properties.sigla == region.sigla
          })
            .addTo(this.map)
            .bringToBack();
          this.map.fitBounds(this.geoJSONFronteira.getBounds());
        });
      } else {
        // desenhar fronteiras do brasil
        this.getJSON("assets/data/brazil.json").subscribe(brasil => {
          this.geoJSONFronteira = L.geoJSON(brasil, {
            style: function(feature) {
              const a = feature.properties && feature.properties.style;
              return { ...a, weight: 1, fillOpacity: 0 };
            }
          })
            .addTo(this.map)
            .bringToBack();
          this.map.fitBounds(this.geoJSONFronteira.getBounds());
        });
      }
    });
  }

  ngAfterContentInit(): void {
    setTimeout(_ => {
      this.subscriptions$ = [
        this.store.select(selectRegionsMapMode$).subscribe(mapMode => {
          this.mapMode = mapMode;
        }),
        this.ultimaAtualizacao$.subscribe(ultimaAtualizacao => {
          this.ultimaAtualizacao =
            ultimaAtualizacao instanceof Date
              ? moment(ultimaAtualizacao).format("LL")
              : "...";
        }),
        this.mapDate$.subscribe(mapDate => {
          this.mapDate = mapDate;
        }),

        getRegionsWithLatestCases$(this.store).subscribe(
          (regioes: Region[]) => {
            this.regioes = regioes;
            this.initMap();
          }
        ),

        this.store.select(getCurrentRegion$).subscribe(region => {
          if (region != null) {
            const marker = this.markersRegioes[region?.codigo_ibge];
            if (marker != null) {
              this.mostraPopup(marker);
            }
          }
        })
      ];

      // Correção para exibir no browser android
      const resizeCorrectly = () => {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
      };

      resizeCorrectly();
      window.addEventListener("resize", resizeCorrectly);
    });
  }

  async mostraPopup(layer: L.Path) {
    this.sidenav.close();

    if (this.popupComponent) this.popupComponent.destroy();

    this.popupComponent = this.resolver
      .resolveComponentFactory(PopupChartComponent)
      .create(this.injector);

    layer
      .unbindPopup()
      .bindPopup(this.popupComponent.location.nativeElement, { autoPan: true })
      .openPopup();

    this.popupComponent.changeDetectorRef.detectChanges();
  }

  private desenharRegiao(regiaoAtual: any, razao: number) {
    let marker: L.Path = this.markersRegioes[regiaoAtual.codigo_ibge];

    if ("latitude" in regiaoAtual.representacao) {
      // cidade
      const circle = <L.CircleMarker>marker;

      const estilo: L.CircleMarkerOptions = {
        color: getColor(regiaoAtual.confirmed + regiaoAtual.deaths),
        fillColor: getColor(regiaoAtual.confirmed + regiaoAtual.deaths),
        weight: 0,
        radius: Math.max(5, 50.0 * razao),
        fillOpacity: 0.9,
        className: "pulse"
      };

      if (!circle) {
        marker = L.circleMarker(
          [
            regiaoAtual.representacao.latitude,
            regiaoAtual.representacao.longitude
          ],
          estilo
        );
      } else {
        circle.setStyle(estilo);
      }
    } else {
      // estado
      const polygon = <L.Polygon>marker;

      const estilo: L.PolylineOptions = {
        color: getColor(regiaoAtual.confirmed + regiaoAtual.deaths),
        fillColor: getColor(regiaoAtual.confirmed + regiaoAtual.deaths),
        weight: 3,
        fillOpacity: 0.9
      };

      if (!polygon) {
        marker = L.polygon(regiaoAtual.representacao, estilo);
      } else {
        polygon.setStyle(estilo);
      }
    }

    return marker;
  }

  public abreAvisoInicial(forcar: boolean) {
    const AVISOU_ITEM = "avisou";

    if (!localStorage.getItem(AVISOU_ITEM) || forcar) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.height = "300px";
      dialogConfig.width = "500px";

      this.dialog.open(AvisoInicialComponent, dialogConfig);
      localStorage.setItem(AVISOU_ITEM, new Date().toDateString());
    }
  }

  private limparMarkers() {
    this.markersRegioes?.forEach(marker => this.map.removeLayer(marker));
  }

  private adicionarRegioesAoMapa() {}

  private criarMarker(regiaoAtual): L.Path {
    if (typeof regiaoAtual != "undefined") {
      this.totalConfirmed += regiaoAtual.confirmed;
      this.totalDeath += regiaoAtual.deaths;
      const razao = regiaoAtual.confirmed / this.maiorCaso;

      const bringMarkerToFront = marker => {
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          marker.bringToFront();
        }
      };

      return this.desenharRegiao(regiaoAtual, razao)
        .off()
        .on({
          mouseout: ({ target: marker }) => {
            marker.setStyle({
              color: getColor(regiaoAtual.confirmed + regiaoAtual.deaths),
              fillColor: getColor(regiaoAtual.confirmed + regiaoAtual.deaths)
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
        });
    }
  }

  private async atualizarMarker(regiaoAtual) {
    const markerParaAtualizar = this.markersRegioes[regiaoAtual.codigo_ibge];
  }

  maiorCaso;

  private calculaMaiorCaso() {
    this.maiorCaso = Object.keys(this.regioes).reduce(
      (prev, curr) =>
        prev < this.regioes[curr].confirmed
          ? this.regioes[curr].confirmed
          : prev,
      0
    );

    this.totalDeath = this.totalConfirmed = 0;
  }

  private initMap() {
    if (!this.regioes) return;
    const proximosMarkers = [];

    this.calculaMaiorCaso();

    Object.keys(this.regioes).forEach(regiao_ibge => {
      const regiao = this.regioes[regiao_ibge];
      let markerAtual = this.markersRegioes[regiao_ibge];

      if (!markerAtual) {
        markerAtual = this.criarMarker(regiao);
        markerAtual.addTo(this.map);
      } else {
        this.criarMarker(regiao);
      }

      const ultimoCaso = regiao?.timeseries[regiao.timeseries.length - 1];

      if (!L.Browser.mobile) {
        markerAtual.unbindTooltip().bindTooltip(
          this.translate.instant("map.tooltip", {
            regionName: regiao.nome,
            regionConfirmed: regiao.confirmed,
            regionDeaths: regiao.deaths,
            lastUpdate: moment(ultimoCaso?.date).format("LL")
          })
        );
      }

      // adiciona markerAtual a proximoMarkers
      proximosMarkers[regiao.codigo_ibge] = markerAtual;

      // remove markerAtual da lista atual de markers
      this.markersRegioes[regiao.codigo_ibge] = null;
      delete this.markersRegioes[regiao.codigo_ibge];
    });
    this.limparMarkers();
    this.markersRegioes = proximosMarkers;
    //this.adicionarRegioesAoMapa();
  }
}
