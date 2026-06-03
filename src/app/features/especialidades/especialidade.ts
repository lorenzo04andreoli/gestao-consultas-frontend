import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../core/api';
import { EspecialidadeModel } from './especialidade.model';

@Injectable({
  providedIn: 'root'
})
export class EspecialidadeService {
  private apiUrl = `${API_URL}/especialidades`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<EspecialidadeModel[]>(this.apiUrl);
  }

  criar(especialidade: EspecialidadeModel) {
    return this.http.post<EspecialidadeModel>(this.apiUrl, especialidade);
  }

  atualizar(id: number, especialidade: EspecialidadeModel) {
    return this.http.put<EspecialidadeModel>(`${this.apiUrl}/${id}`, especialidade);
  }

  excluir(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
