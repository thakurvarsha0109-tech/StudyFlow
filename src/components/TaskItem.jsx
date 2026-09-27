export default function TaskItem({ task, onToggleComplete, onDelete, onEdit }) {
  const priorityClass = `priority-${task.priority?.toLowerCase() || 'medium'}`

  const isOverdue = () => {
    if (!task.dueDate) return false

    return new Date(task.dueDate) < new Date() && !task.completed
  }

  const getReminderStatus = () => {
    if (!task.reminder?.enabled) return 'No reminder'
    if (task.completed) return 'Reminder completed'
    if (task.reminder.notified) return 'Reminder dismissed'
    if (new Date(task.reminder.remindAt) <= new Date()) return 'Reminder due'

    return 'Reminder scheduled'
  }

  const reminderStatus = getReminderStatus()
  const reminderClass = reminderStatus.toLowerCase().replaceAll(' ', '-')

  return (
    <div
      className={`task-item ${
        task.completed ? 'completed' : ''
      } ${isOverdue() ? 'overdue' : ''}`}
    >
      {/* Checkbox */}
      <div className="task-checkbox-wrapper">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleComplete(task.id)}
          className="task-checkbox"
          aria-label={`Mark "${task.title}" as ${
            task.completed ? 'incomplete' : 'complete'
          }`}
        />
      </div>

      {/* Main task content */}
      <div className="task-content">
        <div className="task-header">
          {/* Task title */}
          <h3 className="task-title">{task.title}</h3>

          {/* Right side: badges + buttons */}
          <div className="task-right">
            <div className="task-badges">
              {task.priority && (
                <span className={`badge priority-badge ${priorityClass}`}>
                  {task.priority}
                </span>
              )}

              {task.subject && (
                <span className="badge subject-badge">
                  {task.subject}
                </span>
              )}
            </div>

            <div className="task-actions">
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="btn btn-edit"
                aria-label={`Edit task "${task.title}"`}
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="btn btn-delete"
                aria-label={`Delete task "${task.title}"`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="task-description">
            {task.description}
          </p>
        )}

        {/* Task information */}
        <div className="task-meta">
          {task.dueDate && (
            <div className="task-meta-item">
              <span
                className="meta-icon calendar-icon"
                aria-hidden="true"
              />

              <span className="meta-value">
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {task.estimatedTime && (
            <div className="task-meta-item">
              <span
                className="meta-icon clock-icon"
                aria-hidden="true"
              />

              <span className="meta-value">
                {task.estimatedTime} min
              </span>
            </div>
          )}

          <div className={`task-reminder ${reminderClass}`}>
            <span
              className="reminder-pulse"
              aria-hidden="true"
            />

            <span>{reminderStatus}</span>
          </div>
        </div>
      </div>
    </div>
  )
}