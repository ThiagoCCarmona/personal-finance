import { query, getClient } from '../../config/database.js';
import { CriarEmprestimoInput, BaixaDividaInput } from './dividas.schema.js';

export interface DividaItem {
  id: string;
  pessoa_id: string;
  pessoa_nome: string;
  pessoa_apelido?: string;
  valor_total: number;
  valor_pago: number;
  valor_perdoado: number;
  saldo_devedor: number;
  motivo: string;
  conta_origem_id?: string;
  conta_origem_nome?: string;
  despesa_compartilhada_id?: string;
  status: 'pendente' | 'parcial' | 'quitada' | 'perdoada';
  data: string;
  vencimento?: string;
}

export class DividasService {
  async listar(userId: string, filtroStatus?: string, pessoaId?: string): Promise<DividaItem[]> {
    let sql = `
      SELECT 
        d.id,
        d.pessoa_id,
        p.nome AS pessoa_nome,
        p.apelido AS pessoa_apelido,
        d.valor_total,
        d.valor_pago,
        d.valor_perdoado,
        (d.valor_total - d.valor_pago - d.valor_perdoado) AS saldo_devedor,
        d.motivo,
        d.conta_origem_id,
        c.apelido AS conta_origem_nome,
        d.despesa_compartilhada_id,
        d.status,
        d.data,
        d.vencimento
      FROM divida d
      JOIN pessoa p ON p.id = d.pessoa_id
      LEFT JOIN conta c ON c.id = d.conta_origem_id
      WHERE d.usuario_id = $1
    `;
    const params: any[] = [userId];

    if (filtroStatus && filtroStatus !== 'todos') {
      params.push(filtroStatus);
      sql += ` AND d.status = $${params.length}`;
    }
    if (pessoaId) {
      params.push(pessoaId);
      sql += ` AND d.pessoa_id = $${params.length}`;
    }

    sql += ' ORDER BY d.data DESC, d.criado_em DESC';

    const res = await query<any>(sql, params);
    return res.rows.map(r => ({
      ...r,
      valor_total: parseFloat(r.valor_total),
      valor_pago: parseFloat(r.valor_pago),
      valor_perdoado: parseFloat(r.valor_perdoado),
      saldo_devedor: parseFloat(r.saldo_devedor)
    }));
  }

  async obterResumo(userId: string): Promise<{ totalReceber: number; totalRecebido: number; totalPerdoado: number; qtdPendentes: number }> {
    const res = await query<any>(`
      SELECT 
        COALESCE(SUM(CASE WHEN status IN ('pendente', 'parcial') THEN (valor_total - valor_pago - valor_perdoado) ELSE 0 END), 0) AS total_receber,
        COALESCE(SUM(valor_pago), 0) AS total_recebido,
        COALESCE(SUM(valor_perdoado), 0) AS total_perdoado,
        COUNT(CASE WHEN status IN ('pendente', 'parcial') THEN 1 END) AS qtd_pendentes
      FROM divida
      WHERE usuario_id = $1
    `, [userId]);
    const row = res.rows[0];
    return {
      totalReceber: parseFloat(row.total_receber),
      totalRecebido: parseFloat(row.total_recebido),
      totalPerdoado: parseFloat(row.total_perdoado),
      qtdPendentes: parseInt(row.qtd_pendentes, 10)
    };
  }

  async criarEmprestimo(userId: string, dados: CriarEmprestimoInput): Promise<DividaItem> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Verifica saldo da conta de origem garantindo posse do usuário
      const contaRes = await client.query(
        'SELECT saldo_atual, moeda_id FROM conta WHERE id = $1 AND usuario_id = $2',
        [dados.conta_origem_id, userId]
      );
      if (contaRes.rows.length === 0) {
        throw new Error('Conta bancária de origem não encontrada ou não autorizada');
      }
      const moedaId = contaRes.rows[0].moeda_id;

      // 2. Busca ou cria categoria do usuário 'Empréstimos Concedidos'
      let catRes = await client.query(
        "SELECT id FROM categoria WHERE nome = 'Empréstimos Concedidos' AND usuario_id = $1 LIMIT 1",
        [userId]
      );
      let categoriaId: string;
      if (catRes.rows.length > 0) {
        categoriaId = catRes.rows[0].id;
      } else {
        const novaCat = await client.query(`
          INSERT INTO categoria (usuario_id, nome, tipo, icone, cor)
          VALUES ($1, 'Empréstimos Concedidos', 'despesa', 'HandCoins', '#F59E0B')
          RETURNING id
        `, [userId]);
        categoriaId = novaCat.rows[0].id;
      }

      // 3. Insere a dívida com usuario_id
      const dividaRes = await client.query<any>(`
        INSERT INTO divida (
          usuario_id, pessoa_id, valor_total, valor_pago, valor_perdoado, motivo, 
          conta_origem_id, status, data, vencimento
        )
        VALUES ($1, $2, $3, 0.00, 0.00, $4, $5, 'pendente', COALESCE($6, CURRENT_DATE), $7)
        RETURNING *
      `, [
        userId,
        dados.pessoa_id, 
        dados.valor_total, 
        dados.motivo, 
        dados.conta_origem_id, 
        dados.data || null, 
        dados.vencimento || null
      ]);
      const novaDivida = dividaRes.rows[0];

      // 4. Cria lançamento financeiro de débito
      await client.query(`
        INSERT INTO lancamento (
          usuario_id, tipo, valor, moeda_id, data_compra, forma_pagamento, 
          conta_id, categoria_id, descricao, status
        )
        VALUES ($1, 'despesa', $2, $3, COALESCE($4, CURRENT_DATE), 'transferencia', $5, $6, $7, 'efetivado')
      `, [
        userId,
        dados.valor_total,
        moedaId,
        dados.data || null,
        dados.conta_origem_id,
        categoriaId,
        `Empréstimo concedido: ${dados.motivo}`
      ]);

      // 5. Atualiza saldo da conta bancária de origem
      await client.query(`
        UPDATE conta 
        SET saldo_atual = saldo_atual - $1, atualizado_em = NOW() 
        WHERE id = $2 AND usuario_id = $3
      `, [dados.valor_total, dados.conta_origem_id, userId]);

      await client.query('COMMIT');

      const fullItem = await this.listar(userId, undefined, undefined);
      return fullItem.find(d => d.id === novaDivida.id)!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async darBaixa(dividaId: string, userId: string, dados: BaixaDividaInput): Promise<DividaItem> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const dRes = await client.query(
        'SELECT * FROM divida WHERE id = $1 AND usuario_id = $2 FOR UPDATE',
        [dividaId, userId]
      );
      if (dRes.rows.length === 0) {
        throw new Error('Dívida não encontrada ou não autorizada');
      }
      const divida = dRes.rows[0];
      const saldoDevedor = parseFloat(divida.valor_total) - parseFloat(divida.valor_pago) - parseFloat(divida.valor_perdoado);

      if (dados.valor > saldoDevedor + 0.009) {
        throw new Error(`Valor da baixa (R$ ${dados.valor.toFixed(2)}) não pode ser superior ao saldo devedor (R$ ${saldoDevedor.toFixed(2)})`);
      }

      const novoValorPago = parseFloat(divida.valor_pago) + dados.valor;
      const quitou = (novoValorPago + parseFloat(divida.valor_perdoado)) >= (parseFloat(divida.valor_total) - 0.009);
      const novoStatus = quitou ? 'quitada' : 'parcial';

      await client.query(`
        UPDATE divida 
        SET valor_pago = $1, status = $2, atualizado_em = NOW()
        WHERE id = $3 AND usuario_id = $4
      `, [novoValorPago, novoStatus, dividaId, userId]);

      if (dados.conta_destino_id) {
        const cRes = await client.query(
          'SELECT moeda_id FROM conta WHERE id = $1 AND usuario_id = $2',
          [dados.conta_destino_id, userId]
        );
        if (cRes.rows.length > 0) {
          const moedaId = cRes.rows[0].moeda_id;

          let catRes = await client.query(
            "SELECT id FROM categoria WHERE nome = 'Recebimento de Empréstimo' AND usuario_id = $1 LIMIT 1",
            [userId]
          );
          let categoriaId: string;
          if (catRes.rows.length > 0) {
            categoriaId = catRes.rows[0].id;
          } else {
            const novaCat = await client.query(`
              INSERT INTO categoria (usuario_id, nome, tipo, icone, cor)
              VALUES ($1, 'Recebimento de Empréstimo', 'receita', 'Handshake', '#10B981')
              RETURNING id
            `, [userId]);
            categoriaId = novaCat.rows[0].id;
          }

          const formaPgto = dados.forma_pagamento === 'pix' ? 'pix_debito' : (dados.forma_pagamento || 'transferencia');

          await client.query(`
            INSERT INTO lancamento (
              usuario_id, tipo, valor, moeda_id, data_compra, forma_pagamento, 
              conta_id, categoria_id, descricao, status
            )
            VALUES ($1, 'receita', $2, $3, COALESCE($4, CURRENT_DATE), $5, $6, $7, $8, 'efetivado')
          `, [
            userId,
            dados.valor,
            moedaId,
            dados.data || null,
            formaPgto,
            dados.conta_destino_id,
            categoriaId,
            `Recebimento de dívida: ${divida.motivo}`
          ]);

          await client.query(`
            UPDATE conta 
            SET saldo_atual = saldo_atual + $1, atualizado_em = NOW() 
            WHERE id = $2 AND usuario_id = $3
          `, [dados.valor, dados.conta_destino_id, userId]);
        }
      }

      await client.query('COMMIT');
      const items = await this.listar(userId, undefined, undefined);
      return items.find(d => d.id === dividaId)!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async perdoar(dividaId: string, userId: string): Promise<DividaItem> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const dRes = await client.query(
        'SELECT * FROM divida WHERE id = $1 AND usuario_id = $2 FOR UPDATE',
        [dividaId, userId]
      );
      if (dRes.rows.length === 0) {
        throw new Error('Dívida não encontrada ou não autorizada');
      }
      const divida = dRes.rows[0];
      const valorRestante = parseFloat(divida.valor_total) - parseFloat(divida.valor_pago);

      await client.query(`
        UPDATE divida
        SET valor_perdoado = $1, status = 'perdoada', atualizado_em = NOW()
        WHERE id = $2 AND usuario_id = $3
      `, [valorRestante, dividaId, userId]);

      await client.query('COMMIT');
      const items = await this.listar(userId, undefined, undefined);
      return items.find(d => d.id === dividaId)!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async atualizar(dividaId: string, userId: string, dados: import('./dividas.schema.js').AtualizarDividaInput): Promise<DividaItem | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dados.motivo !== undefined) {
      fields.push(`motivo = $${idx++}`);
      values.push(dados.motivo.trim());
    }
    if (dados.valor_total !== undefined) {
      fields.push(`valor_total = $${idx++}`);
      values.push(dados.valor_total);
    }
    if (dados.data !== undefined) {
      fields.push(`data = $${idx++}`);
      values.push(dados.data);
    }
    if (dados.vencimento !== undefined) {
      fields.push(`vencimento = $${idx++}`);
      values.push(dados.vencimento ? dados.vencimento : null);
    }

    if (fields.length === 0) {
      const items = await this.listar(userId);
      return items.find(d => d.id === dividaId) || null;
    }

    fields.push(`atualizado_em = NOW()`);
    values.push(dividaId);
    const idIdx = idx++;
    values.push(userId);
    const userIdx = idx++;

    await query(`UPDATE divida SET ${fields.join(', ')} WHERE id = $${idIdx} AND usuario_id = $${userIdx}`, values);
    const items = await this.listar(userId);
    return items.find(d => d.id === dividaId) || null;
  }

  async excluir(dividaId: string, userId: string): Promise<boolean> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const dRes = await client.query(
        'SELECT * FROM divida WHERE id = $1 AND usuario_id = $2 FOR UPDATE',
        [dividaId, userId]
      );
      if (dRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }
      const divida = dRes.rows[0];

      if (divida.conta_origem_id && parseFloat(divida.valor_pago) === 0 && !divida.despesa_compartilhada_id) {
        await client.query(
          'UPDATE conta SET saldo_atual = saldo_atual + $1, atualizado_em = NOW() WHERE id = $2 AND usuario_id = $3',
          [divida.valor_total, divida.conta_origem_id, userId]
        );
        await client.query(
          `DELETE FROM lancamento WHERE conta_id = $1 AND descricao LIKE $2 AND tipo = 'despesa' AND usuario_id = $3`,
          [divida.conta_origem_id, `%${divida.motivo}%`, userId]
        );
      }

      await client.query('DELETE FROM cobranca_pix WHERE divida_id = $1 AND usuario_id = $2', [dividaId, userId]);
      await client.query('DELETE FROM divida WHERE id = $1 AND usuario_id = $2', [dividaId, userId]);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const dividasService = new DividasService();
