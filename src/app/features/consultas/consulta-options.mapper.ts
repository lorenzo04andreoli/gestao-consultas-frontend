import { DentistaResponseModel } from '../dentistas/dentista.model';
import { EspecialidadeModel } from '../especialidades/especialidade.model';

export function especialidadesDoDentista(
  dentistaId: number | null,
  dentistas: DentistaResponseModel[],
  especialidades: EspecialidadeModel[]
) {
  const dentista = dentistas.find(item => item.id === dentistaId);

  if (!dentista) return [];

  const nomesDentista = new Set(
    dentista.especialidades.map(nome => normalizarTexto(nome))
  );

  return especialidades
    .filter(especialidade => nomesDentista.has(normalizarTexto(especialidade.nome)))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

function normalizarTexto(valor: string) {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
