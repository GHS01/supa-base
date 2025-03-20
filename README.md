# GHS Finanzas

Aplicación completa de finanzas y contabilidad con asistente IA integrado utilizando el modelo Gemini Pro a través de OpenRouter.

## Características

- Dashboard financiero completo
- Gestión de transacciones
- Reportes financieros
- Asistente IA de finanzas (Neutro)
- Interfaz moderna y responsiva

## Requisitos

- Node.js 14.0 o superior
- Cuenta en OpenRouter para acceder a la API de Gemini Pro

## Configuración

1. Clona este repositorio
2. Instala las dependencias:
   ```
   npm install
   ```
3. Configura tu API key de OpenRouter:
   - Renombra el archivo `.env.example` a `.env` (o crea uno nuevo)
   - Reemplaza `your_openrouter_api_key_here` con tu API key real de OpenRouter

## Ejecución

Para iniciar el servidor en modo desarrollo:
```
npm run dev
```

Para iniciar el servidor en modo producción:
```
npm start
```

La aplicación estará disponible en `http://localhost:3000` (o el puerto que hayas configurado en el archivo .env)

## Despliegue en Render

Esta aplicación está configurada para ser desplegada en Render:

1. Crea una nueva aplicación web en Render
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno:
   - `OPENROUTER_API_KEY`: Tu API key de OpenRouter
4. Render detectará automáticamente la configuración de Node.js y desplegará la aplicación

## Despliegue en Vercel

Este proyecto está configurado para ser desplegado en Vercel. Sigue estos pasos para desplegarlo:

1. Asegúrate de tener una cuenta en [Vercel](https://vercel.com)
2. Instala la CLI de Vercel: `npm install -g vercel`
3. Ejecuta `vercel login` para iniciar sesión en tu cuenta
4. Ejecuta `vercel` en la raíz del proyecto para desplegarlo
5. Configura las siguientes variables de entorno en el dashboard de Vercel:
   - `OPENROUTER_API_KEY`: Tu clave de API de OpenRouter
   - `ADMIN_ACCESS_CODE`: Código de acceso para administradores
   - `NODE_ENV`: Establece como "production"

## Estructura del Proyecto

- `index.html`: Interfaz principal de la aplicación
- `style.css`: Estilos de la aplicación
- `financeAI.js`: Lógica del asistente IA y funciones financieras
- `server.js`: Servidor Express y configuración de la API
- `.env`: Archivo de configuración de variables de entorno
- `neomorphic-buttons.css`: Estilos para los botones neomórficos
- `test.html`: Página de prueba para verificar la carga de archivos estáticos
- `static-test.html`: Página de prueba simplificada para verificar la carga de archivos estáticos
- `public/`: Carpeta para archivos estáticos adicionales

## Desarrollo Local

1. Instala las dependencias: `npm install`
2. Crea un archivo `.env` con las variables de entorno necesarias
3. Ejecuta `npm run dev` para iniciar el servidor en modo desarrollo
4. Abre `http://localhost:3000` en tu navegador

## Solución de Problemas

Si encuentras problemas con los archivos estáticos en Vercel:

1. Verifica que los archivos estén siendo servidos con los tipos MIME correctos
2. Asegúrate de que las rutas a los archivos estáticos sean relativas
3. Verifica que las llamadas a la API usen rutas relativas (por ejemplo, `api/config` en lugar de `/api/config`)
4. Visita `/static-test` o `/test` para verificar que los archivos estáticos se carguen correctamente

## Licencia

Este proyecto está licenciado bajo la Licencia MIT.