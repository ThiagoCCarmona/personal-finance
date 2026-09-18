import { PoolClient } from 'pg';

export interface CategorySeedDef {
  nome: string;
  tipo: 'despesa' | 'receita';
  icone: string;
  cor: string;
  grupo_50_30_20: 'essencial' | 'estilo_vida' | 'investimento' | 'receita';
  subcategorias?: string[];
}

export const DEFAULT_USER_CATEGORIES: CategorySeedDef[] = [
  // ==========================================
  // 1. GASTOS ESSENCIAIS (50% - Necessidades Básicas)
  // ==========================================
  {
    nome: 'Moradia & Habitação',
    tipo: 'despesa',
    icone: 'Home',
    cor: '#3B82F6',
    grupo_50_30_20: 'essencial',
    subcategorias: ['Aluguel / Condomínio', 'IPTU & Taxas', 'Manutenção & Reparos', 'Seguro Residencial'],
  },
  {
    nome: 'Contas de Consumo',
    tipo: 'despesa',
    icone: 'Zap',
    cor: '#0EA5E9',
    grupo_50_30_20: 'essencial',
    subcategorias: ['Energia Elétrica', 'Água & Esgoto', 'Gás', 'Internet Fibra', 'Telefonia / Celular'],
  },
  {
    nome: 'Alimentação Essencial',
    tipo: 'despesa',
    icone: 'ShoppingCart',
    cor: '#EF4444',
    grupo_50_30_20: 'essencial',
    subcategorias: ['Supermercado', 'Açougue & Peixaria', 'Feira & Hortifrúti', 'Padaria'],
  },
  {
    nome: 'Saúde & Cuidados',
    tipo: 'despesa',
    icone: 'HeartPulse',
    cor: '#EC4899',
    grupo_50_30_20: 'essencial',
    subcategorias: ['Plano de Saúde', 'Farmácia & Remédios', 'Consultas & Exames', 'Dentista & Terapias'],
  },
  {
    nome: 'Transporte Essencial',
    tipo: 'despesa',
    icone: 'Car',
    cor: '#F59E0B',
    grupo_50_30_20: 'essencial',
    subcategorias: ['Combustível', 'Transporte Público / Metrô', 'Manutenção Veicular', 'IPVA & Seguro Auto'],
  },
  {
    nome: 'Educação & Formação',
    tipo: 'despesa',
    icone: 'GraduationCap',
    cor: '#10B981',
    grupo_50_30_20: 'essencial',
    subcategorias: ['Mensalidade Escolar / Faculdade', 'Cursos & Treinamentos', 'Livros & Material Didático'],
  },

  // ==========================================
  // 2. ESTILO DE VIDA & DESEJOS (30% - Qualidade de Vida)
  // ==========================================
  {
    nome: 'Restaurantes & Bares',
    tipo: 'despesa',
    icone: 'Utensils',
    cor: '#F97316',
    grupo_50_30_20: 'estilo_vida',
    subcategorias: ['Restaurantes & Almoços', 'Bares & Baladas', 'Delivery / Ifood', 'Cafés & Sobremesas'],
  },
  {
    nome: 'Lazer, Viagens & Hobbies',
    tipo: 'despesa',
    icone: 'Gamepad2',
    cor: '#8B5CF6',
    grupo_50_30_20: 'estilo_vida',
    subcategorias: ['Viagens & Hospedagem', 'Cinema, Shows & Eventos', 'Passeios de Fim de Semana', 'Hobbies & Esportes'],
  },
  {
    nome: 'Compras & Cuidados Pessoais',
    tipo: 'despesa',
    icone: 'Shirt',
    cor: '#14B8A6',
    grupo_50_30_20: 'estilo_vida',
    subcategorias: ['Vestuário & Calçados', 'Barbearia & Salão', 'Cosméticos & Perfumaria', 'Eletrônicos & Gadgets'],
  },
  {
    nome: 'Assinaturas & Streaming',
    tipo: 'despesa',
    icone: 'Film',
    cor: '#6366F1',
    grupo_50_30_20: 'estilo_vida',
    subcategorias: ['Streaming (Netflix, Spotify)', 'Games & Softwares', 'Clubes de Assinatura'],
  },

  // ==========================================
  // 3. METAS, INVESTIMENTOS & FUTURO (20% - Construção de Patrimônio)
  // ==========================================
  {
    nome: 'Reserva & Investimentos',
    tipo: 'despesa',
    icone: 'TrendingUp',
    cor: '#059669',
    grupo_50_30_20: 'investimento',
    subcategorias: ['Reserva de Emergência', 'Renda Fixa / Tesouro', 'Ações & FIIs', 'Criptoativos'],
  },
  {
    nome: 'Amortizações & Dívidas',
    tipo: 'despesa',
    icone: 'ShieldCheck',
    cor: '#64748B',
    grupo_50_30_20: 'investimento',
    subcategorias: ['Amortização de Financiamento', 'Quitação de Empréstimos'],
  },

  // ==========================================
  // 4. RECEITAS
  // ==========================================
  {
    nome: 'Salário & Remuneração',
    tipo: 'receita',
    icone: 'Briefcase',
    cor: '#10B981',
    grupo_50_30_20: 'receita',
    subcategorias: ['Salário Mensal', '13º Salário', 'Férias', 'Bônus & PLR'],
  },
  {
    nome: 'Renda Extra & Freelance',
    tipo: 'receita',
    icone: 'Award',
    cor: '#34D399',
    grupo_50_30_20: 'receita',
    subcategorias: ['Consultoria', 'Projetos Freelance', 'Comissões & Prêmios'],
  },
  {
    nome: 'Rendimentos de Ativos',
    tipo: 'receita',
    icone: 'LineChart',
    cor: '#059669',
    grupo_50_30_20: 'receita',
    subcategorias: ['Dividendos & JCP', 'Rendimentos de Renda Fixa', 'Aluguéis Recebidos'],
  },
  {
    nome: 'Outras Entradas',
    tipo: 'receita',
    icone: 'PlusCircle',
    cor: '#6EE7B7',
    grupo_50_30_20: 'receita',
    subcategorias: ['Reembolsos', 'Venda de Bens Pessoais', 'Presentes & Doações'],
  },
];

/**
 * Cria a árvore padrão de categorias associadas a um usuário específico.
 */
export async function seedUserDefaultCategories(userId: string, client: PoolClient) {
  for (const cat of DEFAULT_USER_CATEGORIES) {
    // Insere ou atualiza categoria pai para este usuário
    let catPaiId: string;
    const { rows: existing } = await client.query(
      `SELECT id FROM categoria WHERE usuario_id = $1 AND nome = $2 AND tipo = $3 LIMIT 1`,
      [userId, cat.nome, cat.tipo]
    );

    if (existing.length > 0) {
      catPaiId = existing[0].id;
      await client.query(
        `UPDATE categoria 
         SET grupo_50_30_20 = $1, icone = $2, cor = $3
         WHERE id = $4`,
        [cat.grupo_50_30_20, cat.icone, cat.cor, catPaiId]
      );
    } else {
      const { rows: inserted } = await client.query(
        `INSERT INTO categoria (usuario_id, nome, tipo, icone, cor, grupo_50_30_20, ativo)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         RETURNING id`,
        [userId, cat.nome, cat.tipo, cat.icone, cat.cor, cat.grupo_50_30_20]
      );
      catPaiId = inserted[0].id;
    }

    // Insere subcategorias filhas herdando o grupo 50-30-20 da categoria pai
    if (cat.subcategorias && cat.subcategorias.length > 0) {
      for (const sub of cat.subcategorias) {
        const { rows: subExist } = await client.query(
          `SELECT id FROM categoria WHERE usuario_id = $1 AND nome = $2 AND categoria_pai_id = $3 LIMIT 1`,
          [userId, sub, catPaiId]
        );
        if (subExist.length === 0) {
          await client.query(
            `INSERT INTO categoria (usuario_id, nome, tipo, icone, cor, grupo_50_30_20, categoria_pai_id, ativo)
             VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
            [userId, sub, cat.tipo, cat.icone, cat.cor, cat.grupo_50_30_20, catPaiId]
          );
        } else {
          await client.query(
            `UPDATE categoria 
             SET grupo_50_30_20 = $1, icone = $2, cor = $3
             WHERE id = $4`,
            [cat.grupo_50_30_20, cat.icone, cat.cor, subExist[0].id]
          );
        }
      }
    }
  }
}
