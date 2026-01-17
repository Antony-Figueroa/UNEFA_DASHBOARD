import React, { useEffect, useRef } from 'react';
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

const MAP_STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  voyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
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

const Map: React.FC<MapProps> = ({
  center = [9.569627, -69.219552], // HQ9J+R7P, Calle 6, Araure 3303, Portuguesa, Venezuela
  zoom = 17,
  markers = [],
  className = "",
  mapStyle
}) => {
  const { theme } = useTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const isInitializing = useRef(false);

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
        center: center,
        zoom: zoom,
        attributionControl: false,
        trackResize: true
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
        console.warn('MapLibre error:', e.error);
        
        // If a style fails to load, try a basic fallback
        if (e.error?.message?.includes('style') || e.error?.status === 404) {
          const fallback = (theme === 'dark' ? MAP_STYLES.dark : MAP_STYLES.light) as MapStyleType;
          if (currentStyleRef.current !== fallback) {
            console.log('Style load failed, falling back to stable style...');
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
      const targetCenter = maplibregl.LngLat.convert(center);
      if (Math.abs(currentCenter.lng - targetCenter.lng) > 0.0001 || 
          Math.abs(currentCenter.lat - targetCenter.lat) > 0.0001) {
        m.setCenter(center);
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
      markers.forEach(marker => {
        const m = new maplibregl.Marker({ color: '#2d90c4' })
          .setLngLat(marker.position)
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
};

export default Map;
