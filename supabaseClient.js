const { createClient } = require('@supabase/supabase-js');

// Inicialización del cliente Supabase
// Usar las variables con el prefijo NEXT_PUBLIC que son las configuradas en Vercel
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Las variables de Supabase no están configuradas correctamente');
  console.error('Buscando en: SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('Conectando a Supabase URL:', supabaseUrl.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase; 