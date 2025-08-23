import { Component } from '@angular/core';
import { WeatherPageComponent } from '@presentation/pages/weather/weather-page/weather-page.component';

@Component({
  selector: 'app-root',
  imports: [WeatherPageComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
