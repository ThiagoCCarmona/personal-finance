import { query, withTransaction } from '../../config/database.js';
import { RecorrenciaInput } from './recorrencias.schemas.js';
import { lancamentosService } from '../lancamentos/lancamentos.service.js';
import { calcularCompetenciaFatura } from '../../utils/fatura.utils.js';

export class RecorrenciasService {
  async listAll(userId: string, anoMesParam?: string) {
    const hoje = new Date();
    const anoMes = anoMesParam || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    const { rows: recorrencias } = await query(
      `SELECT r.*,
        c.apelido as conta_apelido,
        card.apelido as cartao_apelido,
        cat.nome as categoria_nome, cat.icone as categoria_icone, cat.cor as categoria_cor
       FROM recorrencia r
       LEFT JOIN conta c ON c.id = r.conta_id
       LEFT JOIN cartao_credito card ON card.id = r.cartao_id
       JOIN categoria cat ON cat.id = r.categoria_id
       WHERE r.usuario_id = $1 AND r.ativo = TRUE
       ORDER BY r.dia_referencia ASC`,
      [userId]
    );

    // Para cada recorrência, verifica se já foi lançado um item neste mês
    const result = await Promise.all(
      recorrencias.map(async (rec) => {
        const { rows: lancRows } = await query(
          `SELECT id, valor, data_compra, status 
           FROM lancamento 
           WHERE recorrencia_id = $1 
             AND usuario_id = $2
             AND (
               TO_CHAR(data_compra, 'YYYY-MM') = $3 
               OR TO_CHAR(data_competencia_fatura, 'YYYY-MM') = $3
             )
           LIMIT 1`,
          [rec.id, userId, anoMes]
        );

        const lancamento = lancRows[0] || null;

        return {
          ...rec,
          valor: parseFloat(rec.valor),
          ja_lancado: !!lancamento,
          lancamento_id: lancamento?.id || null,
          lancamento_status: lancamento?.status || null,
        };
      })
    );

    return result;
  }

  async getById(id: string, userId: string) {
    const { rows } = await query('SELECT * FROM recorrencia WHERE id = $1 AND usuario_id = $2', [id, userId]);
    return rows[0] || null;
  }

  async create(userId: string, input: RecorrenciaInput) {
    const { rows } = await query(
      `INSERT INTO recorrencia (
        usuario_id, tipo, descricao, valor, categoria_id, forma_pagamento,
        conta_id, cartao_id, frequencia, dia_referencia, dia_estimado_na_fatura,
        data_inicio, data_fim, ativo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        userId,
        input.tipo,
        input.descricao.trim(),
        input.valor,
        input.categoria_id,
        input.forma_pagamento,
        input.conta_id || null,
        input.cartao_id || null,
        input.frequencia,
        input.dia_referencia,
        input.dia_estimado_na_fatura || null,
        input.data_inicio,
        input.data_fim || null,
        input.ativo ?? true,
      ]
    );
    return rows[0];
  }

  async update(id: string, userId: string, input: Partial<RecorrenciaInput>) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (input.tipo !== undefined) {
      fields.push(`tipo = $${idx++}`);
      values.push(input.tipo);
    }
    if (input.descricao !== undefined) {
      fields.push(`descricao = $${idx++}`);
      values.push(input.descricao.trim());
    }
    if (input.valor !== undefined) {
      fields.push(`valor = $${idx++}`);
      values.push(input.valor);
    }
    if (input.categoria_id !== undefined) {
      fields.push(`categoria_id = $${idx++}`);
      values.push(input.categoria_id);
    }
    if (input.forma_pagamento !== undefined) {
      fields.push(`forma_pagamento = $${idx++}`);
      values.push(input.forma_pagamento);
    }
    if (input.conta_id !== undefined) {
      fields.push(`conta_id = $${idx++}`);
      values.push(input.conta_id);
    }
    if (input.cartao_id !== undefined) {
      fields.push(`cartao_id = $${idx++}`);
      values.push(input.cartao_id);
    }
    if (input.frequencia !== undefined) {
      fields.push(`frequencia = $${idx++}`);
      values.push(input.frequencia);
    }
    if (input.dia_referencia !== undefined) {
      fields.push(`dia_referencia = $${idx++}`);
      values.push(input.dia_referencia);
    }
    if (input.dia_estimado_na_fatura !== undefined) {
      fields.push(`dia_estimado_na_fatura = $${idx++}`);
      values.push(input.dia_estimado_na_fatura);
    }
    if (input.data_inicio !== undefined) {
      fields.push(`data_inicio = $${idx++}`);
      values.push(input.data_inicio);
    }
    if (input.data_fim !== undefined) {
      fields.push(`data_fim = $${idx++}`);
      values.push(input.data_fim);
    }
    if (input.ativo !== undefined) {
      fields.push(`ativo = $${idx++}`);
      values.push(input.ativo);
    }

    if (fields.length === 0) return this.getById(id, userId);

    fields.push(`atualizado_em = NOW()`);
    values.push(id);
    const idIdx = idx++;
    values.push(userId);
    const userIdx = idx++;

    const { rows } = await query(
      `UPDATE recorrencia SET ${fields.join(', ')} WHERE id = $${idIdx} AND usuario_id = $${userIdx} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id: string, userId: string) {
    const { rowCount } = await query('DELETE FROM recorrencia WHERE id = $1 AND usuario_id = $2', [id, userId]);
    return rowCount ? rowCount > 0 : false;
  }

  async lancarNaCompetencia(id: string, userId: string, anoMesParam?: string) {
    const hoje = new Date();
    const anoMes = anoMesParam || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    const rec = await this.getById(id, userId);
    if (!rec) throw new Error('Recorrência não encontrada.');

    // Verifica se já foi lançado neste mês
    const { rows: lancExistente } = await query(
      `SELECT id FROM lancamento 
       WHERE recorrencia_id = $1 
         AND usuario_id = $2
         AND (TO_CHAR(data_compra, 'YYYY-MM') = $3 OR TO_CHAR(data_competencia_fatura, 'YYYY-MM') = $3)`,
      [id, userId, anoMes]
    );

    if (lancExistente.length > 0) {
      throw new Error('Esta recorrência já possui lançamento efetivado para este mês.');
    }

    const diaPadded = String(Math.min(rec.dia_referencia, 28)).padStart(2, '0');
    const dataCompra = `${anoMes}-${diaPadded}`;

    let dataCompetenciaFatura: string | null = null;
    if (rec.cartao_id) {
      const { rows: cartaoRows } = await query(
        'SELECT * FROM cartao_credito WHERE id = $1 AND usuario_id = $2',
        [rec.cartao_id, userId]
      );
      if (cartaoRows.length > 0) {
        const cartao = cartaoRows[0];
        const diaComparacao = rec.dia_estimado_na_fatura || rec.dia_referencia;
        const dataParaCalculo = `${anoMes}-${String(Math.min(diaComparacao, 28)).padStart(2, '0')}`;
        const ciclo = calcularCompetenciaFatura(dataParaCalculo, cartao.dia_fechamento, cartao.dia_vencimento);
        dataCompetenciaFatura = ciclo.dataCompetenciaFatura;
      }
    }

    // Cria o lançamento via serviço para respeitar as regras financeiras e atômicas com o userId
    const novoLancamento = await lancamentosService.create(userId, {
      tipo: rec.tipo,
      valor: parseFloat(rec.valor),
      data_compra: dataCompra,
      data_competencia_fatura: dataCompetenciaFatura,
      forma_pagamento: rec.forma_pagamento,
      conta_id: rec.conta_id || undefined,
      cartao_id: rec.cartao_id || null,
      categoria_id: rec.categoria_id,
      descricao: rec.descricao,
      status: 'efetivado',
      recorrencia_id: rec.id,
    } as any);

    return novoLancamento;
  }
}

export const recorrenciasService = new RecorrenciasService();
