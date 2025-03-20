# Solución al problema de recursión infinita en políticas RLS

## Diagnóstico del problema

Hemos identificado dos problemas principales en la aplicación:

1. **Error al registrar usuarios**: "duplicate key value violates unique constraint" - Resuelto usando la función RPC `create_user`.
2. **Error al hacer login**: "infinite recursion detected in policy for relation users" - Se produce al intentar leer directamente de la tabla `users`.

## Solución para el login y consultas a usuarios

Para resolver el problema de recursión infinita al leer datos de usuarios, necesitas crear dos funciones RPC:

### 1. Función para obtener perfil de usuario

```sql
-- Función para obtener el perfil de usuario (solución al problema de recursión infinita)
CREATE OR REPLACE FUNCTION public.get_user_profile(p_auth_user_id UUID)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY 
  SELECT * FROM public.users 
  WHERE auth_user_id = p_auth_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION public.get_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile TO anon;
```

### 2. Función para obtener miembros de un equipo

```sql
-- Función para obtener los miembros de un equipo
CREATE OR REPLACE FUNCTION public.get_team_members(p_team_code TEXT)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY 
  SELECT * FROM public.users 
  WHERE team_code = p_team_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION public.get_team_members TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members TO anon;
```

## Modificación del código de la aplicación

### Para obtener perfil de usuario

```javascript
// En lugar de:
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('auth_user_id', userId)
  .single();

// Usa esto:
const { data, error } = await supabase
  .rpc('get_user_profile', {
    p_auth_user_id: userId
  });

// Como la función devuelve un array, toma el primer elemento
const user = data && data.length > 0 ? data[0] : null;
```

### Para obtener miembros de un equipo

```javascript
// En lugar de:
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('team_code', teamCode);

// Usa esto:
const { data, error } = await supabase
  .rpc('get_team_members', {
    p_team_code: teamCode
  });
```

### Para crear un usuario

```javascript
// En lugar de:
const { data, error } = await supabase
  .from('users')
  .insert(userData)
  .select()
  .single();

// Usa esto:
const { data, error } = await supabase
  .rpc('create_user', {
    p_auth_user_id: authUserId,
    p_name: name,
    p_role: role,
    p_team_code: teamCode
  });
```

## Por qué funciona esta solución

Las funciones creadas con `SECURITY DEFINER` se ejecutan con los privilegios del usuario que creó la función (generalmente el propietario de la base de datos) en lugar de los privilegios del usuario que la llama.

Esto evita el bucle infinito porque la función puede omitir las comprobaciones de políticas RLS que causan la recursión.

## Pasos de implementación

1. **Ejecutar las consultas SQL** en el Editor SQL de Supabase para crear las funciones RPC.
2. **Modificar los archivos de la aplicación** para usar estas funciones en lugar de consultas directas:
   - `models/index.js`: Actualizado `getById` y `getTeamMembers`
   - `server.js`: Actualizado el endpoint `/api/auth/signup` para usar `create_user`
   - `fixSupabaseAuth.js`: Actualizado para usar `create_user` para registro
3. **Probar** el registro y login para verificar que no hay errores.

## Mejores prácticas

- Usar funciones RPC con `SECURITY DEFINER` es una buena práctica para operaciones sensibles en Supabase.
- Limita el alcance de lo que estas funciones pueden hacer para mantener la seguridad.
- Documenta todas las funciones RPC que crees para facilitar el mantenimiento. 