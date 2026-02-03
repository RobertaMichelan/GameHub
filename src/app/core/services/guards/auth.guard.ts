import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
// AJUSTE AQUI: O caminho muda para voltar apenas uma pasta
import { SupabaseService } from '../supabase.service'; 

export const AuthGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);
  
  const { data } = await supabase.client.auth.getSession();
  
  if (!data.session) {
    router.navigate(['/']); 
    return false;
  }
  
  return true;
};