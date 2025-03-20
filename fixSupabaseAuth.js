// Script para sobrescribir las funciones originales de autenticación
// Este script debe cargarse después de financeAI.js pero antes de supabaseAuth.js

// Guardamos referencia a las funciones originales por si necesitamos fallback
window.originalLoginUser = window.loginUser;
window.originalRegisterUser = window.registerUser;

// Crear el cliente de Supabase directamente en el frontend para operaciones de emergencia
// Esto es una solución temporal para asegurar que los datos se guarden en Supabase
let supabaseClient = null;

function createSupabaseClient() {
  if (!supabaseClient) {
    // URL y clave de Supabase - utilizamos las mismas que el servidor
    const supabaseUrl = 'https://thagtirdkvmhxawmlxxv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoYWd0aXJka3ZtaHhhd21seHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwOTk3ODMsImV4cCI6MjA1NzY3NTc4M30.q7KQMtSRWfjod_BKoCQQSDJswjoYe8RLeE4LQCfIDjg';
    
    // Crear cliente de Supabase
    supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Cliente de Supabase creado correctamente');
  }
  return supabaseClient;
}

// Función para crear directamente un usuario en Supabase Auth y en la tabla users
async function createUserInSupabase(email, password, name, role, teamCode) {
  try {
    console.log('Creando usuario directamente en Supabase...');
    const client = createSupabaseClient();
    
    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          team_code: teamCode
        }
      }
    });
    
    if (authError) {
      console.error('Error al crear usuario en Auth:', authError);
      throw authError;
    }
    
    console.log('Usuario creado en Auth con ID:', authData.user.id);
    
    // 2. Crear usuario en la tabla users usando la función create_user (método más confiable)
    try {
      console.log('Usando función create_user para insertar en tabla users...');
      const { data, error } = await client.rpc('create_user', {
        p_auth_user_id: authData.user.id,
        p_name: name,
        p_role: role,
        p_team_code: teamCode
      });
      
      if (error) {
        console.error('Error al llamar a create_user:', error);
        throw error;
      }
      
      console.log('✅ Usuario creado con éxito tanto en Auth como en tabla users');
      return data;
    } catch (error) {
      console.error('Error al crear usuario en tabla users:', error);
      
      // Si falla, devolvemos al menos el usuario de Auth
      console.log('⚠️ Solo se creó el usuario en Auth, pero no en tabla users');
      return authData.user;
    }
  } catch (error) {
    console.error('Error grave al crear usuario en Supabase:', error);
    throw error;
  }
}

// Sobrescribimos la función de registro
window.registerUser = async function(username, password) {
  try {
    console.log('Interceptando función registerUser para usar Supabase');
    
    // Validaciones originales
    if (!isValidUsername(username)) {
      throw new Error('El nombre de usuario debe tener el formato "Nombre" o "Nombre Apellido".');
    }
    
    const email = document.getElementById('registerEmail').value;
    if (!email || !email.endsWith('@gmail.com')) {
      throw new Error('Por favor ingrese un correo electrónico de Gmail válido');
    }
    
    const profileType = document.getElementById('profileType').value || 'user';
    
    // Preparamos los datos del equipo
    let teamCode = null;
    
    // Si es administrador, crear equipo
    if (profileType === 'admin') {
      const accessCode = document.getElementById('adminAccessCode').value;
      const expectedCode = 'default-code'; // Este valor vendría del servidor
      
      if (accessCode !== expectedCode) {
        showNotification('Error', 'Código de acceso incorrecto', 'error');
        return;
      }
      
      const teamName = document.getElementById('createTeamName').value;
      const teamPassword = document.getElementById('createTeamPassword').value;
      
      teamCode = generateTeamCode(teamName);
      console.log('Equipo generado:', { teamName, teamCode });
    } else if (profileType === 'user') {
      // Si es usuario normal, unirse a equipo
      teamCode = document.getElementById('joinTeamCode').value;
      const teamPassword = document.getElementById('joinTeamPassword').value;
      
      if (!teamCode) {
        showNotification('Error', 'Debe ingresar un código de equipo', 'error');
        return;
      }
    }
    
    console.log('Datos de registro:', { username, email, profileType, teamCode });
    
    // MÉTODO 1: Crear directamente en Supabase (solución más confiable)
    const user = await createUserInSupabase(email, password, username, profileType, teamCode);
    
    // MÉTODO 2: Llamada al servidor usando fetch (backup)
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: username,
          email,
          password,
          role: profileType,
          team_code: teamCode
        })
      });
      
      // Solo para propósitos de registro, no esperamos el resultado
      console.log('Respuesta del servidor:', response.status);
    } catch (fetchError) {
      console.warn('Error en llamada al servidor (no crítico):', fetchError);
    }
    
    // Mostrar éxito 
    showNotification('Éxito', 'Usuario registrado correctamente', 'success');
    
    // Redireccionar al login
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    
    return user;
  } catch (error) {
    console.error('Error en registro con Supabase:', error);
    showNotification('Error', error.message || 'Error al registrar usuario', 'error');
    throw error;
  }
};

// Sobrescribimos la función de login
window.loginUser = async function(email, password) {
  try {
    console.log('Interceptando función loginUser para usar Supabase');
    
    // Intentar primero el cliente directo para autenticación
    let user = null;
    try {
      const client = createSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });
      
      if (!error) {
        user = data.user;
        console.log('Login exitoso usando cliente directo:', user);
      }
    } catch (directError) {
      console.warn('Error en login directo (intentando API):', directError);
    }
    
    // Si no funcionó, intentar con la API
    if (!user) {
      // Llamada al servidor usando fetch
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Error al iniciar sesión');
      }
      
      const data = await response.json();
      user = data.user;
    }
    
    console.log('Sesión iniciada exitosamente en Supabase');
    
    // Guardar información de sesión
    sessionStorage.setItem('userId', user.id || user.auth_user_id);
    sessionStorage.setItem('userName', user.name);
    sessionStorage.setItem('userRole', user.role);
    sessionStorage.setItem('token', user.token);
    
    if (user.team_code) {
      sessionStorage.setItem('teamCode', user.team_code);
    }
    
    showNotification('Éxito', '¡Sesión iniciada correctamente!', 'success');
    
    // Mostrar la interfaz principal
    document.getElementById('loginSection').style.display = 'none';
    document.querySelector('.navbar').style.display = 'flex';
    document.getElementById('content').style.display = 'block';
    document.querySelector('.whatsapp-bubble').style.display = 'flex';
    
    // Actualizar la interfaz con los datos del usuario
    document.getElementById('profileUsername').textContent = user.name;
    
    console.log('Login con Supabase completado');
    return user;
  } catch (error) {
    console.error('Error en login con Supabase:', error);
    showNotification('Error', error.message || 'Error al iniciar sesión', 'error');
    
    // Intentar fallback al método original en caso de error
    console.log('Intentando fallback al método original...');
    try {
      return await window.originalLoginUser(email, password);
    } catch (fallbackError) {
      console.error('Error en fallback login:', fallbackError);
      throw error; // Lanzamos el error original de Supabase
    }
  }
};

// Función auxiliar para generar códigos de equipo (copiada de supabaseAuth.js)
function generateTeamCode(teamName) {
  // Crear un prefijo a partir del nombre del equipo
  const prefix = teamName.substring(0, 3).toUpperCase();
  // Generar un número aleatorio de 4 dígitos
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
}

// Cargar el script de Supabase Client
function loadSupabaseClientScript() {
  return new Promise((resolve, reject) => {
    // Verificar si ya existe
    if (window.supabase) {
      console.log('Cliente de Supabase ya cargado');
      resolve();
      return;
    }
    
    // Crear elemento script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js';
    script.async = true;
    
    // Manejar carga exitosa
    script.onload = () => {
      console.log('Script de Supabase cargado correctamente');
      resolve();
    };
    
    // Manejar error
    script.onerror = (error) => {
      console.error('Error al cargar el script de Supabase:', error);
      reject(error);
    };
    
    // Añadir al DOM
    document.head.appendChild(script);
  });
}

// Inicializar script
(async () => {
  try {
    // Cargar Supabase Client
    await loadSupabaseClientScript();
    console.log('🔄 Funciones de autenticación reemplazadas para usar Supabase');
  } catch (error) {
    console.error('Error al inicializar:', error);
  }
})(); 