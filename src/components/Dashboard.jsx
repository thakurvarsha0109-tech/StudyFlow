const formatReminderDate = (value) => new Date(value).toLocaleString([], {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export default function Dashboard({ tasks, upcomingReminders }) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const activeTasks = totalTasks - completedTasks

  const today = new Date().toDateString()
  const todayTasks = tasks.filter(
    t => t.dueDate && new Date(t.dueDate).toDateString() === today
  ).length

  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.completed) return false
    return new Date(t.dueDate) < new Date()
  }).length

  const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

  return (
    <section className="dashboard">
      <div className="dashboard-intro">
        <div>
          <p className="eyebrow">Your study workspace</p>
          <h1>Make space for focused progress.</h1>
          <p className="dashboard-date">
            {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="progress-orbit" style={{ '--progress': `${completionPercentage}%` }}>
          <div className="progress-orbit-inner">
            <strong>{completionPercentage}%</strong>
            <span>complete</span>
          </div>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-value">{totalTasks}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeTasks}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completedTasks}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completionPercentage}%</div>
          <div className="stat-label">Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{todayTasks}</div>
          <div className="stat-label">Today</div>
        </div>
        <div className="stat-card">
          <div className={`stat-value ${overdueTasks > 0 ? 'overdue-count' : ''}`}>
            {overdueTasks}
          </div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>
      {upcomingReminders.length > 0 && (
        <div className="upcoming-panel">
          <div className="upcoming-heading">
            <div>
              <p className="eyebrow">Stay ahead</p>
              <h2>Upcoming reminders</h2>
            </div>
            <span className="upcoming-count">{upcomingReminders.length} next</span>
          </div>
          <div className="upcoming-list">
            {upcomingReminders.map((task) => (
              <div className="upcoming-item" key={task.id}>
                <span className="upcoming-dot" />
                <div>
                  <strong>{task.title}</strong>
                  <span>{formatReminderDate(task.reminder.remindAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
