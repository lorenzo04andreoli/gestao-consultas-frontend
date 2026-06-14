import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-consulta-cancelamento-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './consulta-cancelamento-modal.html',
  styleUrl: './consulta-cancelamento-modal.scss'
})
export class ConsultaCancelamentoModal {
  @Input() resumo = '';

  @Output() fechar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<string>();

  motivo = '';

  confirmarCancelamento() {
    this.confirmar.emit(this.motivo.trim());
  }
}
