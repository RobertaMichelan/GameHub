import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { 
  LucideAngularModule, 
  Grid3X3, Hash, BrainCircuit, Type, Anchor, CircleDot, PhoneCall, Hand,
  Users, Lock, Unlock, X, Search, Trophy, ArrowRight, Play
} from 'lucide-angular';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 p-4 md:p-8 font-sans text-white relative overflow-hidden">
      
      <header class="flex flex-col md:flex-row justify-between items-center mb-8 relative z-10 gap-6">
        <div>
          <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            GAME HUB
          </h1>
          <p class="text-slate-400 text-sm">Escolha um jogo ou entre com código</p>
        </div>
        
        <div class="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-700 w-full md:w-auto">
          <div class="bg-slate-800 p-2 rounded-lg text-slate-400">
            <lucide-icon [img]="Hash" class="w-5 h-5"></lucide-icon>
          </div>
          <input [(ngModel)]="globalCode" (keyup.enter)="joinByCode()" type="text" maxlength="4" placeholder="Código da Sala (Ex: 1234)" 
                 class="bg-transparent border-none focus:outline-none text-white font-bold tracking-widest w-full md:w-48 placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-600 uppercase">
          <button (click)="joinByCode()" [disabled]="!globalCode || loading()" class="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg font-bold transition-colors disabled:opacity-50">
            <lucide-icon [img]="ArrowRight" class="w-5 h-5"></lucide-icon>
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 max-w-7xl mx-auto">
        @for (game of games; track game.id) {
          <div (click)="openGameModal(game)" 
               class="group relative bg-slate-900/40 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 rounded-3xl p-6 cursor-pointer transition-all hover:-translate-y-1 shadow-lg">
            
            <div class="h-24 rounded-2xl mb-4 flex items-center justify-center transition-colors"
                 [ngClass]="'bg-' + game.color + '-900/20 text-' + game.color + '-400'">
              <lucide-icon [img]="game.icon" class="w-10 h-10"></lucide-icon>
            </div>

            <h3 class="text-lg font-bold text-white mb-1">{{ game.name }}</h3>
            <div class="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-400">
              <span>Ver Salas</span>
              <lucide-icon [img]="ArrowRight" class="w-3 h-3"></lucide-icon>
            </div>
          </div>
        }
      </div>

      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-fade-in">
          <div class="bg-slate-950 border border-slate-800 w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl relative flex flex-col md:flex-row overflow-hidden">
            
            <button (click)="closeModal()" class="absolute top-4 right-4 z-50 text-slate-500 hover:text-white bg-slate-900 rounded-full p-1">
              <lucide-icon [img]="X" class="w-5 h-5"></lucide-icon>
            </button>

            <div class="w-full md:w-2/3 p-6 flex flex-col border-b md:border-b-0 md:border-r border-slate-800">
              <h2 class="text-2xl font-black text-white mb-4 flex items-center gap-2">
                <lucide-icon [img]="selectedGame()?.icon" class="w-6 h-6 text-indigo-400"></lucide-icon>
                SALAS DE {{ selectedGame()?.name | uppercase }}
              </h2>

              <div class="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                @if (loadingRooms()) {
                  <div class="text-center py-10 text-slate-500 animate-pulse">Buscando salas...</div>
                } @else if (publicRooms().length === 0) {
                  <div class="text-center py-10 text-slate-600 border border-dashed border-slate-800 rounded-xl">
                    <p>Nenhuma sala pública encontrada.</p>
                    <p class="text-sm">Crie uma agora!</p>
                  </div>
                } @else {
                  @for (room of publicRooms(); track room.id) {
                    <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center hover:border-indigo-500 transition-colors group">
                      <div>
                        <h4 class="font-bold text-white">{{ room.name }}</h4>
                        <span class="text-xs text-slate-500 uppercase tracking-wide">Aguardando...</span>
                      </div>
                      <button (click)="joinRoom(room.id)" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2">
                        Entrar <lucide-icon [img]="Play" class="w-3 h-3"></lucide-icon>
                      </button>
                    </div>
                  }
                }
              </div>
            </div>

            <div class="w-full md:w-1/3 p-6 bg-slate-900/30 flex flex-col justify-center relative">
              <div class="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/10 pointer-events-none"></div>
              
              <h3 class="text-xl font-bold text-white mb-6">Criar Nova Sala</h3>

              <div class="space-y-4 relative z-10">
                <div class="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button (click)="isPrivate.set(false)" 
                     [class.bg-slate-800]="!isPrivate()" [class.text-white]="!isPrivate()"
                     class="flex-1 py-2 text-xs font-bold uppercase rounded-lg text-slate-500 transition-all">Pública</button>
                  <button (click)="isPrivate.set(true)" 
                     [class.bg-indigo-600]="isPrivate()" [class.text-white]="isPrivate()"
                     class="flex-1 py-2 text-xs font-bold uppercase rounded-lg text-slate-500 transition-all">Privada</button>
                </div>

                <div class="text-xs text-slate-400 text-center min-h-[40px]">
                  @if (isPrivate()) {
                    <p>Você receberá um <strong class="text-white">código de 4 dígitos</strong> para convidar seus amigos.</p>
                  } @else {
                    <p>Sua sala aparecerá na lista para <strong class="text-white">qualquer pessoa</strong> entrar.</p>
                  }
                </div>

                <button (click)="createRoom()" [disabled]="loading()" 
                        class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black uppercase shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                  @if (loading()) { <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> }
                  {{ loading() ? 'CRIANDO...' : 'CRIAR SALA' }}
                </button>
              </div>
            </div>

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class LobbyComponent {
  supabase = inject(SupabaseService);
  auth = inject(AuthService);
  router = inject(Router);

  // Icons
  readonly Hash = Hash; readonly ArrowRight = ArrowRight; readonly X = X; readonly Play = Play;

  // Games List
  games = [
    { id: 'bingo', name: 'Bingo Online', icon: Grid3X3, color: 'indigo' },
    { id: 'chamada', name: 'Chamada', icon: PhoneCall, color: 'cyan' },
    { id: 'stop', name: 'Stop (Adedonha)', icon: Hand, color: 'rose' },
    { id: 'tictactoe', name: 'Jogo da Velha', icon: Hash, color: 'emerald' },
    { id: 'memory', name: 'Jogo da Memória', icon: BrainCircuit, color: 'purple' },
    { id: 'battleship', name: 'Batalha Naval', icon: Anchor, color: 'blue' }
  ];

  // States
  showModal = signal(false);
  selectedGame = signal<any>(null);
  publicRooms = signal<any[]>([]);
  
  loading = signal(false);
  loadingRooms = signal(false);
  
  // Inputs
  isPrivate = signal(false);
  globalCode = '';

  async openGameModal(game: any) {
    this.selectedGame.set(game);
    this.isPrivate.set(false); // Reset para pública
    this.showModal.set(true);
    this.fetchPublicRooms(game.id);
  }

  closeModal() {
    this.showModal.set(false);
  }

  // BUSCAR SALAS PÚBLICAS
  async fetchPublicRooms(gameId: string) {
    this.loadingRooms.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('rooms')
        .select('*')
        .eq('game_type', gameId)
        .eq('is_public', true)
        .eq('status', 'waiting') // Só salas aguardando
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.publicRooms.set(data || []);
    } catch (err) {
      console.error('Erro ao buscar salas:', err);
    } finally {
      this.loadingRooms.set(false);
    }
  }

  // ENTRAR EM SALA EXISTENTE
  joinRoom(roomId: string) {
    this.router.navigate(['/room', roomId]);
  }

  // ENTRAR VIA CÓDIGO (Topo da tela)
  async joinByCode() {
    if (!this.globalCode || this.globalCode.length < 4) return;
    this.loading.set(true);
    try {
      // Procura sala pelo código
      const { data, error } = await this.supabase.client
        .from('rooms')
        .select('id')
        .eq('code', this.globalCode.toUpperCase())
        .single();

      if (error || !data) {
        alert('Sala não encontrada com este código!');
      } else {
        this.router.navigate(['/room', data.id]);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao buscar sala.');
    } finally {
      this.loading.set(false);
    }
  }

  // CRIAR SALA (Com código se for privada)
  async createRoom() {
    this.loading.set(true);
    try {
      const user = await this.auth.getUser();
      const game = this.selectedGame();
      
      // Gera código de 4 dígitos (Ex: 4A2B ou 1234)
      const roomCode = this.isPrivate() 
        ? Math.floor(1000 + Math.random() * 9000).toString() // Gera ex: "4521"
        : null;

      const { data, error } = await this.supabase.client
        .from('rooms')
        .insert({
          name: `${game.name} de ${user?.user_metadata?.['username'] || 'Convidado'}`,
          game_type: game.id,
          is_public: !this.isPrivate(),
          code: roomCode, // Salva o código
          host_id: user?.id,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Se tiver código, mostra num alert rápido (opcional, pois vai estar na sala)
      if (roomCode) alert(`Sala Criada! Código: ${roomCode}`);
      
      this.router.navigate(['/room', data.id]);

    } catch (error) {
      console.error('Erro ao criar:', error);
      alert('Erro ao criar sala. Tente novamente.');
    } finally {
      this.loading.set(false);
    }
  }
}