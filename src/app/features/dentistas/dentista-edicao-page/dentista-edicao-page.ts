import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, take, timeout } from 'rxjs';
import { EspecialidadeService } from '../../especialidades/especialidade';
import { EspecialidadeModel } from '../../especialidades/especialidade.model';
import { DentistaService } from '../dentista';
import {
  criarDentistaForm,
  extrairMensagemErro,
  formatarCpf,
  montarDentistaAtualizacaoPayload,
  montarDentistaForm,
  validarDentistaForm
} from '../dentista-form';

@Component({
  selector: 'app-dentista-edicao-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './dentista-edicao-page.html',
  styleUrl: './dentista-edicao-page.scss'
})
export class DentistaEdicaoPage implements OnInit {
  erro = signal('');
  carregando = signal(true);
  salvando = signal(false);
  dentistaId: number | null = null;
  voltarPara = '/dentistas/listar';
  dentistaForm = criarDentistaForm();
  especialidades = signal<EspecialidadeModel[]>([]);

  constructor(
    private dentistaService: DentistaService,
    private especialidadeService: EspecialidadeService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.erro.set('Dentista não encontrado.');
      this.carregando.set(false);
      return;
    }

    this.dentistaId = id;
    this.definirRetorno();
    this.carregarDados(id);
  }

  salvar() {
    this.erro.set(validarDentistaForm(this.dentistaForm, false));

    if (this.erro() || !this.dentistaId) return;

    this.salvando.set(true);

    this.dentistaService.atualizar(
      this.dentistaId,
      montarDentistaAtualizacaoPayload(this.dentistaForm)
    ).subscribe({
      next: () => {
        this.salvando.set(false);
        this.router.navigateByUrl(this.voltarPara);
      },
      error: err => {
        this.salvando.set(false);
        this.erro.set(extrairMensagemErro(err, 'Erro ao atualizar dentista.'));
      }
    });
  }

  atualizarCpf(valor: string) {
    this.dentistaForm.cpf = formatarCpf(valor);
  }

  alternarEspecialidade(especialidadeId: number, marcado: boolean) {
    const atuais = this.dentistaForm.especialidadeIds;

    this.dentistaForm.especialidadeIds = marcado
      ? [...atuais, especialidadeId]
      : atuais.filter(id => id !== especialidadeId);
  }

  especialidadeSelecionada(especialidadeId: number) {
    return this.dentistaForm.especialidadeIds.includes(especialidadeId);
  }

  private carregarDados(id: number) {
    this.carregando.set(true);
    this.erro.set('');

    this.especialidadeService.listar().pipe(
      take(1),
      timeout(8000)
    ).subscribe({
      next: especialidades => {
        this.especialidades.set(especialidades);
        this.carregarDentista(id);
      },
      error: err => {
        this.erro.set(extrairMensagemErro(err, 'Erro ao carregar especialidades.'));
        this.carregando.set(false);
      }
    });
  }

  private carregarDentista(id: number) {
    this.dentistaService.buscarPorId(id).pipe(
      take(1),
      timeout(8000),
      finalize(() => {
        this.carregando.set(false);
      })
    ).subscribe({
      next: dentista => {
        const especialidadeIds = this.obterEspecialidadeIdsPorNome(dentista.especialidades);
        this.dentistaForm = montarDentistaForm(dentista, especialidadeIds);
      },
      error: err => {
        this.erro.set(extrairMensagemErro(err, 'Erro ao carregar dentista.'));
      }
    });
  }

  private obterEspecialidadeIdsPorNome(nomes: string[]) {
    const nomesNormalizados = nomes.map(nome => this.normalizarTexto(nome));

    return this.especialidades()
      .filter(especialidade =>
        especialidade.id &&
        nomesNormalizados.includes(this.normalizarTexto(especialidade.nome))
      )
      .map(especialidade => especialidade.id as number);
  }

  private normalizarTexto(valor: string) {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private definirRetorno() {
    const origem = this.route.snapshot.queryParamMap.get('origem');

    if (origem === 'pesquisar') {
      this.voltarPara = '/dentistas/pesquisar';
      return;
    }

    this.voltarPara = '/dentistas/listar';
  }
}
