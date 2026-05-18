import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EspecialidadeService } from '../especialidade';
import { EspecialidadeModel } from '../especialidade.model';

@Component({
  selector: 'app-especialidades-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './especialidades-page.html',
  styleUrl: './especialidades-page.scss'
})
export class EspecialidadesPage implements OnInit {
  especialidades = signal<EspecialidadeModel[]>([]);

  erro = signal('');
  sucesso = signal('');
  modalAberto = signal(false);

  especialidadeForm: EspecialidadeModel = {
    nome: ''
  };

  constructor(private especialidadeService: EspecialidadeService) {}

  ngOnInit() {
    this.carregarEspecialidades();
  }

  carregarEspecialidades() {
    this.erro.set('');

    this.especialidadeService.listar().subscribe({
      next: (dados) => {
        this.especialidades.set(dados);
      },
      error: () => {
        this.erro.set('Erro ao carregar especialidades.');
      }
    });
  }

  abrirModalCadastro() {
    this.limparFormulario();
    this.modalAberto.set(true);
  }

  fecharModal() {
    this.modalAberto.set(false);
    this.limparFormulario();
  }

  salvar() {
    const nome = this.especialidadeForm.nome.trim();

    this.erro.set('');
    this.sucesso.set('');

    if (!nome) {
      this.erro.set('Informe o nome da especialidade.');
      return;
    }

    this.especialidadeService.criar({ nome }).subscribe({
      next: () => {
        this.sucesso.set('Especialidade cadastrada com sucesso.');
        this.fecharModal();
        this.carregarEspecialidades();
      },
      error: () => {
        this.erro.set('Erro ao cadastrar especialidade.');
      }
    });
  }

  limparFormulario() {
    this.especialidadeForm = {
      nome: ''
    };
  }
}
