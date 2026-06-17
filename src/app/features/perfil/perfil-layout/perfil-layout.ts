import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';

@Component({
  selector: 'app-perfil-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './perfil-layout.html',
  styleUrl: './perfil-layout.scss'
})
export class PerfilLayout {
  constructor(public authService: AuthService) {}
}
