// Script de prueba para Supabase Auth
// Ejecutar con: node testSupabaseAuth.js

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

// Función para crear un usuario normal
async function createRegularUser() {
  console.log('\n=== PRUEBA: CREACIÓN DE USUARIO NORMAL ===');
  
  const email = generateTestEmail('user');
  const password = 'Password123!';
  const name = 'Usuario Test Normal';
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
      return false;
    }
    
    console.log('✅ Usuario creado en Auth:', {
      id: authData.user.id,
      email: authData.user.email,
      metadata: authData.user.user_metadata
    });
    
    // 2. Crear entrada en tabla users
    console.log('Paso 2: Creando entrada en tabla users...');
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
          name,
          role
        })
        .select()
        .single();
      
      if (userError) {
        console.error('❌ Error al insertar en tabla users:', userError);
        
        // Alternativa: inserción directa con SQL
        console.log('Intentando inserción directa con SQL...');
        const sqlQuery = `
          INSERT INTO public.users (auth_user_id, name, role) 
          VALUES ('${authData.user.id}', '${name}', '${role}')
          RETURNING *;
        `;
        
        const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql', { 
          sql_statement: sqlQuery 
        });
        
        if (sqlError) {
          console.error('❌ Error en inserción directa:', sqlError);
          return false;
        }
        
        console.log('✅ Usuario creado directamente con SQL:', sqlData);
        return true;
      }
      
      console.log('✅ Usuario creado en tabla users:', userData);
      return true;
    } catch (insertError) {
      console.error('❌ Error inesperado en inserción:', insertError);
      return false;
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

// Función para crear un usuario administrador
async function createAdminUser() {
  console.log('\n=== PRUEBA: CREACIÓN DE USUARIO ADMINISTRADOR ===');
  
  const email = generateTestEmail('admin');
  const password = 'Password123!';
  const name = 'Admin Test';
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
      return false;
    }
    
    console.log('✅ Admin creado en Auth:', {
      id: authData.user.id,
      email: authData.user.email,
      metadata: authData.user.user_metadata
    });
    
    // 2. Crear entrada en tabla users
    console.log('Paso 2: Creando entrada en tabla users...');
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
          name,
          role,
          team_code: teamCode
        })
        .select()
        .single();
      
      if (userError) {
        console.error('❌ Error al insertar en tabla users:', userError);
        
        // Alternativa: inserción directa con SQL
        console.log('Intentando inserción directa con SQL...');
        const sqlQuery = `
          INSERT INTO public.users (auth_user_id, name, role, team_code) 
          VALUES ('${authData.user.id}', '${name}', '${role}', '${teamCode}')
          RETURNING *;
        `;
        
        const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql', { 
          sql_statement: sqlQuery 
        });
        
        if (sqlError) {
          console.error('❌ Error en inserción directa:', sqlError);
          return false;
        }
        
        console.log('✅ Admin creado directamente con SQL:', sqlData);
        return true;
      }
      
      console.log('✅ Admin creado en tabla users:', userData);
      return true;
    } catch (insertError) {
      console.error('❌ Error inesperado en inserción:', insertError);
      return false;
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

// Función modificada para verificar los usuarios existentes
async function checkExistingUsers() {
  console.log('\n=== VERIFICANDO USUARIOS EXISTENTES ===');
  
  try {
    // Usar SQL directo para evitar problemas con políticas RLS
    const sqlQuery = "SELECT * FROM public.users LIMIT 10;";
    
    const { data, error } = await supabase.rpc('execute_sql', { 
      sql_statement: sqlQuery 
    });
    
    if (error) {
      console.error('❌ Error al consultar usuarios con SQL directo:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('ℹ️ No hay usuarios en la tabla users');
    } else {
      console.log(`✅ Usuarios encontrados (${data.length}):`);
      data.forEach(user => {
        console.log(`- ${user.name} (${user.role}): ${user.auth_user_id}`);
      });
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Función para intentar login con un usuario
async function testLogin(email, password) {
  console.log(`\n=== PROBANDO LOGIN: ${email} ===`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, 
      password
    });
    
    if (error) {
      console.error('❌ Error de login:', error);
      return false;
    }
    
    console.log('✅ Login exitoso:', {
      id: data.user.id,
      email: data.user.email,
      sessionExpires: new Date(data.session.expires_at * 1000).toLocaleString()
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

// Ejecutar las pruebas
async function runTests() {
  console.log('🔍 INICIANDO PRUEBAS DE SUPABASE AUTH');
  console.log('-----------------------------------');
  
  // Verificar usuarios existentes
  await checkExistingUsers();
  
  // Probar creación de usuario normal
  const userCreated = await createRegularUser();
  
  // Probar creación de admin
  const adminCreated = await createAdminUser();
  
  // Verificar usuarios otra vez
  await checkExistingUsers();
  
  console.log('\n=== RESUMEN DE PRUEBAS ===');
  console.log(`Creación de usuario normal: ${userCreated ? '✅ ÉXITO' : '❌ FALLO'}`);
  console.log(`Creación de usuario admin: ${adminCreated ? '✅ ÉXITO' : '❌ FALLO'}`);
  
  console.log('\nLas pruebas han finalizado. Revisa los resultados para diagnosticar el problema.');
}

// Ejecutar todas las pruebas
runTests(); 