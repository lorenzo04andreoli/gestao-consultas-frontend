import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { API_URL } from '../../core/api';
import {
  FinanceiroLancamentoModel,
  FinanceiroLancamentoRequestModel,
  FinanceiroResumoModel
} from './financeiro.model';

@Injectable({
  providedIn: 'root'
})
export class FinanceiroService {
  private apiUrl = `${API_URL}/financeiro`;

  constructor(private http: HttpClient) {}

  listarLancamentos() {
    return this.http.get<FinanceiroLancamentoModel[]>(`${this.apiUrl}/lancamentos`).pipe(
      map(lancamentos => lancamentos.map(lancamento => this.normalizarLancamento(lancamento)))
    );
  }

  buscarLancamento(id: number) {
    return this.http.get<FinanceiroLancamentoModel>(`${this.apiUrl}/lancamentos/${id}`).pipe(
      map(lancamento => this.normalizarLancamento(lancamento))
    );
  }

  criarLancamento(lancamento: FinanceiroLancamentoRequestModel) {
    return this.http.post<FinanceiroLancamentoModel>(`${this.apiUrl}/lancamentos`, lancamento).pipe(
      map(dados => this.normalizarLancamento(dados))
    );
  }

  marcarComoPago(id: number) {
    return this.http.put<FinanceiroLancamentoModel>(`${this.apiUrl}/lancamentos/${id}/pagar`, null).pipe(
      map(dados => this.normalizarLancamento(dados))
    );
  }

  cancelar(id: number) {
    return this.http.put<FinanceiroLancamentoModel>(`${this.apiUrl}/lancamentos/${id}/cancelar`, null).pipe(
      map(dados => this.normalizarLancamento(dados))
    );
  }

  resumo() {
    return this.http.get<FinanceiroResumoModel & { areceber?: number }>(`${this.apiUrl}/resumo`).pipe(
      map(resumo => ({
        recebidoMes: Number(resumo.recebidoMes ?? 0),
        aReceber: Number(resumo.aReceber ?? resumo.areceber ?? 0),
        pendentes: Number(resumo.pendentes ?? 0),
        pagas: Number(resumo.pagas ?? 0),
        canceladas: Number(resumo.canceladas ?? 0)
      }))
    );
  }

  private normalizarLancamento(lancamento: FinanceiroLancamentoModel): FinanceiroLancamentoModel {
    return {
      ...lancamento,
      valor: Number(lancamento.valor ?? 0)
    };
  }

}
