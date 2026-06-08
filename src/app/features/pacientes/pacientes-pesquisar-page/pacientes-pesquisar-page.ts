import { Component, ElementRef, HostListener, OnInit, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { PacienteService } from '../paciente';
import { PacienteModel } from '../paciente.model';

@Component({
  selector: 'app-pacientes-pesquisar-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pacientes-pesquisar-page.html',
  styleUrl: './pacientes-pesquisar-page.scss'
})
export class PacientesPesquisarPage implements OnInit {
  pacientes = signal<PacienteModel[]>([]);
  carregando = signal(false);
  erro = signal('');
  resultadosAbertos = signal(false);
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

    if (!termo) return this.pacientes().slice(0, 8);

    return this.pacientes()
      .filter(paciente => this.pacienteContemTermo(paciente, termo))
      .slice(0, 12);
  });

  constructor(
    private pacienteService: PacienteService,
    private elementRef: ElementRef<HTMLElement>
  ) {}

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

  limparBusca() {
    this.buscaControl.setValue('');
    this.resultadosAbertos.set(true);
  }

  abrirResultados() {
    this.resultadosAbertos.set(true);
  }

  @HostListener('document:click', ['$event'])
  fecharResultadosAoClicarFora(event: MouseEvent) {
    const alvo = event.target as Node | null;
    const pesquisa = this.elementRef.nativeElement.querySelector('.search-card');

    if (alvo && pesquisa?.contains(alvo)) return;

    this.resultadosAbertos.set(false);
  }

  @HostListener('document:keydown.escape')
  fecharResultados() {
    this.resultadosAbertos.set(false);
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
