import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../core/api';
import {
  SolicitacaoAlteracaoRequestModel,
  SolicitacaoAlteracaoResponseModel,
  SolicitacaoAlteracaoRespostaRequestModel
} from './solicitacao-alteracao.model';

@Injectable({
  providedIn: 'root'
})
export class SolicitacaoAlteracaoService {
  private apiUrl = `${API_URL}/solicitacoes-alteracao`;

  constructor(private http: HttpClient) {}

  criar(payload: SolicitacaoAlteracaoRequestModel) {
    return this.http.post<SolicitacaoAlteracaoResponseModel>(this.apiUrl, payload);
  }

  listarMinhas() {
    return this.http.get<SolicitacaoAlteracaoResponseModel[]>(`${this.apiUrl}/minhas`);
  }

  listarAdmin() {
    return this.http.get<SolicitacaoAlteracaoResponseModel[]>(`${this.apiUrl}/admin`);
  }

  listarPendentes() {
    return this.http.get<SolicitacaoAlteracaoResponseModel[]>(`${this.apiUrl}/admin/pendentes`);
  }

  responder(id: number, payload: SolicitacaoAlteracaoRespostaRequestModel) {
    return this.http.post<SolicitacaoAlteracaoResponseModel>(`${this.apiUrl}/${id}/responder`, payload);
  }
}
