import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '@config/environment';
import { ApiResponse, DeckPoint } from '@shared/models/weather';
import { mapStationsToPoints } from '@shared/utils/mapper';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  constructor(private http: HttpClient) {}

  /** Bruto (se precisar debugar) */
  getActual$(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(environment.API_URL);
  }

  /** Pronto para o mapa */
  getPoints$(): Observable<DeckPoint[]> {
    return this.getActual$().pipe(
      map((r) => mapStationsToPoints(r?.actual?.stationmeasurements ?? []))
    );
  }
}
