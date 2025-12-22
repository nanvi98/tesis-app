// src/lib/createAdmin.ts
import { supabase } from './supabaseClient';

interface AdminData {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
}

export const createAdmin = async ({ email, password, nombre, apellidos }: AdminData) => {
  try {
    // 1. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // opcional
    });

    if (authError) throw new Error(authError.message);

    // 2. Insertar info adicional en tabla users
    const { error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user?.id,
          email,
          nombre,
          apellidos,
          role: 'admin',
          status: 'aprobado',
        },
      ]);

    if (dbError) throw new Error(dbError.message);

    return { success: true };
  } catch (error: any) {
    console.error('Error creando admin:', error.message);
    return { success: false, message: error.message };
  }
};
