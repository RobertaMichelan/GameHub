import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router'; // <--- Importamos isso
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    // Aqui ativamos o "withHashLocation" para consertar o erro da Vercel
    provideRouter(routes, withHashLocation()), 
    provideHttpClient()
  ]
};