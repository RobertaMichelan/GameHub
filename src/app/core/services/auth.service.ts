import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  loading = signal(false);

  // Valida se tem 15 anos completos
  isAgeValid(birthDate: string): boolean {
    if (!birthDate) return false;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 15;
  }

  // Verifica se o username já existe no banco
  async isUsernameTaken(username: string): Promise<boolean> {
    const { data } = await this.supabase.client
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();
    return !!data; 
  }

  // Cadastro
  async signUp(data: { email: string; pass: string; username: string; fullName: string; birthDate: string }) {
    this.loading.set(true);
    try {
      if (!this.isAgeValid(data.birthDate)) throw new Error('É necessário ter pelo menos 15 anos.');
      
      const taken = await this.isUsernameTaken(data.username);
      if (taken) throw new Error('Este nome de usuário já está em uso.');

      const { error } = await this.supabase.client.auth.signUp({
        email: data.email,
        password: data.pass,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName,
            birth_date: data.birthDate
          }
        }
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      this.loading.set(false);
    }
  }

  // Login
  async signIn(email: string, pass: string) {
    this.loading.set(true);
    try {
      const { error } = await this.supabase.client.auth.signInWithPassword({
        email,
        password: pass
      });
      if (error) throw error;
      
      this.router.navigate(['/lobby']);
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      this.loading.set(false);
    }
  }

  // Sair
  async signOut() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/auth']);
  }
}