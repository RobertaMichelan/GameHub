import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, LogIn, UserPlus, Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
         <div class="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s;"></div>
      </div>

      <div class="relative z-10 w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-700 p-8 rounded-2xl shadow-2xl animate-fade-in-up">
        
        <a routerLink="/" class="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 mb-6 transition-colors text-sm font-bold cursor-pointer no-underline">
          <lucide-icon [img]="ArrowLeft" class="w-4 h-4"></lucide-icon>
          VOLTAR PARA INÍCIO
        </a>

        <div class="text-center mb-8">
          <h2 class="text-3xl font-black text-white tracking-tight mb-2">
            {{ isLogin() ? 'BEM-VINDO' : 'CRIAR CONTA' }}
          </h2>
          <p class="text-slate-400 text-sm">
            {{ isLogin() ? 'Entre para continuar sua jornada' : 'Preencha os dados para começar' }}
          </p>
        </div>

        <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="space-y-4">
          
          @if (!isLogin()) {
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <lucide-icon [img]="User" class="w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors"></lucide-icon>
              </div>
              <input formControlName="username" type="text" placeholder="Seu Apelido" 
                class="w-full bg-slate-950 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-600">
            </div>
          }

          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <lucide-icon [img]="Mail" class="w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors"></lucide-icon>
            </div>
            <input formControlName="email" type="email" placeholder="Seu Email" 
              class="w-full bg-slate-950 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-600">
          </div>

          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <lucide-icon [img]="Lock" class="w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors"></lucide-icon>
            </div>
            <input formControlName="password" type="password" placeholder="Sua Senha" 
              class="w-full bg-slate-950 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-600">
          </div>

          @if (errorMessage()) {
            <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center font-medium animate-pulse">
              {{ errorMessage() }}
            </div>
          }

          <button type="submit" [disabled]="authForm.invalid || loading()" 
            class="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold uppercase shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2">
            @if (loading()) {
              <lucide-icon [img]="Loader2" class="w-5 h-5 animate-spin"></lucide-icon>
              PROCESSANDO...
            } @else {
              {{ isLogin() ? 'ENTRAR AGORA' : 'CRIAR CONTA' }}
            }
          </button>

          <div class="text-center pt-2">
            <button type="button" (click)="toggleMode()" class="text-slate-400 hover:text-white text-sm font-medium transition-colors underline decoration-slate-600 underline-offset-4">
              {{ isLogin() ? 'Não tem uma conta? Cadastre-se' : 'Já tem conta? Faça Login' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AuthComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Sinais
  isLogin = signal(true);
  loading = signal(false);
  errorMessage = signal('');

  // Ícones
  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly User = User;
  readonly ArrowLeft = ArrowLeft;
  readonly Loader2 = Loader2;

  // Formulário
  authForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    username: [''] // Opcional no login, obrigatório no cadastro (validado no submit)
  });

  toggleMode() {
    this.isLogin.update(v => !v);
    this.errorMessage.set('');
    this.authForm.reset();
  }

  async onSubmit() {
    if (this.authForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');
    
    const { email, password, username } = this.authForm.value;

    try {
      if (this.isLogin()) {
        const { error } = await this.authService.signIn(email, password);
        if (error) throw error;
      } else {
        if (!username) {
            this.errorMessage.set('Nome é obrigatório para cadastro');
            this.loading.set(false);
            return;
        }
        const { error } = await this.authService.signUp(email, password, username);
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu email para confirmar.');
      }
      // Sucesso -> Vai pro Lobby
      this.router.navigate(['/lobby']);
    } catch (err: any) {
      console.error(err);
      this.errorMessage.set(err.message || 'Erro na autenticação');
    } finally {
      this.loading.set(false);
    }
  }
}