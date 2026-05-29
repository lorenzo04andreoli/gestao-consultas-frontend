import { PacienteModel } from './paciente.model';

export function criarPacienteForm(): PacienteModel {
  return {
    nome: '',
    email: '',
    cpf: '',
    telefone: ''
  };
}

export function montarPacienteForm(paciente: PacienteModel): PacienteModel {
  return {
    nome: paciente.nome,
    email: paciente.email,
    cpf: formatarCpf(paciente.cpf),
    telefone: formatarTelefone(paciente.telefone)
  };
}

export function montarPacientePayload(form: PacienteModel): PacienteModel {
  return {
    ...form,
    nome: form.nome.trim(),
    email: form.email.trim(),
    cpf: apenasNumeros(form.cpf),
    telefone: apenasNumeros(form.telefone)
  };
}

export function validarPacienteForm(form: PacienteModel) {
  const nome = form.nome.trim();
  const email = form.email.trim();
  const cpf = apenasNumeros(form.cpf);

  if (!nome || !email || !cpf) {
    return 'Preencha nome, e-mail e CPF.';
  }

  if (!email.includes('@')) {
    return 'Informe um e-mail válido.';
  }

  if (cpf.length !== 11) {
    return 'Informe um CPF com 11 dígitos.';
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

export function formatarTelefone(valor: string) {
  const numeros = apenasNumeros(valor).slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return numeros
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
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
