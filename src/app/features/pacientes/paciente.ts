import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PacienteModel } from './paciente.model';
import { API_URL } from '../../core/api';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private apiUrl = `${API_URL}/pacientes`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<PacienteModel[]>(this.apiUrl);
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
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
