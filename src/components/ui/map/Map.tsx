import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import maplibregl, { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '../../../context/theme';

type MapStyleType = string | StyleSpecification;

interface MapProps {
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  markers?: {
    position: [number, number];
    popup?: string;
  }[];
  className?: string;
  mapStyle?: keyof typeof MAP_STYLES | MapStyleType;
}

export interface MapRef {
  flyTo: (center: [number, number], zoom?: number) => void;
  getMap: () => maplibregl.Map | null;
}

const MAP_STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  voyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  osm: {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm-tiles',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  } as StyleSpecification,
  satellite: {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
      }
    },
    layers: [
      {
        id: 'simple-tiles',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  } as StyleSpecification
} as const;

const Map = forwardRef<MapRef, MapProps>(({
  center = [9.569627, -69.219552], // HQ9J+R7P, Calle 6, Araure 3303, Portuguesa, Venezuela
  zoom = 17,
  markers = [],
  className = "",
  mapStyle
}, ref) => {
  const { theme } = useTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const isInitializing = useRef(false);

  useImperativeHandle(ref, () => ({
    flyTo: (center: [number, number], zoomLevel?: number) => {
      if (map.current) {
        map.current.flyTo({
          center,
          zoom: zoomLevel || zoom,
          essential: true,
          duration: 2000
        });
      }
    },
    getMap: () => map.current
  }));

  // Determine the actual style to use
  const getStyle = (): MapStyleType => {
    if (typeof mapStyle === 'string' && mapStyle in MAP_STYLES) {
      return MAP_STYLES[mapStyle as keyof typeof MAP_STYLES] as MapStyleType;
    }
    return (mapStyle as MapStyleType) || (theme === 'dark' ? MAP_STYLES.dark : MAP_STYLES.light);
  };

  const currentStyle = getStyle();
  const currentStyleRef = useRef<MapStyleType>(currentStyle);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map if it doesn't exist and not currently initializing
    if (!map.current && !isInitializing.current) {
      isInitializing.current = true;
      
      const newMap = new maplibregl.Map({
        container: mapContainer.current,
        style: currentStyle,
        center: center as [number, number],
        zoom: zoom,
        attributionControl: false,
        trackResize: true,
        transformRequest: (url) => {
          // Si el mapa se está desmontando o la URL es de CartoDB, 
          // podemos interceptar fallos potenciales aquí si fuera necesario.
          return {
            url: url
          };
        }
      });

      map.current = newMap;
      newMap.addControl(new maplibregl.NavigationControl(), 'top-right');
      
      newMap.on('load', () => {
        isInitializing.current = false;
        currentStyleRef.current = currentStyle;
        setTimeout(() => {
          newMap.resize();
        }, 100);
      });

      newMap.on('error', (e) => {
        // Ignorar errores de cancelación de red (net::ERR_ABORTED) que son comunes y ruidosos
        if (
          !e.error || 
          e.error.message?.includes('Aborted') || 
          e.error.status === 0 || 
          e.error.message?.includes('canceled')
        ) {
          return;
        }

        console.warn('MapLibre error:', e.error);
        
        // If a style fails to load, try a basic fallback to OSM raster tiles
        if (e.error?.message?.includes('style') || e.error?.status === 404 || e.error?.message?.includes('Failed to fetch')) {
          const fallback = MAP_STYLES.osm;
          if (currentStyleRef.current !== fallback) {
            console.log('Style load failed, falling back to stable OSM raster style...');
            newMap.setStyle(fallback);
            currentStyleRef.current = fallback;
          }
        }
        
        if (!map.current) isInitializing.current = false;
      });
    } else if (map.current) {
      // Update existing map properties only if they changed
      const m = map.current;
      
      // Use a safer comparison for center
      const currentCenter = m.getCenter();
      const targetCenter = maplibregl.LngLat.convert(center as [number, number]);
      if (Math.abs(currentCenter.lng - targetCenter.lng) > 0.0001 || 
          Math.abs(currentCenter.lat - targetCenter.lat) > 0.0001) {
        m.setCenter(center as [number, number]);
      }
      
      if (Math.abs(m.getZoom() - zoom) > 0.1) {
        m.setZoom(zoom);
      }

      if (JSON.stringify(currentStyleRef.current) !== JSON.stringify(currentStyle)) {
        m.setStyle(currentStyle);
        currentStyleRef.current = currentStyle;
      }

      // Explicitly trigger resize when style or props change
      setTimeout(() => m.resize(), 100);
    }

    // Clean up markers and re-add them - only if map exists
    const currentMarkers: maplibregl.Marker[] = [];
    
    if (map.current) {
      (markers || []).forEach(marker => {
        const m = new maplibregl.Marker({ color: '#2d90c4' })
          .setLngLat(marker.position as [number, number])
          .addTo(map.current!);

        if (marker.popup) {
          m.setPopup(new maplibregl.Popup({ offset: 25, maxWidth: '280px' }).setHTML(`
            <div class="m-1 p-1 text-xs font-medium ${theme === 'dark' ? 'text-white bg-bg-dark' : 'text-gray-900'}">
              ${marker.popup}
            </div>
          `));
        }
        currentMarkers.push(m);
      });
    }

    // Ensure map resizes to container after initialization or update
    const resizeTimeout = setTimeout(() => {
      map.current?.resize();
    }, 1000); // Increased timeout to ensure Framer Motion animation (0.7s) is complete

    const handleResize = () => {
      map.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(resizeTimeout);
      currentMarkers.forEach(m => m.remove());
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [center, zoom, markers, currentStyle, theme]);

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        isInitializing.current = false;
      }
    };
  }, []);

  return (
    <div 
      ref={mapContainer} 
      className={`relative w-full h-full rounded-2xl overflow-hidden shadow-theme-lg border border-border-light dark:border-border-dark bg-gray-100 dark:bg-gray-800 ${className}`} 
    />
  );
});

export default Map;