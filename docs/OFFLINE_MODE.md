# Modo Offline - UNEFA Dashboard

Guía completa para el modo offline de la aplicación.

---

## Índice

1. [Introducción](#introducción)
2. [Arquitectura](#arquitectura)
3. [Habilitar Modo Offline](#habilitar-modo-offline)
4. [Uso del Modo Offline](#uso-del-modo-offline)
5. [API del Sistema Offline](#api-del-sistema-offline)
6. [Resolución de Problemas](#resolución-de-problemas)
7. [Ejecutar Tests](#ejecutar-tests)

---

## Introducción

UNEFA Dashboard implementa un sistema offline robusto que permite:

- **Navegación sin conexión**: La app carga desde caché cuando no hay internet
- **Caché de datos**: Respuestas API almacenadas en IndexedDB
- **Cola de mutaciones**: Cambios offline se sincronizan automáticamente
- **PWA instalable**: App web progresiva instalable como aplicación de escritorio

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ OfflineContext│  │ apiClient   │  │ PWA Service Worker│  │
│  │              │  │             │  │                  │  │
│  │ - isOnline   │  │ - getCached │  │ - Cache assets   │  │
│  │ - syncStatus │  │ - queueMut  │  │ - Cache API      │  │
│  │ - pendingCnt │  │ - forceSync │  │ - Offline page  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                     IndexedDB (Dexie)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │    cache     │  │  mutations   │  │    syncLogs      │  │
│  │              │  │              │  │                  │  │
│  │ - key        │  │ - id         │  │ - mutationId     │  │
│  │ - data       │  │ - type       │  │ - status         │  │
│  │ - expiresAt  │  │ - endpoint   │  │ - timestamp      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Clave

| Componente | Descripción |
|------------|-------------|
| `src/lib/offline/db.ts` | Base de datos IndexedDB con Dexie |
| `src/lib/offline/syncManager.ts` | Gestor de sincronización |
| `src/lib/offline/offlineApiClient.ts` | Cliente API con soporte offline |
| `src/context/OfflineContext.tsx` | Contexto React para estado offline |
| `src/api/apiClient.ts` | Cliente Axios con interceptores offline |

---

## Habilitar Modo Offline

### Navegador (Chrome DevTools)

1. Abre la aplicación en Chrome
2. Presiona `F12` para abrir DevTools
3. Ve a la pestaña **Network**
4. Busca el dropdown "No throttling" en la barra superior
5. Selecciona **Offline**

### PWA (Service Worker)

El Service Worker se registra automáticamente. Verifica en:

1. **Chrome DevTools** > **Application** > **Service Workers**
2. Debe mostrar el Service Worker registrado con estado "Activated and running"

### App de Escritorio

La app de escritorio (Tauri/Electron) tiene soporte offline nativo:

```bash
# Desarrollo Tauri
npm run tauri:dev

# Build Tauri
npm run tauri:build

# Desarrollo Electron
npm run electron:dev

# Build Electron (instalador)
npm run electron:build
```

**Comparación de instaladores:**

| Característica | Tauri | Electron |
|----------------|-------|----------|
| Tamaño | ~15MB | ~100MB |
| Rendimiento | Excelente | Bueno |
| Offline | Nativo | Requiere Service Worker |

---

## Uso del Modo Offline

### Comportamiento Sin Conexión

| Acción | Comportamiento |
|--------|-----------------|
| **Carga inicial** | Carga desde Service Worker cache |
| **Navegación** | Funciona sin red |
| **GET requests** | Retorna datos del caché |
| **POST/PUT/DELETE** | Se guardan en cola de mutaciones |
| **Sincronización** | Automática cuando se recupera conexión |

### Cola de Mutaciones

Cuando realizas cambios offline:

1. Los cambios se almacenan en IndexedDB
2. Se muestra notificación al usuario
3. Cuando hay conexión, se sincronizan automáticamente
4. Si falla, se reintenta hasta 3 veces

### Indicadores Visuales

La app muestra el estado de conexión en la barra de navegación:

- 🟢 **Verde**: Conectado
- 🟡 **Amarillo**: Sincronizando
- 🔴 **Rojo**: Sin conexión + mutaciones pendientes

---

## API del Sistema Offline

### Hook: `useOfflineStatus`

```typescript
import { useOfflineStatus } from '@/context/OfflineContext';

function MyComponent() {
  const { isOnline, pendingCount, syncStatus, lastSyncAt } = useOfflineStatus();
  
  return (
    <div>
      <p>Estado: {isOnline ? 'En línea' : 'Sin conexión'}</p>
      <p>Mutaciones pendientes: {pendingCount}</p>
      <p>Estado de sync: {syncStatus}</p>
    </div>
  );
}
```

### Funciones de Bajo Nivel

```typescript
import { 
  getCachedData,
  cacheData,
  invalidateCache,
  queueOfflineMutation,
  forceSyncNow,
  getCacheStats,
} from '@/lib/offline';

// Obtener datos en caché
const data = await getCachedData<T>('students');

// Guardar en caché
await cacheData('students', studentsData, 30 * 60 * 1000);

// Invalidar caché
await invalidateCache('students');

// Guardar mutación offline
await queueOfflineMutation('create', '/api/students', 'POST', studentData);

// Forzar sincronización
await forceSyncNow();

// Obtener estadísticas
const stats = await getCacheStats();
```

### Configuración

Editar `src/lib/offline/constants.ts`:

```typescript
export const OFFLINE_CONFIG = {
  DB_NAME: 'UnefaOfflineDB',
  
  CACHE_TTL: {
    SHORT: 5 * 60 * 1000,    // 5 minutos
    MEDIUM: 30 * 60 * 1000,  // 30 minutos
    LONG: 60 * 60 * 1000,    // 1 hora
    DAY: 24 * 60 * 60 * 1000, // 24 horas
  },
  
  MAX_RETRIES: 3,
  SYNC_INTERVAL_MS: 30 * 1000,
  
  // Endpoints que no se cachan
  ENDPOINTS_NO_CACHE: ['/auth/', '/notifications'],
  
  // Endpoints con estrategia cache-first
  ENDPOINTS_CACHE_FIRST: ['/careers', '/periods'],
  
  // Endpoints con estrategia network-first
  ENDPOINTS_NETWORK_FIRST: ['/students', '/enrollments'],
};
```

---

## Resolución de Problemas

### Service Worker No se Registra

1. Verifica que estás sirviendo la app correctamente
2. Limpia la caché del navegador: `DevTools > Application > Clear storage`
3. Recarga la página

### Datos No se Sincronizan

1. Verifica tu conexión a internet
2. Revisa la consola del navegador para errores
3. Verifica el estado en: `DevTools > Application > IndexedDB > UnefaOfflineDB`

### Caché Corrupta

Limpiar la caché desde la consola del navegador:

```javascript
// En la consola del navegador
const { clearAllData } = await import('/src/lib/offline/index.ts');
await clearAllData();
```

O desde DevTools:
1. **Application** > **Storage** > **Clear site data**

---

## Ejecutar Tests

### Tests Unitarios

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests de modo offline
npm test -- --grep "offline"

# Modo watch
npm test -- --watch
```

### Cobertura de Tests

Los tests unitarios cubren:

| Módulo | Archivo | Cobertura |
|--------|---------|-----------|
| Database | `src/lib/offline/__tests__/db.test.ts` | CRUD de caché y mutaciones |
| SyncManager | `src/lib/offline/__tests__/syncManager.test.ts` | Inicio/parada, sincronización |
| OfflineAPI | `src/lib/offline/__tests__/offlineApiClient.test.ts` | getCachedData, cacheData, queueMutation |

---

## Referencias

- [Workbox](https://developer.chrome.com/docs/workbox) - Librería de Service Worker
- [Dexie.js](https://dexie.org) - IndexedDB wrapper
- [PWA Checklist](https://web.dev/pwa-checklist)
- [Vite PWA](https://vite-pwa.org) - Plugin PWA para Vite
