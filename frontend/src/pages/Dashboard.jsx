import { useState, useEffect } from 'react';
import { tasksApi, categoriesApi, tagsApi } from '../api';
import { format, subDays, isPast, isToday, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { TaskCard } from '../components/tasks/TaskManager';

const STATS_CONFIG = [
  { key: 'totalActive',    icon: '🎯', label: 'Tarefas Ativas',     color: 'var(--card-blue)' },
  { key: 'completedToday', icon: '✅', label: 'Concluídas Hoje',    color: 'var(--card-green)' },
  { key: 'urgent',         icon: '🔥', label: 'Urgentes',            color: 'var(--card-red)' },
  { key: 'overdue',        icon: '⚠️', label: 'Atrasadas',          color: 'var(--card-orange)' },
  { key: 'dueToday',       icon: '📅', label: 'Vencem Hoje',         color: 'var(--card-purple)' },
  { key: 'streak',         icon: '🏆', label: 'Dias Consecutivos',   color: 'var(--card-gold)' },
];

function WeekChart({ data }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const key = format(d, 'yyyy-MM-dd');
    const found = data.find(r => r.day === key);
    return {
      day: format(d, 'EEE', { locale: ptBR }),
      count: found?.count || 0,
      isToday: i === 6,
    };
  });

  const max = Math.max(...days.map(d => d.count), 1);
  const totalWeek = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="week-progress-card">
      <div className="week-progress-header">
        <div>
          <div className="week-progress-label">📈 Progresso dos últimos 7 dias</div>
          <div className="week-progress-subtitle">Tarefas concluídas esta semana</div>
        </div>
        <div className="week-progress-total">
          <span className="week-total-number">{totalWeek}</span>
          <span className="week-total-label">concluídas</span>
        </div>
      </div>
      <div className="week-chart">
        {days.map((d, i) => (
          <div key={i} className="week-bar-wrap">
            <div className="week-bar-count">{d.count}</div>
            <div className="week-bar">
              <div
                className={`week-bar-fill ${d.isToday ? 'today' : ''}`}
                style={{ height: `${(d.count / max) * 100}%` }}
              />
            </div>
            <div className="week-day-label">{d.day}</div>
          </div>
        ))}
      </div>
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

function ColumnModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave(name.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 className="modal-title">Nova Coluna (Categoria)</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nome da coluna</label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Trabalho, Pessoal, Estudos..."
                required
                autoFocus
              />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Colunas são baseadas em categorias. Você pode editar cores e ícones em Configurações.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Criando...' : 'Criar coluna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const loadDashboard = async () => {
    try {
      const [statsData, allTasks, cats, tgs] = await Promise.all([
        tasksApi.getStats(),
        tasksApi.getAll({}),
        categoriesApi.getAll(),
        tagsApi.getAll(),
      ]);
      setStats(statsData);
      setCategories(cats);
      setTags(tgs);

      // Filter upcoming tasks (due within 7 days, not done)
      const now = new Date();
      const upcoming = allTasks
        .filter(t => {
          if (t.status === 'done' || !t.due_date) return false;
          const dueDate = new Date(t.due_date + 'T23:59:59');
          const daysUntil = differenceInDays(dueDate, now);
          return daysUntil <= 7;
        })
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 8);

      setUpcomingTasks(upcoming);
    } catch {
      toast.error('Erro ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleSaveTask = async (formData) => {
    try {
      if (editingTask) {
        await tasksApi.update(editingTask.id, formData);
        toast.success('Tarefa atualizada! ✅');
      } else {
        await tasksApi.create(formData);
        toast.success('Tarefa criada! 🎉');
      }
      loadDashboard();
    } catch {
      toast.error('Erro ao salvar tarefa.');
      throw new Error('save failed');
    }
  };

  const handleToggle = async (id) => {
    try {
      await tasksApi.complete(id);
      loadDashboard();
    } catch { toast.error('Erro ao atualizar tarefa.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta tarefa?')) return;
    try {
      await tasksApi.delete(id);
      loadDashboard();
      toast.success('Tarefa excluída.');
    } catch { toast.error('Erro ao excluir.'); }
  };

  const handleToggleItem = async (taskId, itemId) => {
    try {
      await tasksApi.toggleItem(taskId, itemId);
      loadDashboard();
    } catch { toast.error('Erro ao atualizar subtarefa.'); }
  };

  const handleSaveColumn = async (name) => {
    try {
      await categoriesApi.create({ name, color: '#6366f1', icon: '📁' });
      toast.success(`Coluna "${name}" criada! 📂`);
      loadDashboard();
    } catch {
      toast.error('Erro ao criar coluna.');
      throw new Error('save failed');
    }
  };

  const getDueBadge = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate + 'T23:59:59');
    const now = new Date();
    const days = differenceInDays(due, now);

    if (isPast(due) && !isToday(due)) return { text: 'Atrasada', className: 'due-badge overdue' };
    if (isToday(due)) return { text: 'Vence hoje', className: 'due-badge due-today' };
    if (days === 1) return { text: 'Amanhã', className: 'due-badge due-soon' };
    return { text: `${days} dias`, className: 'due-badge' };
  };

  return (
    <>
      {/* Header with greeting */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="page-subtitle">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowColumnModal(true)}>
            📂 Nova Coluna
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', padding: 20 }}>Carregando painel...</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="stats-grid">
            {STATS_CONFIG.map(({ key, icon, label, color }) => (
              <div key={key} className="stat-card" style={{ '--card-color': color }}>
                <div className="stat-card-icon">{icon}</div>
                <div className="stat-card-value">{stats?.[key] ?? 0}</div>
                <div className="stat-card-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Weekly Progress Card (big) */}
          {stats?.weekProgress && (
            <WeekChart data={stats.weekProgress} />
          )}

          {/* Upcoming Tasks */}
          <section className="upcoming-section">
            <div className="section-header">
              <h2 className="section-title">⏰ Próximas a vencer</h2>
              <span className="section-count">{upcomingTasks.length} tarefa{upcomingTasks.length !== 1 ? 's' : ''}</span>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">🎉</div>
                <div className="empty-state-title">Nenhuma tarefa próxima</div>
                <div className="empty-state-desc">Tudo em dia! Crie uma tarefa nova para se organizar.</div>
              </div>
            ) : (
              <div className="task-list">
                {upcomingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    categories={categories}
                    tags={tags}
                    onToggle={handleToggle}
                    onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }}
                    onDelete={handleDelete}
                    onToggleItem={handleToggleItem}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* FAB - Floating Action Button */}
      <button
        className="fab"
        onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
        title="Nova tarefa"
      >
        <span className="fab-icon">+</span>
      </button>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          categories={categories}
          tags={tags}
          onClose={() => setShowTaskModal(false)}
          onSave={handleSaveTask}
        />
      )}

      {/* Column Modal */}
      {showColumnModal && (
        <ColumnModal
          onClose={() => setShowColumnModal(false)}
          onSave={handleSaveColumn}
        />
      )}
    </>
  );
}
