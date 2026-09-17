# 💎 Sistema de Gestão Financeira Pessoal (Multiusuário & Self-Hosted)

Um sistema completo, moderno e responsivo de controle financeiro pessoal, patrimonial e social, com arquitetura **Multiusuário** com isolamento rigoroso de dados em nível de linha (Row-Level Isolation), instalável como PWA (Progressive Web App) e preparado para implantação em VPS própria via Docker.

---

## 🌟 Destaques do Sistema

- 👥 **Arquitetura Multiusuário com Isolamento Estrito**: Cada usuário possui seu próprio ecossistema financeiro isolado (contas, transações, categorias, cartões, investimentos, devedores e cobranças PIX).
- 👑 **Conta de Demonstração (Admin)**: Conta pré-configurada com patrimônio simulado superior a **R$ 380.000,00**, contemplando múltiplos bancos, cartões de alta renda, carteira de investimentos diversificada (Renda Fixa, Ações, FIIs, Cripto), despesas fixas e empréstimos sociais.
- 🔒 **Segurança & Privacidade**: Senhas com hash `bcrypt` (12 rounds de salt), autenticação baseada em cookies `HttpOnly`, expiração de sessão por inatividade, proteção estrita contra IDOR (Insecure Direct Object Reference) em 100% dos endpoints e **Modo Privacidade** com 1 clique para mascarar valores na tela.
- ⚡ **PWA & Mobile-First**: Interface responsiva construída com Tailwind CSS, menus adaptáveis para desktop e mobile, e Service Worker para instalação como app nativo no celular ou computador.
- 📊 **Gestão Patrimonial & Câmbio PTAX Oficial**: Rastreamento de investimentos com cálculo de Preço Médio, alocação por classes e integração direta com a API Olinda do Banco Central do Brasil para cotações diárias do Dólar e Euro com médias móveis (MM7/MM30).
- 🤝 **Módulo Social & Cobranças PIX EMVCo**: Divisão de contas coletivas ("rachar a conta"), controle de empréstimos individuais com quitação atômica e gerador local de QR Code e chave Copia-e-Cola PIX padrão Banco Central (BR Code) sem intermediários.
- 💾 **Backup & Recuperação**: Rotinas de backup automatizado para VPS com retenção configurável e exportação de Dump SQL completo restrita ao perfil Administrador.

---

## 🚀 Credenciais da Conta de Demonstração

Para explorar o sistema imediatamente com dados realistas pré-carregados:

| Perfil | Usuário | Senha | Saldo em Contas | Patrimônio Investido |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador (Demo)** | `admin` | `admin123` | **~R$ 381.800,00** | **~R$ 210.000,00** |

> 💡 Na tela de login, você pode clicar no botão **"Preencher Demonstração"** para autenticar instantaneamente como Administrador.

### Novos Usuários
Ao registrar uma nova conta através da aba **"Cadastrar Nova Conta"**, o usuário inicia com uma área limpa (saldo zero e total privacidade em relação a outros usuários), recebendo automaticamente sua própria árvore hierárquica de categorias padrão de receitas e despesas.

---

## 🏛️ Arquitetura e Modelo de Isolamento Multiusuário

O isolamento é garantido tanto a nível de banco de dados quanto a nível de aplicação:

1. **Camada de Banco de Dados**:
   - Todas as tabelas de escopo do usuário contêm a chave estrangeira `usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE`.
   - Índices compostos `(usuario_id, ...)` aceleram buscas filtradas e garantem performance.
   - Tabelas isoladas: `conta`, `cartao_credito`, `compra_parcelada`, `recorrencia`, `categoria`, `lancamento`, `resumo_mensal`, `investimento`, `movimentacao_investimento`, `pessoa`, `despesa_compartilhada`, `divida`, `chave_pix`, `cobranca_pix` e `lista_desejo`.
2. **Camada de Aplicação (Backend)**:
   - Todo request autenticado extrai a identidade do usuário através do cookie seguro de sessão.
   - Os serviços e queries SQL exigem obrigatoriamente `WHERE usuario_id = $userId` em consultas, inserções, atualizações e exclusões.
   - Tentativas de acesso ou alteração em recursos de terceiros (IDOR) retornam status `404 Not Found`.
3. **Controle de Acesso Baseado em Perfis (RBAC)**:
   - Usuários com papel `admin` possuem acesso a métricas de infraestrutura do sistema e ao dump SQL completo do banco de dados (`/api/sistema/backup`).
   - Usuários padrão (`user`) utilizam os relatórios pessoais em formato CSV e PDF para exportação de seus dados particulares.

---

## 📦 Módulos Funcionais

### 1. Dashboard & Visão Geral
- Saldo Consolidado de contas e carteiras.
- Comprometimento futuro de faturas de cartões de crédito.
- Contas e faturas a pagar no mês com alertas de vencimento.
- Gráficos de evolução temporal (Receitas vs. Despesas) e distribuição de despesas por categoria.

### 2. Contas & Cartões
- Cadastro de bancos (Itaú, Nubank, BTG, XP, etc.), contas correntes, contas salário, poupança, investimentos e dinheiro físico.
- Gestão de cartões de crédito com cálculo automático de ciclo de fatura, fechamento, vencimento, limite utilizado e limite disponível.
- Compras parceladas com distribuição automática entre as faturas futuras.

### 3. Recorrências & Orçamento
- Despesas e receitas fixas com periodicidade customizada (mensal, bimestral, anual).
- Verificação automática entre "Já Lançado" e "Previsto".
- Lançamento rápido de despesas recorrentes com um clique.

### 4. Investimentos & Carteira de Ativos
- Classes de ativos: Renda Fixa (CDB, LC, LCI, LCA), Tesouro Direto, Ações, FIIs, Criptomoedas e Fundos.
- Movimentações de aporte, resgate, rendimento e atualização de cotação.
- Cálculo automático de preço médio ponderado e rentabilidade total acumulada.
- Gráfico de alocação patrimonial por classe.

### 5. Social & Divisão de Contas
- Cadastro de contatos e controle de devedores ("Quem deve para você").
- Empréstimos concedidos com débito atômico na conta de origem e controle de saldo devedor.
- Divisão de despesas coletivas com cotas proporcionais ou igualitárias.
- Quitações parciais, integrais ou perdão de dívidas.

### 6. Cobranças PIX (EMVCo / BR Code)
- Cadastro de chaves PIX (CPF, CNPJ, E-mail, Telefone, Chave Aleatória).
- Geração local de QR Code e código Copia-e-Cola em conformidade com o padrão oficial do Banco Central do Brasil.
- Baixa automatizada de empréstimos após liquidação via PIX.

### 7. Simuladores Financeiros
- **Simulador de Juros Compostos**: Aportes mensais, prazo e comparação com benchmarks (Poupança, CDI, 120% CDI, IPCA+).
- **Simulador de Gastos Futuros**: Previsão de impacto de compras à vista ou parceladas no saldo e no limite dos cartões.
- **Calculadora de Ganho Cambial**: Apuração de variações de compra e venda de moeda estrangeira baseada na PTAX oficial do BACEN.

### 8. Lista de Desejos
- Itens de consumo planejados com link, estimativa de valor, nível de prioridade e histórico de preços.
- Conversão direta de item desejado em despesa realizada quando adquirido.

### 9. Relatórios & Exportação
- Exportação em CSV universal com delimitador `;` e UTF-8 BOM para abertura perfeita no Microsoft Excel brasileiro.
- Relatórios impressos otimizados via CSS `@media print`.

---

## 🛠️ Como Executar com Docker Compose (Recomendado)

O projeto está totalmente configurado para execução conteinerizada através do Docker Compose, incluindo banco de dados PostgreSQL 16 e aplicação compilada em contêiner multi-stage.

### 1. Clonar o repositório e configurar variáveis
```bash
git clone <URL_DO_REPOSITORIO>
cd "projeto financeiro"
cp .env.example .env
```

### 2. Iniciar a aplicação
```bash
docker compose up -d --build
```

O contêiner executa automaticamente:
1. Verificação de saúde do banco de dados PostgreSQL.
2. Execução das migrações (`0001` até `0011_multiusuario_e_isolamento.sql`).
3. Execução do seed de inicialização com a conta de demonstração do Administrador.

Acesse o sistema em seu navegador:
👉 **http://localhost:3001**

---

## 💻 Desenvolvimento Local

Caso deseje executar os serviços individualmente fora do Docker:

### Pré-requisitos
- Node.js 20+
- PostgreSQL 16 rodando localmente

### 1. Configurar Banco de Dados
Crie um banco de dados chamado `financeiro` no PostgreSQL local e configure a variável `DATABASE_URL` no arquivo `backend/.env`.

### 2. Backend
```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```
Servidor backend inicializado em: `http://localhost:3001`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Interface frontend inicializada em: `http://localhost:5173`

---

## 🛡️ Rotinas de Backup em Produção (VPS)

Para programar backups periódicos do banco de dados na VPS hospedeira via crontab:

```bash
# Adicionar no crontab da VPS (execução diária às 03:00)
0 3 * * * /caminho/do/projeto/scripts/backup.sh >> /var/log/backup_financeiro.log 2>&1
```

O script comprime o banco em `.sql.gz` e mantém automaticamente a retenção configurada (padrão de 7 dias).

---

## 📄 Licença

Este projeto é disponibilizado para uso pessoal e auto-hospedagem com foco em privacidade e integridade financeira.
