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
        path: 'pacientes/listar',
        loadComponent: () =>
          import('./features/pacientes/pacientes-page/pacientes-page').then(m => m.PacientesPage)
      },
      {
        path: 'pacientes/pesquisar',
        loadComponent: () =>
          import('./features/pacientes/pacientes-pesquisar-page/pacientes-pesquisar-page').then(
            m => m.PacientesPesquisarPage
          )
      },
      {
        path: 'pacientes/cadastrar',
        loadComponent: () =>
          import('./features/pacientes/paciente-cadastro-page/paciente-cadastro-page').then(
            m => m.PacienteCadastroPage
          )
      },
      {
        path: 'pacientes/arquivados',
        loadComponent: () =>
          import('./features/pacientes/pacientes-arquivados-page/pacientes-arquivados-page').then(
            m => m.PacientesArquivadosPage
          )
      },
      {
        path: 'pacientes/:id/editar',
        loadComponent: () =>
          import('./features/pacientes/paciente-edicao-page/paciente-edicao-page').then(
            m => m.PacienteEdicaoPage
          )
      },
      {
        path: 'pacientes/:id',
        loadComponent: () =>
          import('./features/pacientes/paciente-detalhe-page/paciente-detalhe-page').then(
            m => m.PacienteDetalhePage
          )
      },
      {
        path: 'pacientes',
        redirectTo: 'pacientes/listar',
        pathMatch: 'full'
      },
      {
        path: 'dentistas/listar',
        loadComponent: () =>
          import('./features/dentistas/dentistas-page/dentistas-page').then(m => m.DentistasPage)
      },
      {
        path: 'dentistas/pesquisar',
        loadComponent: () =>
          import('./features/dentistas/dentistas-pesquisar-page/dentistas-pesquisar-page').then(
            m => m.DentistasPesquisarPage
          )
      },
      {
        path: 'dentistas/arquivados',
        loadComponent: () =>
          import('./features/dentistas/dentistas-arquivados-page/dentistas-arquivados-page').then(
            m => m.DentistasArquivadosPage
          )
      },
      {
        path: 'dentistas/cadastrar',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/dentistas/dentista-cadastro-page/dentista-cadastro-page').then(
            m => m.DentistaCadastroPage
          )
      },
      {
        path: 'dentistas/:id/editar',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/dentistas/dentista-edicao-page/dentista-edicao-page').then(
            m => m.DentistaEdicaoPage
          )
      },
      {
        path: 'dentistas',
        redirectTo: 'dentistas/listar',
        pathMatch: 'full'
      },
      {
        path: 'especialidades',
        loadComponent: () =>
          import('./features/especialidades/especialidades-page/especialidades-page').then(
            m => m.EspecialidadesPage
          )
      },
      {
        path: 'consultas/listar',
        loadComponent: () =>
          import('./features/consultas/consultas-listar-page/consultas-listar-page').then(
            m => m.ConsultasListarPage
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
