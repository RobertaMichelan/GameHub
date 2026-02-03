import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, LogIn, UserPlus, Ghost, X } from 'lucide-angular';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      <div class="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div class="absolute top-10 left-10 w-32 h-32 bg-indigo-600 rounded-full blur-3xl"></div>
        <div class="absolute bottom-10 right-10 w-40 h-40 bg-emerald-600 rounded-full blur-3xl"></div>
      </div>

      <div class="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800 relative z-10">
        
        <div class="text-center mb-8">
          <h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">Final Game 🎮</h1>
          <p class="text-slate-400 font-medium">Sua plataforma de jogos multiplayer</p>
        </div>

        @if (!showGuestInput()) {
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

          <button (click)="showGuestInput.set(true)" [disabled]="loading()" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-slate-700/50">
            <lucide-icon [img]="Ghost" class="w-5 h-5"></lucide-icon>
            JOGAR COMO CONVIDADO
          </button>

        } @else {
          <div class="animate-fade-in">
            <button (click)="showGuestInput.set(false)" class="absolute top-4 right-4 text-slate-500 hover:text-white">
               <lucide-icon [img]="X" class="w-6 h-6"></lucide-icon>
            </button>

            <div class="text-center mb-6">
              <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-700">
                <lucide-icon [img]="Ghost" class="w-8 h-8 text-indigo-400"></lucide-icon>
              </div>
              <h3 class="text-xl font-bold text-white">Identificação</h3>
              <p class="text-sm text-slate-400">Como você quer ser chamado?</p>
            </div>

            <form (submit)="guestLogin()" class="space-y-4">
               <input [(ngModel)]="guestNameInput" name="guestName" type="text" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-white text-center text-lg font-bold outline-none focus:border-indigo-500 transition-colors placeholder-slate-600" placeholder="Digite seu apelido..." autoFocus>
               
               <button type="submit" [disabled]="!guestNameInput.trim() || loading()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                 ENTRAR NA SALA
               </button>
            </form>
          </div>
        }

      </div>
    </div>
  `
})
export class AuthComponent {
  authService = inject(AuthService);
  router = inject(Router);

  isLogin = signal(true);
  showGuestInput = signal(false); // Controla a tela do convidado
  loading = signal(false);
  
  email = '';
  password = '';
  username = '';
  
  guestNameInput = '';

  readonly LogIn = LogIn;
  readonly UserPlus = UserPlus;
  readonly Ghost = Ghost;
  readonly X = X;

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
    if (!this.guestNameInput.trim()) return;

    this.loading.set(true);
    try {
      const rand = Math.floor(Math.random() * 1000000);
      const guestEmail = `convidado${rand}@gamehub.temp`; 
      const guestPass = `guestpass${rand}`; 
      const name = this.guestNameInput.trim();

      const { data, error } = await this.authService.signUp(guestEmail, guestPass, name);
      
      if (error) throw error;

      if (!data.session) {
         await this.authService.signIn(guestEmail, guestPass);
      }
      
      this.router.navigate(['/lobby']);
      
    } catch (error: any) {
      console.error(error);
      alert('Erro ao entrar: ' + error.message);
    } finally {
      this.loading.set(false);
    }
  }
}