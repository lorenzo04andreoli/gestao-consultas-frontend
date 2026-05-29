import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PacienteService } from '../paciente';
import { PacienteModel } from '../paciente.model';

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

  pacienteForm: PacienteModel = {
    nome: '',
    email: '',
    cpf: '',
    telefone: ''
  };

  constructor(
    private pacienteService: PacienteService,
    private router: Router
  ) {}

  salvar() {
    this.erro = '';

    if (!this.formularioValido()) return;

    this.salvando = true;

    const payload: PacienteModel = {
      ...this.pacienteForm,
      nome: this.pacienteForm.nome.trim(),
      email: this.pacienteForm.email.trim(),
      cpf: this.apenasNumeros(this.pacienteForm.cpf),
      telefone: this.apenasNumeros(this.pacienteForm.telefone)
    };

    this.pacienteService.criar(payload).subscribe({
      next: paciente => {
        this.salvando = false;
        this.router.navigate(['/pacientes', paciente.id ?? 'listar']);
      },
      error: err => {
        this.salvando = false;
        this.erro = this.extrairMensagemErro(err, 'Erro ao cadastrar paciente.');
      }
    });
  }

  atualizarCpf(valor: string) {
    this.pacienteForm.cpf = this.formatarCpf(valor);
  }

  atualizarTelefone(valor: string) {
    this.pacienteForm.telefone = this.formatarTelefone(valor);
  }

  private formularioValido() {
    const nome = this.pacienteForm.nome.trim();
    const email = this.pacienteForm.email.trim();
    const cpf = this.apenasNumeros(this.pacienteForm.cpf);

    if (!nome || !email || !cpf) {
      this.erro = 'Preencha nome, e-mail e CPF.';
      return false;
    }

    if (!email.includes('@')) {
      this.erro = 'Informe um e-mail válido.';
      return false;
    }

    if (cpf.length !== 11) {
      this.erro = 'Informe um CPF com 11 dígitos.';
      return false;
    }

    return true;
  }

  private formatarCpf(valor: string) {
    const numeros = this.apenasNumeros(valor).slice(0, 11);

    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  private formatarTelefone(valor: string) {
    const numeros = this.apenasNumeros(valor).slice(0, 11);

    if (numeros.length <= 10) {
      return numeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  private apenasNumeros(valor: string) {
    return (valor || '').replace(/\D/g, '');
  }

  private extrairMensagemErro(err: unknown, mensagemPadrao: string) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'error' in err &&
      typeof err.error === 'object' &&
      err.error !== null &&
      'message' in err.error &&
      typeof err.error.message === 'string'
    ) {
      return err.error.message;
    }

    return mensagemPadrao;
  }
}
