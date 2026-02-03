import { Component, Input, signal, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../core/services/supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { LucideAngularModule, Play, Pause, Trophy, Frown, Heart, Zap, X, RefreshCw, Power, CheckCircle, AlertTriangle, Grid3X3 } from 'lucide-angular';

@Component({
  selector: 'app-bingo',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  // ESTILOS DO CARIMBO
  styles: [`
    @keyframes stampIn {
      0% { transform: scale(3) rotate(-20deg); opacity: 0; }
      50% { transform: scale(0.8) rotate(5deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    .animate-stamp-in {
      animation: stampIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
  `],
  template: `
    <div class="flex flex-col items-center w-full max-w-2xl mx-auto p-4 pb-20 relative">
      
      @if (showHistoryModal()) {
        <div class="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in p-4">
          <div class="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
             <div class="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-2xl">
                <div>
                   <h3 class="text-white font-black text-xl flex items-center gap-2">
                     <lucide-icon [img]="Grid3X3" class="w-5 h-5 text-indigo-500"></lucide-icon>
                     Números Sorteados
                   </h3>
                   <p class="text-slate-400 text-xs">Total: {{ history().length }} / 75</p>
                </div>
                <button (click)="showHistoryModal.set(false)" class="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><lucide-icon [img]="X" class="w-6 h-6"></lucide-icon></button>
             </div>
             <div class="p-4 overflow-y-auto grid grid-cols-10 gap-1 sm:gap-2 justify-items-center">
                @for (num of allNumbers; track num) {
                   <div class="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-xs sm:text-sm font-bold border transition-all"
                        [ngClass]="history().includes(num) ? 'bg-indigo-600 text-white border-indigo-400 scale-110 shadow-lg' : 'bg-slate-800 text-slate-600 border-slate-800 opacity-50'">{{ num }}</div>
                }
             </div>
             <div class="p-4 border-t border-slate-800 bg-slate-950 rounded-b-2xl"><button (click)="showHistoryModal.set(false)" class="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold uppercase">Voltar</button></div>
          </div>
        </div>
      }

      @if (isHost && pendingClaim()) {
        <div class="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-md animate-bounce-in px-4">
           <div class="bg-slate-900 border-2 border-yellow-500 w-full max-w-md rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.3)] p-6 text-center">
              <div class="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                 <lucide-icon [img]="AlertTriangle" class="w-8 h-8 text-yellow-500"></lucide-icon>
              </div>
              <h2 class="text-2xl font-black text-white mb-2">PEDIDO DE BINGO!</h2>
              <p class="text-slate-300 mb-6">O jogador <strong class="text-yellow-400 text-xl">{{ pendingClaim()?.name }}</strong> diz que ganhou.</p>
              
              <div class="flex flex-col gap-3">
                 <button (click)="validateClaim()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black uppercase shadow-lg flex items-center justify-center gap-2">
                    <lucide-icon [img]="CheckCircle" class="w-6 h-6"></lucide-icon> CONFERIR CARTELA
                 </button>
                 <button (click)="rejectClaim()" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold uppercase">Ignorar</button>
              </div>
           </div>
        </div>
      }

      @if (winnerName()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
           <div class="text-center animate-bounce-in relative px-4 w-full max-w-lg">
              <div class="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
              <h1 class="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-2xl mb-4">BINGO!</h1>
              <p class="text-2xl text-white font-bold uppercase tracking-widest mb-6">Vencedor Confirmado</p>
              <div class="bg-indigo-600 text-white text-3xl md:text-5xl font-black px-8 py-6 rounded-2xl shadow-xl border-4 border-indigo-400 transform -rotate-2 mb-8 break-words">{{ winnerName() }}</div>
              
              @if (isHost) {
                 <div class="mt-10 flex flex-col gap-3">
                    <button (click)="restartGame()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black uppercase shadow-lg flex items-center justify-center gap-2"><lucide-icon [img]="RefreshCw" class="w-6 h-6"></lucide-icon> Nova Partida</button>
                    <button (click)="resumeGameAfterWin()" class="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded-xl font-bold uppercase shadow-lg flex items-center justify-center gap-2"><lucide-icon [img]="Play" class="w-5 h-5"></lucide-icon> Continuar Jogando</button>
                    <button (click)="endRoom()" class="w-full bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-600 py-3 rounded-xl font-bold uppercase flex items-center justify-center gap-2"><lucide-icon [img]="Power" class="w-5 h-5"></lucide-icon> Fechar Sala</button>
                 </div>
              } @else {
                 <p class="mt-8 text-slate-400 font-bold animate-pulse">Aguardando decisão do organizador...</p>
              }
           </div>
        </div>
      }

      @if (falseAlarmUser()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center bg-red-900/90 backdrop-blur-md animate-fade-in">
           <div class="text-center animate-shake px-6 py-10 bg-slate-900 border-4 border-red-500 rounded-3xl shadow-2xl max-w-md mx-4">
              <lucide-icon [img]="Frown" class="w-24 h-24 text-red-500 mx-auto mb-4"></lucide-icon>
              <h1 class="text-4xl font-black text-red-500 uppercase leading-none">ALARME FALSO!</h1>
              <div class="bg-slate-800 p-4 rounded-xl mt-4 mb-4 border border-red-500/30">
                 <p class="text-slate-400 text-sm font-bold uppercase mb-1">Quem "Comeu Bronha"?</p>
                 <p class="text-2xl text-white font-black">{{ falseAlarmUser() }}</p>
              </div>
              <p class="text-xl text-slate-300 font-bold mt-4">O jogo continua!</p>
              @if (isHost) {
                  <button (click)="clearFalseAlarm()" class="w-full mt-6 bg-red-600 text-white py-3 rounded-xl font-black uppercase">REMOVER AVISO</button>
              }
           </div>
        </div>
      }

      <div class="mb-6 text-center w-full">
        <h2 class="text-4xl font-black text-yellow-400 drop-shadow-lg tracking-wider mb-2">BINGO</h2>
        
        <div class="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full shadow-2xl relative overflow-hidden">
           <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse"></div>
           <p class="text-slate-400 text-xs font-bold uppercase mb-2">BOLA DA VEZ</p>
           <div class="flex justify-center items-center gap-4">
             <div class="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center border-4 border-slate-800 shadow-2xl transition-all" [ngClass]="{'scale-110': isAutoDrawing()}">
                <span class="text-5xl font-black text-white">{{ lastNumber() || '?' }}</span>
             </div>
             <div (click)="showHistoryModal.set(true)" class="hidden sm:flex flex-col gap-1 ml-4 cursor-pointer group" title="Ver Histórico">
                <span class="text-[10px] uppercase font-bold text-slate-500 group-hover:text-indigo-400 transition-colors flex items-center gap-1">Anteriores <lucide-icon [img]="Grid3X3" class="w-3 h-3"></lucide-icon></span>
                <div class="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                  @for (hist of history().slice(-4).reverse(); track $index) {
                    <div class="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-600 text-xs font-bold text-slate-300 group-hover:border-indigo-500 group-hover:text-white">{{ hist }}</div>
                  }
                </div>
             </div>
           </div>
           
           <div class="sm:hidden mt-4">
              <button (click)="showHistoryModal.set(true)" class="text-xs text-indigo-400 font-bold uppercase border border-indigo-500/30 px-3 py-1.5 rounded-full hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-2 mx-auto"><lucide-icon [img]="Grid3X3" class="w-3 h-3"></lucide-icon> Ver Sorteados ({{ history().length }})</button>
           </div>

           @if (isHost && !winnerName()) {
             <div class="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-3 animate-fade-in">
               <button (click)="drawNumber()" [disabled]="isAutoDrawing()" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg active:scale-95 disabled:opacity-50">SORTEAR MANUAL</button>
               @if (!isAutoDrawing()) {
                 <div class="flex justify-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                   <p class="text-[10px] text-slate-400 uppercase font-bold flex items-center mr-2">Velocidade:</p>
                   @for (s of [2, 3, 4]; track s) {
                     <button (click)="drawSpeed.set(s * 1000)" class="px-3 py-1 text-xs font-bold rounded transition-colors" [ngClass]="drawSpeed() === s * 1000 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'">{{ s }}s</button>
                   }
                 </div>
               }
               <button (click)="toggleAutoDraw()" [ngClass]="isAutoDrawing() ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500'" class="w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors active:scale-95">
                 <lucide-icon [img]="isAutoDrawing() ? Pause : Play" class="w-5 h-5"></lucide-icon>
                 <span>{{ isAutoDrawing() ? 'PARAR AUTOMÁTICO' : 'INICIAR AUTOMÁTICO' }}</span>
               </button>
             </div>
           }
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl shadow-2xl w-full max-w-sm relative border-4 border-slate-200">
        <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 shadow-lg"><lucide-icon [img]="Zap" class="w-3 h-3"></lucide-icon> Conferência Automática Ativa</div>

        <div class="grid grid-cols-5 gap-2 mb-3 text-center mt-2">
          @for (letter of ['B','I','N','G','O']; track letter) { <div class="font-black text-2xl text-red-600">{{letter}}</div> }
        </div>

        <div class="grid grid-cols-5 gap-2 min-h-[300px]">
          @if (cardNumbers().length > 0) {
            @for (num of cardNumbers(); track $index) {
                <button (click)="toggleMark($index)" 
                class="aspect-square flex items-center justify-center font-bold text-lg sm:text-xl rounded-lg transition-all relative border-2 select-none"
                [ngClass]="getButtonClass(num, $index)">
                    
                    @if (num === 0) { 
                        <div class="w-full h-full flex items-center justify-center">
                            <img src="assets/icon.png" alt="FG" class="w-8 h-8 object-contain opacity-90 drop-shadow-md">
                        </div>
                    } 
                    @else { {{ num }} }
                    
                    @if (num !== 0 && isMarkedOrDrawn(num, $index)) { 
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <img src="assets/stamp.png" class="w-[90%] h-[90%] object-contain animate-stamp-in drop-shadow-md">
                        </div>
                    }
                </button>
            }
          } @else {
             <div class="col-span-5 flex flex-col items-center justify-center text-slate-400 py-10 gap-2">
                <div class="w-8 h-8 border-4 border-slate-300 border-t-indigo-500 rounded-full animate-spin"></div>
                <p class="text-xs font-bold">Carregando...</p>
             </div>
          }
        </div>

        @if (!winnerName()) {
            <div class="mt-6">
              <button (click)="requestBingoClaim()" [disabled]="verifying()" class="w-full bg-yellow-400 hover:bg-yellow-500 text-red-900 font-black py-4 rounded-xl shadow-xl border-b-4 border-yellow-700 transition-all text-xl flex items-center justify-center gap-2 active:border-b-0 active:translate-y-1">
                <lucide-icon [img]="Trophy" class="w-6 h-6"></lucide-icon> {{ verifying() ? 'AVISAR ORGANIZADOR...' : 'BINGO!' }}
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
  router = inject(Router);
  channel: RealtimeChannel | null = null;

  // Estados do Jogo
  lastNumber = signal<number | null>(null);
  history = signal<number[]>([]);
  cardNumbers = signal<number[]>([]);
  marked = signal<boolean[]>(new Array(25).fill(false));
  
  // Estados de Controle
  verifying = signal(false);
  winnerName = signal<string | null>(null);
  falseAlarmUser = signal<string | null>(null);
  showHistoryModal = signal(false);
  
  // Controle do Host
  isAutoDrawing = signal(false);
  drawSpeed = signal(4000); 
  nearWins = signal(0); 
  pendingClaim = signal<{name: string, id: string} | null>(null);

  // Ícones
  readonly allNumbers = Array.from({length: 75}, (_, i) => i + 1);
  readonly Play = Play; readonly Pause = Pause; readonly Trophy = Trophy;
  readonly Frown = Frown; readonly Heart = Heart; readonly Zap = Zap;
  readonly Grid3X3 = Grid3X3; readonly X = X; 
  readonly RefreshCw = RefreshCw; readonly Power = Power; readonly CheckCircle = CheckCircle; readonly AlertTriangle = AlertTriangle;

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
      const b = this.initialCard.slice(0, 5); const i = this.initialCard.slice(5, 10);
      let n = this.initialCard.slice(10, 14); n.splice(2, 0, 0); 
      const g = this.initialCard.slice(14, 19); const o = this.initialCard.slice(19, 24);

      const grid: number[] = [];
      for (let row = 0; row < 5; row++) grid.push(b[row], i[row], n[row], g[row], o[row]);
      this.cardNumbers.set(grid);
      const m = new Array(25).fill(false); m[12] = true; this.marked.set(m);
    }
  }

  getButtonClass(num: number, index: number): string {
    // Fundo Escuro para o Ícone Central (FG)
    if (index === 12) return 'bg-slate-950 text-slate-500 border-slate-800 shadow-inner';
    
    // NOTA: Removi a cor vermelha de fundo para o carimbo aparecer melhor.
    // Se quiser o fundo vermelho + carimbo, descomente a linha abaixo.
    // if (this.isMarkedOrDrawn(num, index)) return 'bg-red-100 text-red-900 border-red-300';

    return 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100';
  }

  isMarkedOrDrawn(num: number, index: number): boolean {
    if (num === 0) return true;
    return this.marked()[index] || this.history().includes(num);
  }

  setupRealtime() {
    this.channel = this.supabase.client.channel(`room_${this.roomId}`);
    this.channel
      .on('broadcast', { event: 'bingo_draw' }, ({ payload }) => {
        this.lastNumber.set(payload.number);
        this.history.update(h => [...h, payload.number]);
        this.updateNearWinStats();
      })
      .on('broadcast', { event: 'stop_drawing' }, () => this.stopAutoDraw())
      .on('broadcast', { event: 'claim_attempt' }, ({ payload }) => {
          this.stopAutoDraw(); 
          if (this.isHost) this.pendingClaim.set(payload); 
      })
      .on('broadcast', { event: 'game_win' }, ({ payload }) => {
          this.winnerName.set(payload.winnerName || 'Vencedor'); 
          this.pendingClaim.set(null); 
      })
      .on('broadcast', { event: 'false_alarm' }, ({ payload }) => {
          this.pendingClaim.set(null);
          this.falseAlarmUser.set(payload.username || 'Alguém');
      })
      .on('broadcast', { event: 'clear_alarm' }, () => {
          this.falseAlarmUser.set(null);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${this.roomId}` }, (payload: any) => {
         if (payload.new.status === 'WAITING' && this.history().length > 0) window.location.reload();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rooms', filter: `code=eq.${this.roomId}` }, () => {
         alert('🚫 A sala foi encerrada pelo organizador.');
         this.router.navigate(['/lobby']);
      })
      .subscribe();
  }

  async requestBingoClaim() {
    this.verifying.set(true);
    const { data: { user } } = await this.supabase.client.auth.getUser();
    const username = user?.user_metadata['username'] || 'Alguém';
    await this.channel?.send({ type: 'broadcast', event: 'claim_attempt', payload: { name: username, id: user?.id } });
    alert('🔔 O organizador foi avisado! Aguarde a conferência na tela.');
    this.verifying.set(false);
  }

  async validateClaim() {
    if (!this.pendingClaim()) return;
    const { data: winnerName, error } = await this.supabase.client.rpc('verify_card_only', { 
        room_code_param: this.roomId, 
        player_id_param: this.pendingClaim()?.id
    });

    if (error) { console.error(error); alert("Erro ao conferir."); } 
    else if (winnerName) {
        await this.channel?.send({ type: 'broadcast', event: 'game_win', payload: { winnerName: winnerName } });
        this.winnerName.set(winnerName);
        await this.supabase.client.rpc('finish_game_official', { room_code_param: this.roomId, winner_id_param: this.pendingClaim()?.id });
        this.pendingClaim.set(null);
    } else {
        await this.channel?.send({ type: 'broadcast', event: 'false_alarm', payload: { username: this.pendingClaim()?.name } });
        this.falseAlarmUser.set(this.pendingClaim()?.name || null);
        this.pendingClaim.set(null);
    }
  }

  rejectClaim() { this.pendingClaim.set(null); }

  async clearFalseAlarm() {
      await this.channel?.send({ type: 'broadcast', event: 'clear_alarm', payload: {} });
      this.falseAlarmUser.set(null);
  }

  async resumeGameAfterWin() {
      await this.supabase.client.from('rooms').update({ winner_id: null, status: 'PLAYING' }).eq('code', this.roomId);
      this.winnerName.set(null);
  }

  ngOnDestroy() { this.stopAutoDraw(); if (this.channel) this.supabase.client.removeChannel(this.channel); }
  
  toggleAutoDraw() {
    if (this.isAutoDrawing()) { this.stopAutoDraw(); } 
    else { this.isAutoDrawing.set(true); this.drawNumber(); 
    this.autoDrawInterval = setInterval(() => { if (this.history().length >= 75 || this.winnerName() || this.pendingClaim()) { this.stopAutoDraw(); return; } this.drawNumber(); }, this.drawSpeed()); }
  }
  
  stopAutoDraw() { this.isAutoDrawing.set(false); if (this.autoDrawInterval) clearInterval(this.autoDrawInterval); }

  async drawNumber() {
    if (!this.isHost || this.winnerName() || this.pendingClaim()) return;
    let num; do { num = Math.floor(Math.random() * 75) + 1; } while (this.history().includes(num)); 
    this.lastNumber.set(num); this.history.update(h => [...h, num]);
    await this.channel?.send({ type: 'broadcast', event: 'bingo_draw', payload: { number: num } });
    const currentDrawn = [...this.history()];
    this.supabase.client.from('rooms').update({ drawn_numbers: currentDrawn }).eq('code', this.roomId).then();
    this.updateNearWinStats();
  }

  async recoverGameState() {
      const { data } = await this.supabase.client.from('rooms').select('drawn_numbers, winner_id').eq('code', this.roomId).single();
      if (data?.drawn_numbers) { this.history.set(data.drawn_numbers); if (data.drawn_numbers.length) this.lastNumber.set(data.drawn_numbers[data.drawn_numbers.length-1]); }
      if (data?.winner_id) this.announceWinner(data.winner_id);
      this.updateNearWinStats();
  }
  
  async announceWinner(winnerId: string) {
      const { data } = await this.supabase.client.from('room_players').select('username').eq('room_code', this.roomId).eq('user_id', winnerId).single();
      if (data) this.winnerName.set(data.username);
  }
  
  closeWinnerModal() { /* Bloqueado para jogadores */ }
  async updateNearWinStats() { if (this.isHost) { const { data } = await this.supabase.client.rpc('get_near_win_count', { room_code_param: this.roomId }); this.nearWins.set(data || 0); await this.channel?.send({ type: 'broadcast', event: 'stats_update', payload: { nearWins: data || 0 } }); } }
  resumeAfterFalseAlarm() { this.falseAlarmUser.set(null); }
  async restartGame() { if(confirm('Zerar tudo?')) await this.supabase.client.rpc('restart_game', { room_code_param: this.roomId }); }
  async endRoom() { if(confirm('Apagar sala?')) { await this.supabase.client.from('rooms').delete().eq('code', this.roomId); window.location.href = '/lobby'; } }
  
  // Função necessária para checkBingo (não usada mais, mas para evitar erro de compilação se o template chamar)
  async checkBingo() { this.requestBingoClaim(); }

  toggleMark(i: number) { this.marked.update(m => { m[i] = !m[i]; return [...m]; }); }
}