import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ConsultaModel } from '../consulta.model';
import { ConsultaService } from '../consulta';

@Component({
  selector: 'app-consultas-listar-page',
  standalone: true,
  templateUrl: './consultas-listar-page.html',
  styleUrl: './consultas-listar-page.scss'
})
export class ConsultasListarPage implements OnInit {
  private consultaService = inject(ConsultaService);

  consultas = signal<ConsultaModel[]>([]);
  erro = signal('');

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

  private extrairMensagemErro(err: unknown) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? 'Erro ao carregar consultas.';
    }

    return 'Erro ao carregar consultas.';
  }
}
