import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConsultaModel } from '../consulta.model';
import { ConsultaService } from '../consulta';

@Component({
  selector: 'app-consultas-listar-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './consultas-listar-page.html',
  styleUrl: './consultas-listar-page.scss'
})
export class ConsultasListarPage implements OnInit {
  private consultaService = inject(ConsultaService);

  consultas = signal<ConsultaModel[]>([]);
  erro = signal('');
  termoBusca = '';

  ngOnInit() {
    this.carregarConsultas();
  }

  carregarConsultas() {
    this.erro.set('');

    this.consultaService.listar().subscribe({
      next: dados => this.consultas.set(dados),
      error: err => this.erro.set(this.extrairMensagemErro(err))
    });
  }

  formatarData(data: string) {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
  }

  consultasFiltradas() {
    const termo = this.normalizarTexto(this.termoBusca);

    if (!termo) return this.consultas();

    return this.consultas().filter(consulta =>
      [
        consulta.pacienteNome,
        consulta.dentistaNome,
        consulta.descricao,
        consulta.status
      ].some(valor => this.normalizarTexto(valor).includes(termo))
    );
  }

  private extrairMensagemErro(err: unknown) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? 'Erro ao carregar consultas.';
    }

    return 'Erro ao carregar consultas.';
  }

  private normalizarTexto(valor: string) {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
