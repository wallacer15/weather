export type WeatherVariable = 'temp' | 'wind' | 'pressure';

export interface StationMeasurement {
  stationname: string;
  lat: number;
  lon: number;
  weatherdescription?: string;
  temperature?: number;
  airpressure?: number;
  windspeed?: number;
  winddirectiondegrees?: number;
}

export interface ApiResponse {
  actual: {
    actualradarurl: string;
    stationmeasurements: StationMeasurement[];
  };
}

export interface DeckPoint {
  position: [number, number];
  temp?: number;
  pressure?: number;
  windDir?: number;
  windSpeed?: number;
  tooltip: string;
}
