import { Component, Input, signal, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../core/services/supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';
import { LucideAngularModule, Play, Pause, Trophy, Frown, Heart, Zap } from 'lucide-angular';

@Component({
  selector: 'app-bingo',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex flex-col items-center w-full max-w-2xl mx-auto p-4 pb-20 relative">
      
      @if (nearWins() > 0 && !winnerName()) {
        <div class="fixed top-20 right-4 z-40 animate-bounce-in">
           <div class="bg-pink-600 text-white px-4 py-2 rounded-full shadow-xl border-2 border-pink-400 flex items-center gap-2 animate-pulse">
              <lucide-icon [img]="Heart" class="w-6 h-6 fill-current"></lucide-icon>
              <span class="font-black text-lg">{{ nearWins() }}</span>
              <span class="text-xs font-bold uppercase tracking-tighter">Por uma boa!</span>
           </div>
        </div>
      }

      @if (winnerName()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
           <div class="text-center animate-bounce-in relative px-4 w-full max-w-lg">
              <div class="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
              <div class="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
              <h1 class="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-2xl mb-4">BINGO!</h1>
              <p class="text-2xl text-white font-bold uppercase tracking-widest mb-6">Vencedor</p>
              <div class="bg-indigo-600 text-white text-3xl md:text-5xl font-black px-8 py-6 rounded-2xl shadow-xl border-4 border-indigo-400 transform -rotate-2 mb-8 break-words">{{ winnerName() }}</div>
              <button (click)="closeWinnerModal()" class="mt-8 bg-slate-800 hover:bg-slate-700 text-white py-3 px-8 rounded-xl font-bold uppercase">Fechar</button>
           </div>
        </div>
      }

      @if (showFalseAlarm()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center bg-red-900/90 backdrop-blur-md animate-fade-in">
           <div class="text-center animate-shake px-6 py-10 bg-slate-900 border-4 border-red-500 rounded-3xl shadow-2xl max-w-md mx-4">
              <lucide-icon [img]="Frown" class="w-24 h-24 text-red-500 mx-auto mb-4"></lucide-icon>
              <h1 class="text-4xl font-black text-red-500 uppercase leading-none">COMEU<br>BRONHA!</h1>
              <p class="text-xl text-slate-300 font-bold mt-4">A cartela não está completa.<br><span class="text-yellow-400">Continuem jogando!</span></p>
              <button (click)="resumeAfterFalseAlarm()" class="w-full mt-6 bg-red-600 text-white py-3 rounded-xl font-black uppercase">VOLTAR AO JOGO</button>
           </div>
        </div>
      }

      <div class="mb-6 text-center w-full">
        <h2 class="text-4xl font-black text-yellow-400 tracking-wider mb-2">BINGO</h2>
        <div class="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full shadow-2xl">
           <p class="text-slate-400 text-xs font-bold uppercase mb-2">BOLA DA VEZ</p>
           <div class="flex justify-center items-center gap-4">
             <div class="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center border-4 border-slate-800 shadow-2xl transition-all" [ngClass]="{'scale-110': isAutoDrawing()}">
                <span class="text-5xl font-black text-white">{{ lastNumber() || '?' }}</span>
             </div>
           </div>

           @if (isHost && !winnerName()) {
             <div class="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-3">
               <button (click)="drawNumber()" [disabled]="isAutoDrawing()" class="w-full bg-slate-700 text-white font-bold py-3 rounded-xl">SORTEAR MANUAL ({{ history().length }}/75)</button>
               <button (click)="toggleAutoDraw()" [ngClass]="isAutoDrawing() ? 'bg-red-600 animate-pulse' : 'bg-emerald-600'" class="w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                 <lucide-icon [img]="isAutoDrawing() ? Pause : Play" class="w-5 h-5"></lucide-icon>
                 <span>{{ isAutoDrawing() ? 'PARAR AUTOMÁTICO' : 'INICIAR AUTOMÁTICO' }}</span>
               </button>
             </div>
           }
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl shadow-2xl w-full max-w-sm relative border-4 border-slate-200">
        <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 shadow-lg">
           <lucide-icon [img]="Zap" class="w-3 h-3"></lucide-icon> Conferência Automática Ativa
        </div>

        <div class="grid grid-cols-5 gap-2 mb-3 text-center mt-2">
          @for (letter of ['B','I','N','G','O']; track letter) { <div class="font-black text-2xl text-red-600">{{letter}}</div> }
        </div>

        <div class="grid grid-cols-5 gap-2">
            @for (num of cardNumbers(); track $index) {
                <button (click)="toggleMark($index)" 
                class="aspect-square flex items-center justify-center font-bold text-lg sm:text-xl rounded-lg transition-all relative border-2 select-none"
                [ngClass]="getButtonClass(num, $index)">
                    @if (num === 0) { <span class="text-[10px] font-black opacity-80">FG</span> } 
                    @else { {{ num }} }
                    
                    @if (isMarkedOrDrawn(num, $index)) {
                        <span class="absolute inset-0 flex items-center justify-center text-red-900 opacity-30 text-4xl font-black pointer-events-none">X</span>
                    }
                </button>
            }
        </div>

        @if (!winnerName()) {
            <div class="mt-6">
              <button (click)="checkBingo()" [disabled]="verifying()" class="w-full bg-yellow-400 hover:bg-yellow-500 text-red-900 font-black py-4 rounded-xl shadow-xl border-b-4 border-yellow-700 transition-all text-xl flex items-center justify-center gap-2">
                <lucide-icon [img]="Trophy" class="w-6 h-6"></lucide-icon>
                {{ verifying() ? 'CONFERINDO...' : 'BINGO!' }}
              </button>
            </div>
        }
      </div>
    </div>
  `
})
export class BingoComponent implements OnInit, OnDestroy, OnChanges {
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
  showFalseAlarm = signal(false);
  isAutoDrawing = signal(false);
  drawSpeed = signal(4000); 
  nearWins = signal(0); 

  readonly Play = Play; readonly Pause = Pause; readonly Trophy = Trophy;
  readonly Frown = Frown; readonly Heart = Heart; readonly Zap = Zap;

  private autoDrawInterval: any;

  ngOnInit() {
    this.initCard();
    this.setupRealtime();
    this.recoverGameState();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialCard']) this.initCard();
  }

  initCard() {
    if (this.initialCard && this.initialCard.length > 0) {
      // O DB retorna arrays planos: [B1..B5, I1..I5, N1..N4, G1..G5, O1..O5]
      // Precisamos mapear isso para as colunas
      const b = this.initialCard.slice(0, 5);
      const i = this.initialCard.slice(5, 10);
      let n = this.initialCard.slice(10, 14);
      n.splice(2, 0, 0); // Insere o FG (0) no meio da coluna N
      const g = this.initialCard.slice(14, 19);
      const o = this.initialCard.slice(19, 24);

      // Transforma Colunas em Linhas para o Grid HTML (5x5)
      const grid: number[] = [];
      for (let row = 0; row < 5; row++) {
        grid.push(b[row], i[row], n[row], g[row], o[row]);
      }
      this.cardNumbers.set(grid);

      // Marca o FG automaticamente
      const m = new Array(25).fill(false);
      m[12] = true;
      this.marked.set(m);
    }
  }

  isMarkedOrDrawn(num: number, index: number): boolean {
    if (num === 0) return true;
    return this.marked()[index] || this.history().includes(num);
  }

  getButtonClass(num: number, index: number): string {
    if (this.isMarkedOrDrawn(num, index)) {
        return 'bg-red-500 text-white border-red-600 transform scale-95 shadow-inner';
    }
    return 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100';
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
      if (this.autoDrawInterval) clearInterval(this.autoDrawInterval);
      this.autoDrawInterval = setInterval(() => {
        if (this.history().length >= 75 || this.winnerName()) {
          this.stopAutoDraw();
          return;
        }
        this.drawNumber();
      }, this.drawSpeed()); 
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
      const { data } = await this.supabase.client.from('rooms').select('drawn_numbers, winner_id').eq('code', this.roomId).single();
      if (data?.drawn_numbers) {
          this.history.set(data.drawn_numbers);
          const last = data.drawn_numbers[data.drawn_numbers.length - 1];
          if (last) this.lastNumber.set(last);
      }
      if (data?.winner_id) this.announceWinner(data.winner_id);
      this.updateNearWinStats();
  }

  setupRealtime() {
    this.channel = this.supabase.client.channel(`room_${this.roomId}`);
    this.channel
      .on('broadcast', { event: 'bingo_draw' }, ({ payload }) => {
        this.lastNumber.set(payload.number);
        this.history.update(h => [...h, payload.number]);
        this.updateNearWinStats(); // Atualiza stats localmente para todos
      })
      .on('broadcast', { event: 'stop_drawing' }, () => this.stopAutoDraw())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${this.roomId}` }, (payload: any) => {
         if (payload.new.winner_id) {
             this.stopAutoDraw();
             this.announceWinner(payload.new.winner_id);
         }
      })
      .subscribe();
  }

  async announceWinner(winnerId: string) {
      const { data } = await this.supabase.client.from('room_players').select('username').eq('room_code', this.roomId).eq('user_id', winnerId).single();
      if (data) this.winnerName.set(data.username);
  }

  closeWinnerModal() { this.winnerName.set(null); }
  
  async drawNumber() {
    if (!this.isHost || this.winnerName()) return;
    if (this.history().length >= 75) { this.stopAutoDraw(); return; }

    let num;
    let attempts = 0;
    do { num = Math.floor(Math.random() * 75) + 1; attempts++; } while (this.history().includes(num) && attempts < 200); 
    if (attempts >= 200) { this.stopAutoDraw(); return; }

    // Envia o número para o Realtime (Visual rápido)
    await this.channel?.send({ type: 'broadcast', event: 'bingo_draw', payload: { number: num } });
    
    // Atualiza o Banco
    const currentDrawn = [...this.history(), num];
    await this.supabase.client.from('rooms').update({ drawn_numbers: currentDrawn }).eq('code', this.roomId);
    
    // Chama o Juiz Automático
    await this.supabase.client.rpc('check_any_winner', { room_code_param: this.roomId });
  }

  async checkBingo() {
    this.verifying.set(true);
    await this.channel?.send({ type: 'broadcast', event: 'stop_drawing', payload: {} });
    this.stopAutoDraw();

    const { data: { user } } = await this.supabase.client.auth.getUser();
    const { data: isWinner, error } = await this.supabase.client.rpc('check_bingo_winner', { room_code_param: this.roomId, player_id_param: user?.id });

    if (error) { console.error(error); alert("Erro técnico na conferência."); }
    else if (!isWinner) { this.showFalseAlarm.set(true); }
    this.verifying.set(false);
  }

  resumeAfterFalseAlarm() { this.showFalseAlarm.set(false); }
  
  async updateNearWinStats() {
    // Busca a contagem de "por uma boa" do banco
    const { data: count } = await this.supabase.client.rpc('get_near_win_count', { room_code_param: this.roomId });
    this.nearWins.set(count || 0);
  }

  toggleMark(i: number) { this.marked.update(m => { m[i] = !m[i]; return [...m]; }); }
}