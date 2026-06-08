import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/api';
import { UsuarioModel, UsuarioResponseModel } from './usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${API_URL}/usuarios`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<UsuarioResponseModel[]>(this.apiUrl);
  }

  criar(usuario: UsuarioModel) {
    return this.http.post<UsuarioResponseModel>(this.apiUrl, usuario);
  }

  buscarPorId(id: number) {
    return this.http.get<UsuarioResponseModel>(`${this.apiUrl}/${id}`);
  }

  perfilAutenticado() {
    return this.http.get<UsuarioResponseModel>(`${this.apiUrl}/me`);
  }

  deletar(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
