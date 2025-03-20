require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://thagitirdkvmhxawxlxv.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoYWdpdGlyZGt2bWh4YXd4bHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYwNDc2NjEsImV4cCI6MjAzMTYyMzY2MX0.TsvGNQ4dkJLKiKOBqPcbNV5TNPL-X07Vk9XwBIYMK6A';
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para crear un usuario de prueba
async function createTestUser() {
  try {
    console.log('=== TEST DE CREACIÓN DE USUARIO EN SUPABASE ===');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const testName = 'Usuario de Prueba';
    
    console.log(`Creando usuario de prueba: ${testEmail}`);
    
    // 1. Crear usuario en Auth
    console.log('Paso 1: Creando usuario en Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName,
          role: 'user',
          team_code: 'TEST-1234'
        }
      }
    });
    
    if (authError) {
      console.error('❌ Error al crear usuario en Auth:', authError);
      return;
    }
    
    console.log('✅ Usuario creado en Auth con ID:', authData.user.id);
    
    // 2. Crear usuario en tabla 'users' 
    console.log('Paso 2: Creando usuario en tabla users...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        name: testName,
        role: 'user',
        team_code: 'TEST-1234'
      })
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Error al crear usuario en tabla users:', userError);
      
      // Intentar método alternativo: RPC
      console.log('Paso 2b: Intentando con función RPC create_user...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_user', {
        p_auth_user_id: authData.user.id,
        p_name: testName,
        p_role: 'user',
        p_team_code: 'TEST-1234'
      });
      
      if (rpcError) {
        console.error('❌ Error al crear usuario con RPC:', rpcError);
      } else {
        console.log('✅ Usuario creado con RPC:', rpcData);
      }
    } else {
      console.log('✅ Usuario creado en tabla users:', userData);
    }
    
    // 3. Verificar que el usuario exista en ambas tablas
    console.log('Paso 3: Verificando usuario en auth.users...');
    const { data: authUsers, error: authCheckError } = await supabase.auth.admin.listUsers();
    
    if (authCheckError) {
      console.error('❌ Error al verificar usuarios en Auth:', authCheckError);
    } else {
      const foundUser = authUsers.users.find(u => u.email === testEmail);
      console.log('✅ Usuario encontrado en Auth:', !!foundUser);
    }
    
    console.log('Paso 4: Verificando usuario en public.users...');
    const { data: publicUsers, error: publicCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authData.user.id);
    
    if (publicCheckError) {
      console.error('❌ Error al verificar usuarios en public.users:', publicCheckError);
    } else {
      console.log('✅ Usuario encontrado en public.users:', publicUsers.length > 0);
      console.log('Datos del usuario:', publicUsers[0]);
    }
    
    console.log('=== TEST COMPLETO ===');
  } catch (error) {
    console.error('❌ Error grave durante el test:', error);
  }
}

// Ejecutar el test
createTestUser().then(() => {
  console.log('Test finalizado.');
  process.exit(0);
}).catch(err => {
  console.error('Error al ejecutar el test:', err);
  process.exit(1);
}); 