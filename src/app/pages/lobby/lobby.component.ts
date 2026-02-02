import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="background-color: #0f172a; min-height: 100vh; padding: 20px; color: white; font-family: sans-serif;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #334155; padding-bottom: 15px;">
        <div>
          <h1 style="margin: 0; font-size: 20px;">GameHub 🎮</h1>
          <span style="font-size: 14px; color: #94a3b8;">Olá, {{ profile()?.username }}</span>
        </div>
        <button (click)="logout()" style="background: #ef4444; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">SAIR</button>
      </div>

      <h3 style="margin-bottom: 20px;">Escolha um jogo para começar:</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
        
        @for (game of games; track game.id) {
          <button (click)="openModal(game)" 
            style="background: #1e293b; color: white; padding: 24px; border: 1px solid #334155; border-radius: 12px; text-align: left; cursor: pointer; transition: all 0.2s;"
            onmouseover="this.style.background='#334155'; this.style.borderColor='#6366f1'"
            onmouseout="this.style.background='#1e293b'; this.style.borderColor='#334155'">
            <div style="font-size: 32px; margin-bottom: 10px;">{{ game.emoji }}</div>
            <strong style="display: block; font-size: 18px; margin-bottom: 5px;">{{ game.name }}</strong>
            <span style="font-size: 13px; color: #94a3b8;">{{ game.desc }}</span>
          </button>
        }

      </div>

      @if (selectedGame()) {
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 50;">
          <div style="background: #1e293b; padding: 30px; border-radius: 16px; width: 100%; max-width: 400px; border: 1px solid #475569; position: relative;">
            
            <button (click)="closeModal()" style="position: absolute; top: 15px; right: 15px; background: transparent; border: none; color: #64748b; font-size: 20px; cursor: pointer;">✕</button>

            <div style="text-align: center; margin-bottom: 25px;">
              <div style="font-size: 48px; margin-bottom: 10px;">{{ selectedGame().emoji }}</div>
              <h2 style="margin: 0; color: white;">{{ selectedGame().name }}</h2>
              <p style="color: #94a3b8; margin-top: 5px; font-size: 14px;">Como você quer jogar?</p>
            </div>

            <button (click)="createRoom()" style="width: 100%; background: #4f46e5; color: white; padding: 16px; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px; font-weight: bold; font-size: 16px;">
              <span>👑</span> CRIAR NOVA SALA
            </button>

            <div style="text-align: center; color: #64748b; font-size: 12px; margin-bottom: 15px; font-weight: bold;">OU ENTRAR COM CÓDIGO</div>

            <div style="display: flex; gap: 8px;">
              <input [(ngModel)]="roomCodeInput" (keyup.enter)="joinRoom()" placeholder="Ex: A1B2" style="flex: 1; padding: 12px; background: #0f172a; border: 1px solid #475569; color: white; border-radius: 8px; text-transform: uppercase; text-align: center; font-weight: bold;">
              <button (click)="joinRoom()" style="background: #334155; color: white; padding: 0 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">IR</button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class LobbyComponent implements OnInit {
  auth = inject(AuthService);
  supabase = inject(SupabaseService);
  router = inject(Router);

  profile = signal<any>(null);
  selectedGame = signal<any>(null); // Jogo selecionado no clique
  roomCodeInput = ''; // Código digitado no modal

  games = [
    { id: 'BINGO', name: 'Bingo', emoji: '🎱', desc: 'Sorteio Automático e Cartelas' },
    { id: 'CHAMADA', name: 'A Chamada', emoji: '📞', desc: 'Quem atender primeiro ganha!' },
    { id: 'RIFA', name: 'Rifa Digital', emoji: '🎟️', desc: 'Organize sorteios e prêmios' },
    { id: 'STOP', name: 'Stop', emoji: '🛑', desc: 'Adedonha / Vocabulário' },
    { id: 'QUIZ', name: 'Quiz', emoji: '❓', desc: 'Perguntas e Respostas Gerais' },
    { id: 'IMAGEM_ACAO', name: 'Imagem & Ação', emoji: '🎨', desc: 'Um desenha, os outros adivinham' },
    { id: 'FORCA', name: 'Forca', emoji: '😵', desc: 'Descubra a palavra oculta' },
    { id: 'VELHA', name: 'Jogo da Velha', emoji: '❌', desc: 'O clássico duelo X vs O' }
  ];

  async ngOnInit() {
    this.fetchProfile();
  }

  async fetchProfile() {
    const { data: { user } } = await this.supabase.client.auth.getUser();
    if (user) {
      const { data } = await this.supabase.client.from('profiles').select('*').eq('id', user.id).single();
      this.profile.set(data);
    }
  }

  async logout() { await this.auth.signOut(); }

  // Abre o Modal
  openModal(game: any) {
    this.selectedGame.set(game);
    this.roomCodeInput = '';
  }

  // Fecha o Modal
  closeModal() {
    this.selectedGame.set(null);
  }

  // Ação: CRIAR (Organizador)
  async createRoom() {
    const game = this.selectedGame();
    if (!game) return;

    const user = (await this.supabase.client.auth.getUser()).data.user;
    if (!user) return alert('Faça login novamente.');

    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const { error } = await this.supabase.client.from('rooms').insert({
      code: code,
      host_id: user.id,
      game_type: game.id,
      status: 'WAITING'
    });

    if (error) {
      alert('Erro: ' + error.message);
    } else {
      this.closeModal();
      this.router.navigate(['/room', code]);
    }
  }

  // Ação: ENTRAR (Jogador)
  joinRoom() {
    if (this.roomCodeInput && this.roomCodeInput.trim().length > 0) {
      const code = this.roomCodeInput.toUpperCase().trim();
      this.closeModal();
      this.router.navigate(['/room', code]);
    } else {
      alert('Digite o código da sala!');
    }
  }
}