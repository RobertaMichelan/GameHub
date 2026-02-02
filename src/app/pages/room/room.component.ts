import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { LucideAngularModule, Home, Users, Trophy } from 'lucide-angular';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-white flex flex-col">
      
      <header class="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4 sticky top-0 z-10">
        <div class="flex items-center gap-3">
          <button (click)="leaveRoom()" class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Sair da Sala">
            <lucide-icon [img]="Home" class="w-5 h-5"></lucide-icon>
          </button>
          <div class="h-8 w-[1px] bg-slate-700"></div>
          <div>
            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">CÓDIGO DA SALA</p>
            <h1 class="text-xl font-mono font-bold text-indigo-400 tracking-wider leading-none">{{ roomId }}</h1>
          </div>
        </div>

        <div class="flex items-center gap-2 bg-slate-800 py-1.5 px-3 rounded-full border border-slate-700">
          <lucide-icon [img]="Users" class="w-4 h-4 text-indigo-400"></lucide-icon>
          <span class="text-sm font-bold">{{ players().length }}</span>
        </div>
      </header>

      <main class="flex-1 p-6 flex flex-col items-center max-w-4xl mx-auto w-full">
        
        @if (loading()) {
          <div class="flex flex-col items-center gap-4 mt-20 animate-pulse">
            <div class="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-slate-400 font-bold">Conectando...</p>
          </div>
        } 
        
        @else {
          <div class="text-center mb-12 mt-8">
            <div class="inline-flex p-4 bg-slate-900 rounded-2xl mb-4 shadow-xl border border-slate-800 text-4xl">
              🎮
            </div>
            <h2 class="text-3xl font-bold mb-2">Sala de {{ roomData()?.game_type }}</h2>
            
            @if (isHost()) {
              <p class="text-emerald-400 font-bold">👑 Você é o Organizador (Host)!</p>
              <p class="text-slate-400 text-sm">Aguarde os jogadores entrarem e inicie.</p>
            } @else {
              <p class="text-slate-400">Aguardando o Organizador iniciar a partida...</p>
            }
          </div>

          <div class="w-full mb-24">
             <h3 class="font-bold text-slate-500 uppercase text-xs mb-4 tracking-wider text-center">Jogadores Conectados</h3>
             <div class="flex flex-wrap gap-2 justify-center">
                @for (p of players(); track p.id) {
                  <div class="bg-slate-900 border border-slate-800 px-4 py-2 rounded-full flex items-center gap-2 animate-fade-in">
                    <span class="w-2 h-2 rounded-full" [ngClass]="p.id === roomData()?.host_id ? 'bg-yellow-500' : 'bg-green-500'"></span>
                    <span class="font-bold text-sm">{{ p.username }}</span>
                  </div>
                }
             </div>
          </div>

          @if (isHost()) {
            <div class="fixed bottom-8 px-4 z-50">
              <button class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all text-lg flex items-center gap-2">
                <span>INICIAR PARTIDA</span>
                <lucide-icon [img]="Trophy" class="w-5 h-5"></lucide-icon>
              </button>
            </div>
          }
        }

      </main>
    </div>
  `
})
export class RoomComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  supabase = inject(SupabaseService);
  
  readonly Home = Home;
  readonly Users = Users;
  readonly Trophy = Trophy;

  roomId = '';
  loading = signal(true);
  roomData = signal<any>(null);
  players = signal<any[]>([]);
  currentUser = signal<any>(null);
  
  isHost = computed(() => {
    const user = this.currentUser();
    const room = this.roomData();
    return user && room && user.id === room.host_id;
  });

  private channel: RealtimeChannel | null = null;

  async ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    if (this.roomId) await this.connectToRoom();
  }

  ngOnDestroy() {
    if (this.channel) this.supabase.client.removeChannel(this.channel);
  }

  async connectToRoom() {
    try {
      const { data: { user } } = await this.supabase.client.auth.getUser();
      this.currentUser.set(user);

      const { data: room, error } = await this.supabase.client
        .from('rooms')
        .select('*')
        .eq('code', this.roomId)
        .single();
      
      if (error) throw error;
      this.roomData.set(room);

      if (user) {
        await this.supabase.client.from('room_players').upsert({
          room_code: this.roomId,
          user_id: user.id
        });
      }
      this.fetchPlayers();
      this.setupRealtime();
    } catch (err) {
      console.error(err);
      this.router.navigate(['/lobby']);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchPlayers() {
    const { data } = await this.supabase.client
      .from('room_players')
      .select('*, profiles(username)')
      .eq('room_code', this.roomId);

    if (data) {
      this.players.set(data.map((p: any) => ({
        id: p.user_id,
        username: p.profiles?.username || 'Jogador'
      })));
    }
  }

  setupRealtime() {
    this.channel = this.supabase.client.channel(`room_${this.roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_code=eq.${this.roomId}` }, () => {
        this.fetchPlayers();
      })
      .subscribe();
  }

  leaveRoom() { this.router.navigate(['/lobby']); }
}