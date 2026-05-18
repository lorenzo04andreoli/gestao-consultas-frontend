export type PerfilUsuario = 'ADMIN' | 'DENTISTA';

export interface UsuarioModel {
  id?: number;
  nome: string;
  cpf?: string;
  email: string;
  senha?: string;
  perfil: PerfilUsuario;
  ativo?: boolean;
  dataCriacao?: string;
  ultimoLogin?: string;
}

export interface UsuarioResponseModel {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}
