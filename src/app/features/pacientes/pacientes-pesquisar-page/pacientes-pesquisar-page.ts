import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PacienteService } from '../paciente';
import { PacienteModel } from '../paciente.model';

@Component({
  selector: 'app-pacientes-pesquisar-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './pacientes-pesquisar-page.html',
  styleUrl: './pacientes-pesquisar-page.scss'
})
export class PacientesPesquisarPage implements OnInit {
  pacientes = signal<PacienteModel[]>([]);
  carregando = signal(false);
  erro = signal('');
  termoBusca = signal('');
  resultadosAbertos = signal(false);

  pacientesFiltrados = computed(() => {
    const termo = this.normalizarTexto(this.termoBusca());

    if (!termo) return this.pacientes().slice(0, 8);

    return this.pacientes()
      .filter(paciente => this.pacienteContemTermo(paciente, termo))
      .slice(0, 12);
  });

  constructor(private pacienteService: PacienteService) {}

  ngOnInit() {
    this.carregarPacientes();
  }

  carregarPacientes() {
    this.carregando.set(true);
    this.erro.set('');

    this.pacienteService.listar().subscribe({
      next: dados => {
        this.pacientes.set(dados);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar pacientes.');
        this.carregando.set(false);
      }
    });
  }

  atualizarBusca(valor: string) {
    this.termoBusca.set(valor);
    this.resultadosAbertos.set(true);
  }

  limparBusca() {
    this.termoBusca.set('');
    this.resultadosAbertos.set(true);
  }

  abrirResultados() {
    this.resultadosAbertos.set(true);
  }

  fecharResultados() {
    window.setTimeout(() => this.resultadosAbertos.set(false), 150);
  }

  private pacienteContemTermo(paciente: PacienteModel, termo: string) {
    return [paciente.nome, paciente.telefone, paciente.email, paciente.cpf]
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
