import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import maplibregl, { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '../../../context/theme';
import { cn } from '../../../utils/cn';

/**
 * Tipo para la especificación de estilo del mapa.
 */
type MapStyleType = string | StyleSpecification;

/**
 * Propiedades para el componente Map.
 */
export interface MapProps {
  /** Coordenadas del centro del mapa [longitud, latitud]. Por defecto [-66.8792, 10.4806] (Caracas). */
  center?: [number, number];
  /** Nivel de zoom inicial. Por defecto 12. */
  zoom?: number;
  /** Arreglo de marcadores a mostrar en el mapa. */
  markers?: {
    /** Coordenadas del marcador [longitud, latitud]. */
    position: [number, number];
    /** Contenido HTML o texto opcional para el popup. */
    popup?: string;
  }[];
  /** Clases CSS adicionales para el contenedor del mapa. */
  className?: string;
  /** Estilo específico del mapa (key de MAP_STYLES) o URL/objeto de estilo personalizado. */
  mapStyle?: keyof typeof MAP_STYLES | MapStyleType;
}

/**
 * API pública expuesta vía ref para el componente Map.
 */
export interface MapRef {
  /** Desplaza la cámara a una coordenada y zoom específicos con animación. */
  flyTo: (center: [number, number], zoom?: number) => void;
  /** Obtiene la instancia subyacente de MapLibre GL. */
  getMap: () => maplibregl.Map | null;
}

/**
 * Estilos de mapa predefinidos basados en CartoDB y OSM.
 */
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
        attribution: '&copy; OpenStreetMap'
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
      'satellite-tiles': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
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

/**
 * Componente de Mapa Interactivo basado en MapLibre GL.
 * Soporta marcadores, popups, temas claro/oscuro automáticos y control de cámara.
 * 
 * @component
 * @example
 * ```tsx
 * <Map 
 *   center={[-66.8792, 10.4806]} 
 *   markers={[{ position: [-66.8792, 10.4806], popup: "<b>UNEFA</b><br/>Sede Caracas" }]} 
 * />
 * ```
 */
export const Map = forwardRef<MapRef, MapProps>(({
  center = [-66.8792, 10.4806],
  zoom = 12,
  markers = [],
  className = "",
  mapStyle,
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Exponer API pública vía Ref
  useImperativeHandle(ref, () => ({
    flyTo: (center: [number, number], zoom?: number) => {
      map.current?.flyTo({ 
        center, 
        zoom: zoom || map.current.getZoom(), 
        duration: 2000,
        essential: true 
      });
    },
    getMap: () => map.current,
  }));

  // Inicialización del mapa
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Determinar estilo inicial
    let initialStyle: MapStyleType;
    if (mapStyle) {
      initialStyle = typeof mapStyle === 'string' && MAP_STYLES[mapStyle] 
        ? MAP_STYLES[mapStyle] 
        : mapStyle as MapStyleType;
    } else {
      initialStyle = isDarkMode ? MAP_STYLES.dark : MAP_STYLES.light;
    }

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle,
      center: center,
      zoom: zoom,
      attributionControl: false
    });

    // Controles estándar
    map.current.addControl(new maplibregl.NavigationControl({
      showCompass: false
    }), 'top-right');
    
    map.current.addControl(new maplibregl.AttributionControl({
      compact: true
    }), 'bottom-right');

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Sincronización de tema (Claro/Oscuro)
  useEffect(() => {
    if (!map.current || mapStyle) return;
    map.current.setStyle(isDarkMode ? MAP_STYLES.dark : MAP_STYLES.light);
  }, [isDarkMode, mapStyle]);

  // Sincronización de marcadores
  useEffect(() => {
    if (!map.current) return;

    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Añadir nuevos marcadores
    markers.forEach(({ position, popup }) => {
      const marker = new maplibregl.Marker({ 
        color: isDarkMode ? '#fb923c' : '#f97316', // Orange-400 / Orange-500
        scale: 0.8
      })
        .setLngLat(position)
        .addTo(map.current!);

      if (popup) {
        const popupInstance = new maplibregl.Popup({ 
          offset: 30,
          closeButton: false,
          className: 'custom-map-popup'
        }).setHTML(`
          <div class="p-2 text-xs font-semibold leading-tight text-slate-900 dark:text-white">
            ${popup}
          </div>
        `);
        marker.setPopup(popupInstance);
      }

      markersRef.current.push(marker);
    });
  }, [markers, isDarkMode]);

  return (
    <div 
      ref={mapContainer} 
      className={cn(
        "w-full h-full rounded-2xl overflow-hidden shadow-sm border border-border-light dark:border-border-dark bg-bg-secondary",
        className
      )} 
    />
  );
});

Map.displayName = 'Map';

export default Map;