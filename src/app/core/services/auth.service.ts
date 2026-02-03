import { Injectable, inject } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient;
  private router = inject(Router);
  
  // Chave para salvar a última vez que o usuário mexeu
  private readonly ACTIVITY_KEY = 'finalgame_last_active';
  // 1 Dia em milissegundos (24h * 60m * 60s * 1000ms)
  private readonly MAX_INACTIVITY_TIME = 24 * 60 * 60 * 1000; 

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    
    // Ao iniciar o serviço (abrir o site), verifica a inatividade
    this.checkAutoLogout();
    
    // Monitora mudanças de sessão
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.updateActivity(); // Usuário está ativo
      }
    });
  }

  // --- LÓGICA DE 1 DIA AUSENTE ---
  private checkAutoLogout() {
    const lastActive = localStorage.getItem(this.ACTIVITY_KEY);
    const now = Date.now();

    if (lastActive) {
      const diff = now - parseInt(lastActive, 10);
      
      // Se passou mais de 1 dia (diff > MAX), desloga
      if (diff > this.MAX_INACTIVITY_TIME) {
        console.log('Sessão expirada por inatividade (1 dia). Deslogando...');
        this.signOut();
        return;
      }
    }

    // Se não expirou, atualiza o horário atual
    this.updateActivity();
  }

  private updateActivity() {
    localStorage.setItem(this.ACTIVITY_KEY, Date.now().toString());
  }

  // --- MÉTODOS PADRÃO ---

  get client() {
    return this.supabase;
  }

  async signUp(email: string, password: string, username: string) {
    // Verifica disponibilidade do nome antes de tentar criar
    const { count } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('username', username);

    if (count && count > 0) {
      return { data: null, error: { message: 'Este nome de usuário já está em uso. Escolha outro.' } };
    }

    return this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }, // Salva nos metadados para o Trigger pegar
      },
    });
  }

  async signIn(email: string, password: string) {
    const response = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!response.error) {
      this.updateActivity();
    }
    return response;
  }

  async signOut() {
    localStorage.removeItem(this.ACTIVITY_KEY); // Limpa o rastro
    await this.supabase.auth.signOut();
    this.router.navigate(['/auth']);
  }
}