# Configuración de Desarrollo - UNEFA Dashboard Desktop

## Requisitos Previos

### 1. Visual Studio Build Tools (OBLIGATORIO)

Para compilar Tauri en Windows, necesitas las Visual Studio Build Tools:

1. Descarga el installer desde: https://visualstudio.microsoft.com/visual-cpp-build-tools/

2. Durante la instalación, selecciona:
   - **"Desktop development with C++"**
   - **"Windows 10/11 SDK"** (o la versión más reciente)

3. Una vez instalado, reinicia tu terminal/PC

### 2. Verificar Instalación

Después de instalar, verifica con:
```bash
rustc --version
cargo --version
```

Deberías ver las versiones de Rust y Cargo.

---

## Ejecución del Proyecto

### Desarrollo
```bash
# En la raíz del proyecto
npm run tauri:dev
```

### Build de Producción
```bash
npm run tauri:build
```

---

## Estructura Creada

```
src-tauri/
├── src/
│   ├── main.rs          # Punto de entrada
│   ├── lib.rs           # Configuración principal
│   └── commands.rs      # Comandos IPC
├── Cargo.toml           # Dependencias Rust
├── tauri.conf.json      # Configuración Tauri
├── capabilities/        # Permisos
└── icons/               # Iconos de la app
```

---

## Estado: Fase 1 Completada

- ✅ Proyecto Tauri 2.x configurado
- ✅ Dependencias Rust definidas
- ✅ Iconos generados
- ⚠️ Esperando instalación de Visual Studio Build Tools
