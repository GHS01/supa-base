-- Script para crear o actualizar el esquema en Supabase
-- Ejecuta esto directamente en el editor SQL de Supabase si necesitas recrear las tablas

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  team_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índice para auth_user_id
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_team_code ON users(team_code);

-- Tabla de equipos
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  password TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índice para user_id
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  cost_type TEXT,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para user_id y date
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);

-- Tabla de balances
CREATE TABLE IF NOT EXISTS balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índice para user_id
CREATE INDEX IF NOT EXISTS idx_balances_user_id ON balances(user_id);

-- Tabla de KPIs
CREATE TABLE IF NOT EXISTS kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  margen_bruto NUMERIC,
  crecimiento_ingresos NUMERIC,
  punto_equilibrio NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- Crear índices para user_id y month_year
CREATE INDEX IF NOT EXISTS idx_kpis_user_id ON kpis(user_id);
CREATE INDEX IF NOT EXISTS idx_kpis_month_year ON kpis(month_year);

-- Crear la función para calcular KPIs
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

-- Función para crear un usuario directamente (para evitar problemas con el modelo)
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

-- Configurar Row Level Security (RLS)
-- Habilitar RLS para todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla users
CREATE POLICY "Usuarios pueden ver su propio perfil" 
ON public.users FOR SELECT 
USING (auth.uid() = auth_user_id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
ON public.users FOR UPDATE 
USING (auth.uid() = auth_user_id);

CREATE POLICY "Usuarios pueden ver miembros de su equipo" 
ON public.users FOR SELECT 
USING (
  (SELECT team_code FROM public.users WHERE auth_user_id = auth.uid()) = team_code
);

-- Políticas para la tabla transactions
CREATE POLICY "Usuarios pueden ver sus propias transacciones" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias transacciones" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias transacciones" 
ON public.transactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias transacciones" 
ON public.transactions FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para la tabla categories
CREATE POLICY "Usuarios pueden ver sus propias categorías" 
ON public.categories FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias categorías" 
ON public.categories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias categorías" 
ON public.categories FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias categorías" 
ON public.categories FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para la tabla balances
CREATE POLICY "Usuarios pueden ver sus propios balances" 
ON public.balances FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propios balances" 
ON public.balances FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios balances" 
ON public.balances FOR UPDATE 
USING (auth.uid() = user_id);

-- Políticas para la tabla kpis
CREATE POLICY "Usuarios pueden ver sus propios KPIs" 
ON public.kpis FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propios KPIs" 
ON public.kpis FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios KPIs" 
ON public.kpis FOR UPDATE 
USING (auth.uid() = user_id);

-- Políticas para la tabla teams
CREATE POLICY "Usuarios pueden ver sus equipos" 
ON public.teams FOR SELECT 
USING (
  code IN (
    SELECT team_code FROM public.users 
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Creadores pueden actualizar equipos" 
ON public.teams FOR UPDATE 
USING (created_by = auth.uid()::text);

CREATE POLICY "Creadores pueden eliminar equipos" 
ON public.teams FOR DELETE 
USING (created_by = auth.uid()::text); 