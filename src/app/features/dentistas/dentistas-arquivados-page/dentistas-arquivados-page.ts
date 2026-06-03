import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DentistaResponseModel } from '../dentista.model';
import { DentistaService } from '../dentista';
import { extrairMensagemErro } from '../dentista-form';

@Component({
  selector: 'app-dentistas-arquivados-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './dentistas-arquivados-page.html',
  styleUrl: '../dentistas-page/dentistas-page.scss'
})
export class DentistasArquivadosPage implements OnInit {
  dentistas = signal<DentistaResponseModel[]>([]);

  erro = signal('');
  termoBusca = '';

  constructor(private dentistaService: DentistaService) {}

  ngOnInit() {
    this.carregarDentistas();
  }

  carregarDentistas() {
    this.erro.set('');

    this.dentistaService.listarArquivados().subscribe({
      next: dados => {
        this.dentistas.set(dados);
      },
      error: err => {
        this.erro.set(extrairMensagemErro(err, 'Erro ao carregar dentistas arquivados.'));
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
