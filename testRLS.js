// Script para probar las políticas RLS de Supabase
// Ejecutar con: node testRLS.js

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://thagtirdkvmhxawmlxxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoYWd0aXJka3ZtaHhhd21seHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwOTk3ODMsImV4cCI6MjA1NzY3NTc4M30.q7KQMtSRWfjod_BKoCQQSDJswjoYe8RLeE4LQCfIDjg';
const supabase = createClient(supabaseUrl, supabaseKey);

// Funciones de prueba

// 1. Verificar tablas existentes
async function checkTables() {
  console.log('\n=== VERIFICANDO TABLAS EXISTENTES ===');
  
  try {
    const { data, error } = await supabase.rpc('check_tables', {});
    
    if (error) {
      // Si falla, es posible que la función RPC no exista
      console.log('La función RPC check_tables no existe, usando método alternativo');
      
      // Intentar otra forma de obtener las tablas
      const tableQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
      const { data: tables, error: tableError } = await supabase.rpc('execute_sql', { sql_statement: tableQuery });
      
      if (tableError) {
        console.error('❌ Error al consultar tablas:', tableError);
        return;
      }
      
      console.log('Tablas encontradas:');
      console.log(tables);
      return;
    }
    
    console.log('Tablas encontradas:');
    console.log(data);
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// 2. Verificar política RLS para users
async function checkUsersPolicies() {
  console.log('\n=== VERIFICANDO POLÍTICAS RLS PARA USERS ===');
  
  try {
    const policyQuery = `
      SELECT 
        schemaname, 
        tablename, 
        policyname, 
        permissive, 
        roles, 
        cmd, 
        qual, 
        with_check
      FROM 
        pg_policies 
      WHERE 
        tablename = 'users'
    `;
    
    const { data, error } = await supabase.rpc('execute_sql', { sql_statement: policyQuery });
    
    if (error) {
      console.error('❌ Error al consultar políticas:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('ℹ️ No hay políticas RLS para la tabla users');
    } else {
      console.log(`✅ Políticas encontradas (${data.length}):`);
      console.log(data);
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// 3. Realizar una inserción de usuario con ignorar políticas
async function insertWithBypassRLS() {
  console.log('\n=== INSERTANDO USUARIO IGNORANDO RLS ===');
  
  const testId = 'test_' + Date.now();
  const testName = 'Test Bypass RLS';
  const testRole = 'admin'; // Probar con el rol que está causando problemas
  
  try {
    // Intentar insertar utilizando RPC especial que ignora RLS
    const sqlQuery = `
      INSERT INTO public.users (auth_user_id, name, role) 
      VALUES ('${testId}', '${testName}', '${testRole}')
      RETURNING *;
    `;
    
    const { data, error } = await supabase.rpc('execute_sql_bypass_rls', { sql_statement: sqlQuery });
    
    if (error) {
      // Si la función no existe, intentamos el método estándar
      console.log('La función bypass_rls no existe, intentando con método estándar');
      
      const { data: stdData, error: stdError } = await supabase
        .from('users')
        .insert({
          auth_user_id: testId,
          name: testName,
          role: testRole
        })
        .select()
        .single();
      
      if (stdError) {
        console.error('❌ Error de inserción estándar:', stdError);
        return false;
      }
      
      console.log('✅ Usuario insertado con método estándar:', stdData);
      return true;
    }
    
    console.log('✅ Usuario insertado ignorando RLS:', data);
    return true;
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

// 4. Verificar tipos de datos en tabla users
async function checkUserTableSchema() {
  console.log('\n=== VERIFICANDO ESQUEMA DE TABLA USERS ===');
  
  try {
    const schemaQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM 
        information_schema.columns 
      WHERE 
        table_schema = 'public' 
        AND table_name = 'users'
      ORDER BY 
        ordinal_position;
    `;
    
    const { data, error } = await supabase.rpc('execute_sql', { sql_statement: schemaQuery });
    
    if (error) {
      console.error('❌ Error al consultar esquema:', error);
      return;
    }
    
    console.log('Esquema de la tabla users:');
    console.log(data);
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// 5. Probar inserción directa con SQL para detectar cualquier trigger o restricción
async function testDirectInsert() {
  console.log('\n=== PROBANDO INSERCIÓN DIRECTA CON SQL ===');
  
  const testId = 'direct_' + Date.now();
  const testName = 'Test Direct SQL';
  
  // Probar inserción como usuario normal
  try {
    const sqlQuery = `
      INSERT INTO public.users (auth_user_id, name, role) 
      VALUES ('${testId}_user', '${testName} (User)', 'user')
      RETURNING *;
    `;
    
    const { data: userData, error: userError } = await supabase.rpc('execute_sql', { sql_statement: sqlQuery });
    
    if (userError) {
      console.error('❌ Error en inserción de usuario normal:', userError);
    } else {
      console.log('✅ Usuario normal insertado directamente:', userData);
    }
  } catch (error) {
    console.error('❌ Error inesperado (usuario):', error);
  }
  
  // Probar inserción como administrador
  try {
    const sqlQuery = `
      INSERT INTO public.users (auth_user_id, name, role) 
      VALUES ('${testId}_admin', '${testName} (Admin)', 'admin')
      RETURNING *;
    `;
    
    const { data: adminData, error: adminError } = await supabase.rpc('execute_sql', { sql_statement: sqlQuery });
    
    if (adminError) {
      console.error('❌ Error en inserción de administrador:', adminError);
    } else {
      console.log('✅ Administrador insertado directamente:', adminData);
    }
  } catch (error) {
    console.error('❌ Error inesperado (admin):', error);
  }
}

// 6. Verificar restricciones en la tabla
async function checkConstraints() {
  console.log('\n=== VERIFICANDO RESTRICCIONES DE LA TABLA USERS ===');
  
  try {
    const constraintQuery = `
      SELECT
        c.conname AS constraint_name,
        c.contype AS constraint_type,
        pg_get_constraintdef(c.oid) AS constraint_definition
      FROM
        pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE
        n.nspname = 'public'
        AND t.relname = 'users'
    `;
    
    const { data, error } = await supabase.rpc('execute_sql', { sql_statement: constraintQuery });
    
    if (error) {
      console.error('❌ Error al consultar restricciones:', error);
      return;
    }
    
    console.log('Restricciones encontradas:');
    console.log(data);
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar pruebas
async function runTests() {
  console.log('🔍 INICIANDO PRUEBAS DE RLS EN SUPABASE');
  console.log('-------------------------------------');
  
  // Comprobar tablas existentes
  await checkTables();
  
  // Verificar políticas RLS
  await checkUsersPolicies();
  
  // Verificar esquema de tabla
  await checkUserTableSchema();
  
  // Verificar restricciones
  await checkConstraints();
  
  // Probar inserción directa
  await testDirectInsert();
  
  // Intentar bypasear RLS
  const bypassSuccess = await insertWithBypassRLS();
  
  console.log('\n=== RESUMEN DE PRUEBAS RLS ===');
  console.log(`Inserción ignorando RLS: ${bypassSuccess ? '✅ ÉXITO' : '❌ FALLO'}`);
}

// Ejecutar las pruebas
runTests(); 