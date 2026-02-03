import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { 
  LucideAngularModule, 
  Grid3X3, Hash, BrainCircuit, Type, Anchor, CircleDot, 
  PhoneCall, Hand, // <--- Novos ícones importados aqui
  Users, Lock, Unlock, X, Search, Trophy 
} from 'lucide-angular';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 p-4 md:p-8 font-sans text-white relative overflow-hidden">
      
      <header class="flex flex-col md:flex-row justify-between items-center mb-10 relative z-10 gap-4">
        <div class="text-center md:text-left">
          <h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tighter">
            GAME HUB
          </h1>
          <p class="text-slate-400 font-medium">Escolha seu desafio de hoje</p>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="hidden md:flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span class="text-xs font-bold text-emerald-400 tracking-widest">ONLINE</span>
          </div>
          <button (click)="logout()" class="text-slate-500 hover:text-red-400 transition-colors text-sm font-bold uppercase tracking-wider">
            Sair
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10 max-w-7xl mx-auto pb-10">
        
        @for (game of games; track game.id) {
          <div (click)="openSetupModal(game)" 
               class="group relative bg-slate-900/40 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden">
            
            @if (game.featured) {
              <div class="absolute top-0 right-0 bg-gradient-to-l from-indigo-600 to-transparent text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                Populares
              </div>
            }

            <div class="h-32 rounded-2xl mb-5 flex items-center justify-center transition-colors duration-300"
                 [ngClass]="'bg-' + game.color + '-900/20 group-hover:bg-' + game.color + '-600/20 text-' + game.color + '-400'">
              <lucide-icon [img]="game.icon" class="w-14 h-14"></lucide-icon>
            </div>

            <h3 class="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{{ game.name }}</h3>
            <p class="text-slate-500 text-sm leading-relaxed">{{ game.desc }}</p>

            <div class="mt-4 flex items-center gap-2 text-xs font-bold text-slate-600 group-hover:text-white transition-colors uppercase tracking-wider">
              <span>Jogar Agora</span>
              <lucide-icon [img]="Trophy" class="w-3 h-3"></lucide-icon>
            </div>
          </div>
        }

      </div>

      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4">
          <div class="bg-slate-950 border border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            <button (click)="closeModal()" class="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <lucide-icon [img]="X" class="w-6 h-6"></lucide-icon>
            </button>

            <h2 class="text-2xl font-black text-white mb-1">CRIAR SALA</h2>
            <p class="text-indigo-400 text-sm font-bold mb-8 uppercase tracking-widest flex items-center gap-2">
              <lucide-icon [img]="selectedGame()?.icon" class="w-4 h-4"></lucide-icon>
              {{ selectedGame()?.name }}
            </p>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <button (click)="isPrivate.set(false)" 
                  [class.bg-indigo-600]="!isPrivate()" [class.text-white]="!isPrivate()" [class.border-transparent]="!isPrivate()"
                  class="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 text-slate-400 flex flex-col items-center gap-2 transition-all hover:bg-slate-800">
                  <lucide-icon [img]="Unlock" class="w-6 h-6"></lucide-icon>
                  <span class="text-xs font-bold uppercase">Pública</span>
                </button>

                <button (click)="isPrivate.set(true)"
                  [class.bg-indigo-600]="isPrivate()" [class.text-white]="isPrivate()" [class.border-transparent]="isPrivate()"
                  class="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 text-slate-400 flex flex-col items-center gap-2 transition-all hover:bg-slate-800">
                  <lucide-icon [img]="Lock" class="w-6 h-6"></lucide-icon>
                  <span class="text-xs font-bold uppercase">Privada</span>
                </button>
              </div>

              @if (isPrivate()) {
                <div class="animate-slide-down pt-2">
                  <label class="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-widest">Senha de Acesso</label>
                  <input [(ngModel)]="roomPassword" type="text" placeholder="Crie uma senha..." 
                         class="w-full bg-slate-900 border border-slate-700 text-white px-4 py-4 rounded-xl focus:border-indigo-500 focus:outline-none font-medium text-center placeholder:text-slate-600">
                </div>
              }

              <button (click)="createRoom()" [disabled]="loading()" 
                      class="w-full bg-white hover:bg-slate-200 text-slate-950 py-4 rounded-xl font-black uppercase shadow-lg shadow-white/5 mt-4 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-3">
                @if (loading()) {
                  <div class="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                }
                {{ loading() ? 'CRIANDO...' : 'INICIAR PARTIDA' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    .animate-slide-down { animation: slideDown 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class LobbyComponent {
  supabase = inject(SupabaseService);
  auth = inject(AuthService);
  router = inject(Router);

  // Ícones Disponíveis
  readonly X = X; readonly Unlock = Unlock; readonly Lock = Lock; readonly Trophy = Trophy;

  // --- LISTA COMPLETA DE JOGOS ---
  games = [
    { 
      id: 'bingo', 
      name: 'Bingo Online', 
      desc: 'Marque a cartela e grite BINGO!', 
      icon: Grid3X3, 
      color: 'indigo', 
      featured: true 
    },
    { 
      id: 'chamada', 
      name: 'Chamada', 
      desc: 'Quando o telefone tocar, atenda!', 
      icon: PhoneCall, 
      color: 'cyan', 
      featured: true 
    },
    { 
      id: 'stop', 
      name: 'Stop', 
      desc: 'Quem sabe mais palavras?', 
      icon: Hand, 
      color: 'rose', 
      featured: true 
    },
    { 
      id: 'tictactoe', 
      name: 'Jogo da Velha', 
      desc: 'Clássico duelo de X e O.', 
      icon: Hash, 
      color: 'emerald', 
      featured: false 
    },
    { 
      id: 'memory', 
      name: 'Jogo da Memória', 
      desc: 'Encontre os pares rapidamente.', 
      icon: BrainCircuit, 
      color: 'purple', 
      featured: false 
    },
    { 
      id: 'hangman', 
      name: 'Forca', 
      desc: 'Adivinhe a palavra antes do fim.', 
      icon: Type, 
      color: 'orange', 
      featured: false 
    },
    { 
      id: 'battleship', 
      name: 'Batalha Naval', 
      desc: 'Afunde os navios inimigos.', 
      icon: Anchor, 
      color: 'blue', 
      featured: false 
    },
    { 
      id: 'checkers', 
      name: 'Damas', 
      desc: 'Estratégia pura no tabuleiro.', 
      icon: CircleDot, 
      color: 'red', 
      featured: false 
    }
  ];

  // Estados
  showModal = signal(false);
  loading = signal(false);
  selectedGame = signal<any>(null);
  isPrivate = signal(false);
  roomPassword = '';

  openSetupModal(game: any) {
    this.selectedGame.set(game);
    this.isPrivate.set(false);
    this.roomPassword = '';
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async createRoom() {
    this.loading.set(true);
    try {
      const user = await this.auth.getUser();
      const currentGame = this.selectedGame();

      const { data, error } = await this.supabase.client
        .from('rooms')
        .insert({
          name: `${currentGame.name} de ${user?.user_metadata?.['username'] || 'Convidado'}`,
          game_type: currentGame.id,
          is_public: !this.isPrivate(),
          password: this.isPrivate() ? this.roomPassword : null,
          host_id: user?.id,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;
      this.router.navigate(['/room', data.id]);

    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar sala.');
    } finally {
      this.loading.set(false);
    }
  }

  async logout() {
    await this.auth.signOut();
  }
}