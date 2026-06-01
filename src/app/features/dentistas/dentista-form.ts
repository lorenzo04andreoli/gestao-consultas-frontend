import { DentistaAtualizacaoRequestModel, DentistaRequestModel, DentistaResponseModel } from './dentista.model';

export interface DentistaFormModel {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  cro: string;
  ativo: boolean;
  especialidadeIds: number[];
}

export function criarDentistaForm(): DentistaFormModel {
  return {
    nome: '',
    cpf: '',
    email: '',
    senha: '',
    cro: '',
    ativo: true,
    especialidadeIds: []
  };
}

export function montarDentistaForm(
  dentista: DentistaResponseModel,
  especialidadeIds: number[]
): DentistaFormModel {
  return {
    nome: dentista.nome,
    cpf: formatarCpf(dentista.cpf ?? ''),
    email: dentista.email,
    senha: '',
    cro: dentista.cro,
    ativo: dentista.ativo,
    especialidadeIds
  };
}

export function montarDentistaCadastroPayload(form: DentistaFormModel): DentistaRequestModel {
  return {
    nome: form.nome.trim(),
    cpf: apenasNumeros(form.cpf),
    email: form.email.trim(),
    senha: form.senha.trim(),
    cro: form.cro.trim(),
    ativo: form.ativo,
    especialidadeIds: form.especialidadeIds
  };
}

export function montarDentistaAtualizacaoPayload(form: DentistaFormModel): DentistaAtualizacaoRequestModel {
  return {
    nome: form.nome.trim(),
    cpf: apenasNumeros(form.cpf),
    email: form.email.trim(),
    cro: form.cro.trim(),
    ativo: form.ativo,
    especialidadeIds: form.especialidadeIds
  };
}

export function validarDentistaForm(form: DentistaFormModel, exigirSenha: boolean) {
  const nome = form.nome.trim();
  const email = form.email.trim();
  const cpf = apenasNumeros(form.cpf);
  const cro = form.cro.trim();
  const senha = form.senha.trim();

  if (!nome || !email || !cpf || !cro) {
    return 'Preencha nome, e-mail, CPF e CRO.';
  }

  if (exigirSenha && !senha) {
    return 'Informe a senha inicial do dentista.';
  }

  if (!email.includes('@')) {
    return 'Informe um e-mail válido.';
  }

  if (cpf.length !== 11) {
    return 'Informe um CPF com 11 dígitos.';
  }

  if (form.especialidadeIds.length === 0) {
    return 'Selecione pelo menos uma especialidade.';
  }

  return '';
}

export function formatarCpf(valor: string) {
  const numeros = apenasNumeros(valor).slice(0, 11);

  return numeros
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function extrairMensagemErro(err: unknown, mensagemPadrao: string) {
  if (
    typeof err === 'object' &&
    err !== null &&
    'error' in err &&
    typeof err.error === 'object' &&
    err.error !== null &&
    'message' in err.error &&
    typeof err.error.message === 'string'
  ) {
    return err.error.message;
  }

  return mensagemPadrao;
}

function apenasNumeros(valor: string) {
  return (valor || '').replace(/\D/g, '');
}
