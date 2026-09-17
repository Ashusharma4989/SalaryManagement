import { Component, signal, ViewChild, ElementRef, AfterViewChecked, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatMessage } from '../../services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  protected readonly isOpen = signal(false);
  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly inputText = signal('');
  protected readonly loading = signal(false);
  protected readonly historyLoading = signal(false);

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
  }

  toggleChat(): void {
    const opening = !this.isOpen();
    this.isOpen.update((v) => !v);
    if (opening) {
      this.loadHistory();
    } else {
      this.inputText.set('');
    }
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  loadHistory(): void {
    if (!this.isOpen()) {
      return;
    }
    this.historyLoading.set(true);
    this.chatbotService.getHistory().subscribe({
      next: (history: ChatMessage[]) => {
        this.messages.set(history);
        this.historyLoading.set(false);
      },
      error: () => {
        this.historyLoading.set(false);
      },
    });
  }

  saveHistory(): void {
    const msgs = this.messages();
    if (msgs.length === 0) {
      return;
    }
    this.chatbotService.saveHistory(msgs).subscribe({
      error: (err) => {
        console.warn('Failed to save chat history:', err);
      },
    });
  }

  clearHistory(): void {
    this.chatbotService.clearHistory().subscribe({
      next: () => {
        this.messages.set([]);
      },
      error: (err) => {
        console.warn('Failed to clear chat history:', err);
      },
    });
  }

  onInputChange(value: string): void {
    this.inputText.set(value);
  }

  sendMessage(): void {
    const text = this.inputText().trim();
    if (!text || this.loading()) {
      return;
    }

    const now = new Date();
    this.messages.update((msgs) => [...msgs, {
      sender: 'user',
      text,
      timestamp: now.toISOString(),
    }]);
    this.inputText.set('');
    this.loading.set(true);

    this.chatbotService.sendMessage(text).subscribe({
      next: (res: { query: string; response: string }) => {
        const reply = res.response || "I couldn't get a response. Please try again.";
        this.messages.update((msgs) => [...msgs, {
          sender: 'bot',
          text: reply,
          timestamp: new Date().toISOString(),
        }]);
        this.loading.set(false);
        this.saveHistory();
      },
      error: () => {
        this.messages.update((msgs) => [...msgs, {
          sender: 'bot',
          text: "I'm offline right now. Please ensure Ollama is running with the model loaded.",
          timestamp: new Date().toISOString(),
        }]);
        this.loading.set(false);
        this.saveHistory();
      },
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }

  get canSend(): boolean {
    return !!this.inputText().trim() && !this.loading();
  }

  formatTime(dateISO: string): string {
    return new Date(dateISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
