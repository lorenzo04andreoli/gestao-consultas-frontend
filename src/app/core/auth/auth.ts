import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface LoginRequest {
  email: string;
  senha: string;
}

interface LoginResponse {
  token: string;
}

interface JwtPayload {
  sub: string;
  perfil: 'ADMIN' | 'DENTISTA';
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/auth';

  private tokenSignal = signal<string | null>(localStorage.getItem('token'));

  isLoggedIn = computed(() => !!this.tokenSignal());
  perfil = computed(() => this.getPayload()?.perfil ?? null);
  email = computed(() => this.getPayload()?.sub ?? null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(email: string, senha: string) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      email,
      senha
    });
  }

  salvarToken(token: string) {
    localStorage.setItem('token', token);
    this.tokenSignal.set(token);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  logout() {
    localStorage.removeItem('token');
    this.tokenSignal.set(null);
    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    return this.perfil() === 'ADMIN';
  }

  isDentista(): boolean {
    return this.perfil() === 'DENTISTA';
  }

  private getPayload(): JwtPayload | null {
    const token = this.getToken();

    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}