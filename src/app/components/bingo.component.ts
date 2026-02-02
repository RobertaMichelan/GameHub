import { Component, Input, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// AQUI ESTAVA O ERRO: Mudamos de '../../' para '../'
import { SupabaseService } from '../core/services/supabase.service';

@Component({
  selector: 'app-bingo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center w-full max-w-2xl mx-auto p-4">
      
      <div class="mb-8 text-center">
        <h2 class="text-4xl font-black text-yellow-400 drop-shadow-lg tracking-wider">BINGO</h2>
        <p class="text-slate-400 text-sm mt-1">
          {{ isHost ? 'Você está sorteando!' : 'Marque sua cartela!' }}
        </p>
      </div>

      @if (isHost) {
        <div class="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full mb-8 text-center">
          <div class="text-sm text-slate-500 font-bold uppercase mb-2">Última Bola</div>
          
          <div class="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center border-4 border-slate-800 shadow-2xl mb-6 relative">
            <span class="text-6xl font-black text-white">{{ lastNumber() || '?' }}</span>
          </div>

          <button (click)="drawNumber()" 
            class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-12 rounded-full shadow-lg text-xl transition-transform active:scale-95 w-full md:w-auto">
            SORTEAR NÚMERO
          </button>
        </div>
      }

      <div class="bg-white p-2 rounded-xl shadow-2xl w-full max-w-sm aspect-[4/5]">
        <div class="grid grid-cols-5 gap-1 mb-2 text-center">
          <div class="font-black text-2xl text-red-600">B</div>
          <div class="font-black text-2xl text-red-600">I</div>
          <div class="font-black text-2xl text-red-600">N</div>
          <div class="font-black text-2xl text-red-600">G</div>
          <div class="font-black text-2xl text-red-600">O</div>
        </div>

        <div class="grid grid-cols-5 gap-1 h-full pb-2">
          @for (num of cardNumbers(); track $index) {
            <button (click)="toggleMark($index)" 
              [disabled]="isHost"
              class="aspect-square flex items-center justify-center font-bold text-xl rounded-md transition-all relative border-2"
              [ngClass]="marked()[$index] ? 'bg-red-500 text-white border-red-600' : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'">
              
              @if ($index === 12) {
                <span class="text-xs font-black opacity-50">FREE</span>
              } @else {
                {{ num }}
              }
              
              @if (marked()[$index]) {
                <span class="absolute inset-0 flex items-center justify-center text-red-800 opacity-20 text-4xl font-black pointer-events-none">X</span>
              }
            </button>
          }
        </div>
      </div>

    </div>
  `
})
export class BingoComponent implements OnInit {
  @Input() isHost = false;
  @Input() roomId = '';
  
  supabase = inject(SupabaseService);

  // Estados
  lastNumber = signal<number | null>(null);
  cardNumbers = signal<number[]>([]);
  marked = signal<boolean[]>(new Array(25).fill(false));

  ngOnInit() {
    this.generateCard();
  }

  // Gera uma cartela válida de Bingo
  generateCard() {
    const card: number[] = [];
    const ranges = [[1,15], [16,30], [31,45], [46,60], [61,75]];

    for (let i = 0; i < 5; i++) { 
      for (let j = 0; j < 5; j++) { 
        if (i === 2 && j === 2) {
          card.push(0); 
        } else {
          const min = ranges[j][0];
          const max = ranges[j][1];
          let num;
          do {
            num = Math.floor(Math.random() * (max - min + 1)) + min;
          } while (card.includes(num));
          card.push(num);
        }
      }
    }
    this.cardNumbers.set(card);
    
    // Marca o meio (Free) automaticamente
    const newMarks = [...this.marked()];
    newMarks[12] = true;
    this.marked.set(newMarks);
  }

  toggleMark(index: number) {
    if (index === 12) return;
    const current = this.marked();
    current[index] = !current[index];
    this.marked.set([...current]);
  }

  drawNumber() {
    const num = Math.floor(Math.random() * 75) + 1;
    this.lastNumber.set(num);
  }
}