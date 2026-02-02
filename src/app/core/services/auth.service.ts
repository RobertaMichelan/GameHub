import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);

  // CORREÇÃO AQUI: Agora aceita 3 itens (email, senha, nome)
  async signUp(email: string, pass: string, username: string) {
    
    const { data, error } = await this.supabase.client.auth.signUp({
      email: email,
      password: pass,
      options: {
        data: { username: username }
      }
    });

    if (data.user && !error) {
      // Salva o nome na tabela de perfis
      await this.supabase.client.from('profiles').upsert({
        id: data.user.id,
        username: username,
        total_wins: 0
      });
    }

    return { data, error };
  }

  async signIn(email: string, pass: string) {
    return await this.supabase.client.auth.signInWithPassword({
      email: email,
      password: pass
    });
  }

  async signOut() {
    return await this.supabase.client.auth.signOut();
  }
}