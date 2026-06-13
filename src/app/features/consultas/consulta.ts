import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { API_URL } from '../../core/api';
import { PageResponseModel } from '../../core/pagination/page-response.model';
import { ConsultaFiltros, ConsultaModel, ConsultaRequestModel } from './consulta.model';

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {
  private apiUrl = `${API_URL}/consultas`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<ConsultaModel[]>(this.apiUrl).pipe(
      map(consultas => consultas.map(consulta => this.normalizarConsulta(consulta)))
    );
  }

  listarPaginado(page: number, size: number, filtros: {
    termo?: string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  } = {}) {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    Object.entries(filtros).forEach(([chave, valor]) => {
      if (valor !== null && valor !== undefined && valor !== '') {
        params = params.set(chave, String(valor));
      }
    });

    return this.http.get<PageResponseModel<ConsultaModel>>(`${this.apiUrl}/paginado`, { params }).pipe(
      map(pagina => ({
        ...pagina,
        content: pagina.content.map(consulta => this.normalizarConsulta(consulta))
      }))
    );
  }

  criar(consulta: ConsultaRequestModel) {
    return this.http.post<ConsultaModel>(this.apiUrl, consulta).pipe(
      map(dados => this.normalizarConsulta(dados))
    );
  }

  atualizar(id: number, consulta: ConsultaRequestModel) {
    return this.http.put<ConsultaModel>(`${this.apiUrl}/${id}/editar`, consulta).pipe(
      map(dados => this.normalizarConsulta(dados))
    );
  }

  cancelar(id: number, motivo: string) {
    const params = new HttpParams().set('motivo', motivo);
    return this.http.put<ConsultaModel>(`${this.apiUrl}/${id}/cancelar`, null, { params }).pipe(
      map(dados => this.normalizarConsulta(dados))
    );
  }

  finalizar(id: number) {
    return this.http.put<ConsultaModel>(`${this.apiUrl}/${id}/finalizar`, null).pipe(
      map(dados => this.normalizarConsulta(dados))
    );
  }

  relatorios(filtros: ConsultaFiltros) {
    let params = new HttpParams();

    Object.entries(filtros).forEach(([chave, valor]) => {
      if (valor !== null && valor !== undefined && valor !== '') {
        params = params.set(chave, String(valor));
      }
    });

    return this.http.get<ConsultaModel[]>(`${this.apiUrl}/relatorios`, { params }).pipe(
      map(consultas => consultas.map(consulta => this.normalizarConsulta(consulta)))
    );
  }

  private normalizarConsulta(consulta: ConsultaModel): ConsultaModel {
    return {
      ...consulta,
      pacienteId: consulta.pacienteId ?? consulta.paciente?.id ?? 0,
      pacienteNome: consulta.pacienteNome ?? consulta.paciente?.nome ?? '-',
      dentistaId: consulta.dentistaId ?? consulta.dentista?.id ?? 0,
      dentistaNome: consulta.dentistaNome ?? consulta.dentista?.nome ?? '-',
      especialidadeId: consulta.especialidadeId ?? null,
      especialidadeNome: consulta.especialidadeNome ?? null,
      usuarioNome: consulta.usuarioNome ?? consulta.usuario?.nome ?? '-'
    };
  }
}
