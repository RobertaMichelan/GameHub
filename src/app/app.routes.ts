import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AuthComponent } from './pages/auth/auth.component';
import { LobbyComponent } from './pages/lobby/lobby.component';
import { RoomComponent } from './pages/room/room.component';
import { AuthGuard } from './core/services/guards/auth.guard'; 

export const routes: Routes = [
  // 1. Rota VAZIA ('') deve mostrar a HOME
  { 
    path: '', 
    component: HomeComponent 
  },
  
  // 2. Rota 'auth' mostra o Login/Cadastro
  { 
    path: 'auth', 
    component: AuthComponent 
  },

  // 3. Rotas Protegidas (Lobby e Jogo)
  { 
    path: 'lobby', 
    component: LobbyComponent,
    canActivate: [AuthGuard] 
  },
  { 
    path: 'room/:id', 
    component: RoomComponent,
    canActivate: [AuthGuard]
  },

  // 4. Qualquer outra coisa volta para a Home
  { 
    path: '**', 
    redirectTo: '' 
  }
];