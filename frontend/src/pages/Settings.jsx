import { useState, useEffect } from 'react';
import { categoriesApi, tagsApi } from '../api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const CATEGORY_COLORS = ['#6366f1', '#f59e0b', '#06d6a0', '#ec4899', '#3b82f6', '#f97316', '#a855f7', '#ef4444'];
const CATEGORY_ICONS = ['📁', '💼', '🏠', '📚', '✨', '🎯', '🏋️', '🎮', '🌿', '💡'];
const TAG_COLORS = ['#06d6a0', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#f97316'];

export default function Settings() {
  const toast = useToast();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [newCat, setNewCat] = useState({ name: '', color: '#6366f1', icon: '📁' });
  const [newTag, setNewTag] = useState({ name: '', color: '#06d6a0' });

  useEffect(() => {
    Promise.all([categoriesApi.getAll(), tagsApi.getAll()]).then(([c, t]) => {
      setCategories(c);
      setTags(t);
    });
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

  const createTag = async (e) => {
    e.preventDefault();
    if (!newTag.name.trim()) return;
    try {
      const t = await tagsApi.create(newTag);
      setTags(prev => [...prev, t]);
      setNewTag({ name: '', color: '#06d6a0' });
      toast.success('Tag criada!');
    } catch { toast.error('Erro ao criar tag.'); }
  };

  const deleteTag = async (id) => {
    try {
      await tagsApi.delete(id);
      setTags(prev => prev.filter(t => t.id !== id));
      toast.success('Tag excluída.');
    } catch { toast.error('Erro ao excluir tag.'); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Gerencie categorias, tags e preferências</p>
        </div>
      </div>

      {/* Perfil */}
      <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>👤 Perfil</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="user-avatar" style={{ width: 52, height: 52, fontSize: 20 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{user?.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{user?.email}</div>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📁 Categorias</h2>

        <form onSubmit={createCategory} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 60 }} value={newCat.icon} onChange={e => setNewCat(f => ({ ...f, icon: e.target.value }))}>
            {CATEGORY_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <input className="form-input" style={{ flex: 1, minWidth: 120 }} placeholder="Nome da categoria" value={newCat.name} onChange={e => setNewCat(f => ({ ...f, name: e.target.value }))} />
          <div style={{ display: 'flex', gap: 4 }}>
            {CATEGORY_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setNewCat(f => ({ ...f, color: c }))}
                style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: newCat.color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Criar</button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: 18 }}>{cat.icon}</span>
              <span style={{ flex: 1, fontWeight: 500 }}>{cat.name}</span>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color, display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.task_count} tarefas</span>
              <button className="action-btn danger" onClick={() => deleteCategory(cat.id)}>🗑️</button>
            </div>
          ))}
        </div>
      </section>

      {/* Tags */}
      <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🏷️ Tags</h2>

        <form onSubmit={createTag} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: 1, minWidth: 120 }} placeholder="Nome da tag" value={newTag.name} onChange={e => setNewTag(f => ({ ...f, name: e.target.value }))} />
          <div style={{ display: 'flex', gap: 4 }}>
            {TAG_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setNewTag(f => ({ ...f, color: c }))}
                style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: newTag.color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Criar</button>
        </form>

        <div className="tags-grid">
          {tags.map(tag => (
            <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="badge badge-tag" style={{ color: tag.color, borderColor: tag.color }}>#{tag.name}</span>
              <button className="action-btn danger" style={{ opacity: 1, width: 20, height: 20, fontSize: 12 }} onClick={() => deleteTag(tag.id)}>×</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
