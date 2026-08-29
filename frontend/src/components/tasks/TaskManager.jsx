import { useState, useEffect } from 'react';
import { tasksApi, categoriesApi, tagsApi } from '../../api';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '../../contexts/ToastContext';

const PRIORITY_LABELS = { high: '🔥 Urgente', medium: '⚡ Média', low: '🌿 Baixa' };
const STATUS_LABELS = { todo: 'A fazer', in_progress: 'Em progresso', done: 'Concluída' };

function SubtaskList({ taskId, items, onToggle }) {
  return (
    <div className="subtask-list">
      {items.map(item => (
        <div key={item.id} className="subtask-item">
          <button
            className={`subtask-checkbox ${item.is_completed ? 'checked' : ''}`}
            onClick={() => onToggle(taskId, item.id)}
          />
          <span className={`subtask-title ${item.is_completed ? 'done' : ''}`}>{item.title}</span>
        </div>
      ))}
    </div>
  );
}

function TaskModal({ task, categories, tags, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    due_date: task?.due_date ? task.due_date.slice(0, 10) : '',
    category_id: task?.category_id || '',
    is_recurring: task?.is_recurring || false,
    recurrence: task?.recurrence || 'daily',
    tags: task?.tags?.map(t => t.id) || [],
    items: task?.items || [],
  });
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleTag = (tagId) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tagId) ? f.tags.filter(t => t !== tagId) : [...f.tags, tagId],
    }));
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setForm(f => ({ ...f, items: [...f.items, { title: newItem.trim(), is_completed: false }] }));
    setNewItem('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Título *</label>
              <input
                className="form-input"
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                placeholder="O que precisa ser feito?"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea
                className="form-textarea"
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                placeholder="Detalhes adicionais..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prioridade</label>
                <div className="priority-grid">
                  {['high', 'medium', 'low'].map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`priority-option ${form.priority === p ? `selected-${p}` : ''}`}
                      onClick={() => setField('priority', p)}
                    >
                      {p === 'high' ? '🔥 Urgente' : p === 'medium' ? '⚡ Média' : '🌿 Baixa'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}>
                  <option value="todo">A fazer</option>
                  <option value="in_progress">Em progresso</option>
                  <option value="done">Concluída</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Data limite</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.due_date}
                  onChange={e => setField('due_date', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select className="form-select" value={form.category_id} onChange={e => setField('category_id', e.target.value)}>
                  <option value="">Sem categoria</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="form-group">
                <label className="form-label">Tags</label>
                <div className="tags-grid">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      className={`tag-option ${form.tags.includes(tag.id) ? 'selected' : ''}`}
                      style={{ color: tag.color }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.is_recurring}
                  onChange={e => setField('is_recurring', e.target.checked)}
                />
                🔁 Tarefa recorrente (diariamente)
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Subtarefas</label>
              {form.items.map((item, i) => (
                <div key={i} className="subtask-item">
                  <span className="subtask-checkbox" />
                  <span className="subtask-title">{item.title}</span>
                  <button
                    type="button"
                    className="action-btn danger"
                    onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}
                  >×</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input
                  className="form-input"
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  placeholder="Adicionar subtarefa..."
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+</button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : task ? 'Salvar alterações' : 'Criar tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TaskCard({ task, categories, tags, onToggle, onEdit, onDelete, onToggleItem }) {
  const isOverdue = task.due_date && isPast(new Date(task.due_date + 'T23:59:59')) && task.status !== 'done';
  const isDueToday = task.due_date && isToday(new Date(task.due_date));
  const priorityColor = { high: 'var(--priority-high)', medium: 'var(--priority-medium)', low: 'var(--priority-low)' };
  const progress = task.items_total > 0 ? Math.round((task.items_done / task.items_total) * 100) : null;

  return (
    <div
      className={`task-card ${task.status === 'done' ? 'done' : ''}`}
      style={{ '--priority-color': priorityColor[task.priority] }}
    >
      <button
        className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
        onClick={() => onToggle(task.id)}
      />

      <div className="task-body">
        <div className="task-title">{task.title}</div>
        {task.description && <div className="task-description">{task.description}</div>}

        <div className="task-meta">
          <span className={`badge badge-priority-${task.priority}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>

          {task.category_name && (
            <span className="badge badge-category" style={{ backgroundColor: task.category_color + '22', color: task.category_color }}>
              {task.category_icon} {task.category_name}
            </span>
          )}

          {task.tags?.map(tag => (
            <span key={tag.id} className="badge badge-tag" style={{ color: tag.color }}>
              #{tag.name}
            </span>
          ))}

          {task.due_date && (
            <span className={`badge badge-due ${isOverdue ? 'overdue' : ''}`}>
              📅 {isOverdue ? '⚠️ ' : ''}{format(new Date(task.due_date + 'T12:00:00'), "d 'de' MMM", { locale: ptBR })}
            </span>
          )}

          {task.is_recurring ? <span className="badge badge-tag">🔁 Diária</span> : null}
        </div>

        {progress !== null && (
          <div className="subtask-progress">
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-text">{task.items_done}/{task.items_total}</span>
          </div>
        )}

        {task.items?.length > 0 && (
          <SubtaskList taskId={task.id} items={task.items} onToggle={onToggleItem} />
        )}
      </div>

      <div className="task-actions">
        <button className="action-btn" title="Editar" onClick={() => onEdit(task)}>✏️</button>
        <button className="action-btn danger" title="Excluir" onClick={() => onDelete(task.id)}>🗑️</button>
      </div>
    </div>
  );
}

export default function TaskManager({ showAll = false }) {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', category_id: '', search: '' });

  const loadAll = async () => {
    try {
      const [t, c, tg] = await Promise.all([
        tasksApi.getAll({ ...filters }),
        categoriesApi.getAll(),
        tagsApi.getAll(),
      ]);
      setTasks(t);
      setCategories(c);
      setTags(tg);
    } catch {
      toast.error('Erro ao carregar tarefas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [filters]);

  const handleSave = async (formData) => {
    try {
      if (editingTask) {
        await tasksApi.update(editingTask.id, formData);
        toast.success('Tarefa atualizada! ✅');
      } else {
        await tasksApi.create(formData);
        toast.success('Tarefa criada! 🎉');
      }
      loadAll();
    } catch {
      toast.error('Erro ao salvar tarefa.');
      throw new Error('save failed');
    }
  };

  const handleToggle = async (id) => {
    try {
      await tasksApi.complete(id);
      setTasks(prev => prev.map(t =>
        t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t
      ));
    } catch { toast.error('Erro ao atualizar tarefa.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta tarefa?')) return;
    try {
      await tasksApi.delete(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Tarefa excluída.');
    } catch { toast.error('Erro ao excluir.'); }
  };

  const handleToggleItem = async (taskId, itemId) => {
    try {
      await tasksApi.toggleItem(taskId, itemId);
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              items: t.items.map(i => i.id === itemId ? { ...i, is_completed: !i.is_completed } : i),
              items_done: t.items.filter(i => i.is_completed).length + (t.items.find(i => i.id === itemId)?.is_completed ? -1 : 1),
            }
          : t
      ));
    } catch { toast.error('Erro ao atualizar subtarefa.'); }
  };

  const openNew = () => { setEditingTask(null); setShowModal(true); };
  const openEdit = (task) => { setEditingTask(task); setShowModal(true); };

  const displayedTasks = showAll ? tasks : tasks.slice(0, 5);

  return (
    <>
      {showAll && (
        <div className="filter-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="form-input"
              placeholder="Buscar tarefa..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>

          {['', 'todo', 'in_progress', 'done'].map(s => (
            <button
              key={s}
              className={`filter-chip ${filters.status === s ? 'active' : ''}`}
              onClick={() => setFilters(f => ({ ...f, status: s }))}
            >
              {s === '' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}

          {['', 'high', 'medium', 'low'].map(p => (
            <button
              key={p}
              className={`filter-chip ${filters.priority === p ? 'active' : ''}`}
              onClick={() => setFilters(f => ({ ...f, priority: p }))}
            >
              {p === '' ? 'Qualquer prioridade' : PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      )}

      <div className="task-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Carregando...</div>
        ) : displayedTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">Nenhuma tarefa encontrada</div>
            <div className="empty-state-desc">Crie sua primeira tarefa e comece a organizar!</div>
            <button className="btn btn-primary" onClick={openNew}>+ Nova tarefa</button>
          </div>
        ) : (
          displayedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              categories={categories}
              tags={tags}
              onToggle={handleToggle}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleItem={handleToggleItem}
            />
          ))
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Nova tarefa</button>
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          categories={categories}
          tags={tags}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
