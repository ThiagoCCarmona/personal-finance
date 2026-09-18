import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, User, Key, Trash2, Edit2, CheckCircle2, XCircle, 
  AlertCircle, RefreshCw, Eye, EyeOff, Search 
} from 'lucide-react';
import { api } from '../services/api.js';
import { UsuarioAdmin } from '../types/index.js';
import { useAuth } from '../contexts/AuthContext.js';

export const UsuariosPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Modais
  const [modalNovo, setModalNovo] = useState(false);
  const [modalEditar, setModalEditar] = useState<UsuarioAdmin | null>(null);
  const [modalResetSenha, setModalResetSenha] = useState<UsuarioAdmin | null>(null);

  // Form Novo
  const [novoLogin, setNovoLogin] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novaSenhaInicial, setNovaSenhaInicial] = useState('');
  const [novoRole, setNovoRole] = useState<'admin' | 'usuario'>('usuario');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Form Editar
  const [editNome, setEditNome] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'usuario'>('usuario');
  const [editAtivo, setEditAtivo] = useState(true);

  // Form Reset Senha
  const [senhaTemporaria, setSenhaTemporaria] = useState('');

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await api.createUsuario({
        login: novoLogin.trim(),
        nome: novoNome.trim() || undefined,
        senha_inicial: novaSenhaInicial,
        role: novoRole,
      });
      setSucesso('Usuário criado com sucesso! Ele deverá alterar a senha no primeiro acesso.');
      setModalNovo(false);
      setNovoLogin('');
      setNovoNome('');
      setNovaSenhaInicial('');
      setNovoRole('usuario');
      carregarUsuarios();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuário.');
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditar) return;
    try {
      setError(null);
      await api.updateUsuario(modalEditar.id, {
        nome: editNome.trim() || undefined,
        role: editRole,
        ativo: editAtivo,
      });
      setSucesso('Usuário atualizado com sucesso!');
      setModalEditar(null);
      carregarUsuarios();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar usuário.');
    }
  };

  const handleResetarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalResetSenha) return;
    try {
      setError(null);
      await api.resetarSenhaUsuario(modalResetSenha.id, {
        nova_senha_temporaria: senhaTemporaria,
      });
      setSucesso(`Senha temporária redefinida para ${modalResetSenha.login}! No próximo login, o usuário precisará criar uma nova senha.`);
      setModalResetSenha(null);
      setSenhaTemporaria('');
      carregarUsuarios();
    } catch (err: any) {
      setError(err.message || 'Erro ao resetar senha do usuário.');
    }
  };

  const handleExcluir = async (usuario: UsuarioAdmin) => {
    if (usuario.id === currentUser?.id) {
      alert('Você não pode excluir o seu próprio usuário administrador!');
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir o usuário "${usuario.login}"? Todos os lançamentos, contas e registros vinculados a ele serão permanentemente excluídos.`)) {
      return;
    }
    try {
      setError(null);
      await api.deleteUsuario(usuario.id);
      setSucesso(`Usuário ${usuario.login} excluído.`);
      carregarUsuarios();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir usuário.');
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.login.toLowerCase().includes(busca.toLowerCase()) || 
    (u.nome && u.nome.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="text-emerald-500" />
            <span>Gestão de Usuários</span>
          </h1>
          <p className="text-sm text-slate-400">
            Painel administrativo de controle de acesso, criação de contas e isolamento estrito
          </p>
        </div>

        <button
          onClick={() => { setModalNovo(true); setError(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <UserPlus size={17} />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {sucesso && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{sucesso}</span>
        </div>
      )}

      {/* Barra de Busca e Filtro */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl">
        <Search size={18} className="text-slate-500" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por login ou nome de exibição..."
          className="bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-500 w-full"
        />
        <button
          onClick={carregarUsuarios}
          title="Recarregar lista"
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase font-semibold">
                <th className="py-3 px-4">Usuário / Nome</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">1º Acesso</th>
                <th className="py-3 px-4">Cadastrado em</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Carregando usuários...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100 flex items-center gap-2">
                        <span>{u.nome || u.login}</span>
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">@{u.login}</div>
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30">
                          <Shield size={12} />
                          Administrador
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                          <User size={12} />
                          Usuário
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.ativo ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <CheckCircle2 size={14} />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
                          <XCircle size={14} />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.precisa_trocar_senha ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                          Pendente troca
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Senha configurada
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setModalResetSenha(u);
                            setSenhaTemporaria('');
                          }}
                          title="Redefinir Senha Provisória"
                          className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setModalEditar(u);
                            setEditNome(u.nome || '');
                            setEditRole(u.role);
                            setEditAtivo(u.ativo);
                          }}
                          title="Editar Usuário"
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleExcluir(u)}
                            title="Excluir Usuário"
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Novo Usuário */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="text-emerald-400" size={20} />
                Cadastrar Novo Usuário
              </h2>
              <button
                onClick={() => setModalNovo(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Login / Usuário *
                </label>
                <input
                  type="text"
                  required
                  value={novoLogin}
                  onChange={(e) => setNovoLogin(e.target.value)}
                  placeholder="Ex: joao.silva"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nome de Visualização
                </label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Senha Inicial Provisória * (mín. 6 caracteres)
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={novaSenhaInicial}
                    onChange={(e) => setNovaSenhaInicial(e.target.value)}
                    placeholder="Defina uma senha provisória"
                    className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  O usuário será forçado a alterar esta senha no seu primeiro login.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Perfil de Acesso
                </label>
                <select
                  value={novoRole}
                  onChange={(e) => setNovoRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="usuario">Usuário Padrão</option>
                  <option value="admin">Administrador do Sistema</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNovo(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow transition-all"
                >
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Usuário */}
      {modalEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="text-blue-400" size={18} />
                Editar Usuário ({modalEditar.login})
              </h2>
              <button
                onClick={() => setModalEditar(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nome de Visualização
                </label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Nome do usuário"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Perfil
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="usuario">Usuário Padrão</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkAtivo"
                  checked={editAtivo}
                  onChange={(e) => setEditAtivo(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="chkAtivo" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Usuário Ativo (pode fazer login)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalEditar(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Resetar Senha Temporária */}
      {modalResetSenha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Key className="text-amber-400" size={18} />
                Resetar Senha de {modalResetSenha.login}
              </h2>
              <button
                onClick={() => setModalResetSenha(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetarSenha} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Ao redefinir a senha temporária, o usuário será obrigado a criar uma nova senha pessoal assim que efetuar o próximo login.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nova Senha Temporária * (mín. 6 caracteres)
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={senhaTemporaria}
                  onChange={(e) => setSenhaTemporaria(e.target.value)}
                  placeholder="Ex: Temp123@"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalResetSenha(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl shadow transition-all"
                >
                  Redefinir e Forçar Troca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
