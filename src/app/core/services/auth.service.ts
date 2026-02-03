import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  // --- MÉTODOS ANTIGOS (Recuperados para corrigir o erro de Build) ---
  
  // Login com Email e Senha
  async signIn(email: string, password: string) {
    return await this.supabase.client.auth.signInWithPassword({
      email,
      password
    });
  }

  // Cadastro com Email e Senha
  async signUp(email: string, password: string, username: string) {
    return await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    });
  }

  // --- MÉTODOS NOVOS (Para a Home e Lobby) ---

  // Login com Google
  async signInWithGoogle() {
    const { error } = await this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/lobby`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    if (error) throw error;
  }

  // Login Anônimo (Com suporte a apelido)
  async signInAnonymously(username: string) {
    const { error } = await this.supabase.client.auth.signInAnonymously({
      options: {
        data: { username: username }
      }
    });
    if (error) throw error;
  }

  // --- GERAIS ---

  async signOut() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/']);
  }

  async getUser() {
    const { data } = await this.supabase.client.auth.getUser();
    return data.user;
  }
}