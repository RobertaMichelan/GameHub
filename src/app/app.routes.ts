import { Routes } from '@angular/router';
import { AuthComponent } from './pages/auth/auth.component';
import { LobbyComponent } from './pages/lobby/lobby.component';
import { RoomComponent } from './pages/room/room.component'; // <--- Importe aqui

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { path: 'lobby', component: LobbyComponent },
  { path: 'room/:id', component: RoomComponent } // <--- Rota nova
];