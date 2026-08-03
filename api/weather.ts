export const config = {
  runtime: 'edge',
};

interface HourlyForecast {
  dt: number;
  temp: number;
  feels_like: number;
  icon: string;
  description: string;
  humidity: number;
  wind_speed: number;
}

interface WeatherPayload {
  name: string;
  coordinates: { lat: number; lon: number };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: { speed: number; deg?: number };
  clouds: { all: number };
  rain?: Record<string, number>;
  dt: number;
  sys: Record<string, unknown>;
  timezone: number;
  id: number;
  timestamp: string;
  hourly: HourlyForecast[];
}

const DEFAULT_CITY = 'Bulakan';
const DEFAULT_COORDS = { lat: 14.7947, lon: 120.8789 };

function normalizeCityKey(cityName: string): string {
  return cityName.toLowerCase().replace(/\s+/g, '_').replace(/ñ/g, 'n');
}

function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

async function fetchCityWeather(
  cityName: string,
  lat: number,
  lon: number,
  apiKey: string
): Promise<WeatherPayload | null> {
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const currentResponse = await fetch(currentUrl);
  if (!currentResponse.ok) {
    return null;
  }

  const currentData = (await currentResponse.json()) as {
    name?: string;
    coord?: { lat: number; lon: number };
    weather?: WeatherPayload['weather'];
    main?: WeatherPayload['main'];
    visibility?: number;
    wind?: WeatherPayload['wind'];
    clouds?: WeatherPayload['clouds'];
    rain?: WeatherPayload['rain'];
    dt?: number;
    sys?: Record<string, unknown>;
    timezone?: number;
    id?: number;
  };

  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const forecastResponse = await fetch(forecastUrl);
  let hourly: HourlyForecast[] = [];

  if (forecastResponse.ok) {
    const forecastJson = (await forecastResponse.json()) as {
      list?: Array<{
        dt: number;
        main: { temp: number; feels_like: number; humidity: number };
        weather: Array<{ icon: string; description: string }>;
        wind: { speed: number };
      }>;
    };
    hourly = (forecastJson.list?.slice(0, 8) || []).map(entry => ({
      dt: entry.dt,
      temp: entry.main.temp,
      feels_like: entry.main.feels_like,
      icon: entry.weather[0].icon,
      description: entry.weather[0].description,
      humidity: entry.main.humidity,
      wind_speed: entry.wind.speed,
    }));
  }

  return {
    name: currentData.name || cityName,
    coordinates: currentData.coord || { lat, lon },
    weather: currentData.weather || [],
    main: currentData.main || {
      temp: 0,
      feels_like: 0,
      temp_min: 0,
      temp_max: 0,
      pressure: 0,
      humidity: 0,
    },
    visibility: currentData.visibility || 0,
    wind: currentData.wind || { speed: 0 },
    clouds: currentData.clouds || { all: 0 },
    rain: currentData.rain,
    dt: currentData.dt || Math.floor(Date.now() / 1000),
    sys: currentData.sys || {},
    timezone: currentData.timezone || 0,
    id: currentData.id || 0,
    timestamp: new Date().toISOString(),
    hourly,
  };
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return jsonResponse(
      { error: 'OpenWeatherMap API key not configured', offline: true },
      503
    );
  }

  const url = new URL(request.url);
  const cityName = url.searchParams.get('city')?.trim() || DEFAULT_CITY;

  try {
    const data = await fetchCityWeather(
      cityName,
      DEFAULT_COORDS.lat,
      DEFAULT_COORDS.lon,
      apiKey
    );
    if (!data) {
      return jsonResponse({ error: 'Failed to fetch weather data' }, 502);
    }

    return jsonResponse({ [normalizeCityKey(cityName)]: data }, 200, {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=600',
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : 'Weather request failed',
      },
      500
    );
  }
}
