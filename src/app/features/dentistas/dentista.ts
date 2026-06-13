import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { API_URL } from '../../core/api';
import { PageResponseModel } from '../../core/pagination/page-response.model';
import {
  DentistaAtualizacaoRequestModel,
  DentistaRequestModel,
  DentistaResponseModel
} from './dentista.model';

@Injectable({
  providedIn: 'root'
})
export class DentistaService {
  private apiUrl = `${API_URL}/dentistas`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http
      .get<DentistaResponseModel[]>(this.apiUrl)
      .pipe(map(dentistas => dentistas.filter(dentista => dentista.ativo !== false)));
  }

  listarPaginado(page: number, size: number, termo = '', ativo: boolean | null = true) {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (termo.trim()) {
      params = params.set('termo', termo.trim());
    }

    if (ativo !== null) {
      params = params.set('ativo', ativo);
    }

    return this.http.get<PageResponseModel<DentistaResponseModel>>(`${this.apiUrl}/paginado`, { params });
  }

  listarArquivados() {
    return this.http
      .get<DentistaResponseModel[]>(this.apiUrl)
      .pipe(map(dentistas => dentistas.filter(dentista => dentista.ativo === false)));
  }

  criar(dentista: DentistaRequestModel) {
    return this.http.post<DentistaResponseModel>(this.apiUrl, dentista);
  }

  buscarPorId(id: number) {
    return this.http.get<DentistaResponseModel>(`${this.apiUrl}/${id}`);
  }

  atualizar(id: number, dentista: DentistaAtualizacaoRequestModel) {
    return this.http.put<DentistaResponseModel>(`${this.apiUrl}/${id}`, dentista);
  }

  desativar(id: number) {
    return this.http.put<DentistaResponseModel>(`${this.apiUrl}/${id}/desativar`, {});
  }

  reativar(id: number) {
    return this.http.put<DentistaResponseModel>(`${this.apiUrl}/${id}/reativar`, {});
  }

  deletar(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
