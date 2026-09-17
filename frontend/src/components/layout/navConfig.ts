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
  customLabel?: string;
  icon: LucideIcon;
  categoria: string;
  visible?: boolean;
}

export const DEFAULT_NAV_ITEMS: NavItemConfig[] = [
  // Principal
  { to: '/', label: 'Visão Geral', icon: LayoutDashboard, categoria: 'Principal', visible: true },
  { to: '/lancamentos', label: 'Lançamentos', icon: ArrowLeftRight, categoria: 'Principal', visible: true },
  { to: '/cartoes', label: 'Cartões & Faturas', icon: CreditCard, categoria: 'Principal', visible: true },
  { to: '/recorrencias', label: 'Recorrências', icon: RefreshCw, categoria: 'Principal', visible: true },
  
  // Planejamento
  { to: '/desejos', label: 'Lista de Desejos', icon: Heart, categoria: 'Planejamento', visible: true },
  { to: '/simulador', label: 'Simulador Juros', icon: Calculator, categoria: 'Planejamento', visible: true },
  { to: '/simulador-gastos', label: 'Simulador de Gastos', icon: ShoppingCart, categoria: 'Planejamento', visible: true },
  
  // Investimentos & Câmbio
  { to: '/investimentos', label: 'Investimentos', icon: TrendingUp, categoria: 'Investimentos & Câmbio', visible: true },
  { to: '/cambio', label: 'Câmbio & Cotações', icon: DollarSign, categoria: 'Investimentos & Câmbio', visible: true },
  
  // Social & PIX
  { to: '/social', label: 'Social & Devedores', icon: Users, categoria: 'Social & PIX', visible: true },
  { to: '/pix', label: 'Cobranças PIX', icon: QrCode, categoria: 'Social & PIX', visible: true },
  
  // Análises & Relatórios
  { to: '/relatorios', label: 'Relatórios & Dashboards', icon: FileSpreadsheet, categoria: 'Análises & Relatórios', visible: true },
  
  // Cadastros & Sistema
  { to: '/contas', label: 'Contas & Bancos', icon: Landmark, categoria: 'Cadastros & Sistema', visible: true },
  { to: '/categorias', label: 'Categorias', icon: Tags, categoria: 'Cadastros & Sistema', visible: true },
  { to: '/configuracoes', label: 'Backup & Sistema', icon: Settings, categoria: 'Cadastros & Sistema', visible: true },
];

const STORAGE_KEY = 'finan_nav_custom_config_v2';
const LEGACY_STORAGE_KEY = 'finan_nav_order';

interface SavedItemState {
  to: string;
  customLabel?: string;
  visible?: boolean;
}

export function getAllNavItemsForConfig(): NavItemConfig[] {
  const itemMap = new Map<string, NavItemConfig>();
  DEFAULT_NAV_ITEMS.forEach(i => itemMap.set(i.to, { ...i, visible: true }));

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: SavedItemState[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const result: NavItemConfig[] = [];
        parsed.forEach(savedItem => {
          const original = itemMap.get(savedItem.to);
          if (original) {
            result.push({
              ...original,
              customLabel: savedItem.customLabel?.trim() || undefined,
              visible: savedItem.visible !== false,
            });
            itemMap.delete(savedItem.to);
          }
        });
        itemMap.forEach(item => result.push(item));
        return result;
      }
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsedLegacy: string[] = JSON.parse(legacy);
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        const result: NavItemConfig[] = [];
        parsedLegacy.forEach(to => {
          const original = itemMap.get(to);
          if (original) {
            result.push(original);
            itemMap.delete(to);
          }
        });
        itemMap.forEach(item => result.push(item));
        return result;
      }
    }
  } catch (e) {
    console.error('Erro ao ler configuração do menu', e);
  }

  return DEFAULT_NAV_ITEMS.map(i => ({ ...i }));
}

export function getOrderedNavItems(onlyVisible = true): NavItemConfig[] {
  const all = getAllNavItemsForConfig();
  if (!onlyVisible) return all;
  return all.filter(i => i.visible !== false);
}

export function saveNavCustomConfig(items: NavItemConfig[]): void {
  const payload: SavedItemState[] = items.map(i => ({
    to: i.to,
    customLabel: i.customLabel?.trim() || undefined,
    visible: i.visible !== false,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event('finan_nav_order_changed'));
}

export function resetNavCustomConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  window.dispatchEvent(new Event('finan_nav_order_changed'));
}

export function groupNavItemsByCategory(items: NavItemConfig[]): Record<string, NavItemConfig[]> {
  const groups: Record<string, NavItemConfig[]> = {};
  items.forEach(item => {
    const cat = item.categoria || 'Geral';
    if (!groups[cat]) {
      groups[cat] = [];
    }
    groups[cat].push(item);
  });
  return groups;
}
