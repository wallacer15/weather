import { DeckPoint, StationMeasurement } from '@shared/models/weather';

export function mapStationsToPoints(
  stations: StationMeasurement[]
): DeckPoint[] {
  return (stations ?? []).map((s) => ({
    position: [s.lon, s.lat] as [number, number],
    temp: s.temperature ?? undefined,
    pressure: s.airpressure ?? undefined,
    windDir: s.winddirectiondegrees ?? undefined,
    windSpeed: s.windspeed ?? undefined,
    tooltip: `${s.stationname}${
      s.weatherdescription ? ' • ' + s.weatherdescription : ''
    }`,
  }));
}
