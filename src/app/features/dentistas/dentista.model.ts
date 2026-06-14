import { EspecialidadeModel } from '../especialidades/especialidade.model';
import { UsuarioModel } from '../usuarios/usuario.model';

export interface DentistaModel {
  id?: number;
  nome: string;
  cpf: string;
  email: string;
  cro: string;
  ativo?: boolean;
  dataCriacao?: string;
  usuario?: UsuarioModel;
  especialidades?: EspecialidadeModel[];
}

export interface DentistaResponseModel {
  id: number;
  nome: string;
  cpf?: string;
  email: string;
  cro: string;
  ativo: boolean;
  usuarioId?: number;
  fotoPerfil?: string | null;
  especialidades: string[];
}

export interface DentistaRequestModel {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  cro: string;
  ativo: boolean;
  especialidadeIds: number[];
}

export interface DentistaAtualizacaoRequestModel {
  nome: string;
  cpf: string;
  email: string;
  cro: string;
  ativo: boolean;
  especialidadeIds: number[];
}
