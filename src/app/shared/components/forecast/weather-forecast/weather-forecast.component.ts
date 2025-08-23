import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService } from '@domain/services/weather.service';
import { Observable, shareReplay } from 'rxjs';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { TodayReport, ForecastDay } from '@shared/models/weather';

@Component({
  selector: 'app-weather-forecast',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, AsyncPipe, DatePipe],
  templateUrl: './weather-forecast.component.html',
  styleUrls: ['./weather-forecast.component.scss'],
})
export class WeatherForecastComponent {
  vm$: Observable<{ today: TodayReport; days: ForecastDay[] }>;
  constructor(private weather: WeatherService) {
    this.vm$ = this.weather.getForecast$().pipe(shareReplay(1));
  }
}
