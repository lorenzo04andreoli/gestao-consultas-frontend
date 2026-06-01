import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/api';
import {
  DentistaAtualizacaoRequestModel,
  DentistaModel,
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
    return this.http.get<DentistaResponseModel[]>(this.apiUrl);
  }

  criar(dentista: DentistaRequestModel) {
    return this.http.post<DentistaResponseModel>(this.apiUrl, dentista);
  }

  buscarPorId(id: number) {
    return this.http.get<DentistaModel>(`${this.apiUrl}/${id}`);
  }

  atualizar(id: number, dentista: DentistaAtualizacaoRequestModel) {
    return this.http.put<DentistaResponseModel>(`${this.apiUrl}/${id}`, dentista);
  }

  deletar(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
