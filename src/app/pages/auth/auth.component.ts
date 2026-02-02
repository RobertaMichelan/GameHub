import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, LogIn, UserPlus, Ghost } from 'lucide-angular';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div class="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800">
        
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">GameHub 🎮</h1>
          <p class="text-slate-400">Sua plataforma de jogos multiplayer</p>
        </div>

        <div class="flex bg-slate-800 p-1 rounded-xl mb-6">
          <button (click)="isLogin.set(true)" 
            [class]="isLogin() ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'"
            class="flex-1 py-2 rounded-lg text-sm font-bold transition-all">
            ENTRAR
          </button>
          <button (click)="isLogin.set(false)" 
            [class]="!isLogin() ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'"
            class="flex-1 py-2 rounded-lg text-sm font-bold transition-all">
            CADASTRAR
          </button>
        </div>

        <form (submit)="handleSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
            <input [(ngModel)]="email" name="email" type="email" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors" placeholder="seu@email.com">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Senha</label>
            <input [(ngModel)]="password" name="password" type="password" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors" placeholder="••••••••">
          </div>

          @if (!isLogin()) {
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Nome de Usuário</label>
              <input [(ngModel)]="username" name="username" type="text" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Ex: MestreDosJogos">
            </div>
          }

          <button type="submit" [disabled]="loading()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
            @if (loading()) {
              <span>Carregando...</span>
            } @else {
              <lucide-icon [img]="isLogin() ? LogIn : UserPlus" class="w-5 h-5"></lucide-icon>
              {{ isLogin() ? 'ACESSAR CONTA' : 'CRIAR CONTA' }}
            }
          </button>
        </form>
        
        <div class="relative flex items-center py-6">
          <div class="flex-grow border-t border-slate-700"></div>
          <span class="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase">OU</span>
          <div class="flex-grow border-t border-slate-700"></div>
        </div>

        <button (click)="guestLogin()" [disabled]="loading()" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-slate-700/50">
          <lucide-icon [img]="Ghost" class="w-5 h-5"></lucide-icon>
          JOGAR COMO CONVIDADO
        </button>

      </div>
    </div>
  `
})
export class AuthComponent {
  authService = inject(AuthService);
  router = inject(Router);

  isLogin = signal(true);
  loading = signal(false);
  
  email = '';
  password = '';
  username = '';

  readonly LogIn = LogIn;
  readonly UserPlus = UserPlus;
  readonly Ghost = Ghost;

  async handleSubmit() {
    this.loading.set(true);
    try {
      if (this.isLogin()) {
        const { error } = await this.authService.signIn(this.email, this.password);
        if (error) throw error;
      } else {
        const { error } = await this.authService.signUp(this.email, this.password, this.username);
        if (error) throw error;
      }
      this.router.navigate(['/lobby']);
    } catch (error: any) {
      alert('Erro: ' + error.message);
    } finally {
      this.loading.set(false);
    }
  }

  async guestLogin() {
    this.loading.set(true);
    try {
      // Gera dados aleatórios para o convidado
      const rand = Math.floor(Math.random() * 1000000);
      const guestEmail = `convidado${rand}@gamehub.temp`; // Email falso
      const guestPass = `guestpass${rand}`; // Senha falsa
      const guestName = `Convidado ${Math.floor(Math.random() * 100)}`;

      // Tenta cadastrar
      const { data, error } = await this.authService.signUp(guestEmail, guestPass, guestName);
      
      if (error) {
        throw error;
      }

      // Se cadastrou mas não logou (acontece se Confirm Email estiver ligado), tenta logar
      if (!data.session) {
         const login = await this.authService.signIn(guestEmail, guestPass);
         if (login.error) throw new Error('Falha ao logar automático. Verifique se "Confirm Email" está desligado no Supabase.');
      }
      
      // Sucesso
      this.router.navigate(['/lobby']);
      
    } catch (error: any) {
      console.error(error);
      alert('Não foi possível entrar como convidado: ' + error.message);
    } finally {
      this.loading.set(false);
    }
  }
}