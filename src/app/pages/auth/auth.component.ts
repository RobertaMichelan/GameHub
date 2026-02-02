import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, User, Mail, Lock, Calendar, AlertCircle } from 'lucide-angular';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-white">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        
        <div class="text-center mb-8">
          <h1 class="text-3xl font-black text-indigo-500 mb-2">GameHub</h1>
          <p class="text-slate-400">Entre para jogar.</p>
        </div>

        <div class="flex bg-slate-950 p-1 rounded-lg mb-6">
          <button (click)="mode.set('LOGIN')" 
            [class]="mode() === 'LOGIN' ? 'bg-indigo-600 text-white' : 'text-slate-500'"
            class="flex-1 py-2 rounded font-bold transition-all">Entrar</button>
          <button (click)="mode.set('REGISTER')" 
            [class]="mode() === 'REGISTER' ? 'bg-indigo-600 text-white' : 'text-slate-500'"
            class="flex-1 py-2 rounded font-bold transition-all">Cadastrar</button>
        </div>

        <form (submit)="handleSubmit($event)" class="space-y-4">
          
          @if (mode() === 'REGISTER') {
            <input [(ngModel)]="form.fullName" name="name" type="text" placeholder="Nome Completo" required class="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white">
            <input [(ngModel)]="form.username" name="user" type="text" placeholder="Nome de Usuário (@unico)" required class="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white">
            <input [(ngModel)]="form.birthDate" name="birth" type="date" required class="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white">
          }

          <input [(ngModel)]="form.email" name="email" type="email" placeholder="E-mail" required class="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white">
          <input [(ngModel)]="form.password" name="pass" type="password" placeholder="Senha" required minlength="6" class="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white">

          @if (errorMessage()) {
            <div class="text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-900/50">
              {{ errorMessage() }}
            </div>
          }

          <button type="submit" [disabled]="auth.loading()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded transition-all disabled:opacity-50">
            {{ auth.loading() ? 'Processando...' : (mode() === 'LOGIN' ? 'ENTRAR' : 'CRIAR CONTA') }}
          </button>
        </form>

      </div>
    </div>
  `
})
export class AuthComponent {
  auth = inject(AuthService);
  mode = signal<'LOGIN' | 'REGISTER'>('LOGIN');
  errorMessage = signal('');
  
  form = { email: '', password: '', username: '', fullName: '', birthDate: '' };

  async handleSubmit(e: Event) {
    e.preventDefault();
    this.errorMessage.set('');

    if (this.mode() === 'LOGIN') {
      const res = await this.auth.signIn(this.form.email, this.form.password);
      if (res.error) this.errorMessage.set(res.error);
    } else {
      const res = await this.auth.signUp({
        email: this.form.email, pass: this.form.password,
        username: this.form.username, fullName: this.form.fullName, birthDate: this.form.birthDate
      });
      if (res.error) this.errorMessage.set(res.error);
      else { alert('Sucesso! Verifique seu e-mail.'); this.mode.set('LOGIN'); }
    }
  }
}