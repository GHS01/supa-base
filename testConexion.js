// Script para probar la conexión con Supabase
// Ejecutar con: node testConexion.js

const https = require('https');
const dns = require('dns');

// URL del proyecto Supabase (para probar)
const supabaseHost = 'thagtirdkvmhxawmlxxv.supabase.co';
const alternativeDomain = 'supabase.co'; // Para verificar si podemos resolver otros dominios de Supabase

console.log('=== PRUEBA DE CONEXIÓN A SUPABASE ===');

// 1. Prueba de resolución DNS
console.log('\n1. Probando resolución DNS...');
dns.lookup(supabaseHost, (err, address, family) => {
  if (err) {
    console.error(`❌ Error al resolver ${supabaseHost}: ${err.message}`);
    console.log('Probando resolver el dominio principal de Supabase...');
    
    dns.lookup(alternativeDomain, (err2, address2, family2) => {
      if (err2) {
        console.error(`❌ Error al resolver ${alternativeDomain}: ${err2.message}`);
        console.log('❌ Parece que hay un problema con tu resolución DNS o conexión a Internet');
      } else {
        console.log(`✅ El dominio principal ${alternativeDomain} resuelve a: ${address2}`);
        console.log('⚠️ El problema podría ser específicamente con el subdominio de tu proyecto');
      }
    });
  } else {
    console.log(`✅ El dominio ${supabaseHost} resuelve a: ${address}`);
  }
});

// 2. Prueba de conexión HTTPS
console.log('\n2. Probando conexión HTTPS...');
const req = https.request({
  hostname: supabaseHost,
  port: 443,
  path: '/',
  method: 'GET'
}, (res) => {
  console.log(`✅ Conexión establecida. Código de estado: ${res.statusCode}`);
  
  // No necesitamos leer los datos
  res.resume();
  res.on('end', () => {
    console.log('Respuesta recibida correctamente');
  });
});

req.on('error', (e) => {
  console.error(`❌ Error de conexión HTTPS: ${e.message}`);
  
  // Probar con el dominio principal para ver si es un problema general
  console.log('Probando conexión al dominio principal de Supabase...');
  const reqAlt = https.request({
    hostname: alternativeDomain,
    port: 443,
    path: '/',
    method: 'GET'
  }, (res) => {
    console.log(`✅ Conexión a ${alternativeDomain} establecida. Código: ${res.statusCode}`);
    console.log('⚠️ El problema es específicamente con tu proyecto Supabase');
  });
  
  reqAlt.on('error', (e2) => {
    console.error(`❌ Error de conexión a ${alternativeDomain}: ${e2.message}`);
    console.log('❌ Parece que hay un problema general con tu conexión a Internet');
  });
  
  reqAlt.end();
});

req.end();

// 3. Verificar URL del proyecto
console.log('\n3. Verificando información del proyecto...');
console.log('URL del proyecto: https://' + supabaseHost);
console.log('URL del dashboard: https://app.supabase.com/project/thagtirdkvmhxawmlxxv');
console.log('\nSi no puedes conectarte, verifica:');
console.log('1. Que el proyecto no haya sido eliminado o renombrado');
console.log('2. Que estés utilizando la URL correcta');
console.log('3. Que no haya problemas de red o firewall');

// 4. Sugerencias si todo falla
console.log('\n=== SUGERENCIAS SI TODO FALLA ===');
console.log('1. Verifica tu conexión a Internet');
console.log('2. Prueba abrir https://supabase.com en tu navegador');
console.log('3. Inicia sesión en https://app.supabase.com y verifica la URL correcta de tu proyecto');
console.log('4. Si el proyecto existe pero no puedes conectarte, contacta al soporte de Supabase');
console.log('5. Como alternativa, puedes crear un nuevo proyecto en Supabase y utilizarlo para las pruebas');

// Esperar un poco para que las pruebas asíncronas tengan tiempo de ejecutarse
setTimeout(() => {
  console.log('\n=== FIN DE LA PRUEBA ===');
}, 5000); 