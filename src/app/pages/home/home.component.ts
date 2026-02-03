import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Adicionado RouterModule
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, LogIn, User, X, Mail, UserPlus } from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule, RouterModule],
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
              
              <h3 class="text-xl font-bold text-white mb-2">Jogar como Convidado</h3>
              <p class="text-slate-400 text-sm mb-4">Escolha um apelido temporário.</p>
              
              <input [(ngModel)]="guestName" (keyup.enter)="confirmGuestLogin()" placeholder="Seu Apelido" 
                     class="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-indigo-500 focus:outline-none mb-4 font-bold text-center">
              
              <button (click)="confirmGuestLogin()" [disabled]="!guestName || loading()" 
                      class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold uppercase shadow-lg disabled:opacity-50 transition-all active:scale-95">
                  {{ loading() ? 'ENTRANDO...' : 'JOGAR AGORA' }}
              </button>
           </div>
        </div>
      }

      <div class="relative z-10 w-full max-w-4xl flex flex-col items-center text-center gap-6">
        
        <div class="relative group mb-4">
            <img src="assets/finalgame-logo.png" alt="Final Game" 
                 class="relative h-32 md:h-48 drop-shadow-2xl animate-float object-contain"
                 onerror="this.style.display='none'; document.getElementById('logo-fallback').style.display='block'">
            <h1 id="logo-fallback" style="display:none" class="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">FINAL GAME</h1>
        </div>

        <h1 class="text-3xl md:text-5xl font-black tracking-tighter text-white mb-2">
            A PLATAFORMA DE <span class="text-indigo-400">JOGOS ONLINE</span>
        </h1>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
            
            <button (click)="handleGoogleLogin()" [disabled]="loading()"
                class="col-span-1 sm:col-span-2 py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95">
                <lucide-icon [img]="LogIn" class="w-5 h-5 text-indigo-600"></lucide-icon>
                <span>Entrar com Google</span>
            </button>

            <button routerLink="/auth" [disabled]="loading()"
                class="py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
                <lucide-icon [img]="Mail" class="w-5 h-5"></lucide-icon>
                <span>Entrar</span>
            </button>

            <button routerLink="/auth" [disabled]="loading()"
                class="py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
                <lucide-icon [img]="UserPlus" class="w-5 h-5"></lucide-icon>
                <span>Cadastrar</span>
            </button>

            <button (click)="openGuestModal()" [disabled]="loading()"
                class="col-span-1 sm:col-span-2 py-3 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                <lucide-icon [img]="User" class="w-4 h-4"></lucide-icon>
                <span>Jogar apenas como Convidado</span>
            </button>

        </div>
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
  
  // Ícones
  readonly LogIn = LogIn; readonly User = User; readonly X = X; readonly Mail = Mail; readonly UserPlus = UserPlus;

  async handleGoogleLogin() {
    this.loading.set(true);
    try {
        await this.auth.signInWithGoogle();
    } catch (error) {
        console.error(error);
        alert('Erro no Google Login');
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
        // Tenta logar. Se o Supabase estiver bloqueado, vai dar erro aqui.
        await this.auth.signInAnonymously(this.guestName);
        this.router.navigate(['/lobby']); 
    } catch (error) {
        console.error(error);
        alert("Erro: O Login de Convidado pode estar desativado no Supabase.");
        this.loading.set(false);
    }
  }
}