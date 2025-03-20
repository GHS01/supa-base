const supabase = require('../supabaseClient');

// Modelo de Usuarios
const Users = {
  // Obtener usuario por ID
  async getById(id) {
    try {
      // Usar la función RPC get_user_profile en lugar de consulta directa
      const { data, error } = await supabase
        .rpc('get_user_profile', {
          p_auth_user_id: id
        });
        
      if (error) throw error;
      
      // La función RPC devuelve un array, tomamos el primer elemento
      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error('Error en Users.getById:', err);
      throw err;
    }
  },
  
  // Crear un nuevo usuario
  async create(userData) {
    try {
      console.log('Modelo Users - Creando usuario:', userData);
      
      // Validar datos mínimos requeridos
      if (!userData.auth_user_id) {
        throw new Error('El ID de autenticación es obligatorio');
      }
      
      // Intento principal usando la tabla users
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
        
      if (error) {
        console.error('Error en modelo Users.create:', error);
        
        // Verificar si el usuario ya existe
        if (error.code === '23505') { // Código de error para duplicado
          console.log('El usuario ya existe, intentando recuperar...');
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', userData.auth_user_id)
            .single();
            
          if (!fetchError && existingUser) {
            console.log('Usuario existente recuperado:', existingUser);
            return existingUser;
          }
        }
        
        // Si falla, intentar una segunda vez con reintentos
        console.log('Reintentando creación de usuario...');
        let retryCount = 3;
        let retryData = null;
        let retryError = error;
        
        while (retryCount > 0 && retryError) {
          // Esperar brevemente antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: rData, error: rError } = await supabase
            .from('users')
            .insert(userData)
            .select()
            .single();
            
          retryData = rData;
          retryError = rError;
          
          if (!retryError) break;
          retryCount--;
        }
        
        if (!retryError && retryData) {
          console.log('Usuario creado en reintento:', retryData);
          return retryData;
        }
        
        throw error;
      }
      
      console.log('Usuario creado exitosamente:', data);
      return data;
    } catch (err) {
      console.error('Error crítico en Users.create:', err);
      throw err;
    }
  },
  
  // Actualizar un usuario
  async update(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('auth_user_id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  // Obtener miembros del equipo
  async getTeamMembers(teamCode) {
    try {
      // Usar la función RPC get_team_members en lugar de consulta directa
      const { data, error } = await supabase
        .rpc('get_team_members', {
          p_team_code: teamCode
        });
        
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error en Users.getTeamMembers:', err);
      throw err;
    }
  }
};

// Modelo de Transacciones
const Transactions = {
  // Obtener todas las transacciones de un usuario
  async getByUserId(userId) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data;
  },
  
  // Crear una nueva transacción
  async create(transactionData) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  // Actualizar una transacción
  async update(id, updates) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  // Eliminar una transacción
  async delete(id) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  },
  
  // Obtener transacciones filtradas por mes/año
  async getByMonth(userId, monthYear) {
    const startDate = new Date(`${monthYear}-01`);
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1) - 1);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data;
  },
  
  // Obtener estadísticas de transacciones
  async getStats(userId) {
    // Obtener mes actual en formato YYYY-MM
    const currentDate = new Date();
    const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Calcular mes anterior
    const previousDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
    const previousMonthYear = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Obtener transacciones del mes actual
    const currentMonth = await this.getByMonth(userId, currentMonthYear);
    
    // Obtener transacciones del mes anterior
    const previousMonth = await this.getByMonth(userId, previousMonthYear);
    
    // Calcular ingresos y gastos
    const currentMonthRevenue = currentMonth
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const currentMonthExpenses = currentMonth
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      
    const currentMonthFixedCosts = currentMonth
      .filter(t => t.type === 'saida' && t.cost_type === 'fijo')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      
    const currentMonthVariableCosts = currentMonth
      .filter(t => t.type === 'saida' && t.cost_type === 'variable')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      
    const lastMonthRevenue = previousMonth
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const lastMonthExpenses = previousMonth
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    
    // Calcular KPIs
    const currentGrossMargin = currentMonthRevenue > 0 
      ? (currentMonthRevenue - currentMonthExpenses) / currentMonthRevenue * 100 
      : 0;
      
    const revenueGrowth = lastMonthRevenue > 0 
      ? (currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100 
      : 0;
    
    // Calcular categorías de gasto principales
    const expensesByCategory = currentMonth
      .filter(t => t.type === 'saida')
      .reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = 0;
        acc[t.category] += Math.abs(Number(t.amount));
        return acc;
      }, {});
    
    const topExpenseCategories = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    return {
      currentMonthRevenue,
      currentMonthExpenses,
      currentMonthFixedCosts,
      currentMonthVariableCosts,
      lastMonthRevenue,
      lastMonthExpenses,
      currentGrossMargin,
      revenueGrowth,
      topExpenseCategories
    };
  }
};

// Modelo de Categorías
const Categories = {
  // Obtener todas las categorías de un usuario
  async getByUserId(userId) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    return data;
  },
  
  // Crear una nueva categoría
  async create(categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  // Actualizar una categoría
  async update(id, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  // Eliminar una categoría
  async delete(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  }
};

// Modelo de Balances
const Balances = {
  // Obtener el balance de un usuario
  async getByUserId(userId) {
    const { data, error } = await supabase
      .from('balances')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data || { balance: 0 };
  },
  
  // Actualizar el balance de un usuario
  async update(userId, newBalance) {
    const { data, error } = await supabase
      .from('balances')
      .insert({
        user_id: userId,
        balance: newBalance
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};

// Modelo de KPIs
const KPIs = {
  // Obtener KPIs de un usuario por mes
  async getByMonth(userId, monthYear) {
    const { data, error } = await supabase
      .from('kpis')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  // Calcular y actualizar KPIs
  async calculateAndUpdate(userId, monthYear) {
    // Llamar al procedimiento almacenado para calcular KPIs
    const { error } = await supabase.rpc('calculate_monthly_kpis', {
      p_user_id: userId,
      p_month_year: monthYear
    });
    
    if (error) throw error;
    
    // Obtener los KPIs actualizados
    return await this.getByMonth(userId, monthYear);
  }
};

// Modelo de Equipos
const Teams = {
  // Obtener equipo por código
  async getByCode(code) {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('code', code)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  // Crear un nuevo equipo
  async create(teamData) {
    const { data, error } = await supabase
      .from('teams')
      .insert(teamData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};

// Exportar todos los modelos
module.exports = {
  Users,
  Transactions,
  Categories,
  Balances,
  KPIs,
  Teams
}; 