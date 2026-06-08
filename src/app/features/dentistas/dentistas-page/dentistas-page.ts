import { Component, OnInit, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
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
  termoBusca = toSignal(
    this.buscaControl.valueChanges.pipe(
      startWith(this.buscaControl.value),
      debounceTime(250),
      map(valor => this.normalizarTexto(valor)),
      distinctUntilChanged()
    ),
    { initialValue: '' }
  );

  dentistasFiltrados = computed(() => {
    const termo = this.termoBusca();

    if (!termo) return this.dentistas();

    return this.dentistas().filter(dentista => this.dentistaContemTermo(dentista, termo));
  });

  totalDentistasFiltrados = computed(() => this.dentistasFiltrados().length);

  constructor(
    public authService: AuthService,
    private dentistaService: DentistaService,
    private especialidadeService: EspecialidadeService,
    private confirmation: ConfirmationService
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
        this.dentistas.update(dentistas => dentistas.filter(item => item.id !== dentista.id));
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
