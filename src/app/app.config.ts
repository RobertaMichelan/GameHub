import { ApplicationConfig } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    // O 'withHashLocation()' é o que cria a cerquilha # no link
    provideRouter(routes, withHashLocation()), 
    provideHttpClient()
  ]
};