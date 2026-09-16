import { query } from '../../config/database.js';

export interface MetricasSistema {
  tamanho_banco: string;
  total_lancamentos: number;
  total_investimentos: number;
  total_dividas: number;
  versao_banco: string;
  data_hora_servidor: string;
}

export class SistemaService {
  async obterMetricas(): Promise<MetricasSistema> {
    const sizeRes = await query("SELECT pg_size_pretty(pg_database_size(current_database())) as size");
    const lancRes = await query("SELECT count(*) as total FROM lancamento");
    const invRes = await query("SELECT count(*) as total FROM investimento");
    const divRes = await query("SELECT count(*) as total FROM divida");
    const verRes = await query("SELECT version() as ver");

    return {
      tamanho_banco: sizeRes.rows[0]?.size || 'N/D',
      total_lancamentos: parseInt(lancRes.rows[0]?.total || '0', 10),
      total_investimentos: parseInt(invRes.rows[0]?.total || '0', 10),
      total_dividas: parseInt(divRes.rows[0]?.total || '0', 10),
      versao_banco: verRes.rows[0]?.ver || 'PostgreSQL',
      data_hora_servidor: new Date().toISOString()
    };
  }

  // Gera dump SQL das tabelas principais em texto plano para download imediato
  async exportarDumpSql(): Promise<string> {
    const tabelas = [
      'usuario', 'instituicao', 'moeda', 'conta', 'cartao_credito',
      'categoria', 'lancamento', 'recorrencia', 'compra_parcelada',
      'investimento', 'movimentacao_investimento', 'cotacao_cambio',
      'pessoa', 'divida', 'despesa_compartilhada', 'chave_pix', 'cobranca_pix'
    ];

    let dump = `-- DUMP SQL DO SISTEMA DE GESTÃO FINANCEIRA PESSOAL (SELF-HOSTED)\n`;
    dump += `-- Gerado em: ${new Date().toISOString()}\n\n`;
    dump += 'BEGIN;\n\n';

    for (const tabela of tabelas) {
      try {
        const res = await query(`SELECT * FROM ${tabela}`);
        if (res.rows.length > 0) {
          dump += `-- Tabela: ${tabela} (${res.rows.length} registros)\n`;
          for (const row of res.rows) {
            const cols = Object.keys(row);
            const vals = cols.map(c => {
              const val = row[c];
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'number') return val;
              if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
              if (val instanceof Date) return `'${val.toISOString()}'`;
              return `'${String(val).replace(/'/g, "''")}'`;
            });
            dump += `INSERT INTO ${tabela} (${cols.join(', ')}) VALUES (${vals.join(', ')});\n`;
          }
          dump += '\n';
        }
      } catch (e) {
        // Tabela pode não existir ainda
      }
    }

    dump += 'COMMIT;\n';
    return dump;
  }
}

export const sistemaService = new SistemaService();
