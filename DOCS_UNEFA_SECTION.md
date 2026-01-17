# Documentación Técnica: Sección Informativa Dinámica UNEFA

Esta documentación detalla la implementación de la nueva sección informativa dinámica para el sitio web de la UNEFA, diseñada para mostrar contenido actualizado sobre historia, noticias e información institucional.

## 1. Investigación de APIs

Se evaluaron las siguientes fuentes de datos:

| API | Contenido | Disponibilidad | Límites | Evaluación |
| :--- | :--- | :--- | :--- | :--- |
| **Wikipedia REST API** | Historia y resumen institucional | Alta | Gratis, sin auth | **Seleccionada** por estabilidad y relevancia histórica. |
| **Unsplash API** | Imágenes de alta calidad | Alta | Gratis, Atribución | **Integrada** para proporcionar imágenes temáticas sobre Venezuela, Soberanía y Universidad. |
| **Fallback Local** | Eventos y avisos internos | 100% | Ilimitado | **Seleccionada** como mecanismo de respaldo ante fallos de red. |

## 2. Integración de Imágenes (Unsplash)

Para enriquecer la experiencia visual y cumplir con los requisitos de soberanía y cultura, se ha implementado un servicio dedicado de imágenes:

### Servicio de Imágenes (`imageService.ts`)
- **Fuente**: [Unsplash](https://unsplash.com), plataforma líder en imágenes de libre uso.
- **Temáticas Configuradas**:
    - `venezuela`: Paisajes, cultura y símbolos nacionales.
    - `sovereignty`: Símbolos de independencia y autodeterminación.
    - `freedom`: Representaciones de libertad y horizontes.
    - `university`: Vida académica e investigación.
- **Mecanismo de Rotación**: Las búsquedas incluyen parámetros aleatorios (`sig`) para asegurar que el contenido visual varíe en cada actualización.
- **Atribución Automática**: Se muestra el nombre del fotógrafo y el enlace a su perfil en Unsplash al pasar el ratón sobre la imagen (hover), cumpliendo con los términos de uso.

## 3. Implementación Técnica

### Arquitectura de Archivos
- `src/services/imageService.ts`: Gestión de peticiones a Unsplash y lógica de temas.
- `src/services/unefaInfoService.ts`: Lógica de fetching, cache (localStorage) y enriquecimiento de datos con imágenes temáticas.
- `src/features/internship-home/sections/UnefaInfoSection.tsx`: Componente de interfaz de usuario con soporte para atribución de imágenes.
- `src/icons/actions.tsx`: Inclusión del icono `RefreshIcon`.

### Características Principales
- **Manejo de Cache**: Los datos se almacenan en `localStorage` por 1 hora para minimizar peticiones y permitir visualización offline.
- **Actualización Automática**: El componente utiliza un `setInterval` (configurable) para refrescar los datos.
- **Animaciones**: Implementadas con `framer-motion` para transiciones suaves entre estados de carga y nuevos contenidos.
- **Diseño Responsivo**: Adaptado para móviles (stack vertical) y escritorio (layout horizontal).
- **Accesibilidad**: Uso de etiquetas semánticas y estados de carga (skeletons).

## 3. Manual de Configuración

### Cambiar el Tiempo de Actualización
El tiempo de actualización por defecto es de **1 hora (3,600,000 ms)**. Para cambiarlo, localice el archivo `src/pages/InternshipHome/InternshipHome.tsx` y pase la prop `updateIntervalMs` al componente:

```tsx
// Ejemplo: Cambiar a 30 minutos (1,800,000 ms)
<UnefaInfoSection updateIntervalMs={1800000} />
```

### Modificar Datos de Respaldo (Fallback)
Para actualizar los avisos que se muestran cuando no hay conexión, edite la constante `FALLBACK_DATA` en `src/services/unefaInfoService.ts`.

## 4. Reporte de Pruebas

| Caso de Prueba | Resultado | Observaciones |
| :--- | :--- | :--- |
| Carga inicial desde Wikipedia | **Exitoso** | Se obtiene el extracto e imagen institucional correctamente. |
| Funcionamiento del botón "Actualizar" | **Exitoso** | Muestra animación de rotación y refresca el contenido. |
| Modo Offline / Error de API | **Exitoso** | Se cargan los datos de `FALLBACK_DATA` tras fallo de fetch. |
| Persistencia en Cache | **Exitoso** | Al recargar la página, el contenido aparece instantáneamente desde `localStorage`. |
| Responsividad | **Exitoso** | La imagen se posiciona debajo del texto en resoluciones < 768px. |
| Accesibilidad | **Exitoso** | Contraste adecuado y soporte para lectores de pantalla mediante HTML semántico. |
