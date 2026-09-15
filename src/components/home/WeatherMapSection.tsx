import { useEffect, useState } from 'react';

import { HourlyForecast, WeatherData } from '@/types';
import L from 'leaflet';
// Fix Leaflet default marker icon issue in Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplet,
  LoaderIcon,
  LucideIcon,
  MapPin,
  Moon,
  Sun,
  Wind,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';

import { config } from '@/lib/lguConfig';
import { fetchWeatherData } from '@/lib/weather';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Map Lucide string to actual component
const lucideIconMap: Record<string, LucideIcon> = {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  CloudSnow,
};

interface LeafletHTMLElement extends HTMLElement {
  _leaflet_id?: number;
}

export default function WeatherMapSection() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch weather data
  useEffect(() => {
    const getWeather = async () => {
      try {
        setLoading(true);
        const data = await fetchWeatherData(); // WeatherData[]
        setWeather(data[0] ?? null);
      } catch (err: unknown) {
        // Offline / missing API key should not dump raw HTTP status into the UI
        const message =
          err instanceof Error ? err.message : 'Failed to fetch weather data';
        if (
          message.includes('503') ||
          message.includes('API unavailable') ||
          message.toLowerCase().includes('offline')
        ) {
          setError('Weather data is temporarily unavailable.');
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };
    getWeather();
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    const container = document.getElementById('map-container');
    if (!container) {
      console.log('Map: Container not found');
      return;
    }

    // If map already exists, clean it up first
    const containerLeaflet = container as LeafletHTMLElement;
    if (containerLeaflet._leaflet_id) {
      containerLeaflet.innerHTML = '';
      delete containerLeaflet._leaflet_id;
    }

    let mapInstance: L.Map | null = null;

    // Check if Leaflet is available
    if (typeof L === 'undefined') {
      console.error('Map: Leaflet not loaded');
      return;
    }

    try {
      console.log('Map: Initializing Leaflet...');

      // Create the map
      mapInstance = L.map(container, {
        center: [
          config.location.coordinates.lat,
          config.location.coordinates.lon,
        ],
        zoom: 15,
        scrollWheelZoom: false,
        zoomControl: true,
        keyboard: true,
        keyboardPanDelta: 80,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstance);

      // Add marker
      const marker = L.marker([
        config.location.coordinates.lat,
        config.location.coordinates.lon,
      ]).addTo(mapInstance);
      const popupContent = document.createElement('div');
      popupContent.textContent = `${config.lgu.fullName} Municipal Hall`;
      const popupSub = document.createElement('div');
      popupSub.textContent = `${config.lgu.province}, Philippines`;
      popupContent.appendChild(popupSub);
      marker.bindPopup(popupContent);

      // Force resize after short delays to ensure full tile coverage
      const resizeTimer1 = setTimeout(() => {
        if (mapInstance) mapInstance.invalidateSize();
      }, 100);

      const resizeTimer2 = setTimeout(() => {
        if (mapInstance) mapInstance.invalidateSize();
      }, 400);

      const resizeTimer3 = setTimeout(() => {
        if (mapInstance) mapInstance.invalidateSize();
      }, 800);

      const handleResize = () => {
        if (mapInstance) mapInstance.invalidateSize();
      };
      window.addEventListener('resize', handleResize);

      console.log('Map: Leaflet initialized successfully');

      return () => {
        clearTimeout(resizeTimer1);
        clearTimeout(resizeTimer2);
        clearTimeout(resizeTimer3);
        window.removeEventListener('resize', handleResize);
        if (mapInstance) {
          try {
            mapInstance.remove();
          } catch (e) {
            console.warn('Map: Cleanup warning:', e);
          }
        }
      };
    } catch (error) {
      console.error('Map: Initialization failed:', error);
    }
  }, []);

  // Safe hourly forecast
  const hourlyForecast: HourlyForecast[] =
    weather?.hourly && weather.hourly.length > 0
      ? weather.hourly.slice(0, 4)
      : Array.from({ length: 4 }, (_, i) => ({
          hour: `${i + 1}PM`,
          temperature: weather?.temperature ?? 28,
          icon: weather?.icon ?? 'Sun',
        }));

  const WeatherIcon = weather ? lucideIconMap[weather.icon || 'Sun'] || Sun : Sun;

  return (
    <section className='border-kapwa-border-weak border-t py-12 bg-kapwa-bg-surface'>
      <div className='container px-4 mx-auto'>
        {/* Section Header */}
        <div className='mb-8 text-center'>
          <h2 className='text-2xl font-bold md:text-3xl text-kapwa-text-strong'>
            Weather and Map of {config.lgu.name}
          </h2>
          <p className='text-kapwa-text-support mt-2 text-sm md:text-base'>
            Current weather forecast and municipal center location
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch'>
          {/* Weather Card */}
          <Card className='lg:col-span-5 w-full flex flex-col justify-between shadow-sm min-h-[380px] md:min-h-[440px]'>
            <CardContent className='p-6 md:p-8 flex flex-col justify-between h-full'>
              {loading ? (
                <div className='flex flex-col items-center justify-center flex-1 py-12 text-kapwa-text-disabled gap-3'>
                  <LoaderIcon className='h-8 w-8 animate-spin text-kapwa-text-brand' />
                  <span className='text-base font-medium'>Loading weather forecast...</span>
                </div>
              ) : error ? (
                <div className='flex flex-col items-center justify-center flex-1 py-12 text-center gap-3'>
                  <Cloud className='h-12 w-12 text-kapwa-text-disabled' />
                  <p className='text-kapwa-text-support font-medium'>{error}</p>
                </div>
              ) : weather ? (
                <>
                  {/* Top: Temp & Condition */}
                  <div className='flex items-center justify-between gap-6 pb-6 border-b border-kapwa-border-weak'>
                    <div className='flex flex-col'>
                      <div className='text-kapwa-text-strong text-5xl md:text-6xl font-extrabold tracking-tight'>
                        {weather.temperature}°C
                      </div>
                      <div className='text-kapwa-text-support text-lg capitalize font-medium mt-1'>
                        {weather.condition}
                      </div>
                      <div className='text-kapwa-text-disabled mt-2 flex items-center gap-1.5 text-sm'>
                        <MapPin className='h-4 w-4 shrink-0 text-kapwa-text-brand' />
                        <span>{config.lgu.name}, {config.lgu.province}</span>
                      </div>
                    </div>
                    <WeatherIcon className='text-kapwa-text-brand h-20 w-20 shrink-0 stroke-[1.5]' />
                  </div>

                  {/* Middle: Humidity & Wind */}
                  <div className='grid grid-cols-2 gap-4 py-4 bg-kapwa-bg-hover rounded-xl px-4 my-4'>
                    <div className='flex items-center gap-3'>
                      <Droplet className='text-kapwa-text-link h-5 w-5 shrink-0' />
                      <div>
                        <div className='text-xs text-kapwa-text-disabled'>Humidity</div>
                        <div className='text-sm font-semibold text-kapwa-text-strong'>{weather.humidity}%</div>
                      </div>
                    </div>
                    <div className='flex items-center gap-3'>
                      <Wind className='text-kapwa-text-brand h-5 w-5 shrink-0' />
                      <div>
                        <div className='text-xs text-kapwa-text-disabled'>Wind Speed</div>
                        <div className='text-sm font-semibold text-kapwa-text-strong'>{weather.windSpeed} m/s</div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Hourly forecast */}
                  <div>
                    <div className='text-xs font-semibold text-kapwa-text-disabled uppercase tracking-wider mb-2.5'>
                      Forecast
                    </div>
                    <div className='grid grid-cols-4 gap-2'>
                      {hourlyForecast.map((h, idx) => {
                        const IconComp = lucideIconMap[h.icon] || Sun;
                        return (
                          <div
                            key={idx}
                            className='hover:bg-kapwa-bg-surface-brand bg-kapwa-bg-hover flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all duration-200'
                          >
                            <span className='text-xs text-kapwa-text-disabled font-medium'>
                              {h.hour}
                            </span>
                            <IconComp className='text-kapwa-text-brand h-6 w-6 my-1' />
                            <span className='text-sm font-bold text-kapwa-text-strong'>
                              {h.temperature}°
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className='flex flex-col items-center justify-center flex-1 py-12 text-kapwa-text-support'>
                  No weather data available.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map Container */}
          <div className='lg:col-span-7 flex flex-col overflow-hidden rounded-2xl border border-kapwa-border-weak shadow-sm hover:shadow-md min-h-[380px] md:min-h-[440px] bg-kapwa-bg-surface'>
            <div
              id='map-container'
              className='w-full h-full min-h-[320px] md:min-h-[380px] flex-1'
              role='application'
              aria-label={`Interactive map of ${config.lgu.fullName} Municipal Hall`}
            >
              <noscript>
                <div className='text-kapwa-text-disabled p-4 text-sm'>
                  JavaScript is required to view the interactive map.
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${config.location.coordinates.lat}&mlon=${config.location.coordinates.lon}#map=15/${config.location.coordinates.lat}/${config.location.coordinates.lon}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-kapwa-text-brand ml-1 underline'
                  >
                    View {config.lgu.fullName} Municipal Hall on OpenStreetMap
                  </a>
                </div>
              </noscript>
            </div>
            <div className='border-kapwa-border-weak bg-kapwa-bg-surface flex items-center justify-between gap-2 border-t p-3.5 px-4'>
              <div className='flex items-center gap-2'>
                <MapPin className='text-kapwa-text-brand h-5 w-5 shrink-0' />
                <span className='text-kapwa-text-strong text-sm font-medium'>
                  {config.lgu.fullName} Municipal Hall
                </span>
              </div>
              <span className='text-xs text-kapwa-text-disabled'>
                {config.location.coordinates.lat}, {config.location.coordinates.lon}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
