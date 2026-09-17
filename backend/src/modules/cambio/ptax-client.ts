import { query } from '../../config/database.js';

export interface AwesomeDailyItem {
  ask: string;
  bid: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  timestamp: string;
  create_date?: string;
}

export class PtaxClient {
  // Busca cotação atual em tempo real via AwesomeAPI
  async buscarCotacaoAtual(moedaOrigem: string, moedaDestino: string = 'BRL'): Promise<number | null> {
    try {
      const orig = moedaOrigem.toUpperCase();
      const dest = moedaDestino.toUpperCase();
      if (orig === dest) return 1;

      const par = `${orig}-${dest}`;
      const res = await fetch(`https://economia.awesomeapi.com.br/last/${par}`, { 
        signal: AbortSignal.timeout(6000) 
      });
      if (!res.ok) {
        // Tenta inverter se não existir direto
        const parInvertido = `${dest}-${orig}`;
        const resInv = await fetch(`https://economia.awesomeapi.com.br/last/${parInvertido}`, { 
          signal: AbortSignal.timeout(6000) 
        });
        if (resInv.ok) {
          const jsonInv: any = await resInv.json();
          const chaveInv = `${dest}${orig}`;
          if (jsonInv[chaveInv]?.ask) {
            const taxa = Number(jsonInv[chaveInv].ask);
            if (taxa > 0) return 1 / taxa;
          }
        }
        return null;
      }
      const json: any = await res.json();
      const chave = `${orig}${dest}`;
      if (json && json[chave] && json[chave].ask) {
        return Number(json[chave].ask);
      }
      return null;
    } catch {
      return null;
    }
  }

  // Busca histórico diário real da AwesomeAPI e persiste no banco
  async buscarHistoricoDiarioAwesome(moedaCodigo: string, dias: number = 30): Promise<void> {
    try {
      const cod = moedaCodigo.toUpperCase();
      if (cod === 'BRL') return;

      const { rows } = await query('SELECT id FROM moeda WHERE codigo = $1', [cod]);
      if (rows.length === 0) return;
      const moedaId = rows[0].id;

      const url = `https://economia.awesomeapi.com.br/json/daily/${cod}-BRL/${dias}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return;

      const lista = (await res.json()) as AwesomeDailyItem[];
      if (!Array.isArray(lista)) return;

      for (const item of lista) {
        const timestampMs = parseInt(item.timestamp, 10) * 1000;
        const d = new Date(timestampMs);
        const dataIso = d.toISOString().split('T')[0];
        const val = Number(item.ask || item.bid);

        if (val && val > 0) {
          await query(
            `INSERT INTO cotacao_cambio (moeda_id, data, valor_ptax, fonte)
             VALUES ($1, $2, $3, 'AwesomeAPI / Cotação Comercial')
             ON CONFLICT (moeda_id, data) 
             DO UPDATE SET valor_ptax = EXCLUDED.valor_ptax, fonte = EXCLUDED.fonte`,
            [moedaId, dataIso, val]
          );
        }
      }
    } catch (err) {
      console.error(`Erro ao buscar histórico diário para ${moedaCodigo}:`, err);
    }
  }

  // Sincroniza moedas ativas e favoritas
  async sincronizarCotacoesRecentes(): Promise<void> {
    const { rows: moedas } = await query(
      `SELECT codigo FROM moeda WHERE ativo = TRUE AND codigo != 'BRL' ORDER BY favorita DESC, codigo ASC`
    );

    for (const m of moedas) {
      // 1. Garante histórico recente de pelo menos 60 dias da AwesomeAPI
      await this.buscarHistoricoDiarioAwesome(m.codigo, 60);

      // 2. Busca e atualiza a cotação de hoje em tempo real
      const valAtual = await this.buscarCotacaoAtual(m.codigo, 'BRL');
      if (valAtual && valAtual > 0) {
        const { rows: mRows } = await query('SELECT id FROM moeda WHERE codigo = $1', [m.codigo]);
        if (mRows.length > 0) {
          const hojeIso = new Date().toISOString().split('T')[0];
          await query(
            `INSERT INTO cotacao_cambio (moeda_id, data, valor_ptax, fonte)
             VALUES ($1, $2, $3, 'AwesomeAPI / Tempo Real')
             ON CONFLICT (moeda_id, data) 
             DO UPDATE SET valor_ptax = EXCLUDED.valor_ptax, fonte = EXCLUDED.fonte`,
            [mRows[0].id, hojeIso, valAtual]
          );
        }
      }
    }
  }
}

