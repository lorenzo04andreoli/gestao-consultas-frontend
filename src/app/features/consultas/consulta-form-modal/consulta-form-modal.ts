import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DentistaResponseModel } from '../../dentistas/dentista.model';
import { EspecialidadeModel } from '../../especialidades/especialidade.model';
import { PacienteModel } from '../../pacientes/paciente.model';
import { ConsultaFormModel } from '../consulta-form.model';

@Component({
  selector: 'app-consulta-form-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './consulta-form-modal.html',
  styleUrl: './consulta-form-modal.scss'
})
export class ConsultaFormModal {
  @Input({ required: true }) form!: ConsultaFormModel;
  @Input() modo: 'cadastro' | 'edicao' = 'cadastro';
  @Input() confirmandoReagendamento = false;
  @Input() podeExibirAcoes = false;
  @Input() pacientes: PacienteModel[] = [];
  @Input() dentistas: DentistaResponseModel[] = [];
  @Input() especialidades: EspecialidadeModel[] = [];

  @Output() fechar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<void>();
  @Output() dentistaAlterado = new EventEmitter<void>();
  @Output() finalizar = new EventEmitter<void>();
  @Output() cancelarConsulta = new EventEmitter<void>();

  titulo() {
    if (this.confirmandoReagendamento) return 'Confirmar novo horario';
    return this.modo === 'edicao' ? 'Editar consulta' : 'Agendar consulta';
  }

  subtitulo() {
    return this.confirmandoReagendamento
      ? 'Confira os dados antes de salvar a alteracao.'
      : 'Selecione paciente, dentista e horario da consulta.';
  }

  textoBotaoPrincipal() {
    return this.modo === 'edicao' ? 'Salvar' : 'Agendar';
  }

  alterarDentista(dentistaId: number | null) {
    this.form.dentistaId = dentistaId;
    this.dentistaAlterado.emit();
  }
}
