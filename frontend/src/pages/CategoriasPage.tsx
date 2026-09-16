import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Edit2 } from 'lucide-react';
import { api } from '../services/api.js';
import { Categoria } from '../types/index.js';
import { Modal } from '../components/common/Modal.js';

export const CategoriasPage: React.FC = () => {
  const [treeCategorias, setTreeCategorias] = useState<Categoria[]>([]);
  const [flatCategorias, setFlatCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState<'despesa' | 'receita'>('despesa');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'despesa' | 'receita'>('despesa');
  const [cor, setCor] = useState('#3B82F6');
  const [categoriaPaiId, setCategoriaPaiId] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      const res = await api.getCategorias();
      setFlatCategorias(res.flat);
      setTreeCategorias(res.tree);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategorias();
  }, []);

  const handleOpenModal = (cat?: Categoria, parentId?: string) => {
    setFormError(null);
    if (cat) {
      setEditingCategoria(cat);
      setNome(cat.nome);
      setTipo(cat.tipo);
      setCor(cat.cor);
      setCategoriaPaiId(cat.categoria_pai_id || '');
    } else {
      setEditingCategoria(null);
      setNome('');
      setTipo(tipoFiltro);
      setCor(tipoFiltro === 'despesa' ? '#EF4444' : '#10B981');
      setCategoriaPaiId(parentId || '');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nome.trim()) {
      setFormError('Informe o nome da categoria.');
      return;
    }

    try {
      if (editingCategoria) {
        await api.updateCategoria(editingCategoria.id, {
          nome: nome.trim(),
          tipo,
          cor,
          categoria_pai_id: categoriaPaiId || null,
        });
      } else {
        await api.createCategoria({
          nome: nome.trim(),
          tipo,
          cor,
          categoria_pai_id: categoriaPaiId || null,
        });
      }

      setIsModalOpen(false);
      loadCategorias();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao salvar categoria.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir esta categoria? Só é permitido caso não possua lançamentos.')) return;
    try {
      await api.deleteCategoria(id);
      loadCategorias();
    } catch (err: any) {
      alert(err.message || 'Não foi possível excluir.');
    }
  };

  const categoriasFiltradas = treeCategorias.filter(c => c.tipo === tipoFiltro);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Categorias & Subcategorias</h1>
          <p className="text-sm text-slate-400">Classificação para despesas e receitas nos relatórios</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Seletor de Tipo Despesa vs Receita */}
      <div className="flex gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setTipoFiltro('despesa')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
            tipoFiltro === 'despesa'
              ? 'bg-rose-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Despesas
        </button>
        <button
          onClick={() => setTipoFiltro('receita')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
            tipoFiltro === 'receita'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Receitas
        </button>
      </div>

      {/* Lista de Categorias em Árvore */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Carregando categorias...</div>
        ) : categoriasFiltradas.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">Nenhuma categoria encontrada.</div>
        ) : (
          categoriasFiltradas.map((cat) => (
            <div key={cat.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              {/* Categoria Pai */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: cat.cor }}
                  >
                    <Tag size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">{cat.nome}</h3>
                    <span className="text-xs text-slate-400">
                      {cat.subcategorias?.length || 0} subcategorias vinculadas
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenModal(undefined, cat.id)}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-blue-400 hover:bg-slate-800 rounded-lg flex items-center gap-1 transition-colors"
                    title="Adicionar subcategoria"
                  >
                    <Plus size={14} />
                    <span className="hidden sm:inline">Subcategoria</span>
                  </button>
                  <button
                    onClick={() => handleOpenModal(cat)}
                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Lista de Subcategorias */}
              {cat.subcategorias && cat.subcategorias.length > 0 && (
                <div className="bg-slate-950/50 border-t border-slate-800/80 px-4 py-2 divide-y divide-slate-800/40">
                  {cat.subcategorias.map((sub) => (
                    <div key={sub.id} className="py-2.5 pl-6 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub.cor || cat.cor }} />
                        <span className="text-slate-300 font-medium">{sub.nome}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenModal(sub)}
                          className="p-1 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Categoria / Subcategoria */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Categoria *</label>
            <input
              type="text"
              required
              placeholder="Ex: Supermercado, Combustível, Salário..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tipo *</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Vincular a Categoria Principal (Para tornar esta uma subcategoria)
            </label>
            <select
              value={categoriaPaiId}
              onChange={(e) => setCategoriaPaiId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Nenhuma (Esta é uma categoria principal)</option>
              {flatCategorias
                .filter(c => !c.categoria_pai_id && c.tipo === tipo && c.id !== editingCategoria?.id)
                .map((parent) => (
                  <option key={parent.id} value={parent.id}>{parent.nome}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Cor</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400">{cor}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30"
            >
              {editingCategoria ? 'Salvar Alterações' : 'Criar Categoria'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
