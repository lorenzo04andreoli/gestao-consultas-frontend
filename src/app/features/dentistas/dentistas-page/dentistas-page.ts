import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';
import { DentistaResponseModel } from '../dentista.model';
import { DentistaService } from '../dentista';
import { EspecialidadeService } from '../../especialidades/especialidade';
import { EspecialidadeModel } from '../../especialidades/especialidade.model';
import { extrairMensagemErro } from '../dentista-form';

@Component({
  selector: 'app-dentistas-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './dentistas-page.html',
  styleUrl: './dentistas-page.scss'
})
export class DentistasPage implements OnInit {
  dentistas = signal<DentistaResponseModel[]>([]);
  especialidades = signal<EspecialidadeModel[]>([]);

  erro = signal('');
  sucesso = signal('');
  termoBusca = '';

  constructor(
    public authService: AuthService,
    private dentistaService: DentistaService,
    private especialidadeService: EspecialidadeService
  ) {}

  ngOnInit() {
    this.carregarDentistas();
    this.carregarEspecialidades();
  }

  carregarDentistas() {
    this.erro.set('');

    this.dentistaService.listar().subscribe({
      next: dados => {
        this.dentistas.set(dados);
      },
      error: err => {
        this.erro.set(extrairMensagemErro(err, 'Erro ao carregar dentistas.'));
      }
    });
  }

  carregarEspecialidades() {
    this.especialidadeService.listar().subscribe({
      next: dados => {
        this.especialidades.set(dados);
      },
      error: err => {
        this.erro.set(extrairMensagemErro(err, 'Erro ao carregar especialidades.'));
      }
    });
  }

  desativarDentista(dentista: DentistaResponseModel) {
    if (!dentista.ativo) return;

    const confirmar = confirm(`Deseja desativar ${dentista.nome}?`);

    if (!confirmar) return;

    this.erro.set('');
    this.sucesso.set('');

    this.dentistaService.desativar(dentista.id).subscribe({
      next: () => {
        this.sucesso.set('Dentista desativado com sucesso.');
        this.carregarDentistas();
      },
      error: err => {
        this.erro.set(extrairMensagemErro(err, 'Erro ao desativar dentista.'));
      }
    });
  }

  dentistasFiltrados() {
    const termo = this.normalizarTexto(this.termoBusca);

    if (!termo) return this.dentistas();

    return this.dentistas().filter(dentista => this.dentistaContemTermo(dentista, termo));
  }

  totalDentistasFiltrados() {
    return this.dentistasFiltrados().length;
  }

  inicialDentista(dentista: DentistaResponseModel) {
    return dentista.nome.trim().charAt(0).toUpperCase() || 'D';
  }

  limparBusca() {
    this.termoBusca = '';
  }

  private dentistaContemTermo(dentista: DentistaResponseModel, termo: string) {
    return [
      dentista.nome,
      dentista.email,
      dentista.cpf,
      dentista.cro,
      dentista.especialidades.join(' ')
    ]
      .filter((valor): valor is string => Boolean(valor))
      .some(valor => this.normalizarTexto(valor).includes(termo));
  }

  private normalizarTexto(valor: string) {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
