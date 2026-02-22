import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import maplibregl, { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '../../../context/theme';
import { cn } from '../../../utils/cn';

type MapStyleType = string | StyleSpecification;

export interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: {
    position: [number, number];
    popup?: string;
  }[];
  className?: string;
  mapStyle?: keyof typeof MAP_STYLES | MapStyleType;
  showNavigation?: boolean;
  showAttribution?: boolean;
  onMapLoad?: () => void;
}

export interface MapRef {
  flyTo: (center: [number, number], zoom?: number) => void;
  getMap: () => maplibregl.Map | null;
  setStyle: (style: MapStyleType) => void;
}

const MAP_STYLES: Record<string, MapStyleType> = {
  light: {
    version: 8,
    sources: {
      'carto-light': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    layers: [
      {
        id: 'carto-light-layer',
        type: 'raster',
        source: 'carto-light',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  } as StyleSpecification,
  dark: {
    version: 8,
    sources: {
      'carto-dark': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    layers: [
      {
        id: 'carto-dark-layer',
        type: 'raster',
        source: 'carto-dark',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  } as StyleSpecification,
  voyager: {
    version: 8,
    sources: {
      'carto-voyager': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    layers: [
      {
        id: 'carto-voyager-layer',
        type: 'raster',
        source: 'carto-voyager',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  } as StyleSpecification,
  satellite: {
    version: 8,
    sources: {
      'satellite-tiles': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: 'Tiles &copy; Esri'
      }
    },
    layers: [
      {
        id: 'satellite-tiles',
        type: 'raster',
        source: 'satellite-tiles',
        minzoom: 0,
        maxzoom: 18
      }
    ]
  } as StyleSpecification
};

export const Map = forwardRef<MapRef, MapProps>(({
  center = [-66.8792, 10.4806],
  zoom = 12,
  markers = [],
  className = "",
  mapStyle,
  showNavigation = true,
  showAttribution = true,
  onMapLoad,
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [isLoaded, setIsLoaded] = useState(false);
  const currentStyleRef = useRef<string | null>(null);

  const getStyleKey = useCallback((style: MapStyleType | undefined): string => {
    if (!style) return isDarkMode ? 'dark' : 'light';
    if (typeof style === 'string' && MAP_STYLES[style]) return style;
    return JSON.stringify(style);
  }, [isDarkMode]);

  const resolveStyle = useCallback((style: MapStyleType | undefined): MapStyleType => {
    if (!style) return isDarkMode ? MAP_STYLES.dark : MAP_STYLES.light;
    if (typeof style === 'string' && MAP_STYLES[style]) return MAP_STYLES[style];
    return style;
  }, [isDarkMode]);

  useImperativeHandle(ref, () => ({
    flyTo: (center: [number, number], zoom?: number) => {
      map.current?.flyTo({ 
        center, 
        zoom: zoom || map.current.getZoom(), 
        duration: 1500,
        essential: true 
      });
    },
    getMap: () => map.current,
    setStyle: (style: MapStyleType) => {
      map.current?.setStyle(style);
    },
  }));

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const initialStyle = resolveStyle(mapStyle);

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle,
      center: center,
      zoom: zoom,
      attributionControl: false,
      cooperativeGestures: false
    });

    map.current.on('load', () => {
      setIsLoaded(true);
      currentStyleRef.current = getStyleKey(mapStyle);
      onMapLoad?.();
    });

    if (showNavigation) {
      map.current.addControl(new maplibregl.NavigationControl({
        showCompass: false
      }), 'top-right');
    }
    
    if (showAttribution) {
      map.current.addControl(new maplibregl.AttributionControl({
        compact: true
      }), 'bottom-right');
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map.current || !isLoaded) return;
    
    const newStyleKey = getStyleKey(mapStyle);
    if (currentStyleRef.current === newStyleKey) return;
    
    currentStyleRef.current = newStyleKey;
    map.current.setStyle(resolveStyle(mapStyle));
  }, [mapStyle, isLoaded, getStyleKey, resolveStyle]);

  useEffect(() => {
    if (!map.current || !isLoaded || mapStyle) return;
    
    const autoStyle = isDarkMode ? 'dark' : 'light';
    if (currentStyleRef.current === autoStyle) return;
    
    currentStyleRef.current = autoStyle;
    map.current.setStyle(resolveStyle(undefined));
  }, [isDarkMode, isLoaded, mapStyle, resolveStyle]);

  useEffect(() => {
    if (!map.current || !isLoaded) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    markers.forEach(({ position, popup }) => {
      const markerColor = isDarkMode ? '#3B9FD8' : '#054F94';
      
      const marker = new maplibregl.Marker({ 
        color: markerColor,
        scale: 0.9
      })
        .setLngLat(position)
        .addTo(map.current!);

      if (popup) {
        const popupClass = isDarkMode 
          ? 'map-popup-dark bg-gray-900 text-white border-gray-700' 
          : 'map-popup-light bg-white text-gray-900 border-gray-200';
          
        const popupInstance = new maplibregl.Popup({ 
          offset: 35,
          closeButton: true,
          closeOnClick: false,
          className: popupClass,
          maxWidth: '250px'
        }).setHTML(`
          <div class="p-3">
            <div class="text-sm font-semibold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}">
              ${popup}
            </div>
          </div>
        `);
        marker.setPopup(popupInstance);
      }

      markersRef.current.push(marker);
    });
  }, [markers, isDarkMode, isLoaded]);

  return (
    <div className={cn("relative w-full h-full", className)}>
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-secondary dark:text-text-tertiary">Cargando mapa...</span>
          </div>
        </div>
      )}
      <div 
        ref={mapContainer} 
        className={cn(
          "w-full h-full rounded-2xl overflow-hidden",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
      <style>{`
        .map-popup-light .maplibregl-popup-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          padding: 0;
        }
        .map-popup-light .maplibregl-popup-tip {
          border-top-color: white;
        }
        .map-popup-light .maplibregl-popup-close-button {
          color: #374151;
          font-size: 18px;
          padding: 4px 8px;
        }
        .map-popup-dark .maplibregl-popup-content {
          background: #1f2937;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          padding: 0;
          border: 1px solid #374151;
        }
        .map-popup-dark .maplibregl-popup-tip {
          border-top-color: #1f2937;
        }
        .map-popup-dark .maplibregl-popup-close-button {
          color: #9ca3af;
          font-size: 18px;
          padding: 4px 8px;
        }
        .maplibregl-ctrl-attrib {
          font-size: 10px !important;
          background: transparent !important;
        }
        .maplibregl-ctrl-group {
          background: rgba(255,255,255,0.95) !important;
          border-radius: 12px !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
        }
        .dark .maplibregl-ctrl-group {
          background: rgba(31, 41, 55, 0.95) !important;
        }
        .dark .maplibregl-ctrl-group button {
          border-color: #374151 !important;
        }
        .dark .maplibregl-ctrl-group button:not(:disabled):hover {
          background-color: rgba(255,255,255,0.1) !important;
        }
        .maplibregl-ctrl-group button + button {
          border-top: 1px solid #e5e7eb !important;
        }
        .dark .maplibregl-ctrl-group button + button {
          border-top-color: #374151 !important;
        }
      `}</style>
    </div>
  );
});

Map.displayName = 'Map';

export default Map;
