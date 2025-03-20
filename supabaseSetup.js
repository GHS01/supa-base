const supabase = require('./supabaseClient');

async function setupDatabase() {
  console.log('Verificando y configurando la base de datos en Supabase...');

  try {
    // Verificación de políticas y roles de seguridad (RLS)
    await setupRowLevelSecurity();
    
    // Crear los procedimientos almacenados necesarios
    await createStoredProcedures();

    console.log('Configuración de la base de datos completada con éxito.');
  } catch (error) {
    console.error('Error al configurar la base de datos:', error.message);
    process.exit(1);
  }
}

async function setupRowLevelSecurity() {
  // Aplicar políticas de seguridad para cada tabla
  const { error: usersError } = await supabase.rpc('apply_users_policies');
  if (usersError) {
    await createUsersPolicies();
  }

  const { error: transactionsError } = await supabase.rpc('apply_transactions_policies');
  if (transactionsError) {
    await createTransactionsPolicies();
  }

  const { error: categoriesError } = await supabase.rpc('apply_categories_policies');
  if (categoriesError) {
    await createCategoriesPolicies();
  }

  const { error: balancesError } = await supabase.rpc('apply_balances_policies');
  if (balancesError) {
    await createBalancesPolicies();
  }

  const { error: kpisError } = await supabase.rpc('apply_kpis_policies');
  if (kpisError) {
    await createKpisPolicies();
  }

  const { error: teamsError } = await supabase.rpc('apply_teams_policies');
  if (teamsError) {
    await createTeamsPolicies();
  }
}

async function createUsersPolicies() {
  console.log('Creando políticas para la tabla users...');
  await supabase.rpc('create_users_policies', {
    sql: `
      -- Habilitar RLS para la tabla users
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;

      -- Crear política para que los usuarios solo puedan ver sus propios datos
      CREATE POLICY "Usuarios pueden ver su propio perfil" 
      ON public.users FOR SELECT 
      USING (auth.uid() = auth_user_id);

      -- Crear política para que los usuarios solo puedan actualizar sus propios datos
      CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
      ON public.users FOR UPDATE 
      USING (auth.uid() = auth_user_id);

      -- Los miembros del equipo pueden ver a otros miembros del mismo equipo
      CREATE POLICY "Usuarios pueden ver miembros de su equipo" 
      ON public.users FOR SELECT 
      USING (
        (SELECT team_code FROM public.users WHERE auth_user_id = auth.uid()) = 
        team_code
      );
    `
  });
}

async function createTransactionsPolicies() {
  console.log('Creando políticas para la tabla transactions...');
  await supabase.rpc('create_transactions_policies', {
    sql: `
      -- Habilitar RLS para la tabla transactions
      ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

      -- Crear política para que los usuarios solo puedan ver sus propias transacciones
      CREATE POLICY "Usuarios pueden ver sus propias transacciones" 
      ON public.transactions FOR SELECT 
      USING (auth.uid() = user_id);

      -- Crear política para que los usuarios solo puedan insertar sus propias transacciones
      CREATE POLICY "Usuarios pueden crear sus propias transacciones" 
      ON public.transactions FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

      -- Crear política para que los usuarios solo puedan actualizar sus propias transacciones
      CREATE POLICY "Usuarios pueden actualizar sus propias transacciones" 
      ON public.transactions FOR UPDATE 
      USING (auth.uid() = user_id);

      -- Crear política para que los usuarios solo puedan eliminar sus propias transacciones
      CREATE POLICY "Usuarios pueden eliminar sus propias transacciones" 
      ON public.transactions FOR DELETE 
      USING (auth.uid() = user_id);
    `
  });
}

async function createCategoriesPolicies() {
  console.log('Creando políticas para la tabla categories...');
  await supabase.rpc('create_categories_policies', {
    sql: `
      -- Habilitar RLS para la tabla categories
      ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

      -- Crear política para que los usuarios solo puedan ver sus propias categorías
      CREATE POLICY "Usuarios pueden ver sus propias categorías" 
      ON public.categories FOR SELECT 
      USING (auth.uid() = user_id);

      -- Crear política para que los usuarios solo puedan insertar sus propias categorías
      CREATE POLICY "Usuarios pueden crear sus propias categorías" 
      ON public.categories FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

      -- Crear política para que los usuarios solo puedan actualizar sus propias categorías
      CREATE POLICY "Usuarios pueden actualizar sus propias categorías" 
      ON public.categories FOR UPDATE 
      USING (auth.uid() = user_id);

      -- Crear política para que los usuarios solo puedan eliminar sus propias categorías
      CREATE POLICY "Usuarios pueden eliminar sus propias categorías" 
      ON public.categories FOR DELETE 
      USING (auth.uid() = user_id);
    `
  });
}

async function createBalancesPolicies() {
  console.log('Creando políticas para la tabla balances...');
  await supabase.rpc('create_balances_policies', {
    sql: `
      -- Habilitar RLS para la tabla balances
      ALTER TABLE balances ENABLE ROW LEVEL SECURITY;

      -- Crear política para que los usuarios solo puedan ver sus propios balances
      CREATE POLICY "Usuarios pueden ver sus propios balances" 
      ON public.balances FOR SELECT 
      USING (auth.uid() = user_id);

      -- Crear política para que los usuarios solo puedan insertar sus propios balances
      CREATE POLICY "Usuarios pueden crear sus propios balances" 
      ON public.balances FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

      -- Crear política para que los usuarios solo puedan actualizar sus propios balances
      CREATE POLICY "Usuarios pueden actualizar sus propios balances" 
      ON public.balances FOR UPDATE 
      USING (auth.uid() = user_id);
    `
  });
}

async function createKpisPolicies() {
  console.log('Creando políticas para la tabla kpis...');
  await supabase.rpc('create_kpis_policies', {
    sql: `
      -- Habilitar RLS para la tabla kpis
      ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

      -- Crear política para que los usuarios solo puedan ver sus propios KPIs
      CREATE POLICY "Usuarios pueden ver sus propios KPIs" 
      ON public.kpis FOR SELECT 
      USING (auth.uid() = user_id);

      -- Crear política para que los usuarios solo puedan insertar sus propios KPIs
      CREATE POLICY "Usuarios pueden crear sus propios KPIs" 
      ON public.kpis FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

      -- Crear política para que los usuarios solo puedan actualizar sus propios KPIs
      CREATE POLICY "Usuarios pueden actualizar sus propios KPIs" 
      ON public.kpis FOR UPDATE 
      USING (auth.uid() = user_id);
    `
  });
}

async function createTeamsPolicies() {
  console.log('Creando políticas para la tabla teams...');
  await supabase.rpc('create_teams_policies', {
    sql: `
      -- Habilitar RLS para la tabla teams
      ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

      -- Crear política para que los usuarios puedan ver equipos a los que pertenecen
      CREATE POLICY "Usuarios pueden ver sus equipos" 
      ON public.teams FOR SELECT 
      USING (
        code IN (
          SELECT team_code FROM public.users 
          WHERE auth_user_id = auth.uid()
        )
      );
      
      -- Solo los creadores pueden actualizar equipos
      CREATE POLICY "Creadores pueden actualizar equipos" 
      ON public.teams FOR UPDATE 
      USING (created_by = auth.uid()::text);
      
      -- Solo los creadores pueden eliminar equipos
      CREATE POLICY "Creadores pueden eliminar equipos" 
      ON public.teams FOR DELETE 
      USING (created_by = auth.uid()::text);
    `
  });
}

// Función para crear los procedimientos almacenados necesarios
async function createStoredProcedures() {
  console.log('Creando procedimientos almacenados...');

  // Procedimiento para calcular KPIs financieros
  await supabase.rpc('create_calculate_kpis_function', {
    sql: `
      CREATE OR REPLACE FUNCTION calculate_monthly_kpis(p_user_id UUID, p_month_year TEXT)
      RETURNS VOID AS $$
      DECLARE
        v_current_month_revenue NUMERIC;
        v_current_month_expenses NUMERIC;
        v_current_month_fixed_costs NUMERIC;
        v_last_month_revenue NUMERIC;
        v_margen_bruto NUMERIC;
        v_crecimiento_ingresos NUMERIC;
        v_punto_equilibrio NUMERIC;
        v_last_month_year TEXT;
      BEGIN
        -- Calcular el mes anterior
        v_last_month_year := to_char(to_date(p_month_year, 'YYYY-MM') - INTERVAL '1 month', 'YYYY-MM');
        
        -- Ingresos del mes actual
        SELECT COALESCE(SUM(amount), 0) INTO v_current_month_revenue
        FROM transactions
        WHERE user_id = p_user_id 
          AND to_char(date, 'YYYY-MM') = p_month_year
          AND type = 'entrada';
        
        -- Gastos del mes actual
        SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_current_month_expenses
        FROM transactions
        WHERE user_id = p_user_id 
          AND to_char(date, 'YYYY-MM') = p_month_year
          AND type = 'saida';
        
        -- Costos fijos del mes actual
        SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_current_month_fixed_costs
        FROM transactions
        WHERE user_id = p_user_id 
          AND to_char(date, 'YYYY-MM') = p_month_year
          AND type = 'saida'
          AND cost_type = 'fijo';
        
        -- Ingresos del mes anterior
        SELECT COALESCE(SUM(amount), 0) INTO v_last_month_revenue
        FROM transactions
        WHERE user_id = p_user_id 
          AND to_char(date, 'YYYY-MM') = v_last_month_year
          AND type = 'entrada';
        
        -- Calcular margen bruto
        IF v_current_month_revenue > 0 THEN
          v_margen_bruto := ((v_current_month_revenue - v_current_month_expenses) / v_current_month_revenue) * 100;
        ELSE
          v_margen_bruto := 0;
        END IF;
        
        -- Calcular crecimiento de ingresos
        IF v_last_month_revenue > 0 THEN
          v_crecimiento_ingresos := ((v_current_month_revenue - v_last_month_revenue) / v_last_month_revenue) * 100;
        ELSE
          v_crecimiento_ingresos := 0;
        END IF;
        
        -- Punto de equilibrio es el nivel de ventas donde la ganancia es cero
        v_punto_equilibrio := v_current_month_fixed_costs;
        
        -- Insertar o actualizar KPIs
        INSERT INTO kpis (user_id, month_year, margen_bruto, crecimiento_ingresos, punto_equilibrio)
        VALUES (p_user_id, p_month_year, v_margen_bruto, v_crecimiento_ingresos, v_punto_equilibrio)
        ON CONFLICT (user_id, month_year)
        DO UPDATE SET
          margen_bruto = v_margen_bruto,
          crecimiento_ingresos = v_crecimiento_ingresos,
          punto_equilibrio = v_punto_equilibrio;
      END;
      $$ LANGUAGE plpgsql;
    `
  });

  // Procedimiento para crear usuarios directamente
  console.log('Creando función create_user...');
  await supabase.rpc('create_user_function', {
    sql: `
      CREATE OR REPLACE FUNCTION public.create_user(
        p_auth_user_id UUID,
        p_name TEXT,
        p_role TEXT DEFAULT 'user',
        p_team_code TEXT DEFAULT NULL
      ) RETURNS public.users AS $$
      DECLARE
        v_user_record public.users;
      BEGIN
        -- Insertar el registro
        INSERT INTO public.users(auth_user_id, name, role, team_code)
        VALUES (p_auth_user_id, p_name, p_role, p_team_code)
        RETURNING * INTO v_user_record;
        
        RETURN v_user_record;
      EXCEPTION
        WHEN unique_violation THEN
          -- Si ya existe, recuperar y devolver
          SELECT * INTO v_user_record
          FROM public.users
          WHERE auth_user_id = p_auth_user_id;
          
          RETURN v_user_record;
        WHEN OTHERS THEN
          RAISE;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  });
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 