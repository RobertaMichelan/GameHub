import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  // --- MÉTODOS DE EMAIL E SENHA (Necessários para não quebrar o código antigo) ---
  async signIn(email: string, password: string) {
    return await this.supabase.client.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string, username: string) {
    return await this.supabase.client.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
  }

  // --- MÉTODOS NOVOS (Google e Convidado) ---
  async signInWithGoogle() {
    const { error } = await this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/lobby`,
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    });
    if (error) throw error;
  }

  async signInAnonymously(username: string) {
    const { error } = await this.supabase.client.auth.signInAnonymously({
      options: { data: { username: username } }
    });
    if (error) throw error;
  }

  async signOut() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/']);
  }

  async getUser() {
    const { data } = await this.supabase.client.auth.getUser();
    return data.user;
  }
}