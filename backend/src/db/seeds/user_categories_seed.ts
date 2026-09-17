import { PoolClient } from 'pg';

export interface CategorySeedDef {
  nome: string;
  tipo: 'despesa' | 'receita';
  icone: string;
  cor: string;
  subcategorias?: string[];
}

export const DEFAULT_USER_CATEGORIES: CategorySeedDef[] = [
  // Despesas
  {
    nome: 'Alimentação',
    tipo: 'despesa',
    icone: 'Utensils',
    cor: '#EF4444',
    subcategorias: ['Supermercado', 'Restaurantes', 'Delivery / Lanches', 'Café & Padaria'],
  },
  {
    nome: 'Transporte',
    tipo: 'despesa',
    icone: 'Car',
    cor: '#F59E0B',
    subcategorias: ['Combustível', 'Aplicativos / Táxi', 'Estacionamento & Pedágio', 'Manutenção Veicular'],
  },
  {
    nome: 'Moradia',
    tipo: 'despesa',
    icone: 'Home',
    cor: '#3B82F6',
    subcategorias: ['Aluguel / Condomínio', 'Energia Elétrica', 'Água & Gás', 'Internet Fibra'],
  },
  {
    nome: 'Saúde & Bem-Estar',
    tipo: 'despesa',
    icone: 'HeartPulse',
    cor: '#EC4899',
    subcategorias: ['Farmácia', 'Consultas & Exames', 'Plano de Saúde', 'Academia & Esportes'],
  },
  {
    nome: 'Lazer & Cultura',
    tipo: 'despesa',
    icone: 'Gamepad2',
    cor: '#8B5CF6',
    subcategorias: ['Viagens & Passeios', 'Cinema & Shows', 'Bares & Baladas', 'Hobbies'],
  },
  {
    nome: 'Educação & Carreira',
    tipo: 'despesa',
    icone: 'GraduationCap',
    cor: '#10B981',
    subcategorias: ['Cursos & Certificações', 'Livros & Materiais', 'Faculdade / Especialização'],
  },
  {
    nome: 'Assinaturas & Serviços',
    tipo: 'despesa',
    icone: 'Film',
    cor: '#6366F1',
    subcategorias: ['Streaming (Netflix, Spotify)', 'Softwares & Ferramentas', 'Telefonia / Celular'],
  },
  {
    nome: 'Vestuário & Cuidados',
    tipo: 'despesa',
    icone: 'Shirt',
    cor: '#14B8A6',
    subcategorias: ['Roupas & Calçados', 'Barbearia / Salão'],
  },
  {
    nome: 'Outros Gastos',
    tipo: 'despesa',
    icone: 'MoreHorizontal',
    cor: '#6B7280',
    subcategorias: ['Imprevistos', 'Taxas Bancárias', 'Doações'],
  },
  // Receitas
  {
    nome: 'Salário & Remuneração',
    tipo: 'receita',
    icone: 'Briefcase',
    cor: '#10B981',
    subcategorias: ['Salário Mensal', '13º Salário', 'Férias', 'Bônus & PLR'],
  },
  {
    nome: 'Investimentos & Dividendos',
    tipo: 'receita',
    icone: 'TrendingUp',
    cor: '#059669',
    subcategorias: ['Dividendos & JCP', 'Rendimentos de Renda Fixa', 'Ganhos com Vendas'],
  },
  {
    nome: 'Serviços & Freelances',
    tipo: 'receita',
    icone: 'Award',
    cor: '#34D399',
    subcategorias: ['Consultoria', 'Projetos Extras'],
  },
  {
    nome: 'Outras Receitas',
    tipo: 'receita',
    icone: 'PlusCircle',
    cor: '#6EE7B7',
    subcategorias: ['Reembolsos', 'Vendas de Itens Pessoais', 'Presentes'],
  },
];

/**
 * Cria a árvore padrão de categorias associadas a um usuário específico.
 */
export async function seedUserDefaultCategories(userId: string, client: PoolClient) {
  for (const cat of DEFAULT_USER_CATEGORIES) {
    // Insere categoria pai se não existir para este usuário
    let catPaiId: string;
    const { rows: existing } = await client.query(
      `SELECT id FROM categoria WHERE usuario_id = $1 AND nome = $2 AND tipo = $3 LIMIT 1`,
      [userId, cat.nome, cat.tipo]
    );

    if (existing.length > 0) {
      catPaiId = existing[0].id;
    } else {
      const { rows: inserted } = await client.query(
        `INSERT INTO categoria (usuario_id, nome, tipo, icone, cor, ativo)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING id`,
        [userId, cat.nome, cat.tipo, cat.icone, cat.cor]
      );
      catPaiId = inserted[0].id;
    }

    // Insere subcategorias filhas
    if (cat.subcategorias && cat.subcategorias.length > 0) {
      for (const sub of cat.subcategorias) {
        await client.query(
          `INSERT INTO categoria (usuario_id, nome, tipo, icone, cor, categoria_pai_id, ativo)
           SELECT $1, $2, $3, $4, $5, $6, TRUE
           WHERE NOT EXISTS (
             SELECT 1 FROM categoria 
             WHERE usuario_id = $1 AND nome = $2 AND categoria_pai_id = $6
           )`,
          [userId, sub, cat.tipo, cat.icone, cat.cor, catPaiId]
        );
      }
    }
  }
}
