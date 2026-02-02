import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';
// Importamos os ícones que vamos usar
import { LucideAngularModule, LogOut, Trophy, Plus, User, Search, Play, Phone, Ticket, StopCircle, HelpCircle, Palette, Disc, X, Type } from 'lucide-angular';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      
      <header class="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg mb-8">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30">
            {{ userInitial() }}
          </div>
          <div>
            <h2 class="font-bold text-lg">{{ profile()?.username || 'Carregando...' }}</h2>
            <div class="flex items-center gap-1 text-yellow-500 text-sm font-medium">
              <lucide-icon [img]="Trophy" class="w-4 h-4"></lucide-icon>
              <span>{{ profile()?.total_wins || 0 }} Vitórias</span>
            </div>
          </div>
        </div>
        <button (click)="logout()" class="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-400 transition-colors" title="Sair">
          <lucide-icon [img]="LogOut" class="w-6 h-6"></lucide-icon>
        </button>
      </header>

      <div class="mb-12 max-w-lg mx-auto transform hover:scale-[1.02] transition-transform">
        <label class="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">Entrar em Sala Existente</label>
        <div class="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
          <div class="relative flex-1">
            <lucide-icon [img]="Search" class="absolute left-3 top-3.5 text-slate-500 w-5 h-5"></lucide-icon>
            <input 
              [(ngModel)]="roomCode" 
              (keyup.enter)="joinRoom()"
              type="text" 
              placeholder="Código da Sala" 
              class="w-full bg-transparent py-3 pl-10 pr-4 text-white uppercase font-mono font-bold placeholder:text-slate-600 outline-none"
            >
          </div>
          <button (click)="joinRoom()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-lg font-bold transition-all shadow-lg hover:shadow-indigo-500/25">
            ENTRAR
          </button>
        </div>
      </div>

      <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
        <lucide-icon [img]="Play" class="w-6 h-6 text-indigo-500 fill-indigo-500/20"></lucide-icon>
        Criar Nova Sala
      </h3>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        @for (game of games; track game.id) {
          <button (click)="createRoom(game.id)" 
            class="group bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl text-left transition-all hover:-translate-y-1 relative overflow-hidden shadow-lg">
            
            <div class="w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-colors" [ngClass]="game.bg">
              <lucide-icon [img]="game.iconRef" class="w-6 h-6" [ngClass]="game.color"></lucide-icon>
            </div>
            
            <h4 class="font-bold text-lg text-slate-200 group-hover:text-white mb-1">{{ game.name }}</h4>
            <p class="text-xs text-slate-500 leading-relaxed">{{ game.desc }}</p>

            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shine"></div>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes shine { 100% { transform: translateX(100%); } }
    .animate-shine { animation: shine 0.7s; }
  `]
})
export class LobbyComponent implements OnInit {
  auth = inject(AuthService);
  supabase = inject(SupabaseService);
  router = inject(Router);

  // Ícones do sistema
  readonly LogOut = LogOut;
  readonly Trophy = Trophy;
  readonly Search = Search;
  readonly Play = Play;

  profile = signal<any>(null);
  roomCode = '';

  // Configuração dos Jogos com Ícones Lucide
  games = [
    { id: 'CHAMADA', name: 'A Chamada', iconRef: Phone, desc: 'Quem atender primeiro ganha!', bg: 'bg-rose-500/10', color: 'text-rose-500' },
    { id: 'BINGO', name: 'Bingo', iconRef: Disc, desc: 'Cartelas automáticas e globo virtual.', bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
    { id: 'RIFA', name: 'Rifa Digital', iconRef: Ticket, desc: 'Organize sorteios facilmente.', bg: 'bg-yellow-500/10', color: 'text-yellow-500' },
    { id: 'STOP', name: 'Stop / Adedonha', iconRef: StopCircle, desc: 'Vocabulário rápido sob pressão.', bg: 'bg-red-500/10', color: 'text-red-500' },
    { id: 'QUIZ', name: 'Quiz', iconRef: HelpCircle, desc: 'Teste de conhecimentos gerais.', bg: 'bg-blue-500/10', color: 'text-blue-500' },
    { id: 'IMAGEM_ACAO', name: 'Imagem & Ação', iconRef: Palette, desc: 'Desenhe para seus amigos.', bg: 'bg-purple-500/10', color: 'text-purple-500' },
    { id: 'FORCA', name: 'Forca', iconRef: Type, desc: 'Adivinhe a palavra secreta.', bg: 'bg-pink-500/10', color: 'text-pink-500' },
    { id: 'VELHA', name: 'Jogo da Velha', iconRef: X, desc: 'O clássico duelo tático.', bg: 'bg-orange-500/10', color: 'text-orange-500' },
  ];

  async ngOnInit() {
    this.fetchProfile();
  }

  async fetchProfile() {
    const { data: { user } } = await this.supabase.client.auth.getUser();
    if (user) {
      const { data } = await this.supabase.client.from('profiles').select('*').eq('id', user.id).single();
      this.profile.set(data);
    }
  }

  userInitial() { return this.profile()?.username?.charAt(0).toUpperCase() || '?'; }
  
  async logout() { await this.auth.signOut(); }
  
  joinRoom() { if (this.roomCode) this.router.navigate(['/room', this.roomCode.toUpperCase()]); }
  
  async createRoom(gameId: string) {
    const user = (await this.supabase.client.auth.getUser()).data.user;
    if (!user) return;
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Cria a sala (Nota: certifique-se que a tabela 'rooms' existe no Supabase, senão vai dar erro aqui)
    const { error } = await this.supabase.client.from('rooms').insert({
        code: code, host_id: user.id, game_type: gameId, status: 'WAITING'
    });

    if (error) alert('Erro ao criar sala: ' + error.message);
    else this.router.navigate(['/room', code]);
  }
}