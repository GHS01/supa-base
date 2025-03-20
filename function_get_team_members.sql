-- Función para obtener los miembros de un equipo (solución al problema de recursión infinita)
CREATE OR REPLACE FUNCTION public.get_team_members(p_team_code TEXT)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY 
  SELECT * FROM public.users 
  WHERE team_code = p_team_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION public.get_team_members TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members TO anon; 