import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EspecialidadeService } from '../../especialidades/especialidade';
import { EspecialidadeModel } from '../../especialidades/especialidade.model';
import { DentistaService } from '../dentista';
import {
  criarDentistaForm,
  extrairMensagemErro,
  formatarCpf,
  montarDentistaCadastroPayload,
  validarDentistaForm
} from '../dentista-form';

@Component({
  selector: 'app-dentista-cadastro-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './dentista-cadastro-page.html',
  styleUrl: './dentista-cadastro-page.scss'
})
export class DentistaCadastroPage implements OnInit {
  erro = '';
  salvando = false;
  dentistaForm = criarDentistaForm();
  especialidades: EspecialidadeModel[] = [];
  voltarPara = '/dentistas/pesquisar';

  constructor(
    private dentistaService: DentistaService,
    private especialidadeService: EspecialidadeService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.definirRetorno();
  }

  ngOnInit() {
    this.carregarEspecialidades();
  }

  salvar() {
    this.erro = validarDentistaForm(this.dentistaForm, true);

    if (this.erro) return;

    this.salvando = true;

    this.dentistaService.criar(montarDentistaCadastroPayload(this.dentistaForm)).subscribe({
      next: () => {
        this.salvando = false;
        this.router.navigateByUrl('/dentistas/listar');
      },
      error: err => {
        this.salvando = false;
        this.erro = extrairMensagemErro(err, 'Erro ao cadastrar dentista.');
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

  private carregarEspecialidades() {
    this.especialidadeService.listar().subscribe({
      next: dados => {
        this.especialidades = dados;
      },
      error: err => {
        this.erro = extrairMensagemErro(err, 'Erro ao carregar especialidades.');
      }
    });
  }

  private definirRetorno() {
    const origem = this.route.snapshot.queryParamMap.get('origem');

    if (origem === 'listar') {
      this.voltarPara = '/dentistas/listar';
      return;
    }

    this.voltarPara = '/dentistas/pesquisar';
  }
}
