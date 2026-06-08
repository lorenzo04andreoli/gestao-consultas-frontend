import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { API_URL } from '../api';
import { UsuarioResponseModel } from '../../features/usuarios/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class ProfilePhotoService {
  foto = signal('');
  private apiUrl = `${API_URL}/usuarios/me`;

  constructor(private http: HttpClient) {}

  carregar() {
    this.http.get<UsuarioResponseModel>(this.apiUrl).subscribe({
      next: usuario => this.atualizarFoto(usuario),
      error: () => this.foto.set('')
    });
  }

  definir(foto: string) {
    return this.http
      .put<UsuarioResponseModel>(`${this.apiUrl}/foto`, { fotoPerfil: foto })
      .pipe(tap(usuario => this.atualizarFoto(usuario)));
  }

  remover() {
    return this.http
      .delete<UsuarioResponseModel>(`${this.apiUrl}/foto`)
      .pipe(tap(usuario => this.atualizarFoto(usuario)));
  }

  private atualizarFoto(usuario: UsuarioResponseModel) {
    this.foto.set(usuario.fotoPerfil ?? '');
  }
}
