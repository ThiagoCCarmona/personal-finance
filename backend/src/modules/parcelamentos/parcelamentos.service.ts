import { query, withTransaction } from '../../config/database.js';
import { ParcelamentoInput } from './parcelamentos.schemas.js';
import { calcularCompetenciaFatura, adicionarMesesCompetencia } from '../../utils/fatura.utils.js';

export class ParcelamentosService {
  async listAll(userId: string) {
    const hoje = new Date();
    const anoMesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    const { rows } = await query(
      `SELECT cp.*,
        c.apelido as cartao_apelido,
        cat.nome as categoria_nome, cat.cor as categoria_cor,
        COUNT(l.id) as total_parcelas_geradas,
        COUNT(CASE WHEN l.data_competencia_fatura < $2 THEN 1 END) as parcelas_pagas,
        COUNT(CASE WHEN l.data_competencia_fatura >= $2 THEN 1 END) as parcelas_restantes,
        COALESCE(SUM(CASE WHEN l.data_competencia_fatura >= $2 THEN l.valor ELSE 0 END), 0) as saldo_devedor_remanescente
       FROM compra_parcelada cp
       JOIN cartao_credito c ON c.id = cp.cartao_id
       JOIN categoria cat ON cat.id = cp.categoria_id
       LEFT JOIN lancamento l ON l.compra_parcelada_id = cp.id AND l.usuario_id = $1
       WHERE cp.usuario_id = $1
       GROUP BY cp.id, c.apelido, cat.nome, cat.cor
       ORDER BY cp.data_compra DESC`,
      [userId, `${anoMesAtual}-01`]
    );

    return rows.map(r => ({
      ...r,
      valor_total: parseFloat(r.valor_total),
      saldo_devedor_remanescente: parseFloat(r.saldo_devedor_remanescente),
      parcelas_pagas: parseInt(r.parcelas_pagas, 10),
      parcelas_restantes: parseInt(r.parcelas_restantes, 10),
    }));
  }

  async getById(id: string, userId: string) {
    const { rows } = await query(
      `SELECT cp.*,
        c.apelido as cartao_apelido,
        cat.nome as categoria_nome, cat.cor as categoria_cor
       FROM compra_parcelada cp
       JOIN cartao_credito c ON c.id = cp.cartao_id
       JOIN categoria cat ON cat.id = cp.categoria_id
       WHERE cp.id = $1 AND cp.usuario_id = $2`,
      [id, userId]
    );

    if (rows.length === 0) return null;

    // Busca todas as parcelas geradas em lancamento
    const { rows: parcelas } = await query(
      `SELECT l.*, TO_CHAR(l.data_competencia_fatura, 'YYYY-MM') as mes_fatura
       FROM lancamento l
       WHERE l.compra_parcelada_id = $1 AND l.usuario_id = $2
       ORDER BY l.numero_parcela ASC`,
      [id, userId]
    );

    return {
      ...rows[0],
      valor_total: parseFloat(rows[0].valor_total),
      parcelas,
    };
  }

  async create(userId: string, input: ParcelamentoInput) {
    return withTransaction(async (client) => {
      // 1. Obter dados do cartão garantindo posse do usuário
      const { rows: cartaoRows } = await client.query(
        `SELECT c.*, inst.id as instituicao_id
         FROM cartao_credito c
         JOIN instituicao inst ON inst.id = c.instituicao_id
         WHERE c.id = $1 AND c.usuario_id = $2`,
        [input.cartao_id, userId]
      );

      if (cartaoRows.length === 0) {
        throw new Error('Cartão de crédito não encontrado ou não autorizado.');
      }
      const cartao = cartaoRows[0];

      // Busca a moeda BRL padrão
      const { rows: moedaRows } = await client.query("SELECT id FROM moeda WHERE codigo = 'BRL' LIMIT 1");
      const moedaId = moedaRows[0]?.id;

      // 2. Criar registro mestre de compra parcelada
      const { rows: compraRows } = await client.query(
        `INSERT INTO compra_parcelada (
          usuario_id, descricao, valor_total, num_parcelas, cartao_id, categoria_id, subcategoria_id, data_compra
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          userId,
          input.descricao.trim(),
          input.valor_total,
          input.num_parcelas,
          input.cartao_id,
          input.categoria_id,
          input.subcategoria_id || null,
          input.data_compra,
        ]
      );

      const compraMaster = compraRows[0];

      // 3. Calcular valor das parcelas com ajuste exato de centavos
      const valorTotal = input.valor_total;
      const n = input.num_parcelas;
      const valorBaseParcela = Math.floor((valorTotal / n) * 100) / 100;
      const diferencaCentavos = Math.round((valorTotal - valorBaseParcela * n) * 100) / 100;

      // 4. Calcular o ciclo da 1ª parcela
      const cicloInicial = calcularCompetenciaFatura(
        input.data_compra,
        cartao.dia_fechamento,
        cartao.dia_vencimento
      );

      // 5. Gerar as N parcelas na tabela lancamento
      for (let i = 1; i <= n; i++) {
        const valorParcela = i === 1 ? valorBaseParcela + diferencaCentavos : valorBaseParcela;
        const competenciaParcela = adicionarMesesCompetencia(cicloInicial.dataCompetenciaFatura, i - 1);
        const descricaoParcela = `${input.descricao.trim()} (${i}/${n})`;

        await client.query(
          `INSERT INTO lancamento (
            usuario_id, tipo, valor, moeda_id, data_compra, data_competencia_fatura,
            forma_pagamento, cartao_id, categoria_id, subcategoria_id,
            descricao, compra_parcelada_id, numero_parcela, total_parcelas, status
          )
          VALUES ($1, 'despesa', $2, $3, $4, $5, 'credito', $6, $7, $8, $9, $10, $11, $12, 'efetivado')`,
          [
            userId,
            valorParcela,
            moedaId,
            input.data_compra,
            competenciaParcela,
            input.cartao_id,
            input.categoria_id,
            input.subcategoria_id || null,
            descricaoParcela,
            compraMaster.id,
            i,
            n,
          ]
        );
      }

      return compraMaster;
    });
  }

  async delete(id: string, userId: string) {
    return withTransaction(async (client) => {
      // Deletar também os lançamentos correspondentes
      await client.query('DELETE FROM lancamento WHERE compra_parcelada_id = $1 AND usuario_id = $2', [id, userId]);
      const { rowCount } = await client.query('DELETE FROM compra_parcelada WHERE id = $1 AND usuario_id = $2', [id, userId]);
      return rowCount ? rowCount > 0 : false;
    });
  }
}

export const parcelamentosService = new ParcelamentosService();
