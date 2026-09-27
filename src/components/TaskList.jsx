import TaskItem from './TaskItem'
import EmptyState from './EmptyState'

export default function TaskList({ tasks, onToggleComplete, onDelete, onEdit }) {
  if (tasks.length === 0) {
    return <EmptyState />
  }

  return (
    <section className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </section>
  )
}
