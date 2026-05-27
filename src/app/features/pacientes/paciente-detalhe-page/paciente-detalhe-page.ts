import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PacienteService } from '../paciente';
import { PacienteModel } from '../paciente.model';

@Component({
  selector: 'app-paciente-detalhe-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './paciente-detalhe-page.html',
  styleUrl: './paciente-detalhe-page.scss'
})
export class PacienteDetalhePage implements OnInit {
  paciente = signal<PacienteModel | null>(null);
  carregando = signal(true);
  erro = signal('');

  constructor(
    private route: ActivatedRoute,
    private pacienteService: PacienteService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.erro.set('Paciente não encontrado.');
      this.carregando.set(false);
      return;
    }

    this.pacienteService.buscarPorId(id).subscribe({
      next: dados => {
        this.paciente.set(dados);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar paciente.');
        this.carregando.set(false);
      }
    });
  }

  formatarData(data?: string) {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
  }
}
