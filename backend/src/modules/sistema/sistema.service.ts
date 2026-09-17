import { query } from '../../config/database.js';

export interface MetricasSistema {
  tamanho_banco: string;
  total_lancamentos: number;
  total_investimentos: number;
  total_dividas: number;
  versao_banco: string;
  data_hora_servidor: string;
  is_admin: boolean;
}

export class SistemaService {
  async obterMetricas(userId: string, isAdmin: boolean): Promise<MetricasSistema> {
    const sizeRes = await query("SELECT pg_size_pretty(pg_database_size(current_database())) as size");
    const verRes = await query("SELECT version() as ver");

    let lancTotal = 0;
    let invTotal = 0;
    let divTotal = 0;

    if (isAdmin) {
      const lancRes = await query("SELECT count(*) as total FROM lancamento");
      const invRes = await query("SELECT count(*) as total FROM investimento");
      const divRes = await query("SELECT count(*) as total FROM divida");
      lancTotal = parseInt(lancRes.rows[0]?.total || '0', 10);
      invTotal = parseInt(invRes.rows[0]?.total || '0', 10);
      divTotal = parseInt(divRes.rows[0]?.total || '0', 10);
    } else {
      const lancRes = await query("SELECT count(*) as total FROM lancamento WHERE usuario_id = $1", [userId]);
      const invRes = await query("SELECT count(*) as total FROM investimento WHERE usuario_id = $1", [userId]);
      const divRes = await query("SELECT count(*) as total FROM divida WHERE usuario_id = $1", [userId]);
      lancTotal = parseInt(lancRes.rows[0]?.total || '0', 10);
      invTotal = parseInt(invRes.rows[0]?.total || '0', 10);
      divTotal = parseInt(divRes.rows[0]?.total || '0', 10);
    }

    return {
      tamanho_banco: isAdmin ? (sizeRes.rows[0]?.size || 'N/D') : 'Privado',
      total_lancamentos: lancTotal,
      total_investimentos: invTotal,
      total_dividas: divTotal,
      versao_banco: verRes.rows[0]?.ver || 'PostgreSQL',
      data_hora_servidor: new Date().toISOString(),
      is_admin: isAdmin,
    };
  }

  // Gera dump SQL das tabelas principais para download pelo administrador
  async exportarDumpSql(): Promise<string> {
    const tabelas = [
      'usuario', 'instituicao', 'moeda', 'conta', 'cartao_credito',
      'categoria', 'lancamento', 'recorrencia', 'compra_parcelada',
      'investimento', 'movimentacao_investimento', 'cotacao_cambio',
      'pessoa', 'divida', 'despesa_compartilhada', 'chave_pix', 'cobranca_pix', 'lista_desejo'
    ];

    let dump = `-- DUMP SQL GLOBAL DO SISTEMA DE GESTÃO FINANCEIRA (ADMIN)\n`;
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
      } catch (err) {
        console.warn(`Aviso ao exportar tabela ${tabela}:`, err);
      }
    }

    dump += 'COMMIT;\n';
    return dump;
  }
}

export const sistemaService = new SistemaService();
