import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, LogIn, Users, Plus, Globe, Lock, AlertTriangle, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute top-10 left-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div class="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
      </div>

      <div class="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div class="flex flex-col gap-6">
          <div class="text-center md:text-left">
             <img src="assets/finalgame-logo.png" alt="Final Game" class="h-16 mx-auto md:mx-0 mb-2 drop-shadow-xl">
             <p class="text-slate-400">O melhor Bingo Multiplayer em tempo real.</p>
          </div>

          @if (!user()) {
            <div class="bg-yellow-500/10 border border-yellow-500/40 p-4 rounded-xl flex flex-col gap-2">
               <div class="flex items-center gap-2 text-yellow-500 font-bold uppercase text-xs tracking-wider">
                  <lucide-icon [img]="AlertTriangle" class="w-4 h-4"></lucide-icon> Conta de Convidado
               </div>
               <p class="text-slate-300 text-sm">
                 Seu histórico será <strong>apagado após 15 minutos de inatividade</strong>.
               </p>
               <button (click)="loginWithGoogle()" class="text-left text-yellow-400 hover:text-yellow-300 text-sm font-bold underline transition-colors">
                 Faça login com Google para salvar seu progresso.
               </button>
            </div>
          }

          <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h3 class="text-white font-bold mb-4 flex items-center gap-2"><lucide-icon [img]="Lock" class="w-4 h-4 text-indigo-400"></lucide-icon> Sala Privada</h3>
            <div class="flex gap-2">
              <input [(ngModel)]="roomCode" placeholder="Código da Sala" class="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-indigo-500 focus:outline-none font-mono uppercase">
              <button (click)="joinRoom()" [disabled]="!roomCode" class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 rounded-xl font-bold transition-colors">
                <lucide-icon [img]="ArrowRight" class="w-5 h-5"></lucide-icon>
              </button>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
             <h3 class="text-white font-bold mb-4 flex items-center gap-2"><lucide-icon [img]="Plus" class="w-4 h-4 text-emerald-400"></lucide-icon> Criar Nova Sala</h3>
             
             <div class="flex gap-2 mb-4">
                <button (click)="isPublicRoom.set(false)" 
                   class="flex-1 py-2 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-2"
                   [ngClass]="!isPublicRoom() ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'">
                   <lucide-icon [img]="Lock" class="w-4 h-4"></lucide-icon> Fechada
                </button>
                <button (click)="isPublicRoom.set(true)" 
                   class="flex-1 py-2 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-2"
                   [ngClass]="isPublicRoom() ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'">
                   <lucide-icon [img]="Globe" class="w-4 h-4"></lucide-icon> Aberta
                </button>
             </div>
             <p class="text-xs text-slate-500 mb-4 h-4">
                {{ isPublicRoom() ? 'Qualquer jogador poderá ver e entrar na sua sala.' : 'Apenas jogadores com o código poderão entrar.' }}
             </p>

             <button (click)="createRoom()" [disabled]="loading()" class="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors uppercase tracking-widest shadow-lg active:scale-95">
               {{ loading() ? 'CRIANDO...' : 'CRIAR SALA' }}
             </button>
          </div>
        </div>

        <div class="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm flex flex-col h-full max-h-[600px]">
           <div class="flex justify-between items-center mb-6">
              <h3 class="text-white font-bold flex items-center gap-2">
                 <lucide-icon [img]="Globe" class="w-5 h-5 text-blue-400"></lucide-icon> Salas Abertas
              </h3>
              <button (click)="loadPublicRooms()" class="text-xs text-slate-400 hover:text-white underline">Atualizar</button>
           </div>

           <div class="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              @if (publicRooms().length > 0) {
                 @for (room of publicRooms(); track room.id) {
                    <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-indigo-500 transition-colors cursor-pointer group" (click)="joinPublicRoom(room.code)">
                       <div class="flex justify-between items-center">
                          <div>
                             <p class="text-white font-bold font-mono text-lg group-hover:text-indigo-400 transition-colors">{{ room.code }}</p>
                             <p class="text-xs text-slate-400">{{ room.game_type }}</p>
                          </div>
                          <div class="bg-slate-900 px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-slate-700">
                             Entrar
                          </div>
                       </div>
                    </div>
                 }
              } @else {
                 <div class="h-full flex flex-col items-center justify-center text-slate-500 gap-2 opacity-50">
                    <lucide-icon [img]="Globe" class="w-10 h-10"></lucide-icon>
                    <p class="text-sm">Nenhuma sala pública agora.</p>
                 </div>
              }
           </div>
        </div>

      </div>
    </div>
  `
})
export class LobbyComponent implements OnInit {
  supabase = inject(SupabaseService);
  auth = inject(AuthService);
  router = inject(Router);

  readonly LogIn = LogIn; readonly Users = Users; readonly Plus = Plus;
  readonly Globe = Globe; readonly Lock = Lock; readonly AlertTriangle = AlertTriangle;
  readonly ArrowRight = ArrowRight;

  user = signal<any>(null);
  roomCode = '';
  loading = signal(false);
  
  // Controle de Sala Pública/Privada
  isPublicRoom = signal(false);
  publicRooms = signal<any[]>([]);

  async ngOnInit() {
    this.checkUser();
    this.loadPublicRooms();
    
    // Roda a limpeza ao entrar no lobby (gatilho manual já que não temos cron)
    await this.supabase.client.rpc('cleanup_inactive_guests');
  }

  async checkUser() {
    const { data } = await this.supabase.client.auth.getUser();
    this.user.set(data.user);
  }

  async loginWithGoogle() {
    await this.auth.signInWithGoogle();
  }

  async createRoom() {
    if (!this.user()) await this.auth.signInAnonymously();
    
    this.loading.set(true);
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const { data: { user } } = await this.supabase.client.auth.getUser();
    
    // Cria a sala com a flag is_public
    await this.supabase.client.from('rooms').insert({
      code,
      host_id: user?.id,
      game_type: 'BINGO',
      status: 'WAITING',
      is_public: this.isPublicRoom() // <--- AQUI
    });

    this.router.navigate(['/room', code]);
    this.loading.set(false);
  }

  joinRoom() {
    if (this.roomCode) this.router.navigate(['/room', this.roomCode.toUpperCase()]);
  }
  
  joinPublicRoom(code: string) {
    this.router.navigate(['/room', code]);
  }

  async loadPublicRooms() {
    // Busca apenas salas WAITING e PÚBLICAS
    const { data } = await this.supabase.client
        .from('rooms')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'WAITING')
        .order('created_at', { ascending: false })
        .limit(20);
        
    if (data) this.publicRooms.set(data);
  }
}