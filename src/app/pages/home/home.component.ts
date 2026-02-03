import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, Gamepad2, ArrowRight, LogIn } from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-white">
      
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s;"></div>
      </div>

      <div class="relative z-10 w-full max-w-3xl flex flex-col items-center text-center gap-8">
        
        <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <img src="assets/finalgame-logo.png" alt="Final Game" class="relative h-32 md:h-40 drop-shadow-2xl animate-float">
        </div>

        <div class="space-y-4 max-w-xl">
            <h1 class="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                JOGUE COM A GALERA
            </h1>
            <p class="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                A melhor plataforma de <strong class="text-indigo-400">Bingo Online</strong> e diversão em tempo real. Crie salas, convide amigos e divirta-se agora mesmo.
            </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
            
            <button (click)="handleGoogleLogin()" [disabled]="loading()"
                class="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3">
                <div class="absolute inset-0 w-full h-full bg-white/20 group-hover:w-full transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 rounded-xl"></div>
                <lucide-icon [img]="LogIn" class="w-5 h-5"></lucide-icon>
                <span>Entrar com Google</span>
            </button>

            <button (click)="handleGuestLogin()" [disabled]="loading()"
                class="px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl font-bold text-lg shadow-lg transition-all hover:border-slate-500 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                <lucide-icon [img]="Gamepad2" class="w-5 h-5"></lucide-icon>
                <span>Jogar como Convidado</span>
            </button>
        
        </div>

        <p class="text-xs text-slate-600 mt-8">
            Ao entrar, você concorda com nossos termos. Convidados têm dados temporários.
        </p>

      </div>
    </div>
  `,
  styles: [`
    .animate-float { animation: float 6s ease-in-out infinite; }
    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
  `]
})
export class HomeComponent {
  auth = inject(AuthService);
  router = inject(Router);
  
  loading = signal(false);
  
  readonly Gamepad2 = Gamepad2; readonly ArrowRight = ArrowRight; readonly LogIn = LogIn;

  async handleGoogleLogin() {
    this.loading.set(true);
    try {
        await this.auth.signInWithGoogle();
        // O redirecionamento acontece via URL do Supabase, não aqui.
    } catch (error) {
        console.error(error);
        this.loading.set(false);
    }
  }

  async handleGuestLogin() {
    this.loading.set(true);
    try {
        await this.auth.signInAnonymously();
        // Convidado entra direto, nós redirecionamos manualmente
        this.router.navigate(['/lobby']); 
    } catch (error) {
        console.error(error);
        alert("Erro ao entrar como convidado.");
        this.loading.set(false);
    }
  }
}