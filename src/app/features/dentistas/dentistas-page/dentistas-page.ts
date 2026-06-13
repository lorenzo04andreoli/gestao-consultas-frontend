import { Component, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../../core/auth/auth';
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';
import { DentistaResponseModel } from '../dentista.model';
import { DentistaService } from '../dentista';
import { EspecialidadeService } from '../../especialidades/especialidade';
import { EspecialidadeModel } from '../../especialidades/especialidade.model';
import { extrairMensagemErro } from '../dentista-form';

@Component({
  selector: 'app-dentistas-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './dentistas-page.html',
  styleUrl: './dentistas-page.scss'
})
export class DentistasPage implements OnInit {
  dentistas = signal<DentistaResponseModel[]>([]);
  especialidades = signal<EspecialidadeModel[]>([]);

  erro = signal('');
  sucesso = signal('');
  buscaControl = new FormControl('', { nonNullable: true });
  paginaAtual = signal(0);
  itensPorPagina = signal(10);
  totalDentistas = signal(0);
  totalPaginas = signal(0);

  constructor(
    public authService: AuthService,
    private dentistaService: DentistaService,
    private especialidadeService: EspecialidadeService,
    private confirmation: ConfirmationService
  ) {}

  ngOnInit() {
    this.carregarDentistas();
    this.carregarEspecialidades();

    this.buscaControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.paginaAtual.set(0);
        this.carregarDentistas();
      });
  }

  carregarDentistas() {
    this.erro.set('');

    this.dentistaService
      .listarPaginado(this.paginaAtual(), this.itensPorPagina(), this.buscaControl.value)
      .subscribe({
      next: pagina => {
        this.dentistas.set(pagina.content);
        this.totalDentistas.set(pagina.totalElements);
        this.totalPaginas.set(pagina.totalPages);
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

  async arquivarDentista(dentista: DentistaResponseModel) {
    if (!dentista.ativo) return;

    const confirmar = await this.confirmation.confirmar({
      title: 'Arquivar dentista',
      message: `${dentista.nome} sairá da agenda de profissionais ativos, mas continuará disponível em Arquivados.`,
      confirmLabel: 'Arquivar',
      cancelLabel: 'Manter ativo',
      tone: 'danger'
    });

    if (!confirmar) return;

    this.erro.set('');
    this.sucesso.set('');

    this.dentistaService.desativar(dentista.id).subscribe({
      next: () => {
        this.sucesso.set('Dentista arquivado com sucesso.');
        this.carregarDentistas();
      },
      error: err => {
        this.erro.set(extrairMensagemErro(err, 'Erro ao arquivar dentista.'));
      }
    });
  }

  inicialDentista(dentista: DentistaResponseModel) {
    return dentista.nome.trim().charAt(0).toUpperCase() || 'D';
  }

  limparBusca() {
    this.buscaControl.setValue('');
  }

  totalDentistasFiltrados() {
    return this.totalDentistas();
  }

  paginas() {
    return Array.from({ length: this.totalPaginas() }, (_, index) => index);
  }

  irParaPagina(pagina: number) {
    if (pagina < 0 || pagina >= this.totalPaginas() || pagina === this.paginaAtual()) return;

    this.paginaAtual.set(pagina);
    this.carregarDentistas();
  }
}
