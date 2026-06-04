import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../core/api';
import { DadosClinicaModel } from './clinica.model';

@Injectable({
  providedIn: 'root'
})
export class ClinicaService {
  private apiUrl = `${API_URL}/clinica`;

  constructor(private http: HttpClient) {}

  buscar() {
    return this.http.get<DadosClinicaModel>(this.apiUrl);
  }

  atualizar(dados: DadosClinicaModel) {
    return this.http.put<DadosClinicaModel>(this.apiUrl, dados);
  }
}
