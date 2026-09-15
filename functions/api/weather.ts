// Enhanced Weather API - Path: functions/api/weather.ts
// Merges forecast capability with robust error handling
// Supports single city focus with easy configuration for other municipalities
import type {
  CityCoordinates,
  Env,
  HourlyForecast,
  OpenWeatherMapResponse,
  WeatherData,
  WeatherResponseData,
} from '../types';

/**
 * CORS Configuration
 * Restricts API access to trusted origins only (security fix for T-059)
 * Production: betterbulakan.pages.dev and betterbulakan.org
 * Development: localhost for local development
 */
const ALLOWED_ORIGINS = [
  'https://betterbulakan.org',
  'https://www.betterbulakan.org',
  'https://betterbulakan.pages.dev',
  'https://betterbulakan.vercel.app',
  'http://localhost:5173', // Vite dev server
  'http://localhost:8788', // Wrangler dev server
];

/**
 * Get appropriate CORS headers based on request origin
 * Returns restrictive headers for untrusted origins
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is allowed
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

  if (isAllowed) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    };
  }

  // Return restrictive headers for untrusted origins
  return {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// CONFIGURATION - Easy to change for other municipalities
const DEFAULT_CITY: CityCoordinates = {
  name: 'Bulakan',
  lat: 14.7947,
  lon: 120.8789,
};

// Optional: Add more cities if needed
const ADDITIONAL_CITIES: CityCoordinates[] = [
  // { name: 'Malolos', lat: 14.8433, lon: 120.8114 },
];

const ALL_CITIES = [DEFAULT_CITY, ...ADDITIONAL_CITIES];

// Normalize city name for consistent key format
function normalizeCityKey(cityName: string): string {
  return cityName.toLowerCase().replace(/\s+/g, '_');
}

// Get city configuration by name (case-insensitive)
function getCityConfig(cityName: string): CityCoordinates | undefined {
  const normalized = cityName.toLowerCase();
  return ALL_CITIES.find(city => city.name.toLowerCase() === normalized);
}

// Map WMO weather code from Open-Meteo to OpenWeatherMap-compatible format
function wmoCodeToWeather(code: number): { id: number; main: string; description: string; icon: string } {
  if (code === 0) return { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' };
  if (code === 1) return { id: 801, main: 'Clouds', description: 'mainly clear', icon: '02d' };
  if (code === 2) return { id: 802, main: 'Clouds', description: 'partly cloudy', icon: '03d' };
  if (code === 3) return { id: 804, main: 'Clouds', description: 'overcast', icon: '04d' };
  if (code === 45 || code === 48) return { id: 741, main: 'Fog', description: 'fog', icon: '50d' };
  if (code >= 51 && code <= 57) return { id: 300, main: 'Drizzle', description: 'light drizzle', icon: '09d' };
  if (code >= 61 && code <= 67) return { id: 500, main: 'Rain', description: 'rain', icon: '10d' };
  if (code >= 71 && code <= 77) return { id: 600, main: 'Snow', description: 'snow', icon: '13d' };
  if (code >= 80 && code <= 82) return { id: 520, main: 'Rain', description: 'rain showers', icon: '09d' };
  if (code >= 95 && code <= 99) return { id: 200, main: 'Thunderstorm', description: 'thunderstorm', icon: '11d' };
  return { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' };
}

// Fetch weather from free Open-Meteo API without requiring an API key
async function fetchCityWeatherOpenMeteo(
  cityName: string,
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,weather_code&timezone=Asia%2FManila&forecast_days=2`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      current?: {
        time?: string;
        temperature_2m?: number;
        relative_humidity_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
        surface_pressure?: number;
      };
      hourly?: {
        time?: string[];
        temperature_2m?: number[];
        weather_code?: number[];
      };
    };

    const current = json.current || {};
    const weather = [wmoCodeToWeather(current.weather_code ?? 0)];

    const hourlyTimes = json.hourly?.time || [];
    const hourlyTemps = json.hourly?.temperature_2m || [];
    const hourlyCodes = json.hourly?.weather_code || [];

    const nowISO = current.time || '';
    let startIndex = hourlyTimes.findIndex(t => t >= nowISO);
    if (startIndex === -1) startIndex = 0;

    const hourly: HourlyForecast[] = [];
    for (let i = startIndex; i < hourlyTimes.length && hourly.length < 8; i += 3) {
      const timeStr = hourlyTimes[i];
      const dt = Math.floor(new Date(timeStr + '+08:00').getTime() / 1000);
      const temp = hourlyTemps[i] ?? current.temperature_2m ?? 28;
      const code = hourlyCodes[i] ?? 0;
      const w = wmoCodeToWeather(code);
      hourly.push({
        dt,
        temp,
        feels_like: temp,
        icon: w.icon,
        description: w.description,
        humidity: current.relative_humidity_2m ?? 80,
        wind_speed: (current.wind_speed_10m ?? 0) / 3.6,
      });
    }

    return {
      name: cityName,
      coordinates: { lat, lon },
      weather,
      main: {
        temp: current.temperature_2m ?? 28,
        feels_like: current.temperature_2m ?? 28,
        temp_min: current.temperature_2m ?? 28,
        temp_max: current.temperature_2m ?? 28,
        pressure: current.surface_pressure ?? 1012,
        humidity: current.relative_humidity_2m ?? 80,
      },
      visibility: 10000,
      wind: { speed: (current.wind_speed_10m ?? 0) / 3.6, deg: 0 },
      clouds: { all: 20 },
      dt: Math.floor(Date.now() / 1000),
      sys: {},
      timezone: 28800,
      id: 0,
      timestamp: new Date().toISOString(),
      hourly,
    };
  } catch (err) {
    console.error(`Error fetching Open-Meteo data for ${cityName}:`, err);
    return null;
  }
}

// Fetch current weather and 3-hour forecast for a single city
async function fetchCityWeather(
  cityName: string,
  lat: number,
  lon: number,
  apiKey?: string
): Promise<WeatherData | null> {
  if (apiKey) {
    try {
      // Use the standard weather API with coordinates
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      const currentResponse = await fetch(currentUrl);

      if (currentResponse.ok) {
        const currentData =
          (await currentResponse.json()) as OpenWeatherMapResponse;

        // Fetch 3-hour forecast (5 day / 3 hour forecast)
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
          // Take first 8 entries (next 24 hours in 3-hour intervals)
          const forecastList = forecastJson.list?.slice(0, 8) || [];

          hourly = forecastList.map(entry => ({
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
          name:
            currentData.name ||
            cityName.charAt(0).toUpperCase() + cityName.slice(1),
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
          wind: currentData.wind || { speed: 0, deg: 0 },
          clouds: currentData.clouds || { all: 0 },
          rain: currentData.rain || undefined,
          dt: currentData.dt || Math.floor(Date.now() / 1000),
          sys: currentData.sys || {},
          timezone: currentData.timezone || 0,
          id: currentData.id || 0,
          timestamp: new Date().toISOString(),
          hourly,
        };
      }
    } catch (cityError) {
      console.warn(`OpenWeatherMap fetch failed for ${cityName}, falling back to Open-Meteo:`, cityError);
    }
  }

  // Fallback to free Open-Meteo
  return fetchCityWeatherOpenMeteo(cityName, lat, lon);
}

// Core function to fetch weather data
async function fetchWeatherData(
  env: Env,
  specificCity: string | null = null
): Promise<WeatherResponseData> {
  const apiKey = env.OPENWEATHERMAP_API_KEY;

  // Determine which cities to fetch
  const citiesToFetch = specificCity
    ? [getCityConfig(specificCity)].filter(Boolean)
    : ALL_CITIES;

  const weatherData: WeatherResponseData = {};

  if (citiesToFetch.length === 0) {
    // If specific city requested not in config, use default coordinates
    const defaultData = await fetchCityWeather(
      specificCity || DEFAULT_CITY.name,
      DEFAULT_CITY.lat,
      DEFAULT_CITY.lon,
      apiKey
    );
    if (defaultData) {
      weatherData[normalizeCityKey(specificCity || DEFAULT_CITY.name)] = defaultData;
    }
    return weatherData;
  }

  // Fetch weather data for cities
  for (const city of citiesToFetch) {
    if (!city) continue;

    const data = await fetchCityWeather(city.name, city.lat, city.lon, apiKey);

    if (data) {
      const cityKey = normalizeCityKey(city.name);
      weatherData[cityKey] = data;
    }

    // Add a small delay to avoid rate limiting
    if (citiesToFetch.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return weatherData;
}

// Handler for direct HTTP requests
export async function onRequest(context: {
  request: Request;
  env: Env;
  ctx?: ExecutionContext;
  waitUntil?: (promise: Promise<unknown>) => void;
}): Promise<Response> {
  const url = new URL(context.request.url);
  const origin = url.origin;

  const runWaitUntil = (promise: Promise<unknown>) => {
    if (typeof context.waitUntil === 'function') {
      context.waitUntil(promise);
    } else if (context.ctx && typeof context.ctx.waitUntil === 'function') {
      context.ctx.waitUntil(promise);
    } else {
      promise.catch(err => console.error('Cache write error:', err));
    }
  };

  try {
    const cityParam = url.searchParams.get('city');
    const forceUpdate = url.searchParams.get('update') === 'true';

    // Handle OPTIONS preflight requests
    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin),
      });
    }

    const weatherKv = context.env?.WEATHER_KV;

    // Always fetch fresh data if update=true is specified
    if (forceUpdate || !weatherKv) {
      // Fetch fresh data for all cities
      const weatherData = await fetchWeatherData(context.env, cityParam);

      // Store the data in KV regardless of whether a specific city was requested
      if (weatherKv) {
        if (!cityParam) {
          runWaitUntil(
            weatherKv.put(
              'philippines_weather',
              JSON.stringify(weatherData),
              {
                expirationTtl: 3600, // Expire after 1 hour
              }
            )
          );
        } else if (cityParam && weatherData[normalizeCityKey(cityParam)]) {
          runWaitUntil(
            weatherKv.get('philippines_weather', {
              type: 'json',
            })
              .then(existingDataRaw => {
                const existingData = (existingDataRaw as WeatherResponseData) || {};
                const cityKey = normalizeCityKey(cityParam);
                existingData[cityKey] = weatherData[cityKey];
                return weatherKv.put(
                  'philippines_weather',
                  JSON.stringify(existingData),
                  {
                    expirationTtl: 3600, // Expire after 1 hour
                  }
                );
              })
              .catch(err => {
                console.error('Failed to update weather cache:', err);
              })
          );
        }
      }

      // Return the fresh data with secure CORS headers
      return new Response(JSON.stringify(weatherData), {
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(origin),
          'Cache-Control': 'max-age=3600',
        },
      });
    }

    // Check if data exists in KV and is not expired
    const cachedData = (await weatherKv.get(
      'philippines_weather',
      { type: 'json' }
    )) as WeatherResponseData | null;

    // If city parameter is provided, filter the data
    if (cityParam && cachedData) {
      const cityKey = normalizeCityKey(cityParam);
      if (cachedData[cityKey]) {
        return new Response(
          JSON.stringify({ [cityKey]: cachedData[cityKey] }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...getCorsHeaders(origin),
              'Cache-Control': 'max-age=3600',
            },
          }
        );
      }
    }

    // If we have cached data for all cities and no specific city is requested, return it
    if (cachedData && !cityParam) {
      return new Response(JSON.stringify(cachedData), {
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(origin),
          'Cache-Control': 'max-age=3600',
        },
      });
    }

    // If we reach here, fetch fresh data
    const weatherData = await fetchWeatherData(context.env, cityParam);

    // Store the data in KV - use runWaitUntil for fire-and-forget cache write
    if (weatherKv) {
      if (!cityParam) {
        runWaitUntil(
          weatherKv.put(
            'philippines_weather',
            JSON.stringify(weatherData),
            {
              expirationTtl: 3600, // Expire after 1 hour
            }
          )
        );
      } else if (cityParam && weatherData[normalizeCityKey(cityParam)]) {
        runWaitUntil(
          weatherKv.get('philippines_weather', {
            type: 'json',
          })
            .then(existingDataRaw => {
              const existingData = (existingDataRaw as WeatherResponseData) || {};
              const cityKey = normalizeCityKey(cityParam);
              existingData[cityKey] = weatherData[cityKey];
              return weatherKv.put(
                'philippines_weather',
                JSON.stringify(existingData),
                {
                  expirationTtl: 3600, // Expire after 1 hour
                }
              );
            })
            .catch(err => {
              console.error('Failed to update weather cache:', err);
            })
        );
      }
    }

    // Return the response
    return new Response(JSON.stringify(weatherData), {
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin),
        'Cache-Control': 'max-age=3600',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin),
      },
    });
  }
}

export async function scheduled(controller: ScheduledController, env: Env) {
  try {
    // Fetch weather data for all cities
    const weatherData = await fetchWeatherData(env);

    // Store the data in Cloudflare KV
    await env.WEATHER_KV.put(
      'philippines_weather',
      JSON.stringify(weatherData),
      {
        expirationTtl: 3600 * 6, // Expire after 6 hours
      }
    );

    return {
      success: true,
      message: `Weather data updated for ${Object.keys(weatherData).length} Philippine cities`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in weather scheduled function:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
