import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LobbyComponent } from './pages/lobby/lobby.component';
import { RoomComponent } from './pages/room/room.component';
// AJUSTE AQUI: Apontamos para o caminho onde o arquivo realmente está
import { AuthGuard } from './core/services/guards/auth.guard'; 

export const routes: Routes = [
  { 
    path: '', 
    component: HomeComponent 
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