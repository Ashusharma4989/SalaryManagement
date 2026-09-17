import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface ChatbotResponse {
  query: string;
  response: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  constructor(private http: HttpClient) {}

  sendMessage(query: string): Observable<ChatbotResponse> {
    return this.http.post<ChatbotResponse>('/api/v1/chat', { query });
  }

  getHistory(): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>('/api/v1/chat/history');
  }

  saveHistory(messages: ChatMessage[]): Observable<void> {
    return this.http.post<void>('/api/v1/chat/history', messages);
  }

  clearHistory(): Observable<void> {
    return this.http.delete<void>('/api/v1/chat/history');
  }
}
