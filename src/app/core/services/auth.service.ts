import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  // Login com Google
  async signInWithGoogle() {
    const { error } = await this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/lobby` // Redireciona de volta pro lobby
      }
    });
    if (error) throw error;
  }

  // Login Anônimo (Convidado)
  async signInAnonymously() {
    const { error } = await this.supabase.client.auth.signInAnonymously();
    if (error) throw error;
  }

  // Sair
  async signOut() {
    const { error } = await this.supabase.client.auth.signOut();
    if (error) throw error;
    this.router.navigate(['/']);
  }

  // Pegar usuário atual
  async getUser() {
    const { data } = await this.supabase.client.auth.getUser();
    return data.user;
  }
}