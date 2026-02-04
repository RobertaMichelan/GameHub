import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { LucideAngularModule, Home, Users, Trophy, Copy, Check } from 'lucide-angular';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      
      <header class="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4 sticky top-0 z-10">
        <div class="flex items-center gap-3">
          <button (click)="leaveRoom()" class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Voltar ao Lobby">
            <lucide-icon [img]="Home" class="w-5 h-5"></lucide-icon>
          </button>
          
          <div class="h-8 w-[1px] bg-slate-700"></div>
          
          <div class="flex flex-col">
            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">CÓDIGO</p>
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
          <div class="text-center mb-8 mt-4 w-full max-w-lg">
            
            <h2 class="text-3xl font-bold mb-2">Sala de {{ roomData()?.game_type }}</h2>
            
            @if (isHost()) {
              <div class="bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-2xl mb-6 mt-6 shadow-2xl shadow-indigo-900/20">
                <p class="text-indigo-300 font-bold mb-4 flex items-center justify-center gap-2 uppercase tracking-wide text-sm">
                  <lucide-icon [img]="Trophy" class="w-4 h-4"></lucide-icon> 
                  Para convidar seus amigos:
                </p>
                
                <div class="bg-slate-900 p-6 rounded-xl border border-slate-700 flex flex-col items-center gap-4 relative overflow-hidden group">
                  <div class="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <span class="text-slate-500 text-xs font-bold uppercase">Compartilhe este código</span>
                  
                  <div class="text-6xl font-mono font-black text-white tracking-widest select-all cursor-pointer" (click)="copyRoomCode()">
                    {{ roomId }}
                  </div>

                  <button (click)="copyRoomCode()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-transform active:scale-95 shadow-lg">
                    <lucide-icon [img]="copied() ? Check : Copy" class="w-4 h-4"></lucide-icon>
                    {{ copied() ? 'COPIADO!' : 'COPIAR CÓDIGO' }}
                  </button>
                </div>
                
                <p class="text-slate-500 text-xs mt-4">Peça para eles digitarem no menu "Entrar"</p>
              </div>

              <div class="fixed bottom-8 px-4 z-50 left-0 right-0 flex justify-center">
                <button class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all text-lg flex items-center gap-2 shadow-emerald-500/20">
                  <span>INICIAR PARTIDA</span>
                </button>
              </div>

            } @else {
              <div class="p-8 bg-slate-900 rounded-2xl border border-slate-800 mt-6">
                 <p class="text-slate-400 text-lg">Aguardando o Organizador iniciar...</p>
                 <div class="mt-4 flex justify-center">
                    <div class="animate-bounce text-2xl">⏳</div>
                 </div>
              </div>
            }
          </div>

          <div class="w-full mb-24">
             <h3 class="font-bold text-slate-500 uppercase text-xs mb-4 tracking-wider text-center flex items-center justify-center gap-2">
               Jogadores na Sala <span class="bg-slate-800 text-slate-300 px-2 rounded-full text-[10px]">{{ players().length }}</span>
             </h3>
             
             <div class="flex flex-wrap gap-2 justify-center">
                @for (p of players(); track p.id) {
                  <div class="bg-slate-900 border border-slate-800 px-4 py-2 rounded-full flex items-center gap-2 animate-fade-in shadow-sm">
                    <span class="w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
                          [ngClass]="p.id === roomData()?.host_id ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-green-500 shadow-green-500/50'"></span>
                    
                    <span class="font-bold text-sm text-slate-200">
                      {{ p.username }} 
                      @if(p.id === currentUser()?.id) { <span class="text-slate-500 font-normal">(Você)</span> }
                    </span>
                    
                    @if (p.id === roomData()?.host_id) {
                      <lucide-icon [img]="Trophy" class="w-3 h-3 text-yellow-500 ml-1"></lucide-icon>
                    }
                  </div>
                }
             </div>
          </div>
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
  readonly Copy = Copy;
  readonly Check = Check;

  roomId = '';
  loading = signal(true);
  copied = signal(false); // Para mudar o ícone do botão
  
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
        username: p.profiles?.username || 'Convidado'
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

  copyRoomCode() {
    navigator.clipboard.writeText(this.roomId).then(() => {
      // Animação de sucesso
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}