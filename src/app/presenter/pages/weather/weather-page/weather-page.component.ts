import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
  ViewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { take, finalize } from 'rxjs/operators';
import { DeckPoint, WeatherVariable } from '@shared/models/weather';
import { WeatherService } from '@domain/services/weather.service';
import { WeatherMapComponent } from '@presentation/components/weather-map/weather-map.component';
import { WeatherControlsComponent } from '@presentation/components/weather-controls/weather-controls.component';
import { WeatherForecastComponent } from '@shared/components/forecast/weather-forecast/weather-forecast.component';
import { LegendComponent } from '@shared/components/legend/legend.component';

@Component({
  selector: 'app-weather-page',
  standalone: true,
  imports: [
    CommonModule,
    WeatherMapComponent,
    WeatherControlsComponent,
    WeatherForecastComponent,
    LegendComponent,
    DatePipe,
  ],
  templateUrl: './weather-page.component.html',
  styleUrls: ['./weather-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherPageComponent implements OnInit, OnDestroy {
  @ViewChild(WeatherMapComponent) mapRef?: WeatherMapComponent;

  variable: WeatherVariable = 'temp';
  heatRadius = 50;
  heatOpacity = 0.8;
  showLabels = true;
  showBasemapLabels = false;

  loading = false;
  error: string | null = null;
  lastUpdated: Date | null = null;

  points: DeckPoint[] = [];
  displayedPoints: DeckPoint[] = [];

  frames: { time: Date; points: DeckPoint[] }[] = [];
  frameIndex = -1;

  isPlaying = false;
  private playTimer: ReturnType<typeof setInterval> | null = null;
  private autoTimer: ReturnType<typeof setInterval> | null = null;

  playbackFps = 30;
  tweenSteps = 20;
  autoCaptureIntervalMs = 15000;

  constructor(private weather: WeatherService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.captureFrame();
    this.autoTimer = setInterval(
      () => this.captureFrame(),
      this.autoCaptureIntervalMs
    );
  }

  captureFrame(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = null;

    this.weather
      .getPoints$()
      .pipe(
        take(1),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (pts) => {
          this.points = pts;
          this.lastUpdated = new Date();

          const snapshot = this.clonePoints(pts);
          const last = this.frames.at(-1)?.points;

          if (!last || !this.sameFrame(last, snapshot)) {
            const maxFrames = 24;
            this.frames = [
              ...this.frames,
              { time: this.lastUpdated, points: snapshot },
            ].slice(-maxFrames);
            this.frameIndex = this.frames.length - 1;
            this.displayedPoints = snapshot;
          }

          this.cd.markForCheck();
        },
        error: (e) => {
          this.error = e?.message ?? 'Erro ao carregar';
          this.cd.markForCheck();
        },
      });
  }

  setFrame(i: number): void {
    if (!this.frames.length) return;
    const max = this.frames.length - 1;
    this.frameIndex = Math.max(0, Math.min(max, i));
    this.displayedPoints = this.frames[this.frameIndex].points;
    this.cd.markForCheck();
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.stopPlayback();
      return;
    }
    if (this.frames.length < 2) this.captureFrame();

    this.isPlaying = true;

    let sub = 0;
    this.playTimer = setInterval(() => {
      if (this.frames.length < 2) return;

      const aIdx = this.frameIndex >= 0 ? this.frameIndex : 0;
      const bIdx = (aIdx + 1) % this.frames.length;
      const a = this.frames[aIdx].points;
      const b = this.frames[bIdx].points;

      const t = sub / this.tweenSteps;
      this.displayedPoints = this.interpolatePoints(a, b, t);
      this.cd.markForCheck();

      sub++;
      if (sub > this.tweenSteps) {
        sub = 0;
        this.frameIndex = bIdx;
      }
    }, 1000 / this.playbackFps);
  }

  private stopPlayback(): void {
    this.isPlaying = false;
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  onResetView(): void {
    this.mapRef?.fitView();
  }

  onSelectStation(_: DeckPoint) {}

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    if (e.key === '1') {
      this.variable = 'temp';
      this.cd.markForCheck();
    }
    if (e.key === '2') {
      this.variable = 'wind';
      this.cd.markForCheck();
    }
    if (e.key === '3') {
      this.variable = 'pressure';
      this.cd.markForCheck();
    }
    if (e.key.toLowerCase() === 'l') {
      this.showLabels = !this.showLabels;
      this.cd.markForCheck();
    }
    if (e.key.toLowerCase() === 'b') {
      this.showBasemapLabels = !this.showBasemapLabels;
      this.cd.markForCheck();
    }
    if (e.key.toLowerCase() === 'r') {
      this.captureFrame();
    }
    if (e.key === ' ') {
      e.preventDefault();
      this.togglePlay();
    }
    if (e.key === 'ArrowLeft') {
      this.setFrame(this.frameIndex - 1);
    }
    if (e.key === 'ArrowRight') {
      this.setFrame(this.frameIndex + 1);
    }
    if (e.key === '0') {
      this.onResetView();
    }
  }

  private clonePoints(pts: DeckPoint[]): DeckPoint[] {
    return pts.map((p) => ({
      ...p,
      position: [...p.position] as [number, number],
    }));
  }

  private eq(a?: number | null, b?: number | null, eps = 0.01) {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    return Math.abs(a - b) <= eps;
  }

  private sameFrame(a: DeckPoint[], b: DeckPoint[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const x = a[i],
        y = b[i];
      if (x.position[0] !== y.position[0] || x.position[1] !== y.position[1])
        return false;
      if (!this.eq(x.temp, y.temp)) return false;
      if (!this.eq(x.pressure, y.pressure)) return false;
      if (!this.eq(x.windSpeed, y.windSpeed)) return false;
      if (!this.eq(x.windDir, y.windDir)) return false;
    }
    return true;
  }

  private keyOf(p: DeckPoint) {
    return `${p.position[0].toFixed(4)},${p.position[1].toFixed(4)}`;
  }

  private lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  private lerpAngleDeg(a: number, b: number, t: number) {
    let d = ((b - a + 540) % 360) - 180;
    return (a + d * t + 360) % 360;
  }

  private interpolatePoints(
    a: DeckPoint[],
    b: DeckPoint[],
    t: number
  ): DeckPoint[] {
    const mapB = new Map<string, DeckPoint>();
    b.forEach((p) => mapB.set(this.keyOf(p), p));

    return a.map((p) => {
      const q = mapB.get(this.keyOf(p)) || p;
      return {
        position: [
          this.lerp(p.position[0], q.position[0], t),
          this.lerp(p.position[1], q.position[1], t),
        ] as [number, number],
        temp:
          p.temp != null && q.temp != null
            ? this.lerp(p.temp, q.temp, t)
            : p.temp ?? q.temp,
        pressure:
          p.pressure != null && q.pressure != null
            ? this.lerp(p.pressure, q.pressure, t)
            : p.pressure ?? q.pressure,
        windSpeed:
          p.windSpeed != null && q.windSpeed != null
            ? this.lerp(p.windSpeed, q.windSpeed, t)
            : p.windSpeed ?? q.windSpeed,
        windDir:
          p.windDir != null && q.windDir != null
            ? this.lerpAngleDeg(p.windDir, q.windDir, t)
            : p.windDir ?? q.windDir,
        tooltip: q.tooltip ?? p.tooltip,
      } as DeckPoint;
    });
  }

  ngOnDestroy(): void {
    this.stopPlayback();
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }
}
