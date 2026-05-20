import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth-guard';
import { adminGuard } from './core/auth/admin-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login-page/login-page').then(m => m.LoginPage)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/dashboard-layout/dashboard-layout').then(m => m.DashboardLayout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page/dashboard-page').then(m => m.DashboardPage)
      },
      {
        path: 'pacientes',
        loadComponent: () =>
          import('./features/pacientes/pacientes-page/pacientes-page').then(m => m.PacientesPage)
      },
      {
        path: 'dentistas',
        loadComponent: () =>
          import('./features/dentistas/dentistas-page/dentistas-page').then(m => m.DentistasPage)
      },
      {
        path: 'especialidades',
        loadComponent: () =>
          import('./features/especialidades/especialidades-page/especialidades-page').then(
            m => m.EspecialidadesPage
          )
      },
      {
        path: 'consultas',
        loadComponent: () =>
          import('./features/consultas/consultas-page/consultas-page').then(m => m.ConsultasPage)
      },
      {
        path: 'relatorios',
        loadComponent: () =>
          import('./features/relatorios/relatorios-page/relatorios-page').then(
            m => m.RelatoriosPage
          )
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/usuarios/usuarios-page/usuarios-page').then(m => m.UsuariosPage)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
