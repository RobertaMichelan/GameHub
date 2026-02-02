import { Component, Input, signal, inject, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../core/services/supabase.service';
import { LucideAngularModule, Send, Lock, Unlock, MessageSquare } from 'lucide-angular';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="flex flex-col h-[400px] bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
      
      <div class="bg-slate-800 p-3 flex items-center justify-between border-b border-slate-700">
        <div class="flex items-center gap-2">
          <lucide-icon [img]="MessageSquare" class="w-4 h-4 text-indigo-400"></lucide-icon>
          <span class="font-bold text-sm text-slate-200">Chat da Sala</span>
        </div>
        
        @if (isHost) {
          <button (click)="toggleChat()" 
            class="p-1.5 rounded-lg transition-colors"
            [ngClass]="isOpen ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'"
            title="Abrir/Fechar Chat para todos">
            <lucide-icon [img]="isOpen ? Unlock : Lock" class="w-4 h-4"></lucide-icon>
          </button>
        } @else {
          <div class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"
               [ngClass]="isOpen ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'">
            {{ isOpen ? 'Aberto' : 'Fechado' }}
          </div>
        }
      </div>

      <div #scrollContainer class="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
        @for (msg of messages(); track msg.id) {
          <div class="flex flex-col" [ngClass]="msg.user_id === currentUserId ? 'items-end' : 'items-start'">
            <span class="text-[10px] text-slate-500 font-bold mb-0.5 px-1">
              {{ msg.username }} @if(msg.is_host) { 👑 }
            </span>
            <div class="max-w-[85%] px-3 py-2 rounded-lg text-sm break-words"
              [ngClass]="msg.user_id === currentUserId 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : (msg.is_host ? 'bg-yellow-500/20 text-yellow-100 border border-yellow-500/30' : 'bg-slate-700 text-slate-200 rounded-tl-none')">
              {{ msg.content }}
            </div>
          </div>
        }
        @empty {
          <div class="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
            <lucide-icon [img]="MessageSquare" class="w-8 h-8 opacity-20"></lucide-icon>
            <p class="text-xs">Nenhuma mensagem ainda.</p>
          </div>
        }
      </div>

      <form (submit)="sendMessage()" class="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
        <input [(ngModel)]="newMessage" name="msg" 
          [disabled]="!isOpen && !isHost"
          [placeholder]="!isOpen && !isHost ? 'O chat está fechado pelo organizador' : 'Digite sua mensagem...'"
          class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        
        <button type="submit" 
          [disabled]="!newMessage.trim() || (!isOpen && !isHost)"
          class="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-2 rounded-lg transition-colors">
          <lucide-icon [img]="Send" class="w-4 h-4"></lucide-icon>
        </button>
      </form>
    </div>
  `
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() roomId = '';
  @Input() isHost = false;
  @Input() isOpen = true; // Status vindo do pai
  @Input() currentUserId = '';
  @Input() currentUsername = '';

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  supabase = inject(SupabaseService);
  messages = signal<any[]>([]);
  newMessage = '';
  
  readonly Send = Send;
  readonly Lock = Lock;
  readonly Unlock = Unlock;
  readonly MessageSquare = MessageSquare;

  private channel: RealtimeChannel | null = null;

  async ngOnInit() {
    await this.fetchMessages();
    this.setupRealtime();
    this.scrollToBottom();
  }

  ngOnDestroy() {
    if (this.channel) this.supabase.client.removeChannel(this.channel);
  }

  async fetchMessages() {
    const { data } = await this.supabase.client
      .from('messages')
      .select('*')
      .eq('room_code', this.roomId)
      .order('created_at', { ascending: true });
    
    if (data) this.messages.set(data);
  }

  setupRealtime() {
    this.channel = this.supabase.client.channel(`chat_${this.roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_code=eq.${this.roomId}` }, (payload) => {
        this.messages.update(msgs => [...msgs, payload.new]);
        this.scrollToBottom();
      })
      .subscribe();
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;

    // Se chat fechado e não for host, bloqueia
    if (!this.isOpen && !this.isHost) return;

    const msg = this.newMessage;
    this.newMessage = ''; // Limpa rápido

    await this.supabase.client.from('messages').insert({
      room_code: this.roomId,
      user_id: this.currentUserId,
      username: this.currentUsername,
      content: msg,
      is_host: this.isHost
    });
  }

  async toggleChat() {
    if (!this.isHost) return;
    // O Host altera o status da SALA, e o componente pai avisa os outros
    await this.supabase.client
      .from('rooms')
      .update({ chat_open: !this.isOpen })
      .eq('code', this.roomId);
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}