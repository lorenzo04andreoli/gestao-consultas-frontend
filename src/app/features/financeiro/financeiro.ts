import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { API_URL } from '../../core/api';
import {
  FinanceiroLancamentoModel,
  FinanceiroLancamentoRequestModel,
  FinanceiroPrecoModel,
  FinanceiroPrecoRequestModel,
  FinanceiroPrecoSugestaoModel,
  FinanceiroResumoModel,
  FinanceiroTabelaPrecoModel,
  FinanceiroTabelaPrecoRequestModel
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

  listarTabelasPreco() {
    return this.http.get<FinanceiroTabelaPrecoModel[]>(`${this.apiUrl}/tabelas-preco`);
  }

  criarTabelaPreco(tabela: FinanceiroTabelaPrecoRequestModel) {
    return this.http.post<FinanceiroTabelaPrecoModel>(`${this.apiUrl}/tabelas-preco`, tabela);
  }

  desativarTabelaPreco(id: number) {
    return this.http.put<FinanceiroTabelaPrecoModel>(`${this.apiUrl}/tabelas-preco/${id}/desativar`, null);
  }

  listarPrecos(tabelaPrecoId: number) {
    return this.http.get<FinanceiroPrecoModel[]>(`${this.apiUrl}/tabelas-preco/${tabelaPrecoId}/precos`).pipe(
      map(precos => precos.map(preco => this.normalizarPreco(preco)))
    );
  }

  criarPreco(preco: FinanceiroPrecoRequestModel) {
    return this.http.post<FinanceiroPrecoModel>(`${this.apiUrl}/precos`, preco).pipe(
      map(dados => this.normalizarPreco(dados))
    );
  }

  desativarPreco(id: number) {
    return this.http.put<FinanceiroPrecoModel>(`${this.apiUrl}/precos/${id}/desativar`, null).pipe(
      map(dados => this.normalizarPreco(dados))
    );
  }

  sugerirPreco(dentistaId: number, especialidadeId: number) {
    return this.http.get<FinanceiroPrecoSugestaoModel>(`${this.apiUrl}/precos/sugestao`, {
      params: {
        dentistaId,
        especialidadeId
      }
    }).pipe(
      map(sugestao => ({
        ...sugestao,
        valor: sugestao.valor == null ? null : Number(sugestao.valor)
      }))
    );
  }

  resumo() {
    return this.http.get<FinanceiroResumoModel>(`${this.apiUrl}/resumo`).pipe(
      map(resumo => ({
        recebidoMes: Number(resumo.recebidoMes ?? 0),
        aReceber: Number(resumo.aReceber ?? 0),
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

  private normalizarPreco(preco: FinanceiroPrecoModel): FinanceiroPrecoModel {
    return {
      ...preco,
      valor: Number(preco.valor ?? 0)
    };
  }
}
