# CakeFlow - Sistema de Gestão para Confeitaria

CakeFlow é uma aplicação completa de gestão para negócios de confeitaria, construída com Next.js, Supabase e Clerk. O sistema oferece funcionalidades de POS, gestão de inventário, controle de produção e relatórios.

## 🚀 Funcionalidades

### ✅ Implementado
- **Autenticação**: Sistema de login com Clerk
- **Dashboard**: Visão geral do negócio com estatísticas
- **POS (Ponto de Venda)**: Interface para vendas com carrinho
- **Gestão de Produtos**: CRUD de produtos finais
- **Gestão de Ingredientes**: Controle de matéria-prima
- **Banco de Dados**: Schema completo no Supabase
- **Controle de Acesso**: Roles baseados (admin, kasir, staf_dapur)

### 🔄 Em Desenvolvimento
- Gestão de Receitas
- Controle de Produção
- Relatórios Avançados
- Gestão de Pedidos de Compra

## 🛠️ Instalação e Configuração

### 1. Pré-requisitos
- Node.js 18+
- Conta no Supabase
- Conta no Clerk

### 2. Clone e Instale
```bash
git clone <repository-url>
cd cakeflow
npm install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI (Opcional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Configure o Banco de Dados

#### Opção A: Usando Supabase CLI (Recomendado)
```bash
# Instalar Supabase CLI se não tiver
npm install -g supabase

# Login no Supabase
supabase login

# Link para seu projeto
supabase link --project-ref your-project-ref

# Executar migrations
supabase db push
```

#### Opção B: SQL Manual
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para SQL Editor
3. Execute o conteúdo do arquivo `supabase/cakeflow_setup.sql`
4. Execute o conteúdo do arquivo `supabase/cakeflow_functions.sql`

### 5. Configure Roles de Usuário

No Clerk Dashboard:
1. Vá para Users
2. Para cada usuário, adicione metadata:
   ```json
   {
     "role": "admin" | "kasir" | "staf_dapur"
   }
   ```

### 6. Execute a Aplicação
```bash
npm run dev
```

Acesse http://localhost:3000

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### `profiles`
- Extensão da tabela auth.users do Clerk
- Campos: id, full_name, role

#### `ingredients`
- Matéria-prima
- Campos: name, current_stock, unit, low_stock_threshold, average_cost

#### `products`
- Produtos finais (bolos, doces)
- Campos: name, price, current_stock, low_stock_threshold, image_url

#### `recipes`
- Receitas de produção
- Relacionamento: product_id (1:1 com products)

#### `recipe_items`
- Ingredientes necessários para cada receita
- Relacionamento: recipe_id, ingredient_id

#### `orders`
- Pedidos de venda (POS)
- Campos: customer_name, total_amount, payment_method, status

#### `order_items`
- Itens de cada pedido
- Relacionamento: order_id, product_id

#### `production_logs`
- Registros de produção
- Campos: recipe_id, quantity_produced, production_cost

#### `purchase_orders`
- Pedidos de compra de fornecedores
- Campos: supplier_name, total_cost, status

## 🔐 Controle de Acesso (RLS)

### Roles do Sistema
- **admin**: Acesso completo a todas as funcionalidades
- **kasir**: Pode criar pedidos, ver produtos
- **staf_dapur**: Pode registrar produção, ver receitas

### Políticas RLS
Cada tabela tem políticas específicas baseadas no role do usuário.

## 🎯 Como Usar

### 1. Dashboard
- Visão geral com estatísticas diárias
- Alertas de estoque baixo
- Atividades recentes

### 2. POS (Ponto de Venda)
- Selecione produtos para adicionar ao carrinho
- Configure quantidade e método de pagamento
- Finalize o pedido

### 3. Gestão de Produtos
- Adicione/edit produtos finais
- Configure preços e controle de estoque

### 4. Gestão de Ingredientes
- Controle de matéria-prima
- Alertas de estoque baixo
- Custos médios

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
src/
├── app/
│   ├── dashboard/
│   │   └── cakeflow/          # Páginas do CakeFlow
│   │       ├── layout.tsx     # Layout específico
│   │       ├── page.tsx       # Dashboard principal
│   │       └── pos/           # Sistema POS
│   └── page.tsx               # Landing page
├── components/                # Componentes reutilizáveis
├── lib/
│   ├── cakeflow-database.ts   # Funções específicas do negócio
│   ├── database.ts           # Funções genéricas (legacy)
│   └── supabase.ts           # Configuração Supabase
supabase/
├── cakeflow_setup.sql        # Schema inicial
├── cakeflow_functions.sql    # Funções RPC
└── migrations/               # Migrations do Supabase
```

### Scripts Disponíveis
```bash
npm run dev      # Desenvolvimento
npm run build    # Build para produção
npm run start    # Servidor de produção
npm run lint     # Verificação de código
```

## 📈 Próximos Passos

### Funcionalidades Planejadas
- [ ] Sistema completo de receitas
- [ ] Controle avançado de produção
- [ ] Relatórios de vendas e lucros
- [ ] Gestão de fornecedores
- [ ] Controle de validade de produtos
- [ ] Integração com sistemas de pagamento
- [ ] App mobile para funcionários

### Melhorias Técnicas
- [ ] Testes automatizados
- [ ] Cache e otimização de performance
- [ ] Backup automático
- [ ] Logs detalhados de auditoria

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para detalhes.

## 📞 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato com a equipe de desenvolvimento.

---

**CakeFlow** - Transformando a gestão de confeitarias com tecnologia moderna! 🎂✨
