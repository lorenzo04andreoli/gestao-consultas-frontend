import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from '../../core/api';
import { ConsultaFiltros, ConsultaModel, ConsultaRequestModel } from './consulta.model';

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {
  private apiUrl = `${API_URL}/consultas`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<ConsultaModel[]>(this.apiUrl);
  }

  criar(consulta: ConsultaRequestModel) {
    return this.http.post<ConsultaModel>(this.apiUrl, consulta);
  }

  cancelar(id: number, motivo: string) {
    const params = new HttpParams().set('motivo', motivo);
    return this.http.put<ConsultaModel>(`${this.apiUrl}/${id}/cancelar`, null, { params });
  }

  finalizar(id: number) {
    return this.http.put<ConsultaModel>(`${this.apiUrl}/${id}/finalizar`, null);
  }

  relatorios(filtros: ConsultaFiltros) {
    let params = new HttpParams();

    Object.entries(filtros).forEach(([chave, valor]) => {
      if (valor !== null && valor !== undefined && valor !== '') {
        params = params.set(chave, String(valor));
      }
    });

    return this.http.get<ConsultaModel[]>(`${this.apiUrl}/relatorios`, { params });
  }
}
