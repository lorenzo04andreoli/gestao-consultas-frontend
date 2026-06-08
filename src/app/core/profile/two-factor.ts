import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../api';
import { UsuarioResponseModel } from '../../features/usuarios/usuario.model';

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class TwoFactorService {
  private apiUrl = `${API_URL}/usuarios/me/2fa`;

  constructor(private http: HttpClient) {}

  iniciar() {
    return this.http.post<TwoFactorSetup>(`${this.apiUrl}/setup`, {});
  }

  confirmar(codigo: string) {
    return this.http.post<UsuarioResponseModel>(`${this.apiUrl}/confirm`, { codigo });
  }

  desativar() {
    return this.http.delete<UsuarioResponseModel>(this.apiUrl);
  }
}
