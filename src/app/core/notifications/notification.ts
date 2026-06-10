import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { API_URL } from '../api';
import { NotificacaoResponseModel, NotificacoesNaoLidasResponse } from './notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notificacoes = signal<NotificacaoResponseModel[]>([]);
  totalNaoLidas = signal(0);

  private apiUrl = `${API_URL}/notificacoes`;

  constructor(private http: HttpClient) {}

  carregar() {
    this.http.get<NotificacaoResponseModel[]>(this.apiUrl).subscribe({
      next: notificacoes => {
        this.notificacoes.set(notificacoes);
        this.totalNaoLidas.set(notificacoes.filter(notificacao => !notificacao.lida).length);
      },
      error: () => {
        this.notificacoes.set([]);
        this.totalNaoLidas.set(0);
      }
    });
  }

  atualizarTotalNaoLidas() {
    this.http.get<NotificacoesNaoLidasResponse>(`${this.apiUrl}/nao-lidas/total`).subscribe({
      next: response => this.totalNaoLidas.set(response.total),
      error: () => this.totalNaoLidas.set(0)
    });
  }

  marcarComoLida(id: number) {
    return this.http.put<NotificacaoResponseModel>(`${this.apiUrl}/${id}/lida`, {});
  }

  marcarTodasComoLidas() {
    return this.http.put<NotificacaoResponseModel[]>(`${this.apiUrl}/lidas`, {});
  }
}
