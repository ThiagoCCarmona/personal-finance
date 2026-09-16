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
      const df = parts[1] + '-' + parts[2] + '-' + parts[0];
      const url = 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia?moeda=' + encodeURIComponent("''" + moeda + "''") + '&dataCotacao=' + encodeURIComponent("''" + df + "''") + '&$top=1&$format=json';
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        value: BacenCotacaoItem[];
      };
      if (data.value && data.value.length > 0) return Number(data.value[0].cotacaoVenda);
      return null;
    } catch (e) {
      return null;
    }
  }

  async sincronizarCotacoesRecentes(): Promise<void> {
    const moedas = ['USD', 'EUR'];
    const hoje = new Date();
    for (const cod of moedas) {
      const { rows } = await query('SELECT id FROM moeda WHERE codigo = $1', [cod]);
      if (rows.length === 0) continue;
      const mId = rows[0].id;
      for (let i = 0; i < 5; i++) {
        const d = new Date();
        d.setDate(hoje.getDate() - i);
        const dIso = d.toISOString().split('T')[0];
        const { rows: ex } = await query('SELECT id FROM cotacao_cambio WHERE moeda_id = $1 AND data = $2', [mId, dIso]);
        if (ex.length === 0) {
          const val = await this.buscarCotacaoBacen(cod, dIso);
          if (val && val > 0) {
            await query(
              'INSERT INTO cotacao_cambio (moeda_id, data, valor_ptax, fonte) ' +
              'VALUES ($1, $2, $3, $4) ' +
              'ON CONFLICT (moeda_id, data) DO UPDATE SET valor_ptax = EXCLUDED.valor_ptax',
              [mId, dIso, val, 'Banco Central do Brasil / PTAX']
            );
          }
        }
      }
    }
  }
}
