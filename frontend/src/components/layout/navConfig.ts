import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  CreditCard, 
  RefreshCw, 
  Heart,
  Users, 
  QrCode, 
  TrendingUp, 
  DollarSign, 
  Calculator, 
  ShoppingCart, 
  FileSpreadsheet, 
  Landmark, 
  Tags, 
  Settings,
  LucideIcon
} from 'lucide-react';

export interface NavItemConfig {
  to: string;
  label: string;
  icon: LucideIcon;
  categoria?: string;
}

export const DEFAULT_NAV_ITEMS: NavItemConfig[] = [
  { to: '/', label: 'Visão Geral', icon: LayoutDashboard, categoria: 'Principal' },
  { to: '/lancamentos', label: 'Lançamentos', icon: ArrowLeftRight, categoria: 'Principal' },
  { to: '/cartoes', label: 'Cartões & Faturas', icon: CreditCard, categoria: 'Principal' },
  { to: '/recorrencias', label: 'Recorrências', icon: RefreshCw, categoria: 'Principal' },
  { to: '/desejos', label: 'Lista de Desejos', icon: Heart, categoria: 'Planejamento' },
  { to: '/social', label: 'Social & Devedores', icon: Users, categoria: 'Social & PIX' },
  { to: '/pix', label: 'Cobranças PIX', icon: QrCode, categoria: 'Social & PIX' },
  { to: '/investimentos', label: 'Investimentos', icon: TrendingUp, categoria: 'Investimentos' },
  { to: '/cambio', label: 'Câmbio & Cotações', icon: DollarSign, categoria: 'Investimentos' },
  { to: '/simulador', label: 'Simulador Juros', icon: Calculator, categoria: 'Planejamento' },
  { to: '/simulador-gastos', label: 'Simulador de Gastos', icon: ShoppingCart, categoria: 'Planejamento' },
  { to: '/relatorios', label: 'Relatórios & Dashboards', icon: FileSpreadsheet, categoria: 'Análises' },
  { to: '/contas', label: 'Contas & Bancos', icon: Landmark, categoria: 'Cadastros' },
  { to: '/categorias', label: 'Categorias', icon: Tags, categoria: 'Cadastros' },
  { to: '/configuracoes', label: 'Backup & Sistema', icon: Settings, categoria: 'Sistema' },
];

const STORAGE_KEY = 'finan_nav_order';

export function getCustomNavOrder(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler ordem do menu', e);
  }
  return DEFAULT_NAV_ITEMS.map(i => i.to);
}

export function saveCustomNavOrder(order: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  window.dispatchEvent(new Event('finan_nav_order_changed'));
}

export function resetCustomNavOrder(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('finan_nav_order_changed'));
}

export function getOrderedNavItems(): NavItemConfig[] {
  const order = getCustomNavOrder();
  const itemMap = new Map<string, NavItemConfig>();
  DEFAULT_NAV_ITEMS.forEach(i => itemMap.set(i.to, i));

  const result: NavItemConfig[] = [];
  order.forEach(to => {
    const found = itemMap.get(to);
    if (found) {
      result.push(found);
      itemMap.delete(to);
    }
  });
  itemMap.forEach(item => {
    result.push(item);
  });

  return result;
}
