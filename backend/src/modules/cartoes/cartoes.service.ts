import { query, withTransaction } from '../../config/database.js';
import { CartaoInput, PagarFaturaInput } from './cartoes.schemas.js';

export class CartoesService {
  async listAll(userId: string) {
    const hoje = new Date();
    const anoMesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    // Busca os cartões do usuário com dados da instituição
    const { rows: cartoes } = await query(
      `SELECT c.*,
        i.nome as instituicao_nome, i.icone as instituicao_icone, i.cor as instituicao_cor
       FROM cartao_credito c
       JOIN instituicao i ON i.id = c.instituicao_id
       WHERE c.usuario_id = $1
       ORDER BY c.ativo DESC, c.apelido ASC`,
      [userId]
    );

    // Para cada cartão, calcula o limite utilizado (descontando faturas pagas) e o valor da fatura do mês atual
    const result = await Promise.all(
      cartoes.map(async (cartao) => {
        // Soma das faturas abertas / futuras a partir do mês atual, IGNORANDO competências que já foram pagas em fatura_paga
        const { rows: gastoTotalRows } = await query(
          `SELECT COALESCE(SUM(l.valor), 0) as total_utilizado
           FROM lancamento l
           WHERE l.cartao_id = $1 
             AND l.usuario_id = $2
             AND l.tipo = 'despesa'
             AND (l.data_competencia_fatura >= $3 OR l.data_competencia_fatura IS NULL)
             AND NOT EXISTS (
               SELECT 1 FROM fatura_paga fp
               WHERE fp.cartao_id = l.cartao_id
                 AND fp.usuario_id = l.usuario_id
                 AND fp.ano_mes = TO_CHAR(l.data_competencia_fatura, 'YYYY-MM')
             )`,
          [cartao.id, userId, `${anoMesAtual}-01`]
        );

        // Soma dos gastos específicos da fatura do mês atual e verifica se já está paga
        const { rows: faturaAtualRows } = await query(
          `SELECT 
            COALESCE(SUM(l.valor), 0) as total_fatura,
            EXISTS (
              SELECT 1 FROM fatura_paga fp 
              WHERE fp.cartao_id = $1 
                AND fp.usuario_id = $2 
                AND fp.ano_mes = $3
            ) as fatura_paga
           FROM lancamento l
           WHERE l.cartao_id = $1 
             AND l.usuario_id = $2
             AND l.tipo = 'despesa'
             AND TO_CHAR(l.data_competencia_fatura, 'YYYY-MM') = $3`,
          [cartao.id, userId, anoMesAtual]
        );

        const limite = parseFloat(cartao.limite);
        const limiteUtilizado = parseFloat(gastoTotalRows[0]?.total_utilizado || '0');
        const faturaAtualTotal = parseFloat(faturaAtualRows[0]?.total_fatura || '0');
        const faturaPaga = Boolean(faturaAtualRows[0]?.fatura_paga);
        const limiteDisponivel = Math.max(0, limite - limiteUtilizado);

        return {
          ...cartao,
          limite: limite,
          limite_utilizado: limiteUtilizado,
          limite_disponivel: limiteDisponivel,
          fatura_atual: faturaAtualTotal,
          fatura_atual_paga: faturaPaga,
          percentual_utilizado: limite > 0 ? parseFloat(((limiteUtilizado / limite) * 100).toFixed(1)) : 0,
        };
      })
    );

    return result;
  }

  async getById(id: string, userId: string) {
    const { rows } = await query(
      `SELECT c.*,
        i.nome as instituicao_nome, i.icone as instituicao_icone, i.cor as instituicao_cor
       FROM cartao_credito c
       JOIN instituicao i ON i.id = c.instituicao_id
       WHERE c.id = $1 AND c.usuario_id = $2`,
      [id, userId]
    );
    return rows[0] || null;
  }

  async create(userId: string, input: CartaoInput) {
    const { rows: instituicao } = await query(
      'SELECT id FROM instituicao WHERE id = $1 AND (usuario_id = $2 OR usuario_id IS NULL)',
      [input.instituicao_id, userId]
    );
    if (instituicao.length === 0) {
      throw new Error('Instituição bancária não encontrada ou inativa.');
    }

    const { rows } = await query(
      `INSERT INTO cartao_credito (usuario_id, instituicao_id, apelido, limite, dia_fechamento, dia_vencimento, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        input.instituicao_id,
        input.apelido.trim(),
        input.limite,
        input.dia_fechamento,
        input.dia_vencimento,
        input.ativo ?? true,
      ]
    );
    return this.getById(rows[0].id, userId);
  }

  async update(id: string, userId: string, input: Partial<CartaoInput>) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (input.instituicao_id !== undefined) {
      fields.push(`instituicao_id = $${idx++}`);
      values.push(input.instituicao_id);
    }
    if (input.apelido !== undefined) {
      fields.push(`apelido = $${idx++}`);
      values.push(input.apelido.trim());
    }
    if (input.limite !== undefined) {
      fields.push(`limite = $${idx++}`);
      values.push(input.limite);
    }
    if (input.dia_fechamento !== undefined) {
      fields.push(`dia_fechamento = $${idx++}`);
      values.push(input.dia_fechamento);
    }
    if (input.dia_vencimento !== undefined) {
      fields.push(`dia_vencimento = $${idx++}`);
      values.push(input.dia_vencimento);
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
      `UPDATE cartao_credito SET ${fields.join(', ')} WHERE id = $${idIdx} AND usuario_id = $${userIdx} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id: string, userId: string) {
    const { rows } = await query(
      'SELECT COUNT(*) as count FROM lancamento WHERE cartao_id = $1 AND usuario_id = $2',
      [id, userId]
    );
    if (parseInt(rows[0].count, 10) > 0) {
      throw new Error('Este cartão possui lançamentos vinculados. Desative-o em vez de excluí-lo.');
    }

    const { rowCount } = await query('DELETE FROM cartao_credito WHERE id = $1 AND usuario_id = $2', [id, userId]);
    return rowCount ? rowCount > 0 : false;
  }

  async getFatura(cartaoId: string, userId: string, anoMesParam?: string) {
    const hoje = new Date();
    const anoMes = anoMesParam || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    const cartao = await this.getById(cartaoId, userId);
    if (!cartao) throw new Error('Cartão não encontrado.');

    // Busca todos os lançamentos pertencentes a este ciclo de fatura deste usuário
    const { rows: itens } = await query(
      `SELECT l.*,
        cat.nome as categoria_nome, cat.icone as categoria_icone, cat.cor as categoria_cor,
        subcat.nome as subcategoria_nome,
        cp.descricao as compra_parcelada_descricao
       FROM lancamento l
       JOIN categoria cat ON cat.id = l.categoria_id
       LEFT JOIN categoria subcat ON subcat.id = l.subcategoria_id
       LEFT JOIN compra_parcelada cp ON cp.id = l.compra_parcelada_id
       WHERE l.cartao_id = $1 
         AND l.usuario_id = $2
         AND TO_CHAR(l.data_competencia_fatura, 'YYYY-MM') = $3
       ORDER BY l.data_compra ASC`,
      [cartaoId, userId, anoMes]
    );

    const totalFatura = itens.reduce((acc, item) => acc + parseFloat(item.valor), 0);

    // Verifica status de pagamento em fatura_paga
    const { rows: pagamentos } = await query(
      `SELECT fp.*, c.apelido as conta_apelido
       FROM fatura_paga fp
       LEFT JOIN conta c ON c.id = fp.conta_id
       WHERE fp.cartao_id = $1 AND fp.usuario_id = $2 AND fp.ano_mes = $3`,
      [cartaoId, userId, anoMes]
    );

    const pagamento = pagamentos[0] || null;

    return {
      cartao,
      anoMes,
      totalFatura,
      quantidadeItens: itens.length,
      paga: Boolean(pagamento),
      pagamento: pagamento ? {
        id: pagamento.id,
        valor_pago: parseFloat(pagamento.valor_pago),
        data_pagamento: pagamento.data_pagamento,
        conta_id: pagamento.conta_id,
        conta_apelido: pagamento.conta_apelido || null,
        lancamento_id: pagamento.lancamento_id,
      } : null,
      itens,
    };
  }

  async pagarFatura(cartaoId: string, userId: string, dados: PagarFaturaInput) {
    const cartao = await this.getById(cartaoId, userId);
    if (!cartao) throw new Error('Cartão não encontrado.');

    const anoMes = dados.anoMes;
    const dataPagamento = dados.dataPagamento || new Date().toISOString().split('T')[0];

    // 1. Verifica se já está paga
    const { rows: jaPaga } = await query(
      `SELECT id FROM fatura_paga WHERE cartao_id = $1 AND usuario_id = $2 AND ano_mes = $3`,
      [cartaoId, userId, anoMes]
    );
    if (jaPaga.length > 0) {
      throw new Error(`A fatura ${anoMes} deste cartão já consta como paga.`);
    }

    // 2. Calcula total da fatura
    const { rows: itens } = await query(
      `SELECT COALESCE(SUM(valor), 0) as total, COUNT(id) as count
       FROM lancamento
       WHERE cartao_id = $1 
         AND usuario_id = $2 
         AND tipo = 'despesa'
         AND TO_CHAR(data_competencia_fatura, 'YYYY-MM') = $3`,
      [cartaoId, userId, anoMes]
    );

    const totalFatura = parseFloat(itens[0]?.total || '0');
    if (totalFatura <= 0) {
      throw new Error(`A fatura ${anoMes} não possui despesas para pagar.`);
    }

    return withTransaction(async (client) => {
      let lancamentoId: string | null = null;

      // 3. Se escolheu conta bancária para debitar
      if (dados.contaId) {
        const { rows: contaRows } = await client.query(
          `SELECT id, apelido, saldo_atual, moeda_id FROM conta WHERE id = $1 AND usuario_id = $2 AND ativo = TRUE`,
          [dados.contaId, userId]
        );
        if (contaRows.length === 0) {
          throw new Error('Conta bancária selecionada não foi encontrada ou está inativa.');
        }

        const conta = contaRows[0];

        // Busca ou seleciona categoria adequada para pagamento de fatura
        const { rows: catRows } = await client.query(
          `SELECT id FROM categoria 
           WHERE usuario_id = $1 AND tipo = 'despesa'
           ORDER BY 
             CASE 
               WHEN LOWER(nome) LIKE '%fatura%' THEN 1
               WHEN LOWER(nome) LIKE '%cart%' THEN 2
               WHEN LOWER(nome) LIKE '%financeiro%' THEN 3
               ELSE 4
             END ASC, nome ASC
           LIMIT 1`,
          [userId]
        );

        if (catRows.length === 0) {
          throw new Error('Nenhuma categoria de despesa cadastrada para registrar o pagamento.');
        }

        const categoriaId = catRows[0].id;
        const moedaId = conta.moeda_id;

        // Cria lançamento de saída na conta bancária
        const [ano, mes] = anoMes.split('-');
        const descLancamento = `Pagamento de Fatura - ${cartao.apelido} (${mes}/${ano})`;

        const { rows: lancRows } = await client.query(
          `INSERT INTO lancamento (
            usuario_id, tipo, valor, moeda_id, data_compra, forma_pagamento,
            conta_id, categoria_id, descricao, status
          ) VALUES (
            $1, 'despesa', $2, $3, $4, 'transferencia', $5, $6, $7, 'efetivado'
          ) RETURNING id`,
          [userId, totalFatura, moedaId, dataPagamento, conta.id, categoriaId, descLancamento]
        );

        lancamentoId = lancRows[0].id;

        // Deduz saldo da conta bancária
        await client.query(
          `UPDATE conta SET saldo_atual = saldo_atual - $1, atualizado_em = NOW() WHERE id = $2`,
          [totalFatura, conta.id]
        );
      }

      // 4. Registra a fatura como paga
      const { rows: faturaPagaRows } = await client.query(
        `INSERT INTO fatura_paga (
          usuario_id, cartao_id, ano_mes, valor_pago, data_pagamento, conta_id, lancamento_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        ) RETURNING *`,
        [userId, cartaoId, anoMes, totalFatura, dataPagamento, dados.contaId || null, lancamentoId]
      );

      return {
        success: true,
        message: dados.contaId 
          ? `Fatura de R$ ${totalFatura.toFixed(2)} paga com sucesso e debitada da conta "${dados.contaId}"!`
          : `Fatura de R$ ${totalFatura.toFixed(2)} marcada como paga com sucesso!`,
        pagamento: faturaPagaRows[0],
      };
    });
  }

  async estornarPagamentoFatura(cartaoId: string, userId: string, anoMes: string) {
    const { rows } = await query(
      `SELECT * FROM fatura_paga WHERE cartao_id = $1 AND usuario_id = $2 AND ano_mes = $3`,
      [cartaoId, userId, anoMes]
    );

    if (rows.length === 0) {
      throw new Error(`Esta fatura não consta como paga.`);
    }

    const pagamento = rows[0];

    return withTransaction(async (client) => {
      // Se teve lançamento e conta vinculada, desfaz o débito
      if (pagamento.lancamento_id) {
        if (pagamento.conta_id) {
          await client.query(
            `UPDATE conta SET saldo_atual = saldo_atual + $1, atualizado_em = NOW() WHERE id = $2`,
            [pagamento.valor_pago, pagamento.conta_id]
          );
        }
        await client.query(`DELETE FROM lancamento WHERE id = $1`, [pagamento.lancamento_id]);
      }

      // Remove registro de pagamento da fatura
      await client.query(`DELETE FROM fatura_paga WHERE id = $1`, [pagamento.id]);

      return {
        success: true,
        message: 'Pagamento da fatura estornado com sucesso. A fatura voltou a ficar em aberto.',
      };
    });
  }
}

export const cartoesService = new CartoesService();
