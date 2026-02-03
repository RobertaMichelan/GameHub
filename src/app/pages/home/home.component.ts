import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, Gamepad2, ArrowRight, LogIn, User, X } from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-white">
      
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s;"></div>
      </div>

      @if (showGuestModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4">
           <div class="bg-slate-900 border border-slate-700 w-full max-w-sm p-6 rounded-2xl shadow-2xl relative">
              <button (click)="showGuestModal.set(false)" class="absolute top-4 right-4 text-slate-500 hover:text-white"><lucide-icon [img]="X" class="w-5 h-5"></lucide-icon></button>
              
              <h3 class="text-xl font-bold text-white mb-2">Como quer ser chamado?</h3>
              <p class="text-slate-400 text-sm mb-4">Escolha um apelido para jogar.</p>
              
              <input [(ngModel)]="guestName" (keyup.enter)="confirmGuestLogin()" placeholder="Seu Apelido" 
                     class="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-indigo-500 focus:outline-none mb-4 font-bold text-center">
              
              <button (click)="confirmGuestLogin()" [disabled]="!guestName || loading()" 
                      class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold uppercase shadow-lg disabled:opacity-50 transition-all active:scale-95">
                  {{ loading() ? 'ENTRANDO...' : 'JOGAR AGORA' }}
              </button>
           </div>
        </div>
      }

      <div class="relative z-10 w-full max-w-3xl flex flex-col items-center text-center gap-8">
        
        <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <img src="assets/finalgame-logo.png" alt="Final Game" class="relative h-32 md:h-40 drop-shadow-2xl animate-float object-contain">
        </div>

        <div class="space-y-4 max-w-xl">
            <h1 class="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                JOGUE COM A GALERA
            </h1>
            <p class="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                A melhor plataforma de <strong class="text-indigo-400">Jogos Online</strong> e diversão em tempo real. Crie salas, convide amigos e divirta-se agora mesmo.
            </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
            <button (click)="handleGoogleLogin()" [disabled]="loading()"
                class="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-3">
                <lucide-icon [img]="LogIn" class="w-5 h-5"></lucide-icon>
                <span>Entrar com Google</span>
            </button>

            <button (click)="openGuestModal()" [disabled]="loading()"
                class="px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3">
                <lucide-icon [img]="User" class="w-5 h-5"></lucide-icon>
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
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  `]
})
export class HomeComponent {
  auth = inject(AuthService);
  router = inject(Router);
  
  loading = signal(false);
  showGuestModal = signal(false);
  guestName = '';
  
  readonly Gamepad2 = Gamepad2; readonly ArrowRight = ArrowRight; readonly LogIn = LogIn; readonly User = User; readonly X = X;

  async handleGoogleLogin() {
    this.loading.set(true);
    try {
        await this.auth.signInWithGoogle();
    } catch (error) {
        console.error("Erro Google:", error);
        this.loading.set(false);
    }
  }

  openGuestModal() {
    this.showGuestModal.set(true);
  }

  async confirmGuestLogin() {
    if (!this.guestName.trim()) return;
    this.loading.set(true);
    try {
        await this.auth.signInAnonymously(this.guestName);
        this.router.navigate(['/lobby']); 
    } catch (error) {
        console.error(error);
        alert("Erro ao entrar como convidado.");
        this.loading.set(false);
    }
  }
}