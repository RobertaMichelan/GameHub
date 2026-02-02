import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { LucideAngularModule, Home, Users } from 'lucide-angular';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-white flex flex-col">
      
      <header class="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4">
        <div class="flex items-center gap-3">
          <button (click)="leaveRoom()" class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <lucide-icon [img]="Home" class="w-5 h-5"></lucide-icon>
          </button>
          <div class="h-8 w-[1px] bg-slate-700"></div>
          <div>
            <p class="text-xs text-slate-500 font-bold uppercase">Código da Sala</p>
            <h1 class="text-xl font-mono font-bold text-indigo-400 tracking-wider">{{ roomId }}</h1>
          </div>
        </div>

        <div class="flex items-center gap-2 bg-slate-800 py-1.5 px-3 rounded-full">
          <lucide-icon [img]="Users" class="w-4 h-4 text-slate-400"></lucide-icon>
          <span class="text-sm font-bold">{{ players().length }}</span>
        </div>
      </header>

      <main class="flex-1 p-4 flex flex-col items-center justify-center">
        
        @if (loading()) {
          <div class="animate-pulse text-indigo-500 font-bold">Conectando à sala...</div>
        } 
        
        @else if (error()) {
          <div class="text-center">
            <h2 class="text-red-500 font-bold text-xl mb-2">Sala não encontrada</h2>
            <button (click)="leaveRoom()" class="underline text-slate-400">Voltar ao Lobby</button>
          </div>
        }

        @else {
          <div class="text-center space-y-4">
            <div class="text-6xl mb-4">🎮</div>
            <h2 class="text-2xl font-bold">Sala de {{ roomData()?.game_type }}</h2>
            <p class="text-slate-400">Aguardando o Host iniciar a partida...</p>
            
            <div class="mt-8 p-4 bg-slate-900 rounded-xl border border-slate-800 max-w-sm mx-auto">
              <h3 class="font-bold mb-4 text-sm uppercase text-slate-500">Jogadores na Sala</h3>
              <div class="flex flex-wrap gap-2 justify-center">
                @for (p of players(); track p.id) {
                  <span class="px-3 py-1 bg-indigo-600/20 text-indigo-400 rounded-full text-sm font-bold border border-indigo-600/30">
                    {{ p.username || 'Jogador' }}
                  </span>
                }
              </div>
            </div>
          </div>
        }

      </main>
    </div>
  `
})
export class RoomComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  supabase = inject(SupabaseService);

  readonly Home = Home;
  readonly Users = Users;

  roomId = '';
  loading = signal(true);
  error = signal('');
  roomData = signal<any>(null);
  players = signal<any[]>([]);

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    if (this.roomId) {
      this.connectToRoom();
    }
  }

  async connectToRoom() {
    try {
      // 1. Busca dados da sala
      const { data, error } = await this.supabase.client
        .from('rooms')
        .select('*')
        .eq('code', this.roomId)
        .single();

      if (error || !data) throw new Error('Sala não existe');
      
      this.roomData.set(data);
      
      // 2. Simula entrada do jogador (Futuramente faremos isso no banco real)
      const user = (await this.supabase.client.auth.getUser()).data.user;
      this.players.set([{ id: user?.id, username: 'Você' }]); // Temporário

    } catch (err) {
      this.error.set('Erro ao entrar');
    } finally {
      this.loading.set(false);
    }
  }

  leaveRoom() {
    this.router.navigate(['/lobby']);
  }
}