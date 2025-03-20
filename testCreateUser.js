// Script de prueba para la función create_user de Supabase
// Ejecutar con: node testCreateUser.js

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://thagtirdkvmhxawmlxxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoYWd0aXJka3ZtaHhhd21seHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwOTk3ODMsImV4cCI6MjA1NzY3NTc4M30.q7KQMtSRWfjod_BKoCQQSDJswjoYe8RLeE4LQCfIDjg';
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para generar un correo electrónico de prueba único
function generateTestEmail(prefix = 'test', suffix = 'gmail.com') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}.${timestamp}.${random}@${suffix}`;
}

// Función para probar la creación de usuario normal con function RPC
async function testCreateUser() {
  console.log('=== TEST: CREACIÓN DE USUARIO CON FUNCIÓN RPC ===');
  
  // Crear usuario en Auth
  const email = generateTestEmail('user');
  const password = 'Password123!';
  const name = 'Usuario RPC Test';
  const role = 'user';
  
  console.log(`Intentando crear usuario: ${email}`);
  
  try {
    // 1. Crear usuario en Auth
    console.log('Paso 1: Registrando en Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    });
    
    if (authError) {
      console.error('❌ Error en Auth:', authError);
      return;
    }
    
    console.log('✅ Usuario creado en Auth:', {
      id: authData.user.id,
      email: authData.user.email,
      metadata: authData.user.user_metadata
    });
    
    // 2. Crear entrada en tabla users usando la función create_user
    console.log('Paso 2: Llamando a función create_user...');
    const { data: userData, error: userError } = await supabase.rpc('create_user', {
      p_auth_user_id: authData.user.id,
      p_name: name,
      p_role: role,
      p_team_code: null
    });
    
    if (userError) {
      console.error('❌ Error al llamar a create_user:', userError);
      return;
    }
    
    console.log('✅ Usuario creado con create_user:', userData);
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Función para probar la creación de usuario administrador con function RPC
async function testCreateAdmin() {
  console.log('\n=== TEST: CREACIÓN DE ADMIN CON FUNCIÓN RPC ===');
  
  // Crear usuario en Auth
  const email = generateTestEmail('admin');
  const password = 'Password123!';
  const name = 'Admin RPC Test';
  const role = 'admin';
  const teamCode = 'TEAM-' + Math.floor(Math.random() * 10000);
  
  console.log(`Intentando crear admin: ${email}`);
  
  try {
    // 1. Crear usuario en Auth
    console.log('Paso 1: Registrando en Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
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
      console.error('❌ Error en Auth:', authError);
      return;
    }
    
    console.log('✅ Admin creado en Auth:', {
      id: authData.user.id,
      email: authData.user.email,
      metadata: authData.user.user_metadata
    });
    
    // 2. Crear entrada en tabla users usando la función create_user
    console.log('Paso 2: Llamando a función create_user...');
    const { data: userData, error: userError } = await supabase.rpc('create_user', {
      p_auth_user_id: authData.user.id,
      p_name: name,
      p_role: role,
      p_team_code: teamCode
    });
    
    if (userError) {
      console.error('❌ Error al llamar a create_user:', userError);
      return;
    }
    
    console.log('✅ Admin creado con create_user:', userData);
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Función principal
async function runTests() {
  console.log('🔍 INICIANDO PRUEBAS DE CREATE_USER RPC');
  console.log('-----------------------------------');
  
  // Probar creación de usuario normal
  await testCreateUser();
  
  // Probar creación de usuario administrador
  await testCreateAdmin();
  
  console.log('\n=== PRUEBAS COMPLETADAS ===');
}

// Ejecutar las pruebas
runTests(); 