export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedSubject,
  onSubjectChange,
  selectedPriority,
  onPriorityChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  subjects,
}) {
  return (
    <div className="filter-bar">
      <div className="filter-section">
        <div className="search-wrapper">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search your tasks..."
            className="search-input"
            aria-label="Search tasks"
          />
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {subjects.length > 0 && (
          <div className="filter-group">
            <label className="filter-label">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="filter-select"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-group">
          <label className="filter-label">Priority</label>
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="filter-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="duedate">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>
    </div>
  )
}
