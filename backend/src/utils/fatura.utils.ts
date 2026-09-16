/**
 * Utilitários para cálculo de ciclo de fatura de cartões de crédito
 */

export interface CicloFatura {
  anoMesCompetencia: string; // Formato 'YYYY-MM'
  dataCompetenciaFatura: string; // Formato 'YYYY-MM-01'
  dataVencimentoFatura: string; // Formato 'YYYY-MM-DD'
}

/**
 * Calcula a competência da fatura e data de vencimento com base na data da compra e regras do cartão
 */
export function calcularCompetenciaFatura(
  dataCompraStr: string,
  diaFechamento: number,
  diaVencimento: number
): CicloFatura {
  // dataCompraStr: 'YYYY-MM-DD'
  const [anoStr, mesStr, diaStr] = dataCompraStr.split('-');
  const ano = parseInt(anoStr, 10);
  const mes = parseInt(mesStr, 10); // 1-12
  const dia = parseInt(diaStr, 10);

  let anoFatura = ano;
  let mesFatura = mes;

  // Se a compra foi feita após o dia de fechamento, avança para a fatura do próximo ciclo
  if (dia > diaFechamento) {
    mesFatura += 1;
    if (mesFatura > 12) {
      mesFatura = 1;
      anoFatura += 1;
    }
  }

  // Se o dia do vencimento for menor que o dia do fechamento (ex: fecha 28, vence dia 5 do mês seguinte)
  let anoVencimento = anoFatura;
  let mesVencimento = mesFatura;
  if (diaVencimento < diaFechamento) {
    mesVencimento += 1;
    if (mesVencimento > 12) {
      mesVencimento = 1;
      anoVencimento += 1;
    }
  }

  const mesFaturaPadded = String(mesFatura).padStart(2, '0');
  const mesVencPadded = String(mesVencimento).padStart(2, '0');
  const diaVencPadded = String(diaVencimento).padStart(2, '0');

  return {
    anoMesCompetencia: `${anoFatura}-${mesFaturaPadded}`,
    dataCompetenciaFatura: `${anoFatura}-${mesFaturaPadded}-01`,
    dataVencimentoFatura: `${anoVencimento}-${mesVencPadded}-${diaVencPadded}`,
  };
}

/**
 * Adiciona N meses a uma data de competência ('YYYY-MM-01')
 */
export function adicionarMesesCompetencia(dataCompetenciaStr: string, mesesParaAdicionar: number): string {
  const [anoStr, mesStr] = dataCompetenciaStr.split('-');
  let ano = parseInt(anoStr, 10);
  let mes = parseInt(mesStr, 10) + mesesParaAdicionar;

  while (mes > 12) {
    mes -= 12;
    ano += 1;
  }
  while (mes < 1) {
    mes += 12;
    ano -= 1;
  }

  return `${ano}-${String(mes).padStart(2, '0')}-01`;
}
