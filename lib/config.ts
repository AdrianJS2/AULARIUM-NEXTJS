// En el archivo: lib/config.ts
export const featureFlags = {
    // Cambia 'supabase' a 'mysql' a medida que migres cada módulo
    aulas: 'mysql',
    profesores: 'mysql',
    materiasGrupos: 'supabase',
    asignacion: 'supabase',
    horarios: 'supabase',
    autenticacion: 'supabase',
  };