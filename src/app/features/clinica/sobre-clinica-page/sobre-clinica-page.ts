import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { ClinicaService } from '../clinica';
import { DadosClinicaModel } from '../clinica.model';

@Component({
  selector: 'app-sobre-clinica-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './sobre-clinica-page.html',
  styleUrl: './sobre-clinica-page.scss'
})
export class SobreClinicaPage implements OnInit {
  dados = signal<DadosClinicaModel | null>(null);
  carregando = signal(true);
  salvando = signal(false);
  erro = signal('');
  sucesso = signal('');
  modalAberto = signal(false);

  form: DadosClinicaModel = this.criarFormVazio();

  constructor(
    public authService: AuthService,
    private clinicaService: ClinicaService
  ) {}

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando.set(true);
    this.erro.set('');

    this.clinicaService.buscar().subscribe({
      next: dados => {
        this.dados.set(dados);
        this.carregando.set(false);
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar dados da clínica.'));
        this.carregando.set(false);
      }
    });
  }

  abrirModalEdicao() {
    const dados = this.dados();

    if (!dados) return;

    this.form = { ...dados };
    this.erro.set('');
    this.sucesso.set('');
    this.modalAberto.set(true);
  }

  fecharModal() {
    this.modalAberto.set(false);
    this.form = this.criarFormVazio();
  }

  salvar() {
    const nomeFantasia = this.form.nomeFantasia?.trim();

    this.erro.set('');
    this.sucesso.set('');

    if (!nomeFantasia) {
      this.erro.set('Informe o nome fantasia da clínica.');
      return;
    }

    this.salvando.set(true);

    const payload: DadosClinicaModel = {
      nomeFantasia,
      razaoSocial: this.form.razaoSocial,
      cnpj: this.form.cnpj,
      email: this.form.email,
      telefone: this.form.telefone,
      endereco: this.form.endereco,
      cidade: this.form.cidade,
      estado: this.form.estado,
      cep: this.form.cep,
      responsavelTecnico: this.form.responsavelTecnico,
      croResponsavel: this.form.croResponsavel,
      horarioFuncionamento: this.form.horarioFuncionamento
    };

    this.clinicaService.atualizar(payload).subscribe({
      next: dados => {
        this.dados.set(dados);
        this.sucesso.set('Dados da clínica atualizados com sucesso.');
        this.salvando.set(false);
        this.fecharModal();
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao atualizar dados da clínica.'));
        this.salvando.set(false);
      }
    });
  }

  cidadeEstado(dados: DadosClinicaModel) {
    return [dados.cidade, dados.estado].filter(Boolean).join(' - ') || '-';
  }

  formatarData(data?: string) {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
  }

  private criarFormVazio(): DadosClinicaModel {
    return {
      nomeFantasia: ''
    };
  }

  private extrairMensagemErro(err: any, mensagemPadrao: string) {
    return err?.error?.message || mensagemPadrao;
  }
}
