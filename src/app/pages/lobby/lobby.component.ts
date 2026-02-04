import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { 
  LucideAngularModule, 
  Grid3X3, Hash, BrainCircuit, Type, Anchor, CircleDot, PhoneCall, Hand,
  Users, Lock, Unlock, X, Play, ArrowRight 
} from 'lucide-angular';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 p-4 md:p-8 font-sans text-white relative overflow-hidden">
      
      <header class="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 relative z-10">
        <div>
          <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            GAME HUB
          </h1>
          <p class="text-slate-400 text-sm">Organize ou participe</p>
        </div>
        
        <div class="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-700 w-full md:w-auto shadow-lg">
          <input [(ngModel)]="globalCode" (keyup.enter)="joinByCode()" type="text" maxlength="4" placeholder="DIGITE O CÓDIGO DA SALA" 
                 class="bg-transparent border-none focus:outline-none text-white font-bold tracking-widest w-full md:w-64 placeholder:text-slate-600 placeholder:font-normal placeholder:tracking-normal text-center uppercase">
          <button (click)="joinByCode()" [disabled]="!globalCode || loading()" class="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-lg font-bold transition-colors disabled:opacity-50">
            <lucide-icon [img]="ArrowRight" class="w-5 h-5"></lucide-icon>
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10 max-w-7xl mx-auto">
        
        @for (game of games; track game.id) {
          <div (click)="openSetupModal(game)" 
               class="group relative bg-slate-900/40 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 rounded-3xl p-6 cursor-pointer transition-all hover:-translate-y-2 shadow-xl hover:shadow-2xl">
            
            <div class="h-32 rounded-2xl mb-4 flex items-center justify-center transition-colors bg-slate-900/50 group-hover:bg-indigo-500/10">
              <lucide-icon [img]="game.icon" [class]="'w-14 h-14 text-' + game.color + '-400'"></lucide-icon>
            </div>

            <h3 class="text-xl font-bold text-white mb-1 group-hover:text-indigo-400">{{ game.name }}</h3>
            <p class="text-slate-500 text-sm">{{ game.desc }}</p>

            <div class="mt-4 flex items-center gap-2 text-xs font-bold text-slate-600 group-hover:text-white uppercase tracking-wider">
              <span>Criar Sala</span>
              <lucide-icon [img]="Play" class="w-3 h-3"></lucide-icon>
            </div>
          </div>
        }
      </div>

      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <div class="bg-slate-950 border border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl relative">
            
            <button (click)="closeModal()" class="absolute top-4 right-4 text-slate-500 hover:text-white">
              <lucide-icon [img]="X" class="w-6 h-6"></lucide-icon>
            </button>

            <h2 class="text-2xl font-black text-white mb-2">CONFIGURAR SALA</h2>
            <p class="text-indigo-400 text-sm font-bold mb-6 uppercase tracking-widest">
              {{ selectedGame()?.name }}
            </p>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <button (click)="isPrivate.set(false)" 
                  [class.bg-indigo-600]="!isPrivate()" [class.text-white]="!isPrivate()" [class.border-transparent]="!isPrivate()"
                  class="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 text-slate-400 flex flex-col items-center gap-2 hover:bg-slate-800 transition-all">
                  <lucide-icon [img]="Unlock" class="w-6 h-6"></lucide-icon>
                  <span class="text-xs font-bold uppercase">Pública</span>
                </button>

                <button (click)="isPrivate.set(true)"
                  [class.bg-indigo-600]="isPrivate()" [class.text-white]="isPrivate()" [class.border-transparent]="isPrivate()"
                  class="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 text-slate-400 flex flex-col items-center gap-2 hover:bg-slate-800 transition-all">
                  <lucide-icon [img]="Lock" class="w-6 h-6"></lucide-icon>
                  <span class="text-xs font-bold uppercase">Privada</span>
                </button>
              </div>

              <div class="bg-slate-900/50 p-4 rounded-xl text-center border border-slate-800">
                @if (isPrivate()) {
                  <p class="text-slate-400 text-sm">Você receberá um <strong class="text-white">Código de 4 Dígitos</strong> para compartilhar.</p>
                } @else {
                  <p class="text-slate-400 text-sm">A sala aparecerá na lista pública para todos.</p>
                }
              </div>

              <button (click)="createRoom()" [disabled]="loading()" 
                      class="w-full bg-white hover:bg-slate-200 text-slate-950 py-4 rounded-xl font-black uppercase shadow-lg mt-2 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2">
                @if (loading()) { <div class="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div> }
                {{ loading() ? 'CRIANDO...' : 'INICIAR JOGO' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class LobbyComponent {
  supabase = inject(SupabaseService);
  auth = inject(AuthService);
  router = inject(Router);

  // Icons
  readonly X = X; readonly Unlock = Unlock; readonly Lock = Lock; readonly Play = Play; readonly ArrowRight = ArrowRight;

  // Games List
  games = [
    { id: 'bingo', name: 'Bingo Online', desc: 'Complete a cartela!', icon: Grid3X3, color: 'indigo' },
    { id: 'chamada', name: 'Chamada', desc: 'Atenda o telefone primeiro!', icon: PhoneCall, color: 'cyan' },
    { id: 'stop', name: 'Stop (Adedonha)', desc: 'Quem sabe mais palavras?', icon: Hand, color: 'rose' },
    { id: 'tictactoe', name: 'Jogo da Velha', desc: 'Clássico X vs O', icon: Hash, color: 'emerald' },
    { id: 'memory', name: 'Jogo da Memória', desc: 'Encontre os pares', icon: BrainCircuit, color: 'purple' },
    { id: 'battleship', name: 'Batalha Naval', desc: 'Afunde os navios', icon: Anchor, color: 'blue' }
  ];

  // States
  showModal = signal(false);
  loading = signal(false);
  selectedGame = signal<any>(null);
  
  // Inputs
  isPrivate = signal(false); // Padrão pública como antes
  globalCode = '';

  openSetupModal(game: any) {
    this.selectedGame.set(game);
    this.isPrivate.set(false);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  // --- LÓGICA DE CRIAÇÃO ---
  async createRoom() {
    this.loading.set(true);
    try {
      const user = await this.auth.getUser();
      
      // Gera código de 4 dígitos APENAS se for privada (ou sempre, se preferir)
      // Aqui gero sempre para garantir que existe
      const code = Math.floor(1000 + Math.random() * 9000).toString(); 

      const { data, error } = await this.supabase.client
        .from('rooms')
        .insert({
          name: `${this.selectedGame().name} de ${user?.user_metadata?.['username'] || 'Convidado'}`,
          game_type: this.selectedGame().id,
          is_public: !this.isPrivate(),
          code: code, // Salva o código
          host_id: user?.id,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;
      this.router.navigate(['/room', data.id]);

    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar sala. Verifique sua conexão.');
    } finally {
      this.loading.set(false);
    }
  }

  // --- LÓGICA DE ENTRAR COM CÓDIGO ---
  async joinByCode() {
    if (!this.globalCode || this.globalCode.length < 4) return;
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('rooms')
        .select('id')
        .eq('code', this.globalCode)
        .single();

      if (error || !data) {
        alert('Sala não encontrada com este código!');
      } else {
        this.router.navigate(['/room', data.id]);
      }
    } catch (err) {
      alert('Erro ao buscar sala.');
    } finally {
      this.loading.set(false);
    }
  }
}