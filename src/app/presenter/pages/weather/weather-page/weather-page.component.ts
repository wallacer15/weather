import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, take } from 'rxjs/operators';

import { WeatherControlsComponent } from '@presentation/components/weather-controls/weather-controls.component';
import { WeatherMapComponent } from '@presentation/components/weather-map/weather-map.component';
import { LegendComponent } from '@shared/components/legend/legend.component';

import { WeatherService } from '@domain/services/weather.service';
import { DeckPoint, WeatherVariable } from '@shared/models/weather';

@Component({
  selector: 'app-weather-page',
  standalone: true,
  imports: [
    CommonModule,
    WeatherControlsComponent,
    WeatherMapComponent,
    LegendComponent,
  ],
  templateUrl: './weather-page.component.html',
  styleUrls: ['./weather-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherPageComponent {
  variable: WeatherVariable = 'temp';
  heatRadius = 30;
  heatOpacity = 1;
  showLabels = true;
  showBasemapLabels = false;

  loading = false;
  error: string | null = null;
  lastUpdated: Date | null = null;
  points: DeckPoint[] = [];

  constructor(private weather: WeatherService, private cd: ChangeDetectorRef) {
    this.reload();
  }

  reload(): void {
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
          this.variable = 'temp';
          this.cd.markForCheck();
        },
        error: (e) => {
          this.error = e?.message ?? 'Erro ao carregar';
          this.cd.markForCheck();
        },
      });
  }
}
