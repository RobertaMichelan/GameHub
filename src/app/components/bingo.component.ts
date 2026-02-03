import { Component, Input, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../core/services/supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-bingo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center w-full max-w-2xl mx-auto p-4">
      
      <div class="mb-6 text-center w-full">
        <h2 class="text-4xl font-black text-yellow-400 drop-shadow-lg tracking-wider mb-2">BINGO</h2>
        
        <div class="flex justify-center gap-2 mb-4 flex-wrap">
          @for (mode of winningModes; track $index) {
            <span class="bg-indigo-900 text-indigo-200 text-[10px] px-2 py-1 rounded border border-indigo-700 font-bold uppercase">
              {{ translateMode(mode) }}
            </span>
          }
        </div>
        
        <div class="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full relative overflow-hidden">
           <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse"></div>
           
           <p class="text-slate-400 text-xs font-bold uppercase mb-2">BOLA DA VEZ</p>
           <div class="flex justify-center items-center gap-4">
             <div class="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center border-4 border-slate-800 shadow-2xl transform transition-all hover:scale-105">
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

           @if (isHost) {
             <div class="mt-6 pt-4 border-t border-slate-800">
               <button (click)="drawNumber()" 
                 class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                 <span>SORTEAR PRÓXIMA</span>
                 <span class="bg-emerald-800 text-xs py-0.5 px-2 rounded-full">{{ history().length }}/75</span>
               </button>
             </div>
           }
        </div>
      </div>

      <div class="bg-white p-3 rounded-xl shadow-2xl w-full max-w-sm aspect-[4/5] relative">
        <div class="grid grid-cols-5 gap-1 mb-2 text-center">
          <div class="font-black text-2xl text-red-600">B</div>
          <div class="font-black text-2xl text-red-600">I</div>
          <div class="font-black text-2xl text-red-600">N</div>
          <div class="font-black text-2xl text-red-600">G</div>
          <div class="font-black text-2xl text-red-600">O</div>
        </div>

        <div class="grid grid-cols-5 gap-1 h-full pb-16">
          @for (num of cardNumbers(); track $index) {
            <button (click)="toggleMark($index)" 
              class="aspect-square flex items-center justify-center font-bold text-xl rounded-md transition-all relative border-2 select-none"
              [ngClass]="marked()[$index] ? 'bg-red-500 text-white border-red-600' : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'">
              
              @if ($index === 12) {
                <span class="text-[10px] font-black opacity-50">FREE</span>
              } @else {
                {{ num }}
              }
              
              @if (marked()[$index]) {
                <span class="absolute inset-0 flex items-center justify-center text-red-900 opacity-20 text-4xl font-black pointer-events-none">X</span>
              }
            </button>
          }
        </div>

        <div class="absolute bottom-4 left-4 right-4">
          <button (click)="shoutBingo()" 
            class="w-full bg-yellow-500 hover:bg-yellow-400 text-red-900 font-black py-3 rounded-xl shadow-lg border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all text-xl tracking-widest animate-bounce">
            BINGO! 🏆
          </button>
        </div>
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

 ngOnInit() {
    if (this.initialCard && this.initialCard.length > 0) {
      // O banco manda 24 numeros. Precisamos de 25.
      // Vamos inserir o '0' (Free) na posição 12 (meio da cartela)
      const fullCard = [...this.initialCard];
      if (fullCard.length === 24) {
        fullCard.splice(12, 0, 0); // Insere o 0 no índice 12
      }
      
      this.cardNumbers.set(fullCard);
      
      // Marca o meio como FREE
      const newMarks = new Array(25).fill(false);
      newMarks[12] = true; 
      this.marked.set(newMarks);
    }
    
    this.setupRealtime();
  }

  ngOnDestroy() {
    if (this.channel) this.supabase.client.removeChannel(this.channel);
  }

  setupRealtime() {
    this.channel = this.supabase.client.channel(`room_${this.roomId}`);
    
    this.channel
      .on('broadcast', { event: 'bingo_draw' }, ({ payload }) => {
        this.updateGameRequest(payload.number);
      })
      .on('broadcast', { event: 'bingo_shout' }, ({ payload }) => {
        // Alerta na tela de todo mundo
        alert(`🎉 O JOGADOR ${payload.username} GRITOU BINGO! Conferiram a cartela?`);
      })
      .subscribe();
  }

  updateGameRequest(num: number) {
    this.lastNumber.set(num);
    this.history.update(h => [...h, num]);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200);
  }

  async drawNumber() {
    if (!this.isHost) return;

    let num;
    do {
      num = Math.floor(Math.random() * 75) + 1;
    } while (this.history().includes(num)); 

    this.updateGameRequest(num);

    await this.channel?.send({
      type: 'broadcast',
      event: 'bingo_draw',
      payload: { number: num }
    });
  }

  // --- MUDANÇA AQUI: Bingo Manual ---
  async shoutBingo() {
    const { data: user } = await this.supabase.client.auth.getUser();
    const username = user.user?.user_metadata['username'] || 'Alguém';

    // 1. Avisa geral que teve Bingo (via Socket)
    await this.channel?.send({
      type: 'broadcast',
      event: 'bingo_shout',
      payload: { username: username }
    });

    // 2. Reabre o Chat para conferência
    await this.supabase.client
        .from('rooms')
        .update({ chat_open: true }) 
        .eq('code', this.roomId);
        
    // 3. Alerta local
    alert(`📢 Você gritou BINGO! Aguarde a conferência.`);
  }

  toggleMark(index: number) {
    if (index === 12) return;
    const current = this.marked();
    current[index] = !current[index];
    this.marked.set([...current]);
  }

  translateMode(mode: string) {
    const map: any = { 
      'FULL': 'Cartela Cheia', 
      'LINE': 'Linha', 
      'COLUMN': 'Coluna', 
      'DIAGONAL': 'Diagonal' 
    };
    return map[mode] || mode;
  }
}