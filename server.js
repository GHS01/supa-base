const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const supabase = require('./supabaseClient');
const models = require('./models');
const { setupDatabase } = require('./supabaseSetup');

// Configuración de variables de entorno
// En Vercel, las variables de entorno se configuran en el dashboard
// y están disponibles automáticamente
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API endpoint for admin configuration
app.get('/api/config', (req, res) => {
  try {
    // Only expose necessary configuration values
    res.json({
      adminAccessCode: process.env.ADMIN_ACCESS_CODE || 'default-code'
    });
  } catch (error) {
    console.error('Error en /api/config:', error);
    res.status(500).json({ 
      error: 'Error al obtener la configuración', 
      details: error.message 
    });
  }
});

// API endpoint para autenticación con Supabase
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role, team_code } = req.body;
    console.log('Intentando registrar usuario:', { name, email, role, team_code });

    // 1. Registrar en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          team_code
        }
      }
    });

    if (authError) {
      console.error('Error en registro Supabase Auth:', authError);
      return res.status(400).json({ 
        error: true, 
        message: 'Error al registrar usuario en Auth', 
        details: authError.message 
      });
    }

    console.log('Usuario creado en Auth con ID:', authData.user.id);

    // 2. Crear usuario en la tabla 'users' con la función create_user RPC
    try {
      console.log('Usando función create_user para insertar en tabla users...');
      
      const { data: userData, error: userError } = await supabase.rpc('create_user', {
        p_auth_user_id: authData.user.id,
        p_name: name,
        p_role: role,
        p_team_code: team_code
      });
      
      if (userError) {
        console.error('Error al crear usuario con create_user:', userError);
        throw userError;
      }
      
      console.log('Usuario creado con éxito usando create_user:', userData);
      
      return res.json({
        success: true,
        message: 'Usuario registrado correctamente',
        user: userData
      });
    } catch (createUserError) {
      console.error('Error al crear usuario con create_user:', createUserError);
      
      // Si falla create_user, intentamos con el modelo como último recurso
      try {
        console.log('Intentando con el modelo Users.create como fallback...');
        const userData = {
          auth_user_id: authData.user.id,
          name,
          role,
          team_code
        };
        
        const createdUser = await models.Users.create(userData);
        console.log('Usuario creado con modelo Users.create:', createdUser);
        
        return res.json({
          success: true,
          message: 'Usuario registrado correctamente (vía modelo)',
          user: createdUser
        });
      } catch (modelError) {
        console.error('Error al crear usuario con el modelo:', modelError);
        
        // Si todo falla, reportamos el error pero al menos el usuario fue creado en Auth
        return res.status(206).json({
          partial_success: true,
          message: 'Usuario creado en Auth pero no en la tabla users',
          user: {
            auth_user_id: authData.user.id,
            name,
            role,
            team_code,
            created_in_auth_only: true
          },
          error: createUserError.message
        });
      }
    }
  } catch (error) {
    console.error('Error general en registro:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Error en el proceso de registro', 
      details: error.message 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Iniciando sesión:', email);
    
    // Iniciar sesión con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      console.error('Error en Auth login:', authError);
      throw authError;
    }
    
    console.log('Sesión iniciada, ID:', authData.user.id);
    
    // Obtener datos de perfil
    const user = await models.Users.getById(authData.user.id);
    console.log('Datos de usuario obtenidos:', user ? 'Sí' : 'No');
    
    res.json({ 
      token: authData.session.access_token,
      user
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      error: 'Error al iniciar sesión', 
      details: error.message 
    });
  }
});

// API endpoint para equipos
app.post('/api/teams', async (req, res) => {
  try {
    // Verificar autenticación
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError) throw authError;
    
    // Obtener datos del equipo
    const { name, password } = req.body;
    
    // Generar código único para el equipo
    const code = `${name.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Crear equipo
    const teamData = {
      name,
      code,
      password,
      created_by: authData.user.id
    };
    
    const team = await models.Teams.create(teamData);
    
    // Actualizar el usuario con el código del equipo
    await models.Users.update(authData.user.id, { team_code: code });
    
    res.json({ team });
  } catch (error) {
    console.error('Error al crear equipo:', error);
    res.status(500).json({ 
      error: 'Error al crear equipo', 
      details: error.message 
    });
  }
});

// API endpoint para transacciones
app.get('/api/transactions', async (req, res) => {
  try {
    // Verificar autenticación
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError) throw authError;
    
    // Obtener transacciones del usuario
    const transactions = await models.Transactions.getByUserId(authData.user.id);
    
    res.json({ transactions });
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({ 
      error: 'Error al obtener transacciones', 
      details: error.message 
    });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    // Verificar autenticación
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError) throw authError;
    
    // Crear nueva transacción
    const transactionData = {
      ...req.body,
      user_id: authData.user.id
    };
    
    const transaction = await models.Transactions.create(transactionData);
    
    // Actualizar balance
    const currentBalance = await models.Balances.getByUserId(authData.user.id);
    const amount = Number(transaction.amount);
    const newBalance = Number(currentBalance.balance || 0) + (transaction.type === 'entrada' ? amount : -amount);
    
    await models.Balances.update(authData.user.id, newBalance);
    
    // Calcular KPIs actualizados para el mes
    const date = new Date(transaction.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    await models.KPIs.calculateAndUpdate(authData.user.id, monthYear);
    
    res.json({ transaction });
  } catch (error) {
    console.error('Error al crear transacción:', error);
    res.status(500).json({ 
      error: 'Error al crear transacción', 
      details: error.message 
    });
  }
});

// API endpoint for chat completions
app.post('/api/chat/completions', async (req, res) => {
  try {
    const { messages } = req.body;
    
    // OpenRouter API configuration
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    console.log('Using API key:', openRouterApiKey.substring(0, 10) + '...');
    
    // Determinar la URL de referencia
    const refererUrl = process.env.NODE_ENV === 'production' 
      ? 'https://asistente-gpt4.vercel.app' 
      : 'http://localhost:3000';
    
    // Make request to OpenRouter API using Gemini model
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.0-pro-exp-02-05:free', // Using Gemini Pro model
        messages: messages,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': refererUrl,
          'X-Title': 'GHS Finanzas'
        }
      }
    );
    
    // Extract and return the response content
    // Ensure we're handling the response format correctly
    let content = '';
    
    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      content = response.data.choices[0].message.content;
    } else if (response.data && response.data.content) {
      // Alternative response format
      content = response.data.content;
    } else {
      console.log('Unexpected API response format:', response.data);
      content = 'Lo siento, no pude procesar tu solicitud en este momento.';
    }
    
    res.json({ content });
    
  } catch (error) {
    console.error('Error calling OpenRouter API:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Error processing request', 
      details: error.response?.data || error.message 
    });
  }
});

// Verificar y configurar la base de datos al iniciar
async function initializeDatabase() {
  try {
    await setupDatabase();
    console.log('Base de datos configurada correctamente');
  } catch (error) {
    console.error('Error al configurar la base de datos:', error);
  }
}

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  // Servir archivos estáticos en desarrollo
  app.use(express.static(path.join(__dirname)));
  
  // Rutas para páginas en desarrollo
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
  
  app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
  });
  
  // Iniciar servidor en desarrollo
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
    
    // Inicializar la base de datos
    await initializeDatabase();
  });
}

// Exportar la app para Vercel
module.exports = app;