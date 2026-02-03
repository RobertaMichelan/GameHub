import { Component, Input, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../core/services/supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';
import { LucideAngularModule, Play, Pause, Trophy, Frown } from 'lucide-angular';

@Component({
  selector: 'app-bingo',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex flex-col items-center w-full max-w-2xl mx-auto p-4 pb-20">
      
      @if (winnerName()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
           <div class="text-center animate-bounce-in relative px-4 w-full max-w-lg">
              <div class="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
              <div class="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>

              <h1 class="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-2xl tracking-widest mb-4">
                BINGO!
              </h1>
              <p class="text-2xl text-white font-bold uppercase tracking-widest mb-6">Vencedor</p>
              
              <div class="bg-indigo-600 text-white text-3xl md:text-5xl font-black px-8 py-6 rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.5)] border-4 border-indigo-400 transform -rotate-2 scale-110 mb-8 break-words">
                {{ winnerName() }}
              </div>
              
              <button (click)="closeWinnerModal()" class="mt-8 bg-slate-800 hover:bg-slate-700 text-white py-3 px-8 rounded-xl font-bold transition-colors border border-slate-600 uppercase tracking-widest">
                Fechar
              </button>
           </div>
        </div>
      }

      @if (showFalseAlarm()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center bg-red-900/90 backdrop-blur-md animate-fade-in">
           <div class="text-center animate-shake relative px-6 py-10 bg-slate-900 border-4 border-red-500 rounded-3xl shadow-2xl max-w-md mx-4">
              
              <lucide-icon [img]="Frown" class="w-24 h-24 text-red-500 mx-auto mb-4"></lucide-icon>

              <h1 class="text-4xl md:text-5xl font-black text-red-500 tracking-tighter mb-2 uppercase leading-none">
                COMEU<br>BRONHA!
              </h1>
              
              <div class="w-full h-1 bg-slate-700 my-4"></div>

              <p class="text-xl text-slate-300 font-bold mb-6">
                Faltam números na cartela.<br>
                <span class="text-yellow-400">Continuem jogando!</span>
              </p>
              
              <button (click)="showFalseAlarm.set(false)" class="w-full bg-red-600 hover:bg-red-500 text-white py-3 px-6 rounded-xl font-black text-lg shadow-lg transition-transform active:scale-95 uppercase">
                VOLTAR PRO JOGO
              </button>
           </div>
        </div>
      }

      <div class="mb-6 text-center w-full">
        <h2 class="text-4xl font-black text-yellow-400 drop-shadow-lg tracking-wider mb-2">BINGO</h2>
        
        <div class="flex justify-center gap-2 mb-4 flex-wrap">
          @for (mode of winningModes; track $index) {
            <span class="bg-indigo-900 text-indigo-200 text-[10px] px-2 py-1 rounded border border-indigo-700 font-bold uppercase">
              {{ translateMode(mode) }}
            </span>
          }
        </div>
        
        <div class="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full relative overflow-hidden shadow-2xl">
           <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse"></div>
           
           <p class="text-slate-400 text-xs font-bold uppercase mb-2">BOLA DA VEZ</p>
           <div class="flex justify-center items-center gap-4">
             <div class="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center border-4 border-slate-800 shadow-2xl transform transition-all" [ngClass]="{'scale-110': isAutoDrawing()}">
                <span class="text-5xl font-black text-white">{{ lastNumber() || '?' }}</span>
             </div>

             <div class="hidden sm:flex flex-col gap-1 ml-4 opacity-50">
                <span class="text-[10px] uppercase font-bold text-slate-500">Anteriores</span>
                <div class="flex gap-2">
                  @for (hist of history().slice(-4).reverse(); track $index) {
                    <div class="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-600 text-xs font-bold text-slate-300">
                      {{ hist }}
                    </div>
                  }
                </div>
             </div>
           </div>

           @if (isHost && !winnerName()) {
             <div class="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-3">
               <button (click)="drawNumber()" [disabled]="isAutoDrawing()"
                 class="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                 <span>SORTEAR MANUAL</span>
                 <span class="bg-slate-900 text-xs py-0.5 px-2 rounded-full">{{ history().length }}/75</span>
               </button>

               <button (click)="toggleAutoDraw()" 
                 [ngClass]="isAutoDrawing() ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500'"
                 class="w-full text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                 <lucide-icon [img]="isAutoDrawing() ? Pause : Play" class="w-5 h-5"></lucide-icon>
                 <span>{{ isAutoDrawing() ? 'PARAR AUTOMÁTICO' : 'INICIAR AUTOMÁTICO (4s)' }}</span>
               </button>
             </div>
           }
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl shadow-2xl w-full max-w-sm relative border-4 border-slate-200">
        
        <div class="grid grid-cols-5 gap-2 mb-3 text-center">
          <div class="font-black text-2xl text-red-600">B</div>
          <div class="font-black text-2xl text-red-600">I</div>
          <div class="font-black text-2xl text-red-600">N</div>
          <div class="font-black text-2xl text-red-600">G</div>
          <div class="font-black text-2xl text-red-600">O</div>
        </div>

        <div class="grid grid-cols-5 gap-2">
          @for (num of cardNumbers(); track $index) {
            <button (click)="toggleMark($index)" 
              class="aspect-square flex items-center justify-center font-bold text-lg sm:text-xl rounded-lg transition-all relative border-2 select-none shadow-sm"
              [ngClass]="marked()[$index] ? 'bg-red-500 text-white border-red-600 transform scale-95' : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'">
              
              @if (num === 0) {
                <span class="text-xs font-black opacity-80 tracking-tighter">FG</span>
              } @else {
                {{ num }}
              }
              
              @if (marked()[$index]) {
                <span class="absolute inset-0 flex items-center justify-center text-red-900 opacity-20 text-4xl font-black pointer-events-none">X</span>
              }
            </button>
          }
        </div>

        @if (!winnerName()) {
            <div class="mt-6">
              <button (click)="checkBingo()" 
                [disabled]="verifying()"
                class="w-full bg-gradient-to-b from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 disabled:from-slate-400 disabled:to-slate-500 text-red-900 font-black py-4 rounded-xl shadow-xl border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all text-xl tracking-widest flex items-center justify-center gap-2">
                <lucide-icon [img]="Trophy" class="w-6 h-6"></lucide-icon>
                {{ verifying() ? 'CONFERINDO...' : 'BINGO!' }}
              </button>
            </div>
        }
      </div>
    </div>
  `
})
export class BingoComponent implements OnInit, OnDestroy {
  @Input() isHost = false;
  @Input() roomId = '';
  @Input() winningModes: string[] = [];
  @Input() initialCard: number[] = []; 
  
  supabase = inject(SupabaseService);
  channel: RealtimeChannel | null = null;

  lastNumber = signal<number | null>(null);
  history = signal<number[]>([]);
  cardNumbers = signal<number[]>([]);
  marked = signal<boolean[]>(new Array(25).fill(false));
  
  verifying = signal(false);
  winnerName = signal<string | null>(null);
  showFalseAlarm = signal(false); // <--- CONTROLA O "COMEU BRONHA"
  isAutoDrawing = signal(false);

  readonly Play = Play;
  readonly Pause = Pause;
  readonly Trophy = Trophy;
  readonly Frown = Frown;

  private autoDrawInterval: any;

  ngOnInit() {
    if (this.initialCard && this.initialCard.length > 0) {
      // Organiza as colunas (B em B, I em I, etc)
      const organized = this.organizeCardByRows(this.initialCard);
      this.cardNumbers.set(organized);

      // Marca o FG (meio)
      const newMarks = new Array(25).fill(false);
      newMarks[12] = true; 
      this.marked.set(newMarks);
    }
    
    this.setupRealtime();
    this.recoverGameState();
  }

  // Organiza: Banco (Colunas) -> Tela (Linhas)
  organizeCardByRows(rawCard: number[]): number[] {
    const b = rawCard.slice(0, 5);
    const i = rawCard.slice(5, 10);
    const n = rawCard.slice(10, 14); // N tem 4 numeros
    const g = rawCard.slice(14, 19);
    const o = rawCard.slice(19, 24);

    n.splice(2, 0, 0); // Adiciona o 0 (FG) no meio do N

    const finalGrid: number[] = [];
    for (let row = 0; row < 5; row++) {
      finalGrid.push(b[row]);
      finalGrid.push(i[row]);
      finalGrid.push(n[row]);
      finalGrid.push(g[row]);
      finalGrid.push(o[row]);
    }
    return finalGrid;
  }

  ngOnDestroy() {
    this.stopAutoDraw();
    if (this.channel) this.supabase.client.removeChannel(this.channel);
  }

  toggleAutoDraw() {
    if (this.isAutoDrawing()) {
      this.stopAutoDraw();
    } else {
      this.isAutoDrawing.set(true);
      this.drawNumber();
      this.autoDrawInterval = setInterval(() => {
        if (this.history().length >= 75) {
          this.stopAutoDraw();
        } else {
          this.drawNumber();
        }
      }, 4000); 
    }
  }

  stopAutoDraw() {
    this.isAutoDrawing.set(false);
    if (this.autoDrawInterval) {
      clearInterval(this.autoDrawInterval);
      this.autoDrawInterval = null;
    }
  }

  async recoverGameState() {
      const { data } = await this.supabase.client
        .from('rooms')
        .select('drawn_numbers, winner_id')
        .eq('code', this.roomId)
        .single();
        
      if (data?.drawn_numbers) {
          this.history.set(data.drawn_numbers);
          const last = data.drawn_numbers[data.drawn_numbers.length - 1];
          if (last) this.lastNumber.set(last);
      }
      if (data?.winner_id) this.announceWinner(data.winner_id);
  }

  setupRealtime() {
    this.channel = this.supabase.client.channel(`room_${this.roomId}`);
    
    this.channel
      .on('broadcast', { event: 'bingo_draw' }, ({ payload }) => {
        this.updateGameRequest(payload.number);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${this.roomId}` }, (payload: any) => {
         const newWinner = payload.new['winner_id'];
         if (newWinner) {
             this.stopAutoDraw();
             if (!this.winnerName()) this.announceWinner(newWinner);
         }
      })
      .subscribe();
  }

  async announceWinner(winnerId: string) {
      const { data } = await this.supabase.client
          .from('room_players')
          .select('username')
          .eq('room_code', this.roomId)
          .eq('user_id', winnerId)
          .single();
      
      if (data) this.winnerName.set(data.username);
  }

  closeWinnerModal() {
    this.winnerName.set(null);
  }

  updateGameRequest(num: number) {
    this.lastNumber.set(num);
    this.history.update(h => [...h, num]);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200);
  }

  async drawNumber() {
    if (!this.isHost) return;
    if (this.history().length >= 75) { this.stopAutoDraw(); return; }

    let num;
    do { num = Math.floor(Math.random() * 75) + 1; } while (this.history().includes(num)); 

    this.updateGameRequest(num);
    await this.channel?.send({ type: 'broadcast', event: 'bingo_draw', payload: { number: num } });
    const currentDrawn = this.history();
    await this.supabase.client.from('rooms').update({ drawn_numbers: currentDrawn }).eq('code', this.roomId);
  }

  async checkBingo() {
    this.verifying.set(true);
    const { data: user } = await this.supabase.client.auth.getUser();

    // Chama o RPC (Função SQL)
    const { data: isWinner, error } = await this.supabase.client
        .rpc('check_bingo_winner', { 
            room_code_param: this.roomId, 
            player_id_param: user.user?.id 
        });

    if (error) {
        console.error(error);
        alert("Erro técnico na conferência.");
    } else if (!isWinner) {
        // --- AQUI ESTÁ A LÓGICA DO "COMEU BRONHA" ---
        this.showFalseAlarm.set(true); 
    }
    // Se isWinner for true, o Realtime vai disparar o "announceWinner" sozinho.
    
    this.verifying.set(false);
  }

  toggleMark(index: number) {
    if (this.cardNumbers()[index] === 0) return;
    const current = this.marked();
    current[index] = !current[index];
    this.marked.set([...current]);
  }

  translateMode(mode: string) {
    const map: any = { 'FULL': 'Cartela Cheia', 'LINE': 'Linha', 'COLUMN': 'Coluna', 'DIAGONAL': 'Diagonal' };
    return map[mode] || mode;
  }
}