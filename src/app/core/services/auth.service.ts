import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  // Login com Email/Senha
  async signIn(email: string, password: string) {
    return await this.supabase.client.auth.signInWithPassword({ email, password });
  }

  // Cadastro com Email/Senha
  async signUp(email: string, password: string, username: string) {
    return await this.supabase.client.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
  }

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

  // Login Anônimo (AGORA COM NOME)
  async signInAnonymously(username: string) {
    const { error } = await this.supabase.client.auth.signInAnonymously({
      options: {
        data: { username: username } // Salva o nome nos metadados
      }
    });
    if (error) throw error;
  }

  // Sair
  async signOut() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/']);
  }

  // Pegar usuário
  async getUser() {
    const { data } = await this.supabase.client.auth.getUser();
    return data.user;
  }
}