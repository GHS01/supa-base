/**
 * SOLUCIÓN PARA EL REGISTRO DE USUARIOS EN SUPABASE
 * 
 * Este archivo contiene la solución al problema de registro de usuarios en Supabase.
 * El problema principal era que la tabla 'users' tiene una política RLS defectuosa que causa
 * una recursión infinita cuando se intenta insertar directamente.
 * 
 * La solución es usar la función RPC 'create_user' que ya existe en el proyecto.
 */

// Reemplaza el código actual de registro con esta función actualizada
async function registerUserWithSupabase(username, email, password, role = 'user', teamData = null) {
  try {
    console.log('Registrando usuario con Supabase');
    
    // 1. Registrar en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: username,
          role,
          team_code: teamData?.code
        }
      }
    });

    if (authError) {
      console.error('Error en registro Auth:', authError);
      throw new Error(authError.message || 'Error al registrar usuario en Auth');
    }

    console.log('Usuario creado en Auth con ID:', authData.user.id);
    
    // 2. Crear registro en tabla users usando la función create_user
    const { data: userData, error: userError } = await supabase.rpc('create_user', {
      p_auth_user_id: authData.user.id,
      p_name: username,
      p_role: role,
      p_team_code: teamData?.code || null
    });
    
    if (userError) {
      console.error('Error al crear perfil de usuario:', userError);
      throw new Error(userError.message || 'Error al crear perfil de usuario');
    }
    
    console.log('Usuario registrado exitosamente:', userData);
    
    // Mostrar notificación y redireccionar
    showNotification('Éxito', 'Usuario registrado correctamente', 'success');
    
    // Redireccionar al login después del registro
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    
    return userData;
  } catch (error) {
    console.error('Error en registro:', error);
    showNotification('Error', error.message || 'Error al registrar usuario', 'error');
    throw error;
  }
}

/**
 * EXPLICACIÓN DE LA SOLUCIÓN
 * 
 * 1. El problema está en la política RLS de la tabla 'users', que causa una recursión infinita
 *    cuando intentamos insertar directamente usando supabase.from('users').insert()
 * 
 * 2. La función create_user ya existe en tu proyecto y funciona correctamente, evitando
 *    la recursión infinita para insertar usuarios.
 * 
 * 3. La función de create_user funciona tanto para usuarios normales como para administradores.
 * 
 * 4. Reemplaza los métodos actuales de inserción en tabla users con llamadas a la función RPC create_user.
 * 
 * BENEFICIOS DE ESTA SOLUCIÓN:
 * 
 * 1. Evita la recursión infinita en las políticas RLS
 * 2. Es más segura porque la función RPC puede tener su propia lógica de validación
 * 3. Centraliza la lógica de creación de usuarios en un solo lugar (la función en la base de datos)
 */ 