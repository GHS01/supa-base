# Instrucciones para pruebas de Supabase Auth

Este conjunto de archivos te permitirá diagnosticar exactamente qué está fallando en la autenticación y creación de usuarios en Supabase.

## Requisitos previos

1. Necesitas tener Node.js instalado
2. Instalar el paquete de Supabase JS ejecutando:
   ```
   npm install @supabase/supabase-js
   ```

## Archivos incluidos

1. `testLogin.html` - Página HTML para probar el registro y login directamente desde el navegador
2. `testSupabaseAuth.js` - Script de Node.js para probar creación de usuarios normales y administradores
3. `testRLS.js` - Script para probar políticas de seguridad y restricciones en la tabla de usuarios

## Instrucciones de uso

### Prueba desde el navegador

1. Abre el archivo `testLogin.html` en tu navegador
2. Intenta registrar un usuario nuevo con los datos:
   - Email: un correo que no hayas usado antes
   - Contraseña: cualquier contraseña segura
   - Nombre: cualquier nombre
   - Rol: prueba primero con "Usuario Normal" y luego con "Administrador"

3. Verifica los resultados que aparecen en la sección "Resultado"
4. Si el registro es exitoso, intenta iniciar sesión con las mismas credenciales

### Prueba desde Node.js

1. Abre una terminal en la ubicación donde están los archivos
2. Ejecuta el script de prueba de autenticación:
   ```
   node testSupabaseAuth.js
   ```
3. Observa la salida en consola para ver si hay errores al crear usuarios normales o administradores
4. Ejecuta el script de prueba de políticas RLS:
   ```
   node testRLS.js
   ```
5. Analiza los resultados para ver si hay restricciones que estén bloqueando la creación de usuarios

## Interpretación de resultados

### Escenarios posibles:

1. **Si ambos tipos de usuarios (normal y admin) se crean correctamente en las pruebas**:
   - El problema está en la lógica específica de registro de tu aplicación, no en Supabase
   - Revisa la lógica de validación de formularios y campos específicos que podrían estar causando el problema

2. **Si solo fallan los usuarios administradores**:
   - El problema podría estar en las políticas RLS que restringen la creación de usuarios con rol 'admin'
   - Revisa las políticas RLS en la salida del test `testRLS.js`
   - Podría ser necesario modificar estas políticas en la consola de Supabase

3. **Si fallan todos los intentos de crear usuarios**:
   - Podría haber un problema con la conexión a Supabase o los permisos
   - Verifica que las claves API sean correctas
   - Revisa que el servicio de Supabase esté funcionando correctamente

## Solución más probable

Basado en el análisis previo, lo más probable es que:

1. El problema esté relacionado con la forma en que se están manejando los diferentes roles de usuario
2. Las políticas RLS podrían estar impidiendo que usuarios con ciertos roles se registren
3. Puede que exista alguna restricción o trigger en la base de datos que esté causando problemas

Una vez identificado el problema exacto con estas pruebas, podemos implementar la solución correcta para tu aplicación.

## Pasos adicionales

Si después de ejecutar estas pruebas sigues teniendo problemas:

1. Revisa la estructura de la tabla `users` en la consola de Supabase
2. Verifica que no haya triggers o funciones que estén interfiriendo con la inserción
3. Considera desactivar temporalmente las políticas RLS para probar si ese es el problema
4. Contacta al soporte de Supabase si es un problema de configuración del servicio 