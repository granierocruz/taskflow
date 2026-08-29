import TaskManager from '../components/tasks/TaskManager';

export default function Tasks() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Minhas Tarefas</h1>
          <p className="page-subtitle">Gerencie e organize todas as suas tarefas</p>
        </div>
      </div>
      <TaskManager showAll={true} />
    </>
  );
}
