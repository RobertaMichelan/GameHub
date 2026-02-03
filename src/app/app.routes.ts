import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AuthComponent } from './pages/auth/auth.component'; // Importe seu componente de Auth
import { LobbyComponent } from './pages/lobby/lobby.component';
import { RoomComponent } from './pages/room/room.component';
import { AuthGuard } from './core/services/guards/auth.guard'; 

export const routes: Routes = [
  { 
    path: '', 
    component: HomeComponent 
  },
  { 
    path: 'auth', // Rota para Login/Cadastro
    component: AuthComponent 
  },
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
  { 
    path: '**', 
    redirectTo: '' 
  }
];