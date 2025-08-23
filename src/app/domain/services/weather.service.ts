import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@config/environment';
import { Observable, map, catchError, of } from 'rxjs';
import { DeckPoint, ForecastDay, TodayReport } from '@shared/models/weather';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  constructor(private http: HttpClient) {}

  getPoints$(): Observable<DeckPoint[]> {
    return this.http.get<any>(environment.API_URL).pipe(
      map((json) => {
        const items = json?.actual?.stationmeasurements ?? [];
        return items.map((s: any) => ({
          position: [s.lon, s.lat] as [number, number],
          temp: s.temperature ?? null,
          pressure: s.airpressure ?? null,
          windDir: s.winddirectiondegrees ?? null,
          windSpeed: s.windspeed ?? null,
          tooltip: `${s.stationname}${
            s.weatherdescription ? ' • ' + s.weatherdescription : ''
          }`,
        }));
      })
    );
  }

  getForecast$(): Observable<{ today: TodayReport; days: ForecastDay[] }> {
    return this.http.get<any>(environment.API_URL).pipe(
      map((json) => {
        const wr = json?.forecast?.weatherreport ?? {};
        const today: TodayReport = {
          title: wr.title ?? '',
          summary: (wr.summary ?? '').toString(),
          published: wr.published ? new Date(wr.published) : null,
          sunrise: json?.actual?.sunrise ? new Date(json.actual.sunrise) : null,
          sunset: json?.actual?.sunset ? new Date(json.actual.sunset) : null,
        };
        const raw = json?.forecast?.fivedayforecast ?? [];
        const days: ForecastDay[] = raw.map((d: any) => ({
          date: d.day ? new Date(d.day) : new Date(),
          min:
            typeof d.mintemperatureMin === 'number'
              ? d.mintemperatureMin
              : parseFloat(
                  d.mintemperatureMax ??
                    d.mintemperature ??
                    d.mintemperatureMin ??
                    ''
                ) || null,
          max:
            typeof d.maxtemperatureMax === 'number'
              ? d.maxtemperatureMax
              : parseFloat(d.maxtemperatureMax ?? d.maxtemperature ?? '') ||
                null,
          rainChance: typeof d.rainChance === 'number' ? d.rainChance : null,
          wind: typeof d.wind === 'number' ? d.wind : null,
          windDirection: d.windDirection ?? null,
          iconUrl: d.iconurl ?? d.fullIconUrl ?? null,
          description: d.weatherdescription ?? null,
        }));
        return { today, days };
      }),
      catchError(() =>
        of({
          today: {
            title: '',
            summary: '',
            published: null,
            sunrise: null,
            sunset: null,
          },
          days: [],
        })
      )
    );
  }
}
