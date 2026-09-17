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
  async listar(filtroStatus?: string, pessoaId?: string): Promise<DividaItem[]> {
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
      WHERE 1=1
    `;
    const params: any[] = [];

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

  async obterResumo(): Promise<{ totalReceber: number; totalRecebido: number; totalPerdoado: number; qtdPendentes: number }> {
    const res = await query<any>(`
      SELECT 
        COALESCE(SUM(CASE WHEN status IN ('pendente', 'parcial') THEN (valor_total - valor_pago - valor_perdoado) ELSE 0 END), 0) AS total_receber,
        COALESCE(SUM(valor_pago), 0) AS total_recebido,
        COALESCE(SUM(valor_perdoado), 0) AS total_perdoado,
        COUNT(CASE WHEN status IN ('pendente', 'parcial') THEN 1 END) AS qtd_pendentes
      FROM divida
    `);
    const row = res.rows[0];
    return {
      totalReceber: parseFloat(row.total_receber),
      totalRecebido: parseFloat(row.total_recebido),
      totalPerdoado: parseFloat(row.total_perdoado),
      qtdPendentes: parseInt(row.qtd_pendentes, 10)
    };
  }

  // Regra 1: Criar empréstimo debita da conta bancária de origem e cria dívida a receber
  async criarEmprestimo(dados: CriarEmprestimoInput): Promise<DividaItem> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Verifica saldo da conta de origem
      const contaRes = await client.query('SELECT saldo_atual, moeda_id FROM conta WHERE id = $1', [dados.conta_origem_id]);
      if (contaRes.rows.length === 0) {
        throw new Error('Conta bancária de origem não encontrada');
      }
      const moedaId = contaRes.rows[0].moeda_id;

      // 2. Busca ou cria categoria padrão 'Empréstimos Concedidos'
      let catRes = await client.query("SELECT id FROM categoria WHERE nome = 'Empréstimos Concedidos' LIMIT 1");
      let categoriaId: string;
      if (catRes.rows.length > 0) {
        categoriaId = catRes.rows[0].id;
      } else {
        const novaCat = await client.query(`
          INSERT INTO categoria (nome, tipo, icone, cor)
          VALUES ('Empréstimos Concedidos', 'despesa', 'HandCoins', '#F59E0B')
          RETURNING id
        `);
        categoriaId = novaCat.rows[0].id;
      }

      // 3. Insere a dívida
      const dividaRes = await client.query<any>(`
        INSERT INTO divida (
          pessoa_id, valor_total, valor_pago, valor_perdoado, motivo, 
          conta_origem_id, status, data, vencimento
        )
        VALUES ($1, $2, 0.00, 0.00, $3, $4, 'pendente', COALESCE($5, CURRENT_DATE), $6)
        RETURNING *
      `, [
        dados.pessoa_id, 
        dados.valor_total, 
        dados.motivo, 
        dados.conta_origem_id, 
        dados.data || null, 
        dados.vencimento || null
      ]);
      const novaDivida = dividaRes.rows[0];

      // 4. Cria lançamento financeiro de débito (despesa de empréstimo)
      await client.query(`
        INSERT INTO lancamento (
          tipo, valor, moeda_id, data_compra, forma_pagamento, 
          conta_id, categoria_id, descricao, status
        )
        VALUES ('despesa', $1, $2, COALESCE($3, CURRENT_DATE), 'transferencia', $4, $5, $6, 'confirmado')
      `, [
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
        WHERE id = $2
      `, [dados.valor_total, dados.conta_origem_id]);

      await client.query('COMMIT');

      const fullItem = await this.listar(undefined, undefined);
      return fullItem.find(d => d.id === novaDivida.id)!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Regra 2: Baixa manual ou via PIX (parcial ou total) -> gera lançamento de receita
  async darBaixa(dividaId: string, dados: BaixaDividaInput): Promise<DividaItem> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const dRes = await client.query('SELECT * FROM divida WHERE id = $1 FOR UPDATE', [dividaId]);
      if (dRes.rows.length === 0) {
        throw new Error('Dívida não encontrada');
      }
      const divida = dRes.rows[0];
      const saldoDevedor = parseFloat(divida.valor_total) - parseFloat(divida.valor_pago) - parseFloat(divida.valor_perdoado);

      if (dados.valor > saldoDevedor + 0.009) {
        throw new Error(`Valor da baixa (R$ ${dados.valor.toFixed(2)}) não pode ser superior ao saldo devedor (R$ ${saldoDevedor.toFixed(2)})`);
      }

      const novoValorPago = parseFloat(divida.valor_pago) + dados.valor;
      const quitou = (novoValorPago + parseFloat(divida.valor_perdoado)) >= (parseFloat(divida.valor_total) - 0.009);
      const novoStatus = quitou ? 'quitada' : 'parcial';

      // Atualiza dívida
      await client.query(`
        UPDATE divida 
        SET valor_pago = $1, status = $2, atualizado_em = NOW()
        WHERE id = $3
      `, [novoValorPago, novoStatus, dividaId]);

      // Se informou conta de destino, debita na conta e gera receita
      if (dados.conta_destino_id) {
        const cRes = await client.query('SELECT moeda_id FROM conta WHERE id = $1', [dados.conta_destino_id]);
        if (cRes.rows.length > 0) {
          const moedaId = cRes.rows[0].moeda_id;

          // Categoria 'Recebimento de Empréstimo'
          let catRes = await client.query("SELECT id FROM categoria WHERE nome = 'Recebimento de Empréstimo' LIMIT 1");
          let categoriaId: string;
          if (catRes.rows.length > 0) {
            categoriaId = catRes.rows[0].id;
          } else {
            const novaCat = await client.query(`
              INSERT INTO categoria (nome, tipo, icone, cor)
              VALUES ('Recebimento de Empréstimo', 'receita', 'Handshake', '#10B981')
              RETURNING id
            `);
            categoriaId = novaCat.rows[0].id;
          }

          // Insere receita
          await client.query(`
            INSERT INTO lancamento (
              tipo, valor, moeda_id, data_compra, forma_pagamento, 
              conta_id, categoria_id, descricao, status
            )
            VALUES ('receita', $1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6, $7, 'confirmado')
          `, [
            dados.valor,
            moedaId,
            dados.data || null,
            dados.forma_pagamento,
            dados.conta_destino_id,
            categoriaId,
            `Recebimento de dívida: ${divida.motivo}`
          ]);

          // Atualiza saldo da conta destino
          await client.query(`
            UPDATE conta 
            SET saldo_atual = saldo_atual + $1, atualizado_em = NOW() 
            WHERE id = $2
          `, [dados.valor, dados.conta_destino_id]);
        }
      }

      await client.query('COMMIT');
      const items = await this.listar(undefined, undefined);
      return items.find(d => d.id === dividaId)!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Regra 3: Perdão de dívida -> status 'perdoada', SEM lançamento financeiro
  async perdoar(dividaId: string): Promise<DividaItem> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const dRes = await client.query('SELECT * FROM divida WHERE id = $1 FOR UPDATE', [dividaId]);
      if (dRes.rows.length === 0) {
        throw new Error('Dívida não encontrada');
      }
      const divida = dRes.rows[0];
      const valorRestante = parseFloat(divida.valor_total) - parseFloat(divida.valor_pago);

      await client.query(`
        UPDATE divida
        SET valor_perdoado = $1, status = 'perdoada', atualizado_em = NOW()
        WHERE id = $2
      `, [valorRestante, dividaId]);

      await client.query('COMMIT');
      const items = await this.listar(undefined, undefined);
      return items.find(d => d.id === dividaId)!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Atualizar dados cadastrais da dívida
  async atualizar(dividaId: string, dados: import('./dividas.schema.js').AtualizarDividaInput): Promise<DividaItem | null> {
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
      const items = await this.listar();
      return items.find(d => d.id === dividaId) || null;
    }

    fields.push(`atualizado_em = NOW()`);
    values.push(dividaId);

    await query(`UPDATE divida SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    const items = await this.listar();
    return items.find(d => d.id === dividaId) || null;
  }

  // Excluir dívida: Desfaz débito caso tenha sido empréstimo que debitou conta e não foi pago
  async excluir(dividaId: string): Promise<boolean> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const dRes = await client.query('SELECT * FROM divida WHERE id = $1 FOR UPDATE', [dividaId]);
      if (dRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }
      const divida = dRes.rows[0];

      // Se for empréstimo que debitou conta e não teve baixa
      if (divida.conta_origem_id && parseFloat(divida.valor_pago) === 0 && !divida.despesa_compartilhada_id) {
        // Estorna o saldo da conta que foi debitado
        await client.query('UPDATE conta SET saldo_atual = saldo_atual + $1, atualizado_em = NOW() WHERE id = $2', [
          divida.valor_total,
          divida.conta_origem_id
        ]);
        // Remove o lançamento financeiro gerado
        await client.query(`DELETE FROM lancamento WHERE conta_id = $1 AND descricao LIKE $2 AND tipo = 'despesa'`, [
          divida.conta_origem_id,
          `%${divida.motivo}%`
        ]);
      }

      // Remove referências em cobrança PIX
      await client.query('DELETE FROM cobranca_pix WHERE divida_id = $1', [dividaId]);

      // Remove a dívida
      await client.query('DELETE FROM divida WHERE id = $1', [dividaId]);

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
