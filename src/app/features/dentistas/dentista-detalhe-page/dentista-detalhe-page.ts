import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';
import { ConsultaService } from '../../consultas/consulta';
import { ConsultaModel, StatusConsulta } from '../../consultas/consulta.model';
import { UsuarioService } from '../../usuarios/usuario';
import { DentistaResponseModel } from '../dentista.model';
import { DentistaService } from '../dentista';

@Component({
  selector: 'app-dentista-detalhe-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dentista-detalhe-page.html',
  styleUrl: './dentista-detalhe-page.scss'
})
export class DentistaDetalhePage implements OnInit {
  dentista = signal<DentistaResponseModel | null>(null);
  consultas = signal<ConsultaModel[]>([]);
  carregando = signal(true);
  carregandoConsultas = signal(true);
  erro = signal('');
  feedback = signal('');
  modalFotoAberto = signal(false);
  fotoPendente = signal('');
  salvandoFoto = signal(false);
  voltarPara = '/dentistas/pesquisar';

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    private dentistaService: DentistaService,
    private consultaService: ConsultaService,
    private usuarioService: UsuarioService,
    private confirmation: ConfirmationService
  ) {}

  ngOnInit() {
    this.definirRetorno();
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.erro.set('Dentista não encontrado.');
      this.carregando.set(false);
      this.carregandoConsultas.set(false);
      return;
    }

    this.dentistaService.buscarPorId(id).subscribe({
      next: dados => {
        this.dentista.set(dados);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar dentista.');
        this.carregando.set(false);
      }
    });

    this.carregarConsultas(id);
  }

  carregarConsultas(dentistaId: number) {
    this.carregandoConsultas.set(true);

    this.consultaService.relatorios({ dentistaId }).subscribe({
      next: dados => {
        this.consultas.set(
          dados.sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())
        );
        this.carregandoConsultas.set(false);
      },
      error: () => {
        this.carregandoConsultas.set(false);
      }
    });
  }

  totalConsultas() {
    return this.consultas().length;
  }

  consultasAgendadas() {
    return this.consultas().filter(consulta => consulta.status === 'AGENDADA').length;
  }

  ultimaConsulta() {
    return this.consultas()[0] ?? null;
  }

  especialidadesFormatadas(dentista: DentistaResponseModel) {
    return dentista.especialidades.join(', ') || '-';
  }

  formatarData(data?: string) {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
  }

  formatarIntervalo(consulta: ConsultaModel) {
    const inicio = new Date(consulta.dataInicio);
    const fim = new Date(consulta.dataFim);

    return `${this.formatarHora(inicio)} - ${this.formatarHora(fim)}`;
  }

  labelStatus(status: StatusConsulta) {
    const labels: Record<StatusConsulta, string> = {
      AGENDADA: 'Agendada',
      FINALIZADA: 'Finalizada',
      CANCELADA: 'Cancelada'
    };

    return labels[status];
  }

  podeGerenciarPerfil(dentista: DentistaResponseModel) {
    return this.authService.isAdmin() && Boolean(dentista.usuarioId);
  }

  fotoModal() {
    return this.fotoPendente() || this.dentista()?.fotoPerfil || '';
  }

  abrirModalFoto() {
    this.feedback.set('');
    this.fotoPendente.set('');
    this.modalFotoAberto.set(true);
  }

  fecharModalFoto() {
    this.fotoPendente.set('');
    this.modalFotoAberto.set(false);
  }

  alterarFoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];

    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      this.feedback.set('Selecione um arquivo de imagem.');
      input.value = '';
      return;
    }

    if (arquivo.size > 2_000_000) {
      this.feedback.set('A foto deve ter no máximo 2 MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      this.fotoPendente.set(String(reader.result || ''));
      this.feedback.set('');
    };

    reader.readAsDataURL(arquivo);
    input.value = '';
  }

  salvarFoto() {
    const dentista = this.dentista();
    const foto = this.fotoPendente();

    if (!dentista?.usuarioId || !foto) return;

    this.salvandoFoto.set(true);
    this.feedback.set('');

    this.usuarioService.atualizarFoto(dentista.usuarioId, foto).subscribe({
      next: usuario => {
        this.atualizarFotoDentista(usuario.fotoPerfil ?? null);
        this.fecharModalFoto();
        this.feedback.set('Foto de perfil atualizada.');
        this.salvandoFoto.set(false);
      },
      error: err => {
        this.feedback.set(this.extrairMensagemErro(err, 'Erro ao atualizar foto de perfil.'));
        this.salvandoFoto.set(false);
      }
    });
  }

  async confirmarRemocaoFoto() {
    const dentista = this.dentista();

    if (!dentista?.usuarioId) return;

    const confirmar = await this.confirmation.confirmar({
      title: 'Remover foto',
      message: 'A foto do perfil deste dentista será removida.',
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      tone: 'danger'
    });

    if (!confirmar) return;

    this.usuarioService.removerFoto(dentista.usuarioId).subscribe({
      next: usuario => {
        this.atualizarFotoDentista(usuario.fotoPerfil ?? null);
        this.fecharModalFoto();
        this.feedback.set('Foto de perfil removida.');
      },
      error: err => {
        this.feedback.set(this.extrairMensagemErro(err, 'Erro ao remover foto de perfil.'));
      }
    });
  }

  private definirRetorno() {
    const origem = this.route.snapshot.queryParamMap.get('origem');

    if (origem === 'listar') {
      this.voltarPara = '/dentistas/listar';
      return;
    }

    if (origem === 'arquivados') {
      this.voltarPara = '/dentistas/arquivados';
      return;
    }

    if (origem === 'dashboard') {
      this.voltarPara = '/dashboard';
      return;
    }

    this.voltarPara = '/dentistas/pesquisar';
  }

  private formatarHora(data: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  }

  private atualizarFotoDentista(fotoPerfil: string | null) {
    const dentista = this.dentista();

    if (!dentista) return;

    this.dentista.set({ ...dentista, fotoPerfil });
  }

  private extrairMensagemErro(err: unknown, mensagemPadrao: string) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.error?.erro ?? mensagemPadrao;
    }

    return mensagemPadrao;
  }
}
