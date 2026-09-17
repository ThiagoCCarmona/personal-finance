import { query } from '../../config/database.js';

interface BacenCotacaoItem {
  cotacaoCompra: number;
  cotacaoVenda: number;
  dataHoraCotacao: string;
}

export class PtaxClient {
  async buscarCotacaoBacen(moeda: string, dataIso: string): Promise<number | null> {
    try {
      const parts = dataIso.split('-');
      const df = `${parts[1]}-${parts[2]}-${parts[0]}`; // MM-DD-YYYY
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${moeda}'&@dataCotacao='${df}'&$top=1&$format=json`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        value: BacenCotacaoItem[];
      };
      if (data.value && data.value.length > 0) return Number(data.value[0].cotacaoVenda);
      return null;
    } catch {
      return null;
    }
  }

  async buscarCotacaoAwesomeApi(moeda: string): Promise<number | null> {
    try {
      const par = `${moeda}-BRL`;
      const res = await fetch(`https://economia.awesomeapi.com.br/last/${par}`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const json: any = await res.json();
      const chave = `${moeda}BRL`;
      if (json && json[chave] && json[chave].ask) {
        return Number(json[chave].ask);
      }
      return null;
    } catch {
      return null;
    }
  }

  async sincronizarCotacoesRecentes(): Promise<void> {
    const moedas = ['USD', 'EUR'];
    const hoje = new Date();

    for (const cod of moedas) {
      let { rows } = await query('SELECT id FROM moeda WHERE codigo = $1', [cod]);
      if (rows.length === 0) {
        // Garante criação da moeda se ainda não existir
        const { rows: nova } = await query(
          "INSERT INTO moeda (codigo, nome, simbolo, ativo) VALUES ($1, $2, $3, TRUE) ON CONFLICT (codigo) DO UPDATE SET ativo = TRUE RETURNING id",
          [cod, cod === 'USD' ? 'Dólar Americano' : 'Euro', cod === 'USD' ? 'US$' : '€']
        );
        rows = nova;
      }
      const mId = rows[0].id;

      // 1. Tenta buscar cotações dos últimos 5 dias pelo Bacen
      for (let i = 0; i < 5; i++) {
        const d = new Date();
        d.setDate(hoje.getDate() - i);
        const dIso = d.toISOString().split('T')[0];

        const { rows: ex } = await query('SELECT id FROM cotacao_cambio WHERE moeda_id = $1 AND data = $2', [mId, dIso]);
        if (ex.length === 0) {
          let val = await this.buscarCotacaoBacen(cod, dIso);
          let fonte = 'Banco Central do Brasil / PTAX';

          // Se for o dia atual e o Bacen ainda não fechou ou é fim de semana, usa AwesomeAPI como fallback
          if (!val && i === 0) {
            val = await this.buscarCotacaoAwesomeApi(cod);
            fonte = 'AwesomeAPI / Cotação Comercial';
          }

          if (val && val > 0) {
            await query(
              'INSERT INTO cotacao_cambio (moeda_id, data, valor_ptax, fonte) ' +
              'VALUES ($1, $2, $3, $4) ' +
              'ON CONFLICT (moeda_id, data) DO UPDATE SET valor_ptax = EXCLUDED.valor_ptax, fonte = EXCLUDED.fonte',
              [mId, dIso, val, fonte]
            );
          }
        }
      }

      // 2. Garante que pelo menos a cotação de hoje exista no banco
      const hojeIso = hoje.toISOString().split('T')[0];
      const { rows: checkHoje } = await query('SELECT id FROM cotacao_cambio WHERE moeda_id = $1 AND data = $2', [mId, hojeIso]);
      if (checkHoje.length === 0) {
        const valAtual = await this.buscarCotacaoAwesomeApi(cod);
        if (valAtual && valAtual > 0) {
          await query(
            'INSERT INTO cotacao_cambio (moeda_id, data, valor_ptax, fonte) ' +
            'VALUES ($1, $2, $3, $4) ' +
            'ON CONFLICT (moeda_id, data) DO UPDATE SET valor_ptax = EXCLUDED.valor_ptax',
            [mId, hojeIso, valAtual, 'Mercado Financeiro / Tempo Real']
          );
        }
      }
    }
  }
}
