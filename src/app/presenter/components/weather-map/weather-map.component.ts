import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer, PathLayer, TextLayer } from '@deck.gl/layers';
import { DeckPoint, WeatherVariable } from '@shared/models/weather';
import { colorRamp, normalize } from '@shared/utils/color';
import { windSegmentFromBearing } from '@shared/utils/geo';

const CARTO_LIGHT_STYLE: any = {
  version: 8,
  sources: {
    base: {
      type: 'raster',
      tiles: ['https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap, © CARTO',
    },
    labels: {
      type: 'raster',
      tiles: [
        'https://basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
    },
  },
  layers: [
    { id: 'base', type: 'raster', source: 'base' },
    {
      id: 'labels',
      type: 'raster',
      source: 'labels',
      layout: { visibility: 'none' },
    },
  ],
};

@Component({
  selector: 'app-weather-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-map.component.html',
  styleUrls: ['./weather-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherMapComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @ViewChild('map', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  @Input({ required: true }) points: DeckPoint[] = [];
  @Input({ required: true }) variable!: WeatherVariable;
  @Input({ required: true }) heatRadius!: number;
  @Input({ required: true }) heatOpacity!: number;
  @Input() showLabels = true;
  @Input() showBasemapLabels = false;

  private map?: maplibregl.Map;
  private overlay?: MapboxOverlay;
  private hasFit = false;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.map = new maplibregl.Map({
        container: this.mapEl.nativeElement,
        style: CARTO_LIGHT_STYLE,
        center: [5.1, 52.2],
        zoom: 6,
      });

      this.map.addControl(new maplibregl.AttributionControl({ compact: true }));
      this.map.addControl(
        new maplibregl.NavigationControl({ visualizePitch: false })
      );

      this.overlay = new MapboxOverlay({
        interleaved: true,
        layers: [],
        getTooltip: ({ object }: any) => {
          if (!object) return null;
          const base = object.tooltip ?? '';
          const parts = [
            base,
            object.temp != null ? `${Math.round(object.temp)}°C` : null,
            object.pressure != null
              ? `${Math.round(object.pressure)} hPa`
              : null,
            object.windSpeed != null && object.windDir != null
              ? `${Math.round(object.windSpeed)} • ${Math.round(
                  object.windDir
                )}°`
              : null,
          ].filter(Boolean);
          return parts.join(' • ');
        },
      });
      this.map.addControl(this.overlay as any);

      this.map.on('load', () => {
        this.updateBasemapLabelsVisibility();
        this.renderLayers();
      });
    });
  }

  ngOnChanges(_: SimpleChanges): void {
    this.updateBasemapLabelsVisibility();
    this.renderLayers();
  }

  private updateBasemapLabelsVisibility() {
    if (!this.map?.getLayer('labels')) return;
    this.map.setLayoutProperty(
      'labels',
      'visibility',
      this.showBasemapLabels ? 'visible' : 'none'
    );
  }

  private fitToPointsOnce() {
    if (!this.map || this.hasFit || !this.points?.length) return;
    const bounds = new maplibregl.LngLatBounds();
    for (const p of this.points) bounds.extend(p.position as [number, number]);
    this.map.fitBounds(bounds, { padding: 40, maxZoom: 8, duration: 0 });
    this.hasFit = true;
  }

  private renderLayers() {
    if (!this.overlay || !this.points?.length) return;

    this.fitToPointsOnce();

    if (this.variable === 'temp') {
      const tMin = -5,
        tMax = 40;

      const heat = new HeatmapLayer({
        id: 'temp-heat',
        data: this.points.filter((p) => p.temp != null),
        getPosition: (d: DeckPoint) => d.position,
        getWeight: (d: DeckPoint) => normalize(d.temp!, tMin, tMax),
        radiusPixels: this.heatRadius,
        aggregation: 'SUM',
      });

      const dots = new ScatterplotLayer({
        id: 'temp-dots',
        pickable: true,
        data: this.points.filter((p) => p.temp != null),
        getPosition: (d: DeckPoint) => d.position,
        radiusUnits: 'pixels',
        getRadius: 6,
        radiusMinPixels: 4,
        getFillColor: (d: DeckPoint) =>
          colorRamp(d.temp!, tMin, tMax, this.heatOpacity),
      });

      const layers: any[] = [heat, dots];

      if (this.showLabels) {
        const tempLabels = new TextLayer({
          id: 'temp-labels',
          data: this.points.filter((p) => p.temp != null),
          getPosition: (d: DeckPoint) => d.position,
          getText: (d: DeckPoint) => `${Math.round(d.temp!)}°`,
          characterSet: Array.from('0123456789°C+- '),
          fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
          getSize: 12,
          sizeUnits: 'pixels',
          getColor: [255, 255, 255, 230],
          background: true,
          getBackgroundColor: [0, 0, 0, 130],
          backgroundPadding: [2, 2],
          getTextAnchor: () => 'middle',
          getAlignmentBaseline: () => 'bottom',
          getPixelOffset: () => [0, -6],
          parameters: { depthTest: false },
          billboard: true,
        });
        layers.push(tempLabels);
      }

      this.overlay.setProps({ layers });
      return;
    }

    if (this.variable === 'pressure') {
      const pMin = 980,
        pMax = 1040;

      const bubbles = new ScatterplotLayer({
        id: 'pressure',
        pickable: true,
        data: this.points.filter((p) => p.pressure != null),
        getPosition: (d: DeckPoint) => d.position,
        radiusUnits: 'pixels',
        getRadius: (d: DeckPoint) => 6 + 0.2 * (d.pressure! - pMin),
        radiusMinPixels: 4,
        getFillColor: (d: DeckPoint) =>
          colorRamp(d.pressure!, pMin, pMax, 0.85),
      });

      const layers: any[] = [bubbles];

      if (this.showLabels) {
        const pressureLabels = new TextLayer({
          id: 'pressure-labels',
          data: this.points.filter((p) => p.pressure != null),
          getPosition: (d: DeckPoint) => d.position,
          getText: (d: DeckPoint) => `${Math.round(d.pressure!)} hPa`,
          characterSet: '0123456789hPa -+',
          fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
          getSize: 12,
          sizeUnits: 'pixels',
          getColor: [255, 255, 255, 230],
          getBackgroundColor: [0, 0, 0, 130],
          backgroundPadding: [2, 2],
          getTextAnchor: () => 'middle',
          getAlignmentBaseline: () => 'bottom',
          getPixelOffset: () => [0, -6],
        });
        layers.push(pressureLabels);
      }

      this.overlay.setProps({ layers });
      return;
    }

    if (this.variable === 'wind') {
      const wind = this.points
        .filter((p) => p.windDir != null && p.windSpeed != null)
        .map((p) => {
          const dirTo = (p.windDir! + 180) % 360;
          const path = windSegmentFromBearing(
            p.position[0],
            p.position[1],
            dirTo,
            (p.windSpeed! || 0) * 5
          );
          const end = path[path.length - 1] as [number, number];
          return {
            path,
            lon: p.position[0],
            lat: p.position[1],
            endLon: end[0],
            endLat: end[1],
            speed: p.windSpeed!,
            dirTo,
            tooltip: p.tooltip,
          };
        });

      const paths = new PathLayer({
        id: 'wind-paths',
        pickable: true,
        data: wind,
        getPath: (d: any) => d.path,
        widthUnits: 'pixels',
        getWidth: 3,
        getColor: [80, 200, 255, 220],
      });

      const layers: any[] = [paths];

      if (this.showLabels) {
        const arrows = new TextLayer({
          id: 'wind-arrows',
          data: wind,
          getPosition: (d: any) => [d.endLon, d.endLat],
          getText: () => '➤',
          characterSet: '➤',
          fontFamily:
            '"Segoe UI Symbol", "Segoe UI", Arial, Helvetica, sans-serif',
          getAngle: (d: any) => 90 - d.dirTo,
          getSize: 16,
          sizeUnits: 'pixels',
          getColor: [80, 200, 255, 230],
          getTextAnchor: () => 'middle',
          getAlignmentBaseline: () => 'center',
        });
        layers.push(arrows);
      }

      this.overlay.setProps({ layers });
      return;
    }

    this.overlay.setProps({ layers: [] });
  }

  ngOnDestroy(): void {
    this.overlay?.finalize?.();
    this.map?.remove?.();
  }
}
