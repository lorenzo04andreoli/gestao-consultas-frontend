import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DentistaService } from '../../dentistas/dentista';
import { DentistaResponseModel } from '../../dentistas/dentista.model';
import { PacienteService } from '../../pacientes/paciente';
import { PacienteModel } from '../../pacientes/paciente.model';
import { ConsultaService } from '../consulta';
import { ConsultaModel, ConsultaRequestModel } from '../consulta.model';

@Component({
  selector: 'app-consultas-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './consultas-page.html',
  styleUrl: './consultas-page.scss'
})
export class ConsultasPage implements OnInit {
  private consultaService = inject(ConsultaService);
  private pacienteService = inject(PacienteService);
  private dentistaService = inject(DentistaService);

  consultas = signal<ConsultaModel[]>([]);
  pacientes = signal<PacienteModel[]>([]);
  dentistas = signal<DentistaResponseModel[]>([]);

  erro = signal('');
  sucesso = signal('');
  modalCadastroAberto = signal(false);
  modalCancelamentoAberto = signal(false);

  consultaForm = {
    pacienteId: null as number | null,
    dentistaId: null as number | null,
    descricao: '',
    dataInicio: '',
    dataFim: ''
  };

  consultaCancelamentoId: number | null = null;
  motivoCancelamento = '';

  ngOnInit() {
    this.carregarConsultas();
    this.carregarPacientes();
    this.carregarDentistas();
  }

  carregarConsultas() {
    this.erro.set('');

    this.consultaService.listar().subscribe({
      next: (dados) => {
        this.consultas.set(dados);
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar consultas.'));
      }
    });
  }

  carregarPacientes() {
    this.pacienteService.listar().subscribe({
      next: (dados) => {
        this.pacientes.set(dados);
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar pacientes.'));
      }
    });
  }

  carregarDentistas() {
    this.dentistaService.listar().subscribe({
      next: (dados) => {
        this.dentistas.set(dados.filter(dentista => dentista.ativo));
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar dentistas.'));
      }
    });
  }

  abrirModalCadastro() {
    this.carregarPacientes();
    this.carregarDentistas();
    this.limparFormulario();
    this.modalCadastroAberto.set(true);
  }

  fecharModalCadastro() {
    this.modalCadastroAberto.set(false);
    this.limparFormulario();
  }

  abrirModalCancelamento(consulta: ConsultaModel) {
    if (!consulta.id) return;

    this.consultaCancelamentoId = consulta.id;
    this.motivoCancelamento = '';
    this.modalCancelamentoAberto.set(true);
  }

  fecharModalCancelamento() {
    this.modalCancelamentoAberto.set(false);
    this.consultaCancelamentoId = null;
    this.motivoCancelamento = '';
  }

  salvar() {
    this.erro.set('');
    this.sucesso.set('');

    if (!this.consultaForm.pacienteId || !this.consultaForm.dentistaId) {
      this.erro.set('Selecione paciente e dentista.');
      return;
    }

    if (!this.consultaForm.dataInicio || !this.consultaForm.dataFim) {
      this.erro.set('Informe data e hora inicial e final.');
      return;
    }

    if (!this.consultaForm.descricao.trim()) {
      this.erro.set('Informe a descrição da consulta.');
      return;
    }

    if (new Date(this.consultaForm.dataFim) <= new Date(this.consultaForm.dataInicio)) {
      this.erro.set('A data final deve ser após a data inicial.');
      return;
    }

    const payload: ConsultaRequestModel = {
      pacienteId: this.consultaForm.pacienteId,
      dentistaId: this.consultaForm.dentistaId,
      descricao: this.consultaForm.descricao.trim(),
      dataInicio: this.consultaForm.dataInicio,
      dataFim: this.consultaForm.dataFim
    };

    this.consultaService.criar(payload).subscribe({
      next: () => {
        this.sucesso.set('Consulta agendada com sucesso.');
        this.fecharModalCadastro();
        this.carregarConsultas();
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao agendar consulta.'));
      }
    });
  }

  cancelarConsulta() {
    const motivo = this.motivoCancelamento.trim();

    this.erro.set('');
    this.sucesso.set('');

    if (!this.consultaCancelamentoId) return;

    if (!motivo) {
      this.erro.set('Informe o motivo do cancelamento.');
      return;
    }

    this.consultaService.cancelar(this.consultaCancelamentoId, motivo).subscribe({
      next: () => {
        this.sucesso.set('Consulta cancelada com sucesso.');
        this.fecharModalCancelamento();
        this.carregarConsultas();
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao cancelar consulta.'));
      }
    });
  }

  finalizarConsulta(consulta: ConsultaModel) {
    if (!consulta.id) return;

    this.erro.set('');
    this.sucesso.set('');

    this.consultaService.finalizar(consulta.id).subscribe({
      next: () => {
        this.sucesso.set('Consulta finalizada com sucesso.');
        this.carregarConsultas();
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao finalizar consulta.'));
      }
    });
  }

  formatarData(data: string) {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
  }

  limparFormulario() {
    this.consultaForm = {
      pacienteId: null,
      dentistaId: null,
      descricao: '',
      dataInicio: '',
      dataFim: ''
    };
  }

  private extrairMensagemErro(err: unknown, mensagemPadrao: string) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.error?.erro ?? mensagemPadrao;
    }

    return mensagemPadrao;
  }
}
