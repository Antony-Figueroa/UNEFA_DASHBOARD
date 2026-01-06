# Documentación de Conexión API - Proyecto Unefa

## Arquitectura de Conexión (Simplificada)
Para garantizar la máxima estabilidad y simplicidad en los módulos de **Periodos** y **Carreras**, el frontend se conecta directamente a MockAPI.

1.  **Frontend (React/Vite)**: Se ejecuta en `http://localhost:5173`.
2.  **Servicio de Datos (MockAPI)**: `https://694ed7abb5bc648a93c169dc.mockapi.io`.

Esta arquitectura elimina intermediarios (proxies locales) que puedan introducir latencia o errores 500 adicionales, aprovechando que MockAPI soporta CORS de forma nativa.

## Códigos de Error Comunes

| Código | Mensaje | Causa Probable | Solución |
| :--- | :--- | :--- | :--- |
| **200/201** | OK / Created | Petición exitosa. | N/A |
| **400** | Bad Request | Formato de datos JSON inválido o campos obligatorios ausentes. | Validar el esquema de datos antes del envío. |
| **404** | Not Found | El endpoint solicitado no existe en MockAPI. | Verificar la URL en el servicio frontend. |
| **429** | Too Many Requests | Se ha excedido el límite de peticiones de MockAPI. | El sistema implementa reintentos automáticos con backoff exponencial. |
| **500** | Internal Server Error | Error interno en el servidor de MockAPI. | Esperar unos segundos; el sistema reintentará automáticamente. |
| **503** | Service Unavailable | MockAPI está temporalmente fuera de servicio. | El sistema reintentará la petición hasta 3 veces. |

## Estrategias de Robustez Implementadas

1.  **Conexión Directa**: El frontend utiliza `src/api/apiClient.ts` configurado con la URL base de MockAPI directamente.
2.  **Reintentos Automáticos (Backoff Exponencial)**: Las peticiones fallidas por errores 5xx o 429 se reintentan automáticamente aumentando el tiempo de espera entre intentos (2s, 4s, 8s).
3.  **Manejo de Timeouts**: Se ha configurado un timeout de 10 segundos para evitar esperas infinitas.
4.  **Validación de Formatos**: El `apiClient` verifica que las respuestas sean JSON y maneja errores de red de forma proactiva.
5.  **Cliente API Centralizado**: Localizado en `src/api/apiClient.ts`, estandariza todas las comunicaciones para Periodos y Carreras.

---
*Nota: Los módulos de Estudiantes y Tutores actualmente utilizan datos estáticos y no requieren conexión a API en esta fase.*
