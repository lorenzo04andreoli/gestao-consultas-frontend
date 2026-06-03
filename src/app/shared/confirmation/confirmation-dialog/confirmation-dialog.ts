import { Component, HostListener } from '@angular/core';
import { ConfirmationService } from '../confirmation.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.scss'
})
export class ConfirmationDialog {
  constructor(public confirmation: ConfirmationService) {}

  @HostListener('document:keydown.escape')
  fecharComEscape() {
    this.confirmation.cancelar();
  }
}
