import bcrypt from 'bcryptjs';
import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database.js';
import { seedUserDefaultCategories } from './user_categories_seed.js';

export async function runAdminDemoSeed() {
  console.log('🚀 Iniciando seed de demonstração do Usuário Administrador...');

  return withTransaction(async (client: PoolClient) => {
    // 1. Moedas Globais do Sistema
    await client.query(`
      INSERT INTO moeda (codigo, nome, simbolo, ativo, favorita)
      VALUES 
        ('BRL', 'Real Brasileiro', 'R$', TRUE, TRUE),
        ('USD', 'Dólar Americano', 'US$', TRUE, TRUE),
        ('EUR', 'Euro', '€', TRUE, TRUE),
        ('BTC', 'Bitcoin', '₿', TRUE, FALSE),
        ('GBP', 'Libra Esterlina', '£', TRUE, FALSE)
      ON CONFLICT (codigo) DO UPDATE 
      SET nome = EXCLUDED.nome, simbolo = EXCLUDED.simbolo, ativo = TRUE;
    `);

    const { rows: moedaRows } = await client.query(`SELECT id, codigo FROM moeda`);
    const moedaMap = new Map<string, string>(moedaRows.map((m: { id: string; codigo: string }) => [m.codigo, m.id]));
    const brlId = moedaMap.get('BRL')!;
    const usdId = moedaMap.get('USD')!;

    // 2. Instituições Bancárias Globais
    const instituicoesPadrao = [
      { nome: 'Itaú Personnalité', tipo: 'banco', icone: 'Landmark', cor: '#EC7000' },
      { nome: 'Nubank Ultravioleta', tipo: 'banco', icone: 'Landmark', cor: '#820AD1' },
      { nome: 'BTG Pactual', tipo: 'banco', icone: 'TrendingUp', cor: '#001E62' },
      { nome: 'XP Investimentos', tipo: 'banco', icone: 'Briefcase', cor: '#000000' },
      { nome: 'Carteira Física', tipo: 'dinheiro', icone: 'Wallet', cor: '#10B981' },
    ];

    for (const inst of instituicoesPadrao) {
      const { rows } = await client.query(`SELECT id FROM instituicao WHERE nome = $1 LIMIT 1`, [inst.nome]);
      if (rows.length === 0) {
        await client.query(`
          INSERT INTO instituicao (nome, tipo, icone, cor, ativo)
          VALUES ($1, $2, $3, $4, TRUE)
        `, [inst.nome, inst.tipo, inst.icone, (inst as any).cor || '#3B82F6']);
      }
    }

    const { rows: instRows } = await client.query(`SELECT id, nome FROM instituicao`);
    const instMap = new Map<string, string>(instRows.map((i: { id: string; nome: string }) => [i.nome, i.id]));
    const itauId = instMap.get('Itaú Personnalité')!;
    const nubankId = instMap.get('Nubank Ultravioleta')!;
    const btgId = instMap.get('BTG Pactual')!;
    const carteiraFisicaId = instMap.get('Carteira Física') || instRows[0].id;

    // 3. Criar ou Obter Usuário Admin
    const salt = await bcrypt.genSalt(12);
    const adminSenhaHash = await bcrypt.hash('admin123', salt);

    let adminUserId: string;
    const { rows: existingAdmin } = await client.query(
      `SELECT id FROM usuario WHERE login = 'admin' LIMIT 1`
    );

    if (existingAdmin.length > 0) {
      adminUserId = existingAdmin[0].id;
      await client.query(
        `UPDATE usuario 
         SET role = 'admin', nome = 'Administrador Demonstrativo', senha_hash = $1 
         WHERE id = $2`,
        [adminSenhaHash, adminUserId]
      );
    } else {
      const { rows: newAdmin } = await client.query(
        `INSERT INTO usuario (login, nome, senha_hash, role, inactivity_timeout_minutes)
         VALUES ('admin', 'Administrador Demonstrativo', $1, 'admin', 720)
         RETURNING id`,
        [adminSenhaHash]
      );
      adminUserId = newAdmin[0].id;
    }

    console.log(`✅ Usuário Admin configurado (ID: ${adminUserId})`);

    // 4. Popular Categorias Padrão para o Admin
    await seedUserDefaultCategories(adminUserId, client);

    const { rows: adminCats } = await client.query(
      `SELECT id, nome, tipo FROM categoria WHERE usuario_id = $1`,
      [adminUserId]
    );
    const catMap = new Map<string, string>(adminCats.map((c: { id: string; nome: string }) => [c.nome, c.id]));

    // 5. Limpar dados anteriores do admin para evitar duplicatas em re-execuções de teste
    await client.query(`DELETE FROM cobranca_pix WHERE usuario_id = $1`, [adminUserId]);
    await client.query(`DELETE FROM chave_pix WHERE usuario_id = $1`, [adminUserId]);
    await client.query(`DELETE FROM divida WHERE usuario_id = $1`, [adminUserId]);
    await client.query(`DELETE FROM despesa_compartilhada WHERE usuario_id = $1`, [adminUserId]);
    await client.query(`DELETE FROM pessoa WHERE usuario_id = $1`, [adminUserId]);
    await client.query(`DELETE FROM lista_desejo WHERE usuario_id = $1`, [adminUserId]);
    await client.query(`DELETE FROM movimentacao_investimento WHERE usuario_id = $1`, [adminUserId]);
    await client.query(`DELETE FROM investimento WHERE usuario_id = $1`, [adminUserId]);
    await client.query(`DELETE FROM lancamento WHERE usuario_id = $1`, [adminUserId]);
    await client.query(`DELETE FROM resumo_mensal WHERE usuario_id = $1`, [adminUserId]);
    await client.query(`DELETE FROM compra_parcelada WHERE usuario_id = $1`, [adminUserId]);
    await client.query(`DELETE FROM recorrencia WHERE usuario_id = $1`, [adminUserId]);
    await client.query(`DELETE FROM cartao_credito WHERE usuario_id = $1`, [adminUserId]);
    await client.query(`DELETE FROM conta WHERE usuario_id = $1`, [adminUserId]);

    // 6. Contas com Saldo Expressivo (Patrimônio Total em Contas > R$ 380.000,00)
    const { rows: contaItau } = await client.query(`
      INSERT INTO conta (usuario_id, instituicao_id, moeda_id, tipo, apelido, saldo_inicial, saldo_atual, ativo)
      VALUES ($1, $2, $3, 'corrente', 'Itaú Personnalité Principal', 148500.00, 148500.00, TRUE)
      RETURNING id;
    `, [adminUserId, itauId, brlId]);

    const { rows: contaNubank } = await client.query(`
      INSERT INTO conta (usuario_id, instituicao_id, moeda_id, tipo, apelido, saldo_inicial, saldo_atual, ativo)
      VALUES ($1, $2, $3, 'corrente', 'Nubank Reserva de Giro', 42150.00, 42150.00, TRUE)
      RETURNING id;
    `, [adminUserId, nubankId, brlId]);

    const { rows: contaBtg } = await client.query(`
      INSERT INTO conta (usuario_id, instituicao_id, moeda_id, tipo, apelido, saldo_inicial, saldo_atual, ativo)
      VALUES ($1, $2, $3, 'corrente', 'BTG Banking & Liquidação', 190000.00, 190000.00, TRUE)
      RETURNING id;
    `, [adminUserId, btgId, brlId]);

    const { rows: contaEspecie } = await client.query(`
      INSERT INTO conta (usuario_id, instituicao_id, moeda_id, tipo, apelido, saldo_inicial, saldo_atual, ativo)
      VALUES ($1, $2, $3, 'dinheiro', 'Cofre / Espécie', 1200.00, 1200.00, TRUE)
      RETURNING id;
    `, [adminUserId, carteiraFisicaId, brlId]);

    console.log('✅ Contas bancárias criadas com sucesso! Saldo total: R$ 381.850,00');

    // 7. Cartões de Crédito de Alto Padrão
    const { rows: cartaoItau } = await client.query(`
      INSERT INTO cartao_credito (usuario_id, instituicao_id, apelido, limite, dia_fechamento, dia_vencimento, ativo)
      VALUES ($1, $2, 'Itaú Visa Infinite', 65000.00, 20, 28, TRUE)
      RETURNING id;
    `, [adminUserId, itauId]);

    const { rows: cartaoNu } = await client.query(`
      INSERT INTO cartao_credito (usuario_id, instituicao_id, apelido, limite, dia_fechamento, dia_vencimento, ativo)
      VALUES ($1, $2, 'Nubank Ultravioleta Black', 40000.00, 12, 20, TRUE)
      RETURNING id;
    `, [adminUserId, nubankId]);

    // 8. Compras Parceladas e Lançamentos das Parcelas
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth(); // 0-indexed

    // Compra Parcelada 1: MacBook Pro (10 parcelas de 1.800)
    const catOutros = catMap.get('Outros Gastos') || adminCats[0].id;
    const catLazer = catMap.get('Lazer & Cultura') || catOutros;
    const catMoradia = catMap.get('Moradia') || catOutros;
    const catAlim = catMap.get('Alimentação') || catOutros;
    const catTransp = catMap.get('Transporte') || catOutros;
    const catSalario = catMap.get('Salário & Remuneração') || catOutros;
    const catInvestReceita = catMap.get('Investimentos & Dividendos') || catOutros;

    const { rows: compraMacbook } = await client.query(`
      INSERT INTO compra_parcelada (usuario_id, descricao, valor_total, num_parcelas, cartao_id, categoria_id, data_compra)
      VALUES ($1, 'MacBook Pro M3 Max 64GB', 18000.00, 10, $2, $3, $4)
      RETURNING id;
    `, [adminUserId, cartaoItau[0].id, catOutros, `${ano}-01-15`]);

    for (let p = 1; p <= 10; p++) {
      const dataParcela = new Date(ano, mes - 3 + (p - 1), 15);
      const dataStr = dataParcela.toISOString().split('T')[0];
      const compStr = `${dataParcela.getFullYear()}-${String(dataParcela.getMonth() + 1).padStart(2, '0')}-01`;

      await client.query(`
        INSERT INTO lancamento (
          usuario_id, tipo, valor, moeda_id, data_compra, data_competencia_fatura,
          forma_pagamento, cartao_id, categoria_id, descricao,
          compra_parcelada_id, numero_parcela, total_parcelas, status
        )
        VALUES ($1, 'despesa', 1800.00, $2, $3, $4, 'credito', $5, $6, $7, $8, $9, 10, 'efetivado')
      `, [
        adminUserId, brlId, dataStr, compStr, cartaoItau[0].id, catOutros,
        `MacBook Pro M3 Max (${p}/10)`, compraMacbook[0].id, p
      ]);
    }

    // Compra Parcelada 2: Passagens Europa (6 parcelas de 1.400)
    const { rows: compraViagem } = await client.query(`
      INSERT INTO compra_parcelada (usuario_id, descricao, valor_total, num_parcelas, cartao_id, categoria_id, data_compra)
      VALUES ($1, 'Passagens Executiva Férias Paris', 8400.00, 6, $2, $3, $4)
      RETURNING id;
    `, [adminUserId, cartaoItau[0].id, catLazer, `${ano}-02-10`]);

    for (let p = 1; p <= 6; p++) {
      const dataParcela = new Date(ano, mes - 1 + (p - 1), 10);
      const dataStr = dataParcela.toISOString().split('T')[0];
      const compStr = `${dataParcela.getFullYear()}-${String(dataParcela.getMonth() + 1).padStart(2, '0')}-01`;

      await client.query(`
        INSERT INTO lancamento (
          usuario_id, tipo, valor, moeda_id, data_compra, data_competencia_fatura,
          forma_pagamento, cartao_id, categoria_id, descricao,
          compra_parcelada_id, numero_parcela, total_parcelas, status
        )
        VALUES ($1, 'despesa', 1400.00, $2, $3, $4, 'credito', $5, $6, $7, $8, $9, 6, 'efetivado')
      `, [
        adminUserId, brlId, dataStr, compStr, cartaoItau[0].id, catLazer,
        `Passagens Executiva Paris (${p}/6)`, compraViagem[0].id, p
      ]);
    }

    // 9. Recorrências Ativas
    await client.query(`
      INSERT INTO recorrencia (
        usuario_id, tipo, descricao, valor, categoria_id, forma_pagamento, conta_id,
        frequencia, dia_referencia, data_inicio, ativo
      )
      VALUES 
        ($1, 'receita', 'Pró-Labore Executivo Tech', 28500.00, $2, 'transferencia', $3, 'mensal', 5, '2025-01-01', TRUE),
        ($1, 'despesa', 'Condomínio & Manutenção Jardins', 2450.00, $4, 'debito', $3, 'mensal', 10, '2025-01-01', TRUE),
        ($1, 'despesa', 'Internet Fibra Óptica 1Gbps', 299.90, $4, 'debito', $3, 'mensal', 12, '2025-01-01', TRUE);
    `, [adminUserId, catSalario, contaItau[0].id, catMoradia]);

    await client.query(`
      INSERT INTO recorrencia (
        usuario_id, tipo, descricao, valor, categoria_id, forma_pagamento, cartao_id,
        frequencia, dia_referencia, dia_estimado_na_fatura, data_inicio, ativo
      )
      VALUES 
        ($1, 'despesa', 'Seguro Auto Premium Allianz', 680.00, $2, 'credito', $3, 'mensal', 15, 15, '2025-01-01', TRUE),
        ($1, 'despesa', 'Plataforma AWS & Serviços Cloud', 489.00, $4, 'credito', $5, 'mensal', 8, 8, '2025-01-01', TRUE);
    `, [adminUserId, catTransp, cartaoItau[0].id, catOutros, cartaoNu[0].id]);

    // 10. Lançamentos Históricos e Recentes (Últimos 3 meses para alimentar extrato e gráficos)
    const transacoesHistoricas = [
      // Receitas
      { desc: 'Pró-Labore Mensal', valor: 28500.00, tipo: 'receita', cat: catSalario, conta: contaItau[0].id, offsetDias: -60, forma: 'transferencia' },
      { desc: 'Dividendos BTG & FIIs', valor: 2140.80, tipo: 'receita', cat: catInvestReceita, conta: contaBtg[0].id, offsetDias: -45, forma: 'transferencia' },
      { desc: 'Pró-Labore Mensal', valor: 28500.00, tipo: 'receita', cat: catSalario, conta: contaItau[0].id, offsetDias: -30, forma: 'transferencia' },
      { desc: 'Rendimentos CDB & Tesouro', valor: 1980.50, tipo: 'receita', cat: catInvestReceita, conta: contaBtg[0].id, offsetDias: -15, forma: 'transferencia' },
      { desc: 'Pró-Labore Mensal', valor: 28500.00, tipo: 'receita', cat: catSalario, conta: contaItau[0].id, offsetDias: -2, forma: 'transferencia' },
      // Despesas Recentes
      { desc: 'Supermercado Emporium Jardins', valor: 1840.60, tipo: 'despesa', cat: catAlim, conta: contaItau[0].id, offsetDias: -25, forma: 'pix_debito' },
      { desc: 'Jantar Restaurante Fasano', valor: 1250.00, tipo: 'despesa', cat: catAlim, conta: contaNubank[0].id, offsetDias: -18, forma: 'debito' },
      { desc: 'Combustível Posto Shell V-Power', valor: 380.00, tipo: 'despesa', cat: catTransp, conta: contaItau[0].id, offsetDias: -12, forma: 'pix_debito' },
      { desc: 'Compras Supermercado St. Marche', valor: 940.20, tipo: 'despesa', cat: catAlim, conta: contaItau[0].id, offsetDias: -5, forma: 'pix_debito' },
      { desc: 'Farmácia & Suplementos', valor: 420.00, tipo: 'despesa', cat: catOutros, conta: contaNubank[0].id, offsetDias: -3, forma: 'pix_debito' },
    ];

    for (const t of transacoesHistoricas) {
      const d = new Date();
      d.setDate(d.getDate() + t.offsetDias);
      const dStr = d.toISOString().split('T')[0];
      const anoMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      await client.query(`
        INSERT INTO lancamento (
          usuario_id, tipo, valor, moeda_id, data_compra, forma_pagamento,
          conta_id, categoria_id, descricao, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'efetivado')
      `, [adminUserId, t.tipo, t.valor, brlId, dStr, t.forma, t.conta, t.cat, t.desc]);

      // Atualiza resumo mensal
      await client.query(`
        INSERT INTO resumo_mensal (usuario_id, ano_mes, categoria_id, conta_id, total_despesas, total_receitas)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (ano_mes, categoria_id, conta_id)
        DO UPDATE SET 
          total_despesas = resumo_mensal.total_despesas + EXCLUDED.total_despesas,
          total_receitas = resumo_mensal.total_receitas + EXCLUDED.total_receitas;
      `, [
        adminUserId, anoMes, t.cat, t.conta,
        t.tipo === 'despesa' ? t.valor : 0,
        t.tipo === 'receita' ? t.valor : 0
      ]);
    }

    // 11. Carteira de Investimentos Robusta e Diversificada (Total: R$ 265.900,00 aplicados)
    const investimentos = [
      { tipo: 'renda_fixa', nome: 'Tesouro IPCA+ 2035', ticker: 'IPCA2035', inst: 'BTG Pactual', indexador: 'IPCA + 6.20%', taxa: 0.0620, val: 85000.00, qtd: 24.5 },
      { tipo: 'renda_fixa', nome: 'CDB Banco Master 120% CDI', ticker: 'CDB120', inst: 'Itaú Personnalité', indexador: '120% CDI', taxa: 0.1250, val: 50000.00, qtd: 50.0 },
      { tipo: 'acao', nome: 'WEG S.A.', ticker: 'WEGE3', inst: 'BTG Pactual', indexador: 'Ação', taxa: null, val: 34000.00, qtd: 800 },
      { tipo: 'acao', nome: 'Itaú Unibanco PN', ticker: 'ITUB4', inst: 'BTG Pactual', indexador: 'Ação', taxa: null, val: 33200.00, qtd: 1000 },
      { tipo: 'fii', nome: 'CSHG Logística FII', ticker: 'HGLG11', inst: 'BTG Pactual', indexador: 'FII Logístico', taxa: null, val: 32400.00, qtd: 200 },
      { tipo: 'fii', nome: 'Maxi Renda FII', ticker: 'MXRF11', inst: 'BTG Pactual', indexador: 'FII Papel', taxa: null, val: 26000.00, qtd: 2500 },
      { tipo: 'cripto', nome: 'Bitcoin Core', ticker: 'BTC', inst: 'Cofre / Cold Wallet', indexador: 'Criptoativo', taxa: null, val: 15300.00, qtd: 0.045 },
    ];

    for (const inv of investimentos) {
      const { rows: invRow } = await client.query(`
        INSERT INTO investimento (
          usuario_id, tipo, nome, ticker, moeda_id, instituicao, indexador, taxa_anual, ativo
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
        RETURNING id;
      `, [adminUserId, inv.tipo, inv.nome, inv.ticker, brlId, inv.inst, inv.indexador, inv.taxa]);

      // Movimentação de aporte inicial
      await client.query(`
        INSERT INTO movimentacao_investimento (
          usuario_id, investimento_id, tipo, valor, quantidade, cotacao_praticada, data, observacao
        )
        VALUES ($1, $2, 'aporte', $3, $4, $5, '2025-01-10', 'Aporte inicial consolidado');
      `, [adminUserId, invRow[0].id, inv.val, inv.qtd, inv.val / inv.qtd]);
    }

    // 12. Pessoas, Dívidas e Cobranças PIX
    const { rows: pKaká } = await client.query(`
      INSERT INTO pessoa (usuario_id, nome, apelido, telefone, email, ativo)
      VALUES ($1, 'Carlos Eduardo Silva', 'Kaká', '(11) 98765-4321', 'carlos.silva@email.com', TRUE)
      RETURNING id;
    `, [adminUserId]);

    const { rows: pMari } = await client.query(`
      INSERT INTO pessoa (usuario_id, nome, apelido, telefone, email, ativo)
      VALUES ($1, 'Mariana Souza', 'Mari', '(11) 97654-3210', 'mari.souza@email.com', TRUE)
      RETURNING id;
    `, [adminUserId]);

    // Empréstimo concedido a Carlos Silva
    await client.query(`
      INSERT INTO divida (
        usuario_id, pessoa_id, valor_total, valor_pago, valor_perdoado,
        motivo, conta_origem_id, status, data, vencimento
      )
      VALUES ($1, $2, 4500.00, 1500.00, 0.00, 'Empréstimo compra equipamentos escritório', $3, 'parcial', '2025-02-01', '2025-06-30');
    `, [adminUserId, pKaká[0].id, contaItau[0].id]);

    // Despesa compartilhada
    const { rows: despComp } = await client.query(`
      INSERT INTO despesa_compartilhada (
        usuario_id, descricao, valor_total, data, conta_origem_id, categoria_id
      )
      VALUES ($1, 'Aluguel Casa de Praia Férias', 3600.00, '2025-02-15', $2, $3)
      RETURNING id;
    `, [adminUserId, contaItau[0].id, catLazer]);

    // Dívida da Mariana referente à cota dela
    await client.query(`
      INSERT INTO divida (
        usuario_id, pessoa_id, valor_total, valor_pago, motivo,
        conta_origem_id, despesa_compartilhada_id, status, data
      )
      VALUES ($1, $2, 1200.00, 0.00, 'Cota Aluguel Casa de Praia', $3, $4, 'pendente', '2025-02-15');
    `, [adminUserId, pMari[0].id, contaItau[0].id, despComp[0].id]);

    // Chave PIX e Cobrança PIX
    const { rows: chavePixAdmin } = await client.query(`
      INSERT INTO chave_pix (usuario_id, tipo, valor_chave, nome_recebedor, cidade_recebedor, apelido, ativo)
      VALUES ($1, 'telefone', '+5511988887777', 'Administrador Demonstrativo', 'SAO PAULO', 'PIX Principal Itaú', TRUE)
      RETURNING id;
    `, [adminUserId]);

    await client.query(`
      INSERT INTO cobranca_pix (
        usuario_id, chave_pix_id, valor, identificador, payload_brcode, descricao, status
      )
      VALUES (
        $1, $2, 1200.00, 'PRAIA2025',
        '00020126580014br.gov.bcb.pix0114+551198888777752040000530398654071200.005802BR5926Administrador Demonstrativo6009SAO PAULO62130509PRAIA20256304ABCD',
        'Cobrança PIX Cota Casa de Praia', 'pendente'
      );
    `, [adminUserId, chavePixAdmin[0].id]);

    // 13. Lista de Desejos (Wishlist)
    await client.query(`
      INSERT INTO lista_desejo (
        usuario_id, nome, preco_estimado, prioridade, tipo_gasto, status, observacoes
      )
      VALUES 
        ($1, 'Monitor Dell UltraSharp 32 4K USB-C', 4890.00, 'alta', 'eletronico', 'planejado', 'Upgrade para o escritório / setup profissional'),
        ($1, 'Viagem Férias ao Japão (Tóquio & Kyoto)', 24000.00, 'media', 'pessoal', 'planejado', 'Planejamento para a temporada de Sakura'),
        ($1, 'Cadeira Ergonômica Herman Miller Aeron', 8900.00, 'media', 'casa', 'planejado', 'Saúde postural no home office');
    `, [adminUserId]);

    console.log('🎉 Seed de demonstração do Usuário Administrador concluído com sucesso!');
    console.log('📊 Resumo do perfil demo:');
    console.log('   - Usuário: admin | Senha: admin123');
    console.log('   - Saldo Líquido em Contas: R$ 381.850,00');
    console.log('   - Patrimônio em Investimentos: R$ 265.900,00');
    console.log('   - Limite nos Cartões: R$ 105.000,00');
  });
}

// Permite execução direta via node / tsx
if (process.argv[1]?.endsWith('admin_demo_seed.ts') || process.argv[1]?.endsWith('admin_demo_seed.js')) {
  runAdminDemoSeed()
    .then(() => pool.end())
    .catch((err) => {
      console.error('❌ Erro no seed do admin:', err);
      pool.end();
      process.exit(1);
    });
}
