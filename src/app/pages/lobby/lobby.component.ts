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
    <div style="background-color: #0f172a; min-height: 100vh; padding: 20px; color: white;">
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 1px solid #334155; padding-bottom: 10px;">
        <div>
          <h1 style="margin: 0; font-size: 20px;">Olá, {{ profile()?.username || 'Jogador' }}</h1>
          <span style="font-size: 12px; color: #94a3b8;">ID: {{ profile()?.id?.substring(0,8) }}...</span>
        </div>
        <button (click)="logout()" style="background: #ef4444; color: white; padding: 5px 15px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">SAIR</button>
      </div>

      <div style="margin-bottom: 40px; background: #1e293b; padding: 20px; border-radius: 10px; border: 1px solid #334155;">
        <h3 style="margin-top: 0;">Entrar em Sala Existente</h3>
        <div style="display: flex; gap: 10px;">
          <input [(ngModel)]="roomCodeInput" (keyup.enter)="joinRoom()" placeholder="Digite o Código..." style="padding: 12px; flex: 1; border-radius: 5px; border: 1px solid #475569; background: #0f172a; color: white; text-transform: uppercase; font-weight: bold;">
          <button (click)="joinRoom()" style="background: #3b82f6; color: white; padding: 10px 25px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
            ENTRAR
          </button>
        </div>
      </div>

      <h3 style="margin-bottom: 20px;">Criar Nova Sala (Escolha o Jogo):</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
        
        @for (game of games; track game.id) {
          <button (click)="createRoom(game.id)" 
            style="background: #334155; color: white; padding: 20px; border: 1px solid #475569; border-radius: 10px; text-align: left; cursor: pointer; transition: transform 0.2s;"
            onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#6366f1'"
            onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#475569'">
            <strong style="display: block; font-size: 18px; margin-bottom: 5px; color: #e2e8f0;">{{ game.name }}</strong>
            <span style="font-size: 13px; color: #94a3b8; line-height: 1.4; display: block;">{{ game.desc }}</span>
          </button>
        }

      </div>

    </div>
  `
})
export class LobbyComponent implements OnInit {
  auth = inject(AuthService);
  supabase = inject(SupabaseService);
  router = inject(Router);

  profile = signal<any>(null);
  roomCodeInput = '';

  // LISTA DE JOGOS (Deve ficar aqui dentro da classe)
  games = [
    { id: 'BINGO', name: 'Bingo', desc: 'Sorteio Automático e Cartelas Virtuais' },
    { id: 'CHAMADA', name: 'A Chamada', desc: 'Quem atender o telefone primeiro ganha!' },
    { id: 'RIFA', name: 'Rifa Digital', desc: 'Organize sorteios e prêmios facilmente' },
    { id: 'STOP', name: 'Stop / Adedonha', desc: 'Teste seu vocabulário sob pressão' },
    { id: 'QUIZ', name: 'Quiz', desc: 'Perguntas e Respostas Gerais' },
    { id: 'IMAGEM_ACAO', name: 'Imagem & Ação', desc: 'Um desenha, os outros adivinham' },
    { id: 'FORCA', name: 'Forca', desc: 'Descubra a palavra oculta antes do fim' },
    { id: 'VELHA', name: 'Jogo da Velha', desc: 'O clássico duelo estratégico X vs O' }
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

  async logout() {
    await this.auth.signOut();
  }

  async createRoom(gameId: string) {
    const user = (await this.supabase.client.auth.getUser()).data.user;
    if (!user) return alert('Você precisa estar logado! Tente sair e entrar novamente.');

    // Gera código de 4 letras
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Cria a sala no banco de dados
    const { error } = await this.supabase.client.from('rooms').insert({
      code: code,
      host_id: user.id,
      game_type: gameId,
      status: 'WAITING'
    });

    if (error) {
      alert('Erro ao criar sala: ' + error.message);
    } else {
      this.router.navigate(['/room', code]);
    }
  }

  joinRoom() {
    if (this.roomCodeInput && this.roomCodeInput.trim().length > 0) {
      this.router.navigate(['/room', this.roomCodeInput.toUpperCase().trim()]);
    } else {
      alert('Digite o código da sala!');
    }
  }
}