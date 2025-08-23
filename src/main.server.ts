import 'zone.js/node';

import { bootstrapApplication } from '@angular/platform-browser';
import { provideServerRendering } from '@angular/platform-server';
import { provideHttpClient } from '@angular/common/http';
import { WeatherPageComponent } from '@presentation/pages/weather/weather-page/weather-page.component';

export default function bootstrap() {
  return bootstrapApplication(WeatherPageComponent, {
    providers: [provideServerRendering(), provideHttpClient()],
  });
}
