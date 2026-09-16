import { pool, withTransaction } from '../../config/database.js';

export async function runInitialSeed() {
  console.log('Iniciando seed inicial do sistema...');

  await withTransaction(async (client) => {
    // 1. Moedas padrão
    await client.query(`
      INSERT INTO moeda (codigo, nome, simbolo, ativo)
      VALUES 
        ('BRL', 'Real Brasileiro', 'R$', TRUE),
        ('USD', 'Dólar Americano', 'US$', TRUE),
        ('EUR', 'Euro', '€', TRUE)
      ON CONFLICT (codigo) DO UPDATE 
      SET nome = EXCLUDED.nome, simbolo = EXCLUDED.simbolo;
    `);

    const { rows: moedaRows } = await client.query(`SELECT id, codigo FROM moeda`);
    const moedaMap = new Map(moedaRows.map((m: { id: string; codigo: string }) => [m.codigo, m.id]));
    const brlId = moedaMap.get('BRL');

    // 2. Categorias padrão de despesas e receitas
    const categorias = [
      // Despesas
      { nome: 'Alimentação', tipo: 'despesa', icone: 'Utensils', cor: '#EF4444' },
      { nome: 'Transporte', tipo: 'despesa', icone: 'Car', cor: '#F59E0B' },
      { nome: 'Moradia', tipo: 'despesa', icone: 'Home', cor: '#3B82F6' },
      { nome: 'Saúde', tipo: 'despesa', icone: 'HeartPulse', cor: '#EC4899' },
      { nome: 'Lazer', tipo: 'despesa', icone: 'Gamepad2', cor: '#8B5CF6' },
      { nome: 'Educação', tipo: 'despesa', icone: 'GraduationCap', cor: '#10B981' },
      { nome: 'Assinaturas', tipo: 'despesa', icone: 'Film', cor: '#6366F1' },
      { nome: 'Vestuário', tipo: 'despesa', icone: 'Shirt', cor: '#14B8A6' },
      { nome: 'Outros Gastos', tipo: 'despesa', icone: 'MoreHorizontal', cor: '#6B7280' },
      // Receitas
      { nome: 'Salário', tipo: 'receita', icone: 'Briefcase', cor: '#10B981' },
      { nome: 'Rendimentos', tipo: 'receita', icone: 'TrendingUp', cor: '#059669' },
      { nome: 'Outras Receitas', tipo: 'receita', icone: 'PlusCircle', cor: '#34D399' },
    ];

    for (const cat of categorias) {
      await client.query(`
        INSERT INTO categoria (nome, tipo, icone, cor)
        SELECT $1, $2, $3, $4
        WHERE NOT EXISTS (
          SELECT 1 FROM categoria WHERE nome = $1 AND tipo = $2
        );
      `, [cat.nome, cat.tipo, cat.icone, cat.cor]);
    }

    // Subcategorias de exemplo para Alimentação e Moradia
    const { rows: catAlim } = await client.query(`SELECT id FROM categoria WHERE nome = 'Alimentação' AND tipo = 'despesa' LIMIT 1`);
    if (catAlim.length > 0) {
      const parentId = catAlim[0].id;
      const subAlim = ['Supermercado', 'Restaurantes', 'Delivery'];
      for (const sub of subAlim) {
        await client.query(`
          INSERT INTO categoria (nome, tipo, icone, cor, categoria_pai_id)
          SELECT $1, 'despesa', 'Utensils', '#F87171', $2
          WHERE NOT EXISTS (
            SELECT 1 FROM categoria WHERE nome = $1 AND categoria_pai_id = $2
          );
        `, [sub, parentId]);
      }
    }

    // 3. Instituições de Exemplo se não houver nenhuma
    const { rows: countInst } = await client.query(`SELECT COUNT(*) as count FROM instituicao`);
    if (parseInt(countInst[0].count, 10) === 0) {
      const { rows: instNubank } = await client.query(`
        INSERT INTO instituicao (nome, tipo, icone, cor)
        VALUES ('Nubank', 'banco', 'Landmark', '#820AD1')
        RETURNING id;
      `);
      const { rows: instEspecie } = await client.query(`
        INSERT INTO instituicao (nome, tipo, icone, cor)
        VALUES ('Carteira Física', 'dinheiro', 'Wallet', '#10B981')
        RETURNING id;
      `);

      // 4. Contas de Exemplo
      const { rows: contaCorrente } = await client.query(`
        INSERT INTO conta (instituicao_id, moeda_id, tipo, apelido, saldo_inicial, saldo_atual)
        VALUES ($1, $2, 'corrente', 'NuConta Principal', 1500.00, 1500.00)
        RETURNING id;
      `, [instNubank[0].id, brlId]);

      const { rows: contaDinheiro } = await client.query(`
        INSERT INTO conta (instituicao_id, moeda_id, tipo, apelido, saldo_inicial, saldo_atual)
        VALUES ($1, $2, 'dinheiro', 'Dinheiro na Carteira', 200.00, 200.00)
        RETURNING id;
      `, [instEspecie[0].id, brlId]);

      // 5. Lançamentos de exemplo para o mês corrente
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const anoMes = `${ano}-${mes}`;
      const dataHojeStr = hoje.toISOString().split('T')[0];

      const { rows: catSalario } = await client.query(`SELECT id FROM categoria WHERE nome = 'Salário' LIMIT 1`);
      const { rows: catMercado } = await client.query(`SELECT id FROM categoria WHERE nome = 'Supermercado' LIMIT 1`);
      const catAlimFallback = catAlim[0]?.id;
      const catDespId = catMercado[0]?.id || catAlimFallback;

      if (catSalario.length > 0 && contaCorrente.length > 0) {
        // Receita: Salário
        const valorSalario = 5500.00;
        await client.query(`
          INSERT INTO lancamento (
            tipo, valor, moeda_id, data_compra, forma_pagamento, 
            conta_id, categoria_id, descricao, status
          )
          VALUES ('receita', $1, $2, $3, 'transferencia', $4, $5, 'Salário Mensal', 'efetivado');
        `, [valorSalario, brlId, `${anoMes}-05`, contaCorrente[0].id, catSalario[0].id]);

        // Atualizar saldo
        await client.query(`
          UPDATE conta SET saldo_atual = saldo_atual + $1 WHERE id = $2;
        `, [valorSalario, contaCorrente[0].id]);

        // Atualizar resumo_mensal
        await client.query(`
          INSERT INTO resumo_mensal (ano_mes, categoria_id, conta_id, total_despesas, total_receitas)
          VALUES ($1, $2, $3, 0.00, $4)
          ON CONFLICT (ano_mes, categoria_id, conta_id)
          DO UPDATE SET total_receitas = resumo_mensal.total_receitas + EXCLUDED.total_receitas;
        `, [anoMes, catSalario[0].id, contaCorrente[0].id, valorSalario]);
      }

      if (contaCorrente.length > 0) {
        // Despesa: Supermercado
        const valorGasto = 420.50;
        await client.query(`
          INSERT INTO lancamento (
            tipo, valor, moeda_id, data_compra, forma_pagamento, 
            conta_id, categoria_id, descricao, status
          )
          VALUES ('despesa', $1, $2, $3, 'pix_debito', $4, $5, 'Compras do Mês no Mercado', 'efetivado');
        `, [valorGasto, brlId, dataHojeStr, contaCorrente[0].id, catDespId]);

        // Atualizar saldo
        await client.query(`
          UPDATE conta SET saldo_atual = saldo_atual - $1 WHERE id = $2;
        `, [valorGasto, contaCorrente[0].id]);

        // Atualizar resumo_mensal
        await client.query(`
          INSERT INTO resumo_mensal (ano_mes, categoria_id, conta_id, total_despesas, total_receitas)
          VALUES ($1, $2, $3, $4, 0.00)
          ON CONFLICT (ano_mes, categoria_id, conta_id)
          DO UPDATE SET total_despesas = resumo_mensal.total_despesas + EXCLUDED.total_despesas;
        `, [anoMes, catDespId, contaCorrente[0].id, valorGasto]);
      }

      // 6. Cartão de Crédito de Exemplo
      const { rows: cartaoNubank } = await client.query(`
        INSERT INTO cartao_credito (instituicao_id, apelido, limite, dia_fechamento, dia_vencimento)
        VALUES ($1, 'Nubank Mastercard Platinum', 8000.00, 15, 25)
        RETURNING id;
      `, [instNubank[0].id]);

      // 7. Categoria Assinaturas para Recorrência
      const { rows: catAssinatura } = await client.query(`SELECT id FROM categoria WHERE nome = 'Assinaturas' LIMIT 1`);
      const catAssinaturaId = catAssinatura[0]?.id || catDespId;

      if (cartaoNubank.length > 0) {
        // Recorrência de Exemplo: Assinatura no Cartão
        await client.query(`
          INSERT INTO recorrencia (
            tipo, descricao, valor, categoria_id, forma_pagamento, cartao_id, frequencia,
            dia_referencia, dia_estimado_na_fatura, data_inicio, ativo
          )
          VALUES ('despesa', 'Streaming Netflix 4K', 59.90, $1, 'credito', $2, 'mensal', 10, 10, $3, TRUE);
        `, [catAssinaturaId, cartaoNubank[0].id, `${anoMes}-01`]);

        // Compra Parcelada de Exemplo: Notebook em 4x
        const valorTotalParc = 2400.00;
        const { rows: compraParc } = await client.query(`
          INSERT INTO compra_parcelada (
            descricao, valor_total, num_parcelas, cartao_id, categoria_id, data_compra
          )
          VALUES ('Notebook Trabalho', $1, 4, $2, $3, $4)
          RETURNING id;
        `, [valorTotalParc, cartaoNubank[0].id, catDespId, `${anoMes}-02`]);

        // Gera as 4 parcelas
        for (let i = 1; i <= 4; i++) {
          const compMes = new Date(ano, parseInt(mes, 10) - 1 + (i - 1), 1);
          const compMesStr = `${compMes.getFullYear()}-${String(compMes.getMonth() + 1).padStart(2, '0')}-01`;
          await client.query(`
            INSERT INTO lancamento (
              tipo, valor, moeda_id, data_compra, data_competencia_fatura,
              forma_pagamento, cartao_id, categoria_id, descricao,
              compra_parcelada_id, numero_parcela, total_parcelas, status
            )
            VALUES ('despesa', 600.00, $1, $2, $3, 'credito', $4, $5, $6, $7, $8, 4, 'efetivado');
          `, [
            brlId,
            `${anoMes}-02`,
            compMesStr,
            cartaoNubank[0].id,
            catDespId,
            `Notebook Trabalho (${i}/4)`,
            compraParc[0].id,
            i,
          ]);
        }
      }
    }

    console.log('Seed inicial executado com sucesso!');
  });
}

// Permite execução direta via CLI
if (process.argv[1]?.endsWith('initial_seed.ts') || process.argv[1]?.endsWith('initial_seed.js')) {
  runInitialSeed()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Erro no seed:', err);
      pool.end();
      process.exit(1);
    });
}
