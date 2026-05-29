import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  criarPacienteForm,
  extrairMensagemErro,
  formatarCpf,
  formatarTelefone,
  montarPacientePayload,
  validarPacienteForm
} from '../paciente-form';
import { PacienteService } from '../paciente';

@Component({
  selector: 'app-paciente-cadastro-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './paciente-cadastro-page.html',
  styleUrl: './paciente-cadastro-page.scss'
})
export class PacienteCadastroPage {
  erro = '';
  salvando = false;
  pacienteForm = criarPacienteForm();

  constructor(
    private pacienteService: PacienteService,
    private router: Router
  ) {}

  salvar() {
    this.erro = validarPacienteForm(this.pacienteForm);

    if (this.erro) return;

    this.salvando = true;

    this.pacienteService.criar(montarPacientePayload(this.pacienteForm)).subscribe({
      next: paciente => {
        this.salvando = false;
        this.router.navigate(['/pacientes', paciente.id ?? 'listar']);
      },
      error: err => {
        this.salvando = false;
        this.erro = extrairMensagemErro(err, 'Erro ao cadastrar paciente.');
      }
    });
  }

  atualizarCpf(valor: string) {
    this.pacienteForm.cpf = formatarCpf(valor);
  }

  atualizarTelefone(valor: string) {
    this.pacienteForm.telefone = formatarTelefone(valor);
  }
}
