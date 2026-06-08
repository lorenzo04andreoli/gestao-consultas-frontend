import { Component, OnInit, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';
import { PacienteService } from '../paciente';
import { PacienteModel } from '../paciente.model';

@Component({
  selector: 'app-pacientes-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pacientes-page.html',
  styleUrl: './pacientes-page.scss'
})
export class PacientesPage implements OnInit {
  pacientes = signal<PacienteModel[]>([]);

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

  pacientesFiltrados = computed(() => {
    const termo = this.termoBusca();

    if (!termo) return this.pacientes();

    return this.pacientes().filter(paciente => this.pacienteContemTermo(paciente, termo));
  });

  totalPacientesFiltrados = computed(() => this.pacientesFiltrados().length);

  constructor(
    private pacienteService: PacienteService,
    private confirmation: ConfirmationService
  ) {}

  ngOnInit() {
    this.carregarPacientes();
  }

  carregarPacientes() {
    this.erro.set('');

    this.pacienteService.listar().subscribe({
      next: (dados) => {
        this.pacientes.set(dados);
      },
      error: () => {
        this.erro.set('Erro ao carregar pacientes.');
      }
    });
  }

  async arquivarPaciente(paciente: PacienteModel) {
    if (!paciente.id) return;

    const confirmar = await this.confirmation.confirmar({
      title: 'Arquivar paciente',
      message: `${paciente.nome} sairá da listagem principal, mas continuará disponível em Arquivados.`,
      confirmLabel: 'Arquivar',
      cancelLabel: 'Manter ativo',
      tone: 'danger'
    });

    if (!confirmar) return;

    this.erro.set('');
    this.sucesso.set('');

    this.pacienteService.desativar(paciente.id).subscribe({
      next: () => {
        this.sucesso.set('Paciente arquivado com sucesso.');
        this.pacientes.update(pacientes => pacientes.filter(item => item.id !== paciente.id));
      },
      error: () => {
        this.erro.set('Erro ao arquivar paciente.');
      }
    });
  }

  inicialPaciente(paciente: PacienteModel) {
    return paciente.nome.trim().charAt(0).toUpperCase() || 'P';
  }

  limparBusca() {
    this.buscaControl.setValue('');
  }

  private pacienteContemTermo(paciente: PacienteModel, termo: string) {
    return [paciente.nome, paciente.email, paciente.cpf, paciente.telefone]
      .filter(Boolean)
      .some(valor => this.normalizarTexto(valor).includes(termo));
  }

  private normalizarTexto(valor: string) {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}

