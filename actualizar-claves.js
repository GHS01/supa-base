// Actualización de claves API de Supabase
// Ejecutar con: node actualizar-claves.js

const fs = require('fs');
const path = require('path');

// IMPORTANTE: Reemplazar estos valores con los correctos
const SUPABASE_URL = 'https://thagtirdkvmhxawmlxxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoYWd0aXJka3ZtaHhhd21seHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwOTk3ODMsImV4cCI6MjA1NzY3NTc4M30.q7KQMtSRWfjod_BKoCQQSDJswjoYe8RLeE4LQCfIDjg';

// Archivos a actualizar
const archivosParaActualizar = [
  'testSupabaseAuth.js',
  'testRLS.js',
  'testConexion.js'
];

// Archivo HTML (necesita tratamiento diferente)
const archivoHTML = 'testSimple.html';
const archivoLoginHTML = 'testLogin.html';

console.log('=== ACTUALIZANDO CLAVES API DE SUPABASE ===');

// Actualizar archivos JS
archivosParaActualizar.forEach(archivo => {
  try {
    const rutaArchivo = path.join(__dirname, archivo);
    
    if (!fs.existsSync(rutaArchivo)) {
      console.log(`❌ El archivo ${archivo} no existe. Omitiendo...`);
      return;
    }
    
    let contenido = fs.readFileSync(rutaArchivo, 'utf8');
    
    // Reemplazar URL
    contenido = contenido.replace(/const supabaseUrl = ['"]https:\/\/[^'"]+['"]/g, `const supabaseUrl = '${SUPABASE_URL}'`);
    
    // Reemplazar clave API
    contenido = contenido.replace(/const supabaseKey = ['"][^'"]+['"]/g, `const supabaseKey = '${SUPABASE_KEY}'`);
    
    fs.writeFileSync(rutaArchivo, contenido);
    console.log(`✅ Actualizado: ${archivo}`);
  } catch (error) {
    console.error(`❌ Error al actualizar ${archivo}:`, error.message);
  }
});

// Actualizar archivo HTML
[archivoHTML, archivoLoginHTML].forEach(htmlFile => {
  try {
    const rutaArchivo = path.join(__dirname, htmlFile);
    
    if (!fs.existsSync(rutaArchivo)) {
      console.log(`❌ El archivo ${htmlFile} no existe. Omitiendo...`);
      return;
    }
    
    let contenido = fs.readFileSync(rutaArchivo, 'utf8');
    
    // Reemplazar URL
    contenido = contenido.replace(/const supabaseUrl = ['"]https:\/\/[^'"]+['"]/g, `const supabaseUrl = '${SUPABASE_URL}'`);
    
    // Reemplazar clave API
    contenido = contenido.replace(/const supabaseKey = ['"][^'"]+['"]/g, `const supabaseKey = '${SUPABASE_KEY}'`);
    
    fs.writeFileSync(rutaArchivo, contenido);
    console.log(`✅ Actualizado: ${htmlFile}`);
  } catch (error) {
    console.error(`❌ Error al actualizar ${htmlFile}:`, error.message);
  }
});

console.log('\n=== INSTRUCCIONES ===');
console.log('1. La clave API ya está actualizada con el valor correcto');
console.log('2. Ejecuta: node actualizar-claves.js');
console.log('3. Luego ejecuta nuevamente: node testSupabaseAuth.js');

console.log('\n=== CLAVE API ACTUAL ===');
console.log(`URL: ${SUPABASE_URL}`);
console.log(`KEY: ${SUPABASE_KEY.substring(0, 15)}...${SUPABASE_KEY.substring(SUPABASE_KEY.length - 10)}`); 