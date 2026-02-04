import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, Plus, Users, Lock, Unlock, Play, X, Search } from 'lucide-angular';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-950 p-4 md:p-8 font-sans text-white relative overflow-hidden">
      
      <header class="flex justify-between items-center mb-8 relative z-10">
        <div>
          <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            LOBBY
          </h1>
          <p class="text-slate-400 text-sm">Escolha um jogo para começar</p>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="hidden md:flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-700">
            <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span class="text-xs font-bold text-emerald-400">ONLINE</span>
          </div>
          <button (click)="logout()" class="text-slate-500 hover:text-red-400 transition-colors text-sm font-bold">
            SAIR
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 max-w-6xl mx-auto">
        
        <div (click)="openSetupModal('tictactoe', 'Jogo da Velha')" 
             class="group bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-1 shadow-xl">
          <div class="h-40 bg-indigo-900/20 rounded-xl mb-4 flex items-center justify-center group-hover:bg-indigo-600/20 transition-colors">
            <lucide-icon [img]="Play" class="w-12 h-12 text-indigo-400"></lucide-icon>
          </div>
          <h3 class="text-xl font-bold mb-1">Jogo da Velha</h3>
          <p class="text-slate-500 text-sm">Clássico estratégico.</p>
        </div>

        <div (click)="openSetupModal('memory', 'Jogo da Memória')"
             class="group bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500 rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-1 shadow-xl">
          <div class="h-40 bg-purple-900/20 rounded-xl mb-4 flex items-center justify-center group-hover:bg-purple-600/20 transition-colors">
            <lucide-icon [img]="Users" class="w-12 h-12 text-purple-400"></lucide-icon>
          </div>
          <h3 class="text-xl font-bold mb-1">Jogo da Memória</h3>
          <p class="text-slate-500 text-sm">Encontre os pares.</p>
        </div>

        <div class="bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-slate-600">
          <span class="text-sm font-bold uppercase tracking-widest">Em Breve</span>
        </div>
      </div>

      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4">
          <div class="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-2xl shadow-2xl relative">
            
            <button (click)="closeModal()" class="absolute top-4 right-4 text-slate-500 hover:text-white">
              <lucide-icon [img]="X" class="w-5 h-5"></lucide-icon>
            </button>

            <h2 class="text-2xl font-bold text-white mb-1">Criar Sala</h2>
            <p class="text-indigo-400 text-sm font-bold mb-6 uppercase">{{ selectedGameName() }}</p>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <button (click)="isPrivate.set(false)" 
                  [class.bg-indigo-600]="!isPrivate()" [class.border-indigo-500]="!isPrivate()"
                  class="p-3 rounded-xl border border-slate-700 bg-slate-950 flex flex-col items-center gap-2 transition-all">
                  <lucide-icon [img]="Unlock" class="w-6 h-6"></lucide-icon>
                  <span class="text-sm font-bold">Aberta</span>
                </button>

                <button (click)="isPrivate.set(true)"
                  [class.bg-indigo-600]="isPrivate()" [class.border-indigo-500]="isPrivate()"
                  class="p-3 rounded-xl border border-slate-700 bg-slate-950 flex flex-col items-center gap-2 transition-all">
                  <lucide-icon [img]="Lock" class="w-6 h-6"></lucide-icon>
                  <span class="text-sm font-bold">Privada</span>
                </button>
              </div>

              @if (isPrivate()) {
                <div class="animate-slide-down">
                  <label class="text-xs font-bold text-slate-400 mb-1 block">SENHA DA SALA</label>
                  <input [(ngModel)]="roomPassword" type="text" placeholder="Ex: 1234" 
                         class="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-indigo-500 focus:outline-none">
                </div>
              }

              <button (click)="createRoom()" [disabled]="loading()" 
                      class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold uppercase shadow-lg mt-4 disabled:opacity-50 transition-all active:scale-95">
                {{ loading() ? 'CRIANDO...' : 'CRIAR SALA E JOGAR' }}
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class LobbyComponent {
  supabase = inject(SupabaseService);
  auth = inject(AuthService);
  router = inject(Router);

  // Estados do Modal
  showModal = signal(false);
  loading = signal(false);
  selectedGameType = signal('');
  selectedGameName = signal('');
  
  // Configurações da Sala
  isPrivate = signal(false);
  roomPassword = '';

  // Ícones
  readonly Plus = Plus; readonly Users = Users; readonly Lock = Lock; 
  readonly Unlock = Unlock; readonly Play = Play; readonly X = X; readonly Search = Search;

  openSetupModal(type: string, name: string) {
    this.selectedGameType.set(type);
    this.selectedGameName.set(name);
    this.isPrivate.set(false);
    this.roomPassword = '';
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async createRoom() {
    this.loading.set(true);
    try {
      const user = await this.auth.getUser();
      
      const { data, error } = await this.supabase.client
        .from('rooms')
        .insert({
          name: `${this.selectedGameName()} de ${user?.email || 'Convidado'}`,
          game_type: this.selectedGameType(),
          is_public: !this.isPrivate(),
          password: this.isPrivate() ? this.roomPassword : null,
          host_id: user?.id,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;

      // Sucesso! Vai para a sala
      this.router.navigate(['/room', data.id]);

    } catch (error) {
      console.error('Erro ao criar sala:', error);
      alert('Não foi possível criar a sala.');
    } finally {
      this.loading.set(false);
    }
  }

  async logout() {
    await this.auth.signOut();
  }
}