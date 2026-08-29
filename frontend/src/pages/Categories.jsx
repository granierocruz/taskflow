import { useState, useEffect } from 'react';
import { categoriesApi } from '../api';
import { useToast } from '../contexts/ToastContext';

const CATEGORY_COLORS = ['#6366f1', '#f59e0b', '#06d6a0', '#ec4899', '#3b82f6', '#f97316', '#a855f7', '#ef4444'];
const CATEGORY_ICONS = ['📁', '💼', '🏠', '📚', '✨', '🎯', '🏋️', '🎮', '🌿', '💡'];

export default function Categories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState({ name: '', color: '#6366f1', icon: '📁' });

  useEffect(() => {
    categoriesApi.getAll()
      .then(setCategories)
      .catch(() => toast.error('Erro ao carregar categorias.'))
      .finally(() => setLoading(false));
  }, []);

  const createCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    try {
      const c = await categoriesApi.create(newCat);
      setCategories(prev => [...prev, c]);
      setNewCat({ name: '', color: '#6366f1', icon: '📁' });
      toast.success('Categoria criada!');
    } catch { toast.error('Erro ao criar categoria.'); }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Excluir categoria? As tarefas ficarão sem categoria.')) return;
    try {
      await categoriesApi.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Categoria excluída.');
    } catch { toast.error('Erro ao excluir categoria.'); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categorias</h1>
          <p className="page-subtitle">Organize suas tarefas por categorias</p>
        </div>
      </div>

      <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>➕ Nova Categoria</h2>

        <form onSubmit={createCategory} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-select" style={{ width: 60 }} value={newCat.icon} onChange={e => setNewCat(f => ({ ...f, icon: e.target.value }))}>
            {CATEGORY_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <input className="form-input" style={{ flex: 1, minWidth: 120 }} placeholder="Nome da categoria" value={newCat.name} onChange={e => setNewCat(f => ({ ...f, name: e.target.value }))} />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {CATEGORY_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setNewCat(f => ({ ...f, color: c }))}
                style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: newCat.color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Criar</button>
        </form>
      </section>

      <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📂 Suas Categorias</h2>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: 20 }}>Carregando...</div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <div className="empty-state-title">Nenhuma categoria</div>
            <div className="empty-state-desc">Crie sua primeira categoria acima.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', transition: 'var(--transition)' }}>
                <span style={{ fontSize: 22 }}>{cat.icon}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{cat.name}</span>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color, display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.task_count ?? 0} tarefas</span>
                <button className="action-btn danger" onClick={() => deleteCategory(cat.id)}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
