import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, take, timeout } from 'rxjs';
import {
  criarPacienteForm,
  extrairMensagemErro,
  formatarCpf,
  formatarTelefone,
  montarPacienteForm,
  montarPacientePayload,
  validarPacienteForm
} from '../paciente-form';
import { PacienteService } from '../paciente';

@Component({
  selector: 'app-paciente-edicao-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './paciente-edicao-page.html',
  styleUrl: './paciente-edicao-page.scss'
})
export class PacienteEdicaoPage implements OnInit {
  erro = signal('');
  carregando = signal(true);
  salvando = signal(false);
  pacienteId: number | null = null;
  voltarPara = '/pacientes/listar';
  pacienteForm = criarPacienteForm();

  constructor(
    private pacienteService: PacienteService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.erro.set('Paciente não encontrado.');
      this.carregando.set(false);
      return;
    }

    this.pacienteId = id;
    this.definirRetorno(id);
    this.carregarPaciente(id);
  }

  salvar() {
    this.erro.set(validarPacienteForm(this.pacienteForm));

    if (this.erro() || !this.pacienteId) return;

    this.salvando.set(true);

    this.pacienteService.atualizar(this.pacienteId, montarPacientePayload(this.pacienteForm)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.router.navigateByUrl(this.voltarPara);
      },
      error: err => {
        this.salvando.set(false);
        this.erro.set(extrairMensagemErro(err, 'Erro ao atualizar paciente.'));
      }
    });
  }

  atualizarCpf(valor: string) {
    this.pacienteForm.cpf = formatarCpf(valor);
  }

  atualizarTelefone(valor: string) {
    this.pacienteForm.telefone = formatarTelefone(valor);
  }

  private carregarPaciente(id: number) {
    this.carregando.set(true);
    this.erro.set('');

    this.pacienteService.buscarPorId(id).pipe(
      take(1),
      timeout(8000),
      finalize(() => {
        this.carregando.set(false);
      })
    ).subscribe({
      next: paciente => {
        if (!paciente) {
          this.erro.set('Paciente não encontrado.');
          return;
        }

        this.pacienteForm = montarPacienteForm(paciente);
      },
      error: err => {
        this.erro.set(extrairMensagemErro(err, 'Erro ao carregar paciente.'));
      }
    });
  }

  private definirRetorno(id: number) {
    const origem = this.route.snapshot.queryParamMap.get('origem');

    if (origem === 'ficha') {
      this.voltarPara = `/pacientes/${id}`;
      return;
    }

    if (origem === 'pesquisar') {
      this.voltarPara = '/pacientes/pesquisar';
      return;
    }

    this.voltarPara = '/pacientes/listar';
  }
}
