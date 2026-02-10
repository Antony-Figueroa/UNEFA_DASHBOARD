# Guía de Estándares UX

## 1. Coherencia Visual
La aplicación sigue un lenguaje de diseño consistente en todos los módulos. Esto garantiza que los usuarios puedan navegar e interactuar con el sistema de manera intuitiva.

## 2. Accesibilidad (WCAG 2.1)
- **Contraste**: Todos los elementos de texto deben mantener un ratio de contraste mínimo de 4.5:1 (AA) o 7:1 (AAA) respecto a su fondo.
- **Objetivos Interactivos**: Los botones y enlaces tienen un área de contacto mínima de 44x44px siempre que sea posible.
- **Indicadores de Foco**: Se proporcionan anillos de enfoque claros para la navegación mediante teclado.

## 3. Estados de Interacción
| Componente | Normal | Hover (Pasar el ratón) | Active (Presionado) | Disabled (Deshabilitado) |
| :--- | :--- | :--- | :--- | :--- |
| Botón | Marca Sólido | -10% Luminosidad | -20% Luminosidad | 50% Opacidad |
| Input | Borde 1px | Borde de Marca | Marca + Anillo | Fondo Gris Claro |
| Select | Borde 1px | Borde de Marca | Marca + Anillo | Fondo Gris Claro |

## 4. Psicología del Color en la UI
Los colores están definidos en `src/index.css` como variables CSS semánticas.

- **Azul (Marca)**: Confianza, profesionalismo y acciones primarias.
- **Verde (Éxito)**: Crecimiento, finalización positiva y validación.
- **Rojo (Error)**: Atención, fallo y acciones destructivas.
- **Naranja (Advertencia)**: Precaución, estados pendientes y alertas no críticas.

## 5. Lista de Verificación de Entrega
- [x] Creado `palette.json` jerárquico.
- [x] Definidas variables semánticas en `src/index.css`.
- [x] Unificados componentes base (Botón, Alerta, Input).
- [x] Documentación generada.
