import bcrypt from 'bcryptjs';
import { PoolClient } from 'pg';
import { pool, withTransaction, query } from '../../config/database.js';
import { seedUserDefaultCategories } from '../../db/seeds/user_categories_seed.js';

export class DemoShowcaseService {
  private static timer: NodeJS.Timeout | null = null;
  private static readonly RESET_INTERVAL_MS = 20 * 60 * 1000; // 20 minutos (dentro da faixa de 15 a 30 minutos)

  /**
   * Inicializa o scheduler de reset automático da vitrine
   */
  static startScheduler() {
    // Executa uma vez ao iniciar
    this.resetDemoUser().catch((err) => {
      console.error('[Demo Showcase] Erro no reset inicial do usuário teste:', err);
    });

    // Agenda execuções a cada 20 minutos
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      console.log('[Demo Showcase] 🔄 Iniciando ciclo de reset automático do usuário vitrine (20 min)...');
      this.resetDemoUser().catch((err) => {
        console.error('[Demo Showcase] ❌ Erro ao reestabelecer dados do usuário teste:', err);
      });
    }, this.RESET_INTERVAL_MS);

    console.log(`[Demo Showcase] ⏱️ Scheduler de auto-reset ativo (a cada ${this.RESET_INTERVAL_MS / 60000} minutos).`);
  }

  /**
   * Reestabelece os dados do usuário 'teste' para o estado vitrine inicial completo
   */
  static async resetDemoUser() {
    return withTransaction(async (client: PoolClient) => {
      // 1. Obter ou Criar Usuário 'teste'
      let testeUserId: string;
      const { rows: existingUser } = await client.query(
        `SELECT id FROM usuario WHERE login = 'teste' LIMIT 1`
      );

      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash('teste123', salt);

      if (existingUser.length > 0) {
        testeUserId = existingUser[0].id;
        await client.query(
          `UPDATE usuario 
           SET nome = 'Usuário Vitrine (Demonstração)',
               senha_hash = $1,
               role = 'user',
               precisa_trocar_senha = FALSE,
               ativo = TRUE
           WHERE id = $2`,
          [senhaHash, testeUserId]
        );
      } else {
        const { rows: newUser } = await client.query(
          `INSERT INTO usuario (login, nome, senha_hash, role, precisa_trocar_senha, ativo)
           VALUES ('teste', 'Usuário Vitrine (Demonstração)', $1, 'user', FALSE, TRUE)
           RETURNING id`,
          [senhaHash]
        );
        testeUserId = newUser[0].id;
      }

      // 2. Limpar dados anteriores do usuário teste
      await client.query(`DELETE FROM cobranca_pix WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM chave_pix WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM divida WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM despesa_compartilhada WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM pessoa WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM lista_desejo WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM movimentacao_investimento WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM investimento WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM fatura_paga WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM lancamento WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM resumo_mensal WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM compra_parcelada WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM recorrencia WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM cartao_credito WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM conta WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM instituicao WHERE usuario_id = $1`, [testeUserId]);
      await client.query(`DELETE FROM categoria WHERE usuario_id = $1`, [testeUserId]);

      // 3. Obter Moeda BRL
      const { rows: moedaRows } = await client.query(`SELECT id FROM moeda WHERE codigo = 'BRL' LIMIT 1`);
      let brlId = moedaRows[0]?.id;
      if (!brlId) {
        const { rows: mIns } = await client.query(`
          INSERT INTO moeda (codigo, nome, simbolo, ativo, favorita)
          VALUES ('BRL', 'Real Brasileiro', 'R$', TRUE, TRUE)
          ON CONFLICT (codigo) DO UPDATE SET ativo = TRUE
          RETURNING id
        `);
        brlId = mIns[0].id;
      }

      // 4. Categorias Padrão
      await seedUserDefaultCategories(testeUserId, client);
      const { rows: catRows } = await client.query(
        `SELECT id, nome FROM categoria WHERE usuario_id = $1`,
        [testeUserId]
      );
      const catMap = new Map<string, string>(catRows.map((c: any) => [c.nome, c.id]));
      const catAlim = catMap.get('Alimentação') || catRows[0]?.id;
      const catTransp = catMap.get('Transporte') || catRows[0]?.id;
      const catMoradia = catMap.get('Moradia') || catRows[0]?.id;
      const catLazer = catMap.get('Lazer & Cultura') || catRows[0]?.id;
      const catSaude = catMap.get('Saúde & Cuidados') || catRows[0]?.id;
      const catSalario = catMap.get('Salário & Remuneração') || catRows[0]?.id;
      const catInvest = catMap.get('Investimentos & Dividendos') || catRows[0]?.id;
      const catOutros = catMap.get('Outros Gastos') || catRows[0]?.id;

      // 5. Instituições Financeiras do Usuário Teste
      const { rows: instNubank } = await client.query(`
        INSERT INTO instituicao (usuario_id, nome, tipo, icone, cor, ativo)
        VALUES ($1, 'Nubank', 'banco', 'Landmark', '#820AD1', TRUE)
        RETURNING id
      `, [testeUserId]);

      const { rows: instItau } = await client.query(`
        INSERT INTO instituicao (usuario_id, nome, tipo, icone, cor, ativo)
        VALUES ($1, 'Itaú Unibanco', 'banco', 'Landmark', '#EC7000', TRUE)
        RETURNING id
      `, [testeUserId]);

      const { rows: instBtg } = await client.query(`
        INSERT INTO instituicao (usuario_id, nome, tipo, icone, cor, ativo)
        VALUES ($1, 'BTG Pactual', 'banco', 'TrendingUp', '#001E62', TRUE)
        RETURNING id
      `, [testeUserId]);

      const { rows: instDinheiro } = await client.query(`
        INSERT INTO instituicao (usuario_id, nome, tipo, icone, cor, ativo)
        VALUES ($1, 'Carteira Física', 'dinheiro', 'Wallet', '#10B981', TRUE)
        RETURNING id
      `, [testeUserId]);

      // 6. Contas Bancárias (Saldo Consolidado demonstrativo: R$ 20.500,00)
      const { rows: contaItau } = await client.query(`
        INSERT INTO conta (usuario_id, instituicao_id, moeda_id, tipo, apelido, saldo_inicial, saldo_atual, ativo)
        VALUES ($1, $2, $3, 'corrente', 'Itaú Principal', 4850.00, 4850.00, TRUE)
        RETURNING id
      `, [testeUserId, instItau[0].id, brlId]);

      const { rows: contaNubank } = await client.query(`
        INSERT INTO conta (usuario_id, instituicao_id, moeda_id, tipo, apelido, saldo_inicial, saldo_atual, ativo)
        VALUES ($1, $2, $3, 'corrente', 'Nubank Reserva', 15300.00, 15300.00, TRUE)
        RETURNING id
      `, [testeUserId, instNubank[0].id, brlId]);

      const { rows: contaDinheiro } = await client.query(`
        INSERT INTO conta (usuario_id, instituicao_id, moeda_id, tipo, apelido, saldo_inicial, saldo_atual, ativo)
        VALUES ($1, $2, $3, 'dinheiro', 'Carteira / Dinheiro', 350.00, 350.00, TRUE)
        RETURNING id
      `, [testeUserId, instDinheiro[0].id, brlId]);

      // 7. Cartões de Crédito
      const { rows: cartaoNu } = await client.query(`
        INSERT INTO cartao_credito (usuario_id, instituicao_id, apelido, limite, dia_fechamento, dia_vencimento, ativo)
        VALUES ($1, $2, 'Nubank Ultravioleta', 12000.00, 12, 20, TRUE)
        RETURNING id
      `, [testeUserId, instNubank[0].id]);

      const { rows: cartaoItau } = await client.query(`
        INSERT INTO cartao_credito (usuario_id, instituicao_id, apelido, limite, dia_fechamento, dia_vencimento, ativo)
        VALUES ($1, $2, 'Itaú Mastercard Black', 25000.00, 20, 28, TRUE)
        RETURNING id
      `, [testeUserId, instItau[0].id]);

      // 8. Recorrências (Receitas fixas de R$ 10.500,00 e Despesas fixas de R$ 2.635,70)
      await client.query(`
        INSERT INTO recorrencia (
          usuario_id, tipo, descricao, valor, categoria_id, forma_pagamento, conta_id,
          frequencia, dia_referencia, data_inicio, ativo
        )
        VALUES 
          ($1, 'receita', 'Salário Engenheiro Tech', 8500.00, $2, 'transferencia', $3, 'mensal', 5, '2026-01-01', TRUE),
          ($1, 'receita', 'Consultoria e Freelance', 2000.00, $2, 'transferencia', $4, 'mensal', 15, '2026-01-01', TRUE),
          ($1, 'despesa', 'Aluguel Apartamento & Condomínio', 2400.00, $5, 'debito', $3, 'mensal', 10, '2026-01-01', TRUE),
          ($1, 'despesa', 'Internet Fibra 600 Mega', 149.90, $5, 'debito', $3, 'mensal', 12, '2026-01-01', TRUE);
      `, [testeUserId, catSalario, contaItau[0].id, contaNubank[0].id, catMoradia]);

      await client.query(`
        INSERT INTO recorrencia (
          usuario_id, tipo, descricao, valor, categoria_id, forma_pagamento, cartao_id,
          frequencia, dia_referencia, dia_estimado_na_fatura, data_inicio, ativo
        )
        VALUES 
          ($1, 'despesa', 'Netflix 4K & Spotify Family', 85.80, $2, 'credito', $3, 'mensal', 18, 18, '2026-01-01', TRUE);
      `, [testeUserId, catLazer, cartaoNu[0].id]);

      // 9. Compras Parceladas e Faturas
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = hoje.getMonth(); // 0-indexed

      // Compra 1: Dell XPS 13 (10x de 780,00)
      const { rows: compraNotebook } = await client.query(`
        INSERT INTO compra_parcelada (usuario_id, descricao, valor_total, num_parcelas, cartao_id, categoria_id, data_compra)
        VALUES ($1, 'Dell XPS 13 Intel Core Ultra', 7800.00, 10, $2, $3, $4)
        RETURNING id
      `, [testeUserId, cartaoNu[0].id, catOutros, `${ano}-01-10`]);

      for (let p = 1; p <= 10; p++) {
        const dataParc = new Date(ano, mes - 2 + (p - 1), 10);
        const dataStr = dataParc.toISOString().split('T')[0];
        const compStr = `${dataParc.getFullYear()}-${String(dataParc.getMonth() + 1).padStart(2, '0')}-01`;

        await client.query(`
          INSERT INTO lancamento (
            usuario_id, tipo, valor, moeda_id, data_compra, data_competencia_fatura,
            forma_pagamento, cartao_id, categoria_id, descricao,
            compra_parcelada_id, numero_parcela, total_parcelas, status
          )
          VALUES ($1, 'despesa', 780.00, $2, $3, $4, 'credito', $5, $6, $7, $8, $9, 10, 'efetivado')
        `, [
          testeUserId, brlId, dataStr, compStr, cartaoNu[0].id, catOutros,
          `Dell XPS 13 (${p}/10)`, compraNotebook[0].id, p
        ]);
      }

      // Compra 2: Smartphone Galaxy S24 (6x de 650,00)
      const { rows: compraCelular } = await client.query(`
        INSERT INTO compra_parcelada (usuario_id, descricao, valor_total, num_parcelas, cartao_id, categoria_id, data_compra)
        VALUES ($1, 'Samsung Galaxy S24 256GB', 3900.00, 6, $2, $3, $4)
        RETURNING id
      `, [testeUserId, cartaoItau[0].id, catOutros, `${ano}-02-15`]);

      for (let p = 1; p <= 6; p++) {
        const dataParc = new Date(ano, mes - 1 + (p - 1), 15);
        const dataStr = dataParc.toISOString().split('T')[0];
        const compStr = `${dataParc.getFullYear()}-${String(dataParc.getMonth() + 1).padStart(2, '0')}-01`;

        await client.query(`
          INSERT INTO lancamento (
            usuario_id, tipo, valor, moeda_id, data_compra, data_competencia_fatura,
            forma_pagamento, cartao_id, categoria_id, descricao,
            compra_parcelada_id, numero_parcela, total_parcelas, status
          )
          VALUES ($1, 'despesa', 650.00, $2, $3, $4, 'credito', $5, $6, $7, $8, $9, 6, 'efetivado')
        `, [
          testeUserId, brlId, dataStr, compStr, cartaoItau[0].id, catOutros,
          `Galaxy S24 (${p}/6)`, compraCelular[0].id, p
        ]);
      }

      // 10. Lançamentos Históricos e Recentes nos últimos 45 dias
      const transacoes = [
        { desc: 'Salário Mensal', valor: 8500.00, tipo: 'receita', cat: catSalario, conta: contaItau[0].id, offset: -30, forma: 'transferencia' },
        { desc: 'Consultoria Freelance', valor: 2000.00, tipo: 'receita', cat: catSalario, conta: contaNubank[0].id, offset: -20, forma: 'transferencia' },
        { desc: 'Rendimentos Selic & FII', valor: 184.20, tipo: 'receita', cat: catInvest, conta: contaNubank[0].id, offset: -15, forma: 'transferencia' },
        { desc: 'Salário Mensal', valor: 8500.00, tipo: 'receita', cat: catSalario, conta: contaItau[0].id, offset: -2, forma: 'transferencia' },
        
        { desc: 'Supermercado Pão de Açúcar', valor: 452.30, tipo: 'despesa', cat: catAlim, conta: contaNubank[0].id, offset: -18, forma: 'debito' },
        { desc: 'Abastecimento Posto Ipiranga', valor: 220.00, tipo: 'despesa', cat: catTransp, conta: contaItau[0].id, offset: -14, forma: 'debito' },
        { desc: 'Farmácia Raia Medicamentos', valor: 115.40, tipo: 'despesa', cat: catSaude, conta: contaNubank[0].id, offset: -10, forma: 'pix_debito' },
        { desc: 'Restaurante Fim de Semana', valor: 185.00, tipo: 'despesa', cat: catAlim, conta: contaItau[0].id, offset: -7, forma: 'debito' },
        { desc: 'SmartFit Mensalidade', valor: 129.90, tipo: 'despesa', cat: catSaude, conta: contaItau[0].id, offset: -5, forma: 'debito' },
        { desc: 'Livraria Cultura Livros', valor: 160.00, tipo: 'despesa', cat: catLazer, conta: contaDinheiro[0].id, offset: -3, forma: 'dinheiro' },
        { desc: 'Padaria & Café da Manhã', valor: 45.50, tipo: 'despesa', cat: catAlim, conta: contaNubank[0].id, offset: -1, forma: 'pix_debito' },
      ];

      for (const t of transacoes) {
        const d = new Date();
        d.setDate(d.getDate() + t.offset);
        const dStr = d.toISOString().split('T')[0];
        const anoMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        await client.query(`
          INSERT INTO lancamento (
            usuario_id, tipo, valor, moeda_id, data_compra, forma_pagamento,
            conta_id, categoria_id, descricao, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'efetivado')
        `, [testeUserId, t.tipo, t.valor, brlId, dStr, t.forma, t.conta, t.cat, t.desc]);

        await client.query(`
          INSERT INTO resumo_mensal (usuario_id, ano_mes, categoria_id, conta_id, total_despesas, total_receitas)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (ano_mes, categoria_id, conta_id)
          DO UPDATE SET 
            total_despesas = resumo_mensal.total_despesas + EXCLUDED.total_despesas,
            total_receitas = resumo_mensal.total_receitas + EXCLUDED.total_receitas
        `, [
          testeUserId, anoMes, t.cat, t.conta,
          t.tipo === 'despesa' ? t.valor : 0,
          t.tipo === 'receita' ? t.valor : 0
        ]);
      }

      // 11. Carteira de Investimentos Demonstrativa (Total Aplicado: R$ 24.200,00)
      const investimentosDemo = [
        { tipo: 'renda_fixa', nome: 'Tesouro Direto Selic 2029', ticker: 'LFT2029', inst: 'BTG Pactual', indexador: '100% Selic', taxa: 0.1075, val: 10000.00, qtd: 1 },
        { tipo: 'fii', nome: 'Maxi Renda FII', ticker: 'MXRF11', inst: 'BTG Pactual', indexador: 'FII Papel', taxa: null, val: 5100.00, qtd: 500 },
        { tipo: 'acao', nome: 'Banco do Brasil ON', ticker: 'BBAS3', inst: 'BTG Pactual', indexador: 'Ação', taxa: null, val: 5700.00, qtd: 200 },
        { tipo: 'cripto', nome: 'Bitcoin Core', ticker: 'BTC', inst: 'Carteira Fria', indexador: 'Criptoativo', taxa: null, val: 3400.00, qtd: 0.01 },
      ];

      for (const inv of investimentosDemo) {
        const { rows: invRow } = await client.query(`
          INSERT INTO investimento (
            usuario_id, tipo, nome, ticker, moeda_id, instituicao, indexador, taxa_anual, ativo
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
          RETURNING id
        `, [testeUserId, inv.tipo, inv.nome, inv.ticker, brlId, inv.inst, inv.indexador, inv.taxa]);

        await client.query(`
          INSERT INTO movimentacao_investimento (
            usuario_id, investimento_id, tipo, valor, quantidade, cotacao_praticada, data, observacao
          )
          VALUES ($1, $2, 'aporte', $3, $4, $5, '2026-01-15', 'Aporte inicial simulado')
        `, [testeUserId, invRow[0].id, inv.val, inv.qtd, inv.val / inv.qtd]);
      }

      // 12. Wishlist com Histórico de Preços
      await client.query(`
        INSERT INTO lista_desejo (
          usuario_id, nome, preco_estimado, prioridade, tipo_gasto, status, observacoes, links, historico_precos
        )
        VALUES 
          (
            $1, 'Cadeira Gamer Ergonômica DT3', 1890.00, 'alta', 'casa', 'planejado',
            'Upgrade para a estação de trabalho home office',
            $2::jsonb, $3::jsonb
          ),
          (
            $1, 'Monitor Dell 34 Curved Ultrawide', 2799.00, 'media', 'eletronico', 'planejado',
            'Mais produtividade em desenvolvimento',
            $4::jsonb, $5::jsonb
          ),
          (
            $1, 'Viagem Férias Serra Gaúcha (Gramado)', 4500.00, 'media', 'pessoal', 'planejado',
            'Passeios, gastronomia e descanso',
            '[]'::jsonb, '[]'::jsonb
          );
      `, [
        testeUserId,
        JSON.stringify([{ url: 'https://kabum.com.br/cadeira', loja: 'KaBuM' }]),
        JSON.stringify([
          { data: '2026-07-01', preco: 2199.00, loja: 'KaBuM', observacao: 'Preço cheio' },
          { data: '2026-08-15', preco: 1999.00, loja: 'KaBuM', observacao: 'Promoção de Inverno' },
          { data: '2026-09-10', preco: 1890.00, loja: 'KaBuM', observacao: 'Menor preço do ano' },
        ]),
        JSON.stringify([{ url: 'https://dell.com.br/monitor', loja: 'Dell Store' }]),
        JSON.stringify([
          { data: '2026-08-01', preco: 3100.00, loja: 'Dell Store' },
          { data: '2026-09-05', preco: 2799.00, loja: 'Dell Store', observacao: 'Cupom de desconto aplicado' },
        ])
      ]);

      // 13. Social e Contas a Receber (Empréstimo e Despesa Compartilhada)
      const { rows: pLucas } = await client.query(`
        INSERT INTO pessoa (usuario_id, nome, apelido, telefone, email, ativo)
        VALUES ($1, 'Lucas Andrade', 'Lucas', '(11) 98888-1122', 'lucas@exemplo.com', TRUE)
        RETURNING id
      `, [testeUserId]);

      const { rows: pBeatriz } = await client.query(`
        INSERT INTO pessoa (usuario_id, nome, apelido, telefone, email, ativo)
        VALUES ($1, 'Beatriz Oliveira', 'Bia', '(11) 97777-3344', 'bia@exemplo.com', TRUE)
        RETURNING id
      `, [testeUserId]);

      await client.query(`
        INSERT INTO divida (
          usuario_id, pessoa_id, valor_total, valor_pago, valor_perdoado,
          motivo, conta_origem_id, status, data, vencimento
        )
        VALUES 
          ($1, $2, 350.00, 150.00, 0.00, 'Cota de Churrasco e Bebidas', $3, 'parcial', '2026-08-20', '2026-10-15'),
          ($1, $4, 480.00, 0.00, 0.00, 'Ingressos do Festival de Música', $3, 'pendente', '2026-09-02', '2026-10-05');
      `, [testeUserId, pLucas[0].id, contaNubank[0].id, pBeatriz[0].id]);

      // Chave PIX do Usuário Teste
      await client.query(`
        INSERT INTO chave_pix (usuario_id, tipo, valor_chave, nome_recebedor, cidade_recebedor, apelido, ativo)
        VALUES ($1, 'email', 'pix.teste@finan.com.br', 'Usuário Vitrine Demonstração', 'SAO PAULO', 'PIX Nubank Vitrine', TRUE)
      `, [testeUserId]);

      console.log(`[Demo Showcase] ✅ Usuário 'teste' (ID: ${testeUserId}) resetado com sucesso para dados simulados de vitrine!`);
    });
  }
}
