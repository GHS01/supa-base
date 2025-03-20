// Este script se ejecutará durante el despliegue en Vercel
// para configurar la base de datos en Supabase

const { setupDatabase } = require('./supabaseSetup');

// Ejecutar la configuración de Supabase
console.log('Iniciando configuración de Supabase en Vercel...');

setupDatabase()
  .then(() => {
    console.log('Configuración de Supabase completada con éxito.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error al configurar Supabase:', error);
    // No queremos que falle el despliegue, así que salimos con código 0
    process.exit(0);
  }); 