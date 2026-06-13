import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { PageResponseModel } from '../../core/pagination/page-response.model';
import { PacienteModel } from './paciente.model';
import { API_URL } from '../../core/api';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private apiUrl = `${API_URL}/pacientes`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<PacienteModel[]>(this.apiUrl).pipe(
      map(pacientes => pacientes.filter(paciente => paciente.ativo !== false))
    );
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

    return this.http.get<PageResponseModel<PacienteModel>>(`${this.apiUrl}/paginado`, { params });
  }

  listarArquivados() {
    return this.http.get<PacienteModel[]>(this.apiUrl).pipe(
      map(pacientes => pacientes.filter(paciente => paciente.ativo === false))
    );
  }

  buscarPorId(id: number) {
    return this.http.get<PacienteModel>(`${this.apiUrl}/${id}`);
  }

  criar(paciente: PacienteModel) {
    return this.http.post<PacienteModel>(this.apiUrl, paciente);
  }

  atualizar(id: number, paciente: PacienteModel) {
    return this.http.put<PacienteModel>(`${this.apiUrl}/${id}`, paciente);
  }

  deletar(id: number) {
    return this.http.delete<PacienteModel>(`${this.apiUrl}/${id}`);
  }

  desativar(id: number) {
    return this.http.put<PacienteModel>(`${this.apiUrl}/${id}/desativar`, {});
  }

  reativar(id: number) {
    return this.http.put<PacienteModel>(`${this.apiUrl}/${id}/reativar`, {});
  }
}
