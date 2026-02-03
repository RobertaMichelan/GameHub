import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service'; // Importar Auth
import { LucideAngularModule, Home, Users, Trophy, Copy, Check, Settings, Eye, LogOut } from 'lucide-angular';
import { RealtimeChannel } from '@supabase/supabase-js';
import { BingoComponent } from '../../components/bingo.component';
import { ChatComponent } from '../../components/chat.component';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, BingoComponent, ChatComponent],
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

        <div class="flex items-center gap-4">
          <div class="hidden sm:flex items-center gap-2 bg-slate-800 py-1.5 px-3 rounded-full border border-slate-700">
            <lucide-icon [img]="Users" class="w-4 h-4 text-indigo-400"></lucide-icon>
            <span class="text-sm font-bold">{{ players().length }}</span>
          </div>

          <button (click)="logout()" class="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 px-3 py-1.5 rounded-lg transition-all text-xs font-bold uppercase border border-red-500/20">
            <lucide-icon [img]="LogOut" class="w-4 h-4"></lucide-icon>
            Sair
          </button>
        </div>
      </header>

      <main class="flex-1 p-4 md:p-6 flex flex-col items-center max-w-6xl mx-auto w-full">
        @if (loading()) {
          <div class="flex flex-col items-center gap-4 mt-20 animate-pulse">
            <div class="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-slate-400 font-bold">Conectando à sala...</p>
          </div>
        } 
        @else {
          <div class="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div class="lg:col-span-2">
              @if (roomData()?.status === 'PLAYING') {
                <app-bingo 
                  [isHost]="isHost()" 
                  [roomId]="roomId" 
                  [initialCard]="userCard()"
                  [winningModes]="roomData()?.winning_modes || ['FULL']">
                </app-bingo>
              } @else {
                <div class="flex flex-col items-center text-center">
                  <h2 class="text-3xl font-bold mb-6">Sala de {{ roomData()?.game_type }}</h2>
                  
                  @if (isHost()) {
                    <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg mb-6 shadow-xl">
                      <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4 mb-6 group cursor-pointer" (click)="copyRoomCode()">
                        <div class="text-left">
                          <p class="text-xs text-slate-500 font-bold uppercase">Compartilhe o código</p>
                          <p class="text-4xl font-mono font-black text-white tracking-widest">{{ roomId }}</p>
                        </div>
                        <lucide-icon [img]="copied() ? Check : Copy" class="w-6 h-6 text-indigo-500"></lucide-icon>
                      </div>
                      
                      <div class="text-left mb-6">
                        <p class="text-xs text-slate-400 font-bold uppercase mb-3 flex items-center gap-2">
                          <lucide-icon [img]="Settings" class="w-3 h-3"></lucide-icon> Modos de Vitória
                        </p>
                        <div class="grid grid-cols-2 gap-3">
                          <label class="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 cursor-pointer hover:border-indigo-500 transition-colors">
                            <input type="checkbox" [checked]="hasMode('FULL')" (change)="toggleMode('FULL')" class="w-4 h-4 accent-indigo-500">
                            <span class="text-sm font-bold">Cartela Cheia</span>
                          </label>
                          <label class="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 cursor-pointer hover:border-indigo-500 transition-colors">
                            <input type="checkbox" [checked]="hasMode('LINE')" (change)="toggleMode('LINE')" class="w-4 h-4 accent-indigo-500">
                            <span class="text-sm font-bold">Linha</span>
                          </label>
                          <label class="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 cursor-pointer hover:border-indigo-500 transition-colors">
                            <input type="checkbox" [checked]="hasMode('COLUMN')" (change)="toggleMode('COLUMN')" class="w-4 h-4 accent-indigo-500">
                            <span class="text-sm font-bold">Coluna</span>
                          </label>
                          <label class="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 cursor-pointer hover:border-indigo-500 transition-colors">
                            <input type="checkbox" [checked]="hasMode('DIAGONAL')" (change)="toggleMode('DIAGONAL')" class="w-4 h-4 accent-indigo-500">
                            <span class="text-sm font-bold">Diagonal</span>
                          </label>
                        </div>
                      </div>

                      <button (click)="startGame()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-lg">
                        <lucide-icon [img]="Trophy" class="w-5 h-5"></lucide-icon> INICIAR PARTIDA
                      </button>
                    </div>
                  } @else {
                    <div class="p-8 bg-slate-900 rounded-2xl border border-slate-800 mt-6 max-w-md mx-auto mb-6">
                       <p class="text-slate-400 text-lg animate-pulse">Aguardando o Organizador...</p>
                    </div>
                    
                    @if (userCard().length > 0) {
                      <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 max-w-sm mx-auto opacity-75 hover:opacity-100 transition-opacity">
                        <p class="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center justify-center gap-2">
                          <lucide-icon [img]="Eye" class="w-3 h-3"></lucide-icon> Sua Cartela
                        </p>
                        <div class="grid grid-cols-5 gap-1 text-[10px]">
                           @for (n of getPreviewCard(); track $index) {
                             <div class="aspect-square bg-slate-800 flex items-center justify-center rounded text-slate-300 font-bold">
                               {{ n === 0 ? '★' : n }}
                             </div>
                           }
                        </div>
                      </div>
                    }
                  }
                </div>
              }
              
              <div class="w-full mt-8 border-t border-slate-800 pt-6">
                 <h3 class="font-bold text-slate-500 uppercase text-xs mb-4 tracking-wider text-center flex items-center justify-center gap-2">
                    <lucide-icon [img]="Users" class="w-3 h-3"></lucide-icon> Lista de Participantes
                 </h3>
                 <div class="flex flex-wrap gap-2 justify-center">
                    @for (p of players(); track p.id) {
                      <div class="bg-slate-900 border border-slate-800 px-4 py-2 rounded-full flex items-center gap-2 animate-fade-in transition-all hover:border-indigo-500">
                        <span class="w-2 h-2 rounded-full" [ngClass]="p.id === roomData()?.host_id ? 'bg-yellow-500' : 'bg-green-500'"></span>
                        <span class="font-bold text-sm text-slate-200">
                          {{ p.username || 'Convidado' }} 
                          @if(p.id === currentUser()?.id) { (Você) }
                          @if(p.id === roomData()?.host_id) { 👑 }
                        </span>
                      </div>
                    }
                 </div>
              </div>

            </div>

            <div class="lg:col-span-1">
              <div class="sticky top-20">
                <app-chat 
                  [roomId]="roomId" 
                  [isHost]="isHost()" 
                  [isOpen]="roomData()?.chat_open"
                  [currentUserId]="currentUser()?.id"
                  [currentUsername]="currentUser()?.user_metadata.username || 'Convidado'">
                </app-chat>
              </div>
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
  authService = inject(AuthService);
  
  readonly Home = Home;
  readonly Users = Users;
  readonly Trophy = Trophy;
  readonly Copy = Copy;
  readonly Check = Check;
  readonly Settings = Settings;
  readonly Eye = Eye;
  readonly LogOut = LogOut;

  roomId = '';
  loading = signal(true);
  copied = signal(false);
  
  roomData = signal<any>(null);
  players = signal<any[]>([]);
  currentUser = signal<any>(null);
  userCard = signal<number[]>([]);
  selectedModes = signal<string[]>(['FULL']);

  isHost = computed(() => this.currentUser()?.id === this.roomData()?.host_id);
  private channel: RealtimeChannel | null = null;

  async ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    if (this.roomId) await this.connectToRoom();
  }

  ngOnDestroy() {
    if (this.channel) this.supabase.client.removeChannel(this.channel);
  }

  async logout() {
    await this.authService.signOut();
    this.router.navigate(['/auth']);
  }

  async connectToRoom() {
    try {
      const { data: { user } } = await this.supabase.client.auth.getUser();
      this.currentUser.set(user);

      const { data: room, error } = await this.supabase.client.from('rooms').select('*').eq('code', this.roomId).single();
      if (error) throw error;
      
      this.roomData.set(room);
      if (room.winning_modes) this.selectedModes.set(room.winning_modes);

      // --- LOGICA REFORÇADA DE ENTRADA E CARTELA ---
      if (user) {
        const username = user.user_metadata['username'] || 'Convidado';

        // 1. Tenta pegar seus dados na sala
        const { data: existingPlayer } = await this.supabase.client
          .from('room_players')
          .select('*')
          .eq('room_code', this.roomId)
          .eq('user_id', user.id)
          .maybeSingle();

        let myCard = existingPlayer?.card;

        // 2. Se não tem dados ou a cartela está vazia
        if (!existingPlayer || !myCard || myCard.length === 0) {
          
          // Gera Cartela no Banco
          const { data: uniqueCard, error: rpcError } = await this.supabase.client
            .rpc('generate_unique_card', { room_code_param: this.roomId });

          if (rpcError) throw rpcError;
          myCard = uniqueCard;

          if (existingPlayer) {
             // Atualiza (incluindo o NOME)
             await this.supabase.client
               .from('room_players')
               .update({ card: myCard, username: username })
               .eq('room_code', this.roomId)
               .eq('user_id', user.id);
          } else {
             // Insere novo (incluindo o NOME)
             await this.supabase.client
               .from('room_players')
               .insert({ 
                 room_code: this.roomId, 
                 user_id: user.id, 
                 card: myCard,
                 username: username 
               });
          }
        }
        
        if (myCard) this.userCard.set(myCard);
      }
      // --------------------------------------------------------

      this.fetchPlayers();
      this.setupRealtime();
    } catch (err: any) {
      console.error(err);
      alert("Erro ao entrar: " + (err.message || "Erro desconhecido"));
    } finally {
      this.loading.set(false);
    }
  }

  async fetchPlayers() {
    // Busca simples, sem JOIN complexo que pode falhar
    const { data } = await this.supabase.client
      .from('room_players')
      .select('*')
      .eq('room_code', this.roomId);
      
    if (data) this.players.set(data);
  }

  setupRealtime() {
    this.channel = this.supabase.client.channel(`room_${this.roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_code=eq.${this.roomId}` }, () => this.fetchPlayers())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${this.roomId}` }, (payload) => {
        this.roomData.set(payload.new);
      })
      .subscribe();
  }

  hasMode(mode: string) { return this.selectedModes().includes(mode); }
  
  toggleMode(mode: string) {
    const current = this.selectedModes();
    if (current.includes(mode)) {
      this.selectedModes.set(current.filter(m => m !== mode));
    } else {
      this.selectedModes.set([...current, mode]);
    }
  }

  getPreviewCard() {
    const c = [...this.userCard()];
    if (c.length === 24) c.splice(12, 0, 0);
    return c;
  }

  async startGame() {
    try {
        await this.supabase.client.from('messages').delete().eq('room_code', this.roomId);
        await this.supabase.client.from('rooms')
          .update({ 
            status: 'PLAYING', 
            winning_modes: this.selectedModes(),
            chat_open: false 
          }).eq('code', this.roomId);
    } catch (error: any) {
        console.error(error);
        alert('Erro ao iniciar: ' + error.message);
    }
  }

  leaveRoom() { this.router.navigate(['/lobby']); }

  copyRoomCode() {
    navigator.clipboard.writeText(this.roomId).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}