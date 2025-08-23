import 'zone.js';

import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { WeatherPageComponent } from '@presentation/pages/weather/weather-page/weather-page.component';

bootstrapApplication(WeatherPageComponent, {
  providers: [provideHttpClient()],
}).catch(console.error);
