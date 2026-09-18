# 💎 Sistema de Gestão Financeira Pessoal & Empresarial (Multiusuário & Self-Hosted)

Um sistema completo, robusto e moderno de gestão financeira pessoal e empresarial, com arquitetura **Multiusuário** com isolamento rigoroso de dados em nível de linha (Row-Level Isolation), instalável como **PWA (Progressive Web App)** e preparado para implantação em VPS própria via Docker.

---

## 🌟 Principais Recursos e Funcionalidades

### 1. 👥 Gestão de Usuários & Segurança Corporativa
- **Painel Administrativo com CRUD Completo de Usuários**: Apenas o Administrador possui permissão para cadastrar novos usuários no sistema.
- **Troca de Senha Obrigatória no Primeiro Acesso**: Tanto novos usuários cadastrados quanto o administrador devem redefinir sua senha com hash `bcrypt` no primeiro login.
- **Nome de Exibição Personalizado**: Cada usuário escolhe como deseja ser chamado nas telas, relatórios e saudações do sistema.
- **Sessão Segura com Cookies HttpOnly**: Autenticação com cookies `SameSite` e proteção contra roubo de tokens XSS.
- **Timeout de Inatividade Configurável**: Logout automático programável por usuário para proteção em dispositivos compartilhados.
- **Modo Privacidade por Padrão**: Valores e saldos monetários iniciam ocultados (`••••••`) e podem ser revelados com um clique.

### 2. 🎪 Vitrine / Demonstração com Auto-Reset (`teste`)
- **Showcase Interativo**: Usuário demonstrativo `teste` (login: `teste`, senha: `teste123`) com ambiente totalmente preenchido:
  - Múltiplas contas bancárias, cartões com faturas abertas e parcelas futuras.
  - Receitas e despesas recorrentes ativas.
  - Carteira de investimentos diversificada (Renda Fixa, Ações, FIIs, Criptomoedas).
  - Itens na Lista de Desejos com histórico de evolução de preços.
  - Módulo Social com contatos e contas a receber.
- **Auto-Reset Periódico (15 a 30 minutos)**: Um serviço inteligente em background (`DemoShowcaseService`) reestabelece automaticamente os dados simulados da vitrine a cada 20 minutos, garantindo que alterações feitas por visitantes não persistam.

### 3. 💳 Cartões de Crédito, Ciclo Dinâmico & "Pagar Fatura"
- **Ciclo Inteligente de Fechamento e Vencimento**: Cálculo automático da fatura em aberto com base no dia de fechamento e dia de vencimento do cartão.
- **Avanço Automático de Competência**: Faturas que já venceram (ex: dia 17) ou que foram quitadas avançam automaticamente para a fatura do próximo ciclo (`determinarFaturaAtual`).
- **Botão "Pagar Fatura"**: Modal dedicado que permite:
  - Debitar o valor da fatura diretamente de uma das contas bancárias cadastradas do usuário.
  - Ou registrar o pagamento da fatura sem debitar de conta.
- **Tabela de Quitações (`fatura_paga`)**: Faturas pagas são registradas no banco e deixam de onerar os alertas de contas a pagar e os saldos futuros.

### 4. 📊 Dashboard Inteligente, Projeção Futura & Regra 50-30-20
- **Metodologia 50-30-20 com Barras Decrescentes**:
  - Divisão automática com base na receita fixa do usuário:
    - **50% Gastos Essenciais**: Moradia, Alimentação Básica, Contas de Consumo, Saúde e Transporte.
    - **30% Estilo de Vida & Lazer**: Restaurantes, Passeios, Assinaturas, Compras Pessoais e Viagens.
    - **20% Metas & Investimentos**: Reserva de Emergência, Aportes em Renda Fixa/Variável e Dívidas.
  - **Barras Decrescentes em Tempo Real**: Conforme as despesas são lançadas, a barra de progresso encolhe mostrando exatamente o saldo disponível restante para gastar no mês, com alertas visuais de atenção (< 20%) e status de orçamento estourado.
- **Saldo Consolidado Disponível**: Somatório em tempo real de todas as contas correntes, poupanças, carteiras digitais e espécie.
- **Saldo Projetado do Próximo Mês**: Cálculo preditivo que antecipa a sobra financeira do próximo ciclo considerando recorrências e faturas abertas:
  $$\text{Saldo Projetado} = \text{Saldo Atual} + \text{Receitas Recorrentes Fixas} - \text{Faturas Abertas Vigentes} - \text{Despesas Fixas em Conta}$$
- **Contas a Pagar do Mês**: Visualização unificada de faturas abertas e despesas fixas com status em tempo real (**✓ Fatura Paga** vs **Fatura Aberta**, e **Lançado** vs **Pendente**).
- **Sem Duplicações**: Contabilização estrita — compras no cartão entram exclusivamente pela competência da fatura, e despesas em conta entram pela data de compra (ignorando lançamentos automáticos de pagamento de fatura).

### 5. 🔄 Recorrências Estruturadas (Fixas vs Variáveis) & Modal Interativo
- **Classificação por Natureza**:
  - **Fixo**: Despesas ou receitas contratuais com valor constante (aluguel, internet, condomínio, salário fixo).
  - **Variável**: Gastos ou receitas periódicas com valores flutuantes ou ocasionais (energia elétrica, água, comissões, freelance).
- **Valor Médio Estimado**: Para itens variáveis, o usuário cadastra uma estimativa média de planejamento.
- **Confirmação Inteligente de Lançamento**: Ao efetivar a recorrência no mês (via Dashboard ou tela de Recorrências), um modal interativo pergunta se o valor real daquele mês foi o **mesmo**, **menor** ou **maior**, permitindo digitar o valor exato antes de criar o lançamento.

### 6. 🏷️ Categorias & Subcategorias Estruturadas na Educação Financeira
- **Taxonomia Moderna**: Categorias base e subcategorias já pré-configuradas e vinculadas aos grupos da metodologia 50-30-20.
- **Personalização Total**: Criação de novas categorias principais e subcategorias vinculadas à categoria pai com herança de grupo e cores customizadas.
- **Badges Visuais**: Identificação imediata do macro-grupo de gastos na listagem de categorias e relatórios.

### 7. 🧮 Simulador de Gastos Avançado
- **À Vista vs Cartão Parcelado**: Análise de impacto imediato no saldo bancário ou no limite de crédito do cartão.
- **Cálculo de Juros nas Parcelas**: Suporte a opções com juros mensais configuráveis via:
  - **Tabela Price (Amortização Francesa)**: Parcelas fixas com juros compostos.
  - **Juros Simples**: Cálculo linear com distribuição uniforme.
- **Projeção Multimensal de Faturas**: Simulação de como as parcelas adicionais impactarão os próximos 3, 6, 10 ou 12 meses de fatura do cartão.
- **Projeção de Saldo do Próximo Mês**: Demonstração exata de como a compra alterará a reserva prevista no mês seguinte.

### 8. 📅 Formato de Data Padronizado (`dd/mm/yyyy`)
- Todas as telas do sistema (Novo Lançamento, Wishlist, Social, Contas a Receber, Relatórios e Filtros) utilizam o componente `DateInput` com máscara brasileira `DD/MM/YYYY` e ícone de calendário com seletor interativo.

### 9. 🎁 Lista de Desejos (Wishlist) com Histórico de Preços
- Cadastro de itens desejados com nível de prioridade (Baixa, Média, Alta, Urgente).
- Múltiplos links de lojas para comparação de preços.
- **Histórico de Variação de Preços**: Registro cronológico de cotações para rastrear promoções reais e saber o melhor momento de compra.
- **Conversão em Lançamento**: Transformação direta do item comprado em despesa efetiva na conta ou cartão com 1 clique.

### 10. 🤝 Módulo Social, Devedores & Cobranças PIX
- Cadastro de pessoas e histórico de contatos.
- **Divisão de Despesas Coletivas ("Rachar a Conta")**: Rateio automático de viagens, churrascos e eventos.
- **Controle de Empréstimos**: Gestão de saldos devedores com quitação atômica (parcial, total ou perdão de dívida).
- **Gerador de QR Code PIX (Padrão BACEN / EMVCo)**: Geração de QR Code e código Copia-e-Cola diretamente no navegador, permitindo selecionar a chave PIX recebedora e valor exato sem intermediários bancários ou taxas.

### 11. 📈 Carteira de Ativos & Investimentos
- Suporte a Renda Fixa (CDB, LCI, LCA, LC), Tesouro Direto, Ações (B3), Fundos Imobiliários (FIIs) e Criptomoedas.
- Movimentações de Aporte, Resgate e Rendimentos.
- Cálculo automático de **Preço Médio Ponderado**, quantidade em carteira e rentabilidade total.

### 12. 📑 Relatórios Analíticos, Exportação CSV e Impressão A4
- **Exportação CSV Formatada para Excel**: Download direto de lançamentos filtrados e balanço patrimonial completo com delimitador `;` e cabeçalho UTF-8 com BOM.
- **Impressão Profissional em Folha A4**: Estilização CSS `@media print` dedicada que oculta menus, sidebars e botões, formatando o relatório em papel timbrado com cores nítidas e tabelas sem cortes.

### 13. 💱 Câmbio e Conversor Multimoedas
- Integração com a **AwesomeAPI** e **Banco Central (PTAX)** com sincronização periódica de cotações.
- Suporte a Real (BRL), Dólar Americano (USD), Euro (EUR), Bitcoin (BTC) e Yuan Chinês (CNY).

### 14. 🌐 Landing Page de Alta Conversão Integrada
- Página de apresentação e vendas moderna com animação 3D interativa (Three.js), vitrine de recursos, tabela de planos, comparativo e FAQ.

### 15. 📱 PWA (Progressive Web App) Mobile-First
- Instalável via navegador no Android, iOS, Windows e Mac.
- Interface ultra fluida e responsiva com Tailwind CSS e navegação por abas otimizada para toque.

---

## 🚀 Credenciais de Acesso Rápido

| Perfil | Login | Senha Inicial | Descrição |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin` | `admin123` | Acesso total ao sistema e tela de CRUD de usuários |
| **Vitrine / Showcase** | `teste` | `teste123` | Demonstração com auto-reset a cada 20 minutos |

---

## 🛠️ Instalação e Deploy via Docker Compose

### 1. Clonar o Repositório
```bash
git clone https://github.com/ThiagoCCarmona/personal-finance.git
cd personal-finance
```

### 2. Configurar Variáveis de Ambiente
Copie o `.env.example` para `.env`:
```bash
cp .env.example .env
```

### 3. Subir os Contêineres
```bash
docker compose up -d --build
```
A aplicação estará disponível em: `http://localhost:3001` (ou em seu domínio configurado via reverse proxy).

---

## 💻 Desenvolvimento Local

### Pré-requisitos
- Node.js 20+
- PostgreSQL 16 rodando localmente

### Backend
```bash
cd backend
npm install
npm run build
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run build
npm run dev
```

---

## 🛡️ Backup Automatizado

Para configurar rotinas automáticas de backup diário do banco na VPS via crontab:
```bash
0 3 * * * /home/ubuntu/apps/finan/scripts/backup.sh >> /var/log/backup_finan.log 2>&1
```

---

## 📄 Licença

Este projeto é desenvolvido para gestão patrimonial privada e corporativa, focado em privacidade, velocidade e confiabilidade.
