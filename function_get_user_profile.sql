-- Función para obtener el perfil de usuario (solución al problema de recursión infinita)
CREATE OR REPLACE FUNCTION public.get_user_profile(p_auth_user_id UUID)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY 
  SELECT * FROM public.users 
  WHERE auth_user_id = p_auth_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION public.get_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile TO anon; 