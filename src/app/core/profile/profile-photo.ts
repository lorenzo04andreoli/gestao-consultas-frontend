import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProfilePhotoService {
  foto = signal('');

  carregar(email?: string | null) {
    this.foto.set(localStorage.getItem(this.storageKey(email)) ?? '');
  }

  definir(email: string | null | undefined, foto: string) {
    this.foto.set(foto);
    localStorage.setItem(this.storageKey(email), foto);
  }

  remover(email?: string | null) {
    this.foto.set('');
    localStorage.removeItem(this.storageKey(email));
  }

  private storageKey(email?: string | null) {
    return `dentix-foto-perfil:${email ?? 'usuario'}`;
  }
}
