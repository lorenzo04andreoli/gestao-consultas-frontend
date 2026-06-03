import { Injectable, signal } from '@angular/core';

export type ConfirmationTone = 'primary' | 'danger';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmationTone;
}

interface ConfirmationState extends Required<ConfirmationOptions> {
  resolve: (confirmed: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  state = signal<ConfirmationState | null>(null);

  confirmar(options: ConfirmationOptions): Promise<boolean> {
    const current = this.state();

    if (current) {
      current.resolve(false);
    }

    return new Promise<boolean>(resolve => {
      this.state.set({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirmar',
        cancelLabel: options.cancelLabel ?? 'Cancelar',
        tone: options.tone ?? 'primary',
        resolve
      });
    });
  }

  confirmarAcao() {
    this.responder(true);
  }

  cancelar() {
    this.responder(false);
  }

  private responder(confirmed: boolean) {
    const current = this.state();

    if (!current) return;

    current.resolve(confirmed);
    this.state.set(null);
  }
}
