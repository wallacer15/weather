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

export interface TodayReport {
  title: string;
  summary: string;
  published: Date | null;
  sunrise: Date | null;
  sunset: Date | null;
}

export interface ForecastDay {
  date: Date;
  min: number | null;
  max: number | null;
  rainChance: number | null;
  wind: number | null;
  windDirection: string | null;
  iconUrl: string | null;
  description: string | null;
}
