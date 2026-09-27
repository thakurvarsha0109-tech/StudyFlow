import { useState, useRef } from 'react'

const PRIORITIES = ['Low', 'Medium', 'High']

const formatDisplayDate = (isoDate) => {
  if (!isoDate) return ''

  const [year, month, day] = isoDate.split('-')

  if (!year || !month || !day) return ''

  return `${day}/${month}/${year}`
}

const isoToDisplayDate = (value) => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

const toDateTimeLocal = (value) => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const offset = date.getTimezoneOffset() * 60000

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16)
}

const isValidDate = (day, month, year) => {
  if (
    !/^\d{2}$/.test(day) ||
    !/^\d{2}$/.test(month) ||
    !/^\d{4}$/.test(year)
  ) {
    return false
  }

  const d = Number(day)
  const m = Number(month)
  const y = Number(year)

  if (m < 1 || m > 12) return false
  if (d < 1 || d > 31) return false

  const date = new Date(y, m - 1, d)

  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  )
}

const displayToISO = (value) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)

  if (!match) return null

  const [, day, month, year] = match

  if (!isValidDate(day, month, year)) {
    return null
  }

  return `${year}-${month}-${day}`
}

export default function TaskForm({
  onAddTask,
  onSaveTask,
  editingTask,
  onCancelEdit,
}) {
  const reminderLocal = toDateTimeLocal(
    editingTask?.reminder?.remindAt
  )

  const initialDueDate = editingTask?.dueDate || ''

  const [title, setTitle] = useState(
    editingTask?.title || ''
  )

  const [description, setDescription] = useState(
    editingTask?.description || ''
  )

  const [subject, setSubject] = useState(
    editingTask?.subject || ''
  )

  const [priority, setPriority] = useState(
    editingTask?.priority || 'Medium'
  )

  const [dueDate, setDueDate] = useState(
    initialDueDate
  )

  const [dueDateText, setDueDateText] = useState(
    formatDisplayDate(initialDueDate)
  )

  const [estimatedTime, setEstimatedTime] = useState(
    editingTask?.estimatedTime || ''
  )

  const [reminderEnabled, setReminderEnabled] = useState(
    Boolean(editingTask?.reminder?.enabled)
  )

  const [reminderDate, setReminderDate] = useState(
    reminderLocal
      ? reminderLocal.slice(0, 10)
      : ''
  )

  const [reminderDateText, setReminderDateText] = useState(
    reminderLocal
      ? isoToDisplayDate(reminderLocal)
      : ''
  )

  const [reminderTime, setReminderTime] = useState(
    reminderLocal
      ? reminderLocal.slice(11, 16)
      : ''
  )

  const [formError, setFormError] = useState('')

  const dueDatePickerRef = useRef(null)
  const reminderDatePickerRef = useRef(null)

  const today = new Date()

  const currentYear = today.getFullYear()

  const todayISO = [
    currentYear,
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  const lastDateOfCurrentYear = `${currentYear}-12-31`

  // --------------------------------
  // MANUAL DATE INPUT
  // --------------------------------

  const handleDueDateTextChange = (e) => {
    let value = e.target.value

    // Only allow numbers and /
    value = value.replace(/[^\d/]/g, '')

    // Automatically add /
    if (value.length === 2 && !value.includes('/')) {
      value += '/'
    }

    if (value.length === 5 && value[2] === '/' && value[4] !== '/') {
      value += '/'
    }

    // Maximum DD/MM/YYYY
    value = value.slice(0, 10)

    setDueDateText(value)

    // Only process once complete
    if (value.length === 10) {
      const iso = displayToISO(value)

      if (!iso) {
        setFormError(
          'Please enter a valid date in DD/MM/YYYY format.'
        )
        return
      }

      const selectedDate = new Date(`${iso}T00:00:00`)

      if (selectedDate.getFullYear() !== currentYear) {
        setFormError(
          `Due dates can only be within ${currentYear}.`
        )
        return
      }

      setDueDate(iso)
      setFormError('')
    }
  }

  const handleReminderDateTextChange = (e) => {
    let value = e.target.value

    // Only allow numbers and /
    value = value.replace(/[^\d/]/g, '')

    // Automatically add /
    if (value.length === 2 && !value.includes('/')) {
      value += '/'
    }

    if (value.length === 5 && value[2] === '/' && value[4] !== '/') {
      value += '/'
    }

    // Maximum DD/MM/YYYY
    value = value.slice(0, 10)

    setReminderDateText(value)

    if (value.length === 10) {
      const iso = displayToISO(value)

      if (!iso) {
        setFormError(
          'Please enter a valid reminder date in DD/MM/YYYY format.'
        )
        return
      }

      const selectedDate = new Date(`${iso}T00:00:00`)

      if (selectedDate.getFullYear() !== currentYear) {
        setFormError(
          `Reminder dates can only be within ${currentYear}.`
        )
        return
      }

      setReminderDate(iso)
      setFormError('')
    }
  }

  // --------------------------------
  // CALENDAR PICKER
  // --------------------------------

  const handleDueDateCalendarChange = (e) => {
    const value = e.target.value

    setDueDate(value)
    setDueDateText(formatDisplayDate(value))
    setFormError('')
  }

  const handleReminderDateCalendarChange = (e) => {
    const value = e.target.value

    setReminderDate(value)
    setReminderDateText(formatDisplayDate(value))
    setFormError('')
  }

  // --------------------------------
  // RESET
  // --------------------------------

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setSubject('')
    setPriority('Medium')

    setDueDate('')
    setDueDateText('')

    setEstimatedTime('')

    setReminderEnabled(false)

    setReminderDate('')
    setReminderDateText('')
    setReminderTime('')

    setFormError('')
  }

  // --------------------------------
  // SUBMIT
  // --------------------------------

  const handleSubmit = (e) => {
    e.preventDefault()

    setFormError('')

    if (!title.trim()) {
      return
    }

    // Validate due date
    if (dueDateText) {
      const iso = displayToISO(dueDateText)

      if (!iso) {
        setFormError(
          'Please enter a valid due date in DD/MM/YYYY format.'
        )
        return
      }

      if (new Date(`${iso}T00:00:00`).getFullYear() !== currentYear) {
        setFormError(
          `Due dates can only be within ${currentYear}.`
        )
        return
      }

      setDueDate(iso)
    }

    let reminderDateTime = null

    // Validate reminder
    if (reminderEnabled) {
      if (!reminderDate || !reminderTime) {
        setFormError(
          'Choose a reminder date and time.'
        )
        return
      }

      reminderDateTime = new Date(
        `${reminderDate}T${reminderTime}`
      )

      if (Number.isNaN(reminderDateTime.getTime())) {
        setFormError(
          'Choose a valid reminder date and time.'
        )
        return
      }

      if (reminderDateTime.getFullYear() !== currentYear) {
        setFormError(
          `Reminders can only be set within ${currentYear}.`
        )
        return
      }

      if (reminderDateTime.getTime() <= Date.now()) {
        setFormError(
          'Choose a future date and time for the reminder.'
        )
        return
      }
    }

    const reminderISO = reminderDateTime
      ? reminderDateTime.toISOString()
      : null

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      subject: subject.trim(),
      priority,
      dueDate,
      estimatedTime: estimatedTime
        ? parseInt(estimatedTime)
        : null,

      completed: editingTask
        ? editingTask.completed
        : false,

      reminder: {
        enabled: reminderEnabled,
        remindAt: reminderISO,

        notified:
          reminderEnabled &&
          editingTask?.reminder?.notified &&
          editingTask.reminder.remindAt === reminderISO,
      },
    }

    if (editingTask) {
      onSaveTask({
        ...editingTask,
        ...taskData,
      })
    } else {
      onAddTask({
        id: Date.now(),
        ...taskData,
        createdAt: new Date().toISOString(),
      })
    }

    resetForm()
  }

  const handleCancel = () => {
    resetForm()
    onCancelEdit()
  }

  return (
    <form
      className="task-form"
      onSubmit={handleSubmit}
    >
      {/* TASK TITLE */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Task Title *
          </label>
<input
  type="text"
  value={title}
  onChange={(e) =>
    setTitle(e.target.value)
  }
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      document.getElementById('task-notes')?.focus()
    }
  }}
  placeholder="What do you need to study?"
  className="form-input"
  autoFocus
/>
        </div>
      </div>

      {/* NOTES */}
      <div className="form-group">
        <label className="form-label">
          Notes
        </label>

        <textarea
  id="task-notes"
  value={description}
  onChange={(e) =>
    setDescription(e.target.value)
  }
  placeholder="Add details or study notes... (optional)"
  className="form-textarea"
  rows="2"
/>
      
      </div>

      {/* SUBJECT + PRIORITY */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Subject
          </label>

          <input
            type="text"
            value={subject}
            onChange={(e) =>
              setSubject(e.target.value)
            }
            placeholder="e.g., React, DSA, Math"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Priority
          </label>

          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value)
            }
            className="form-select"
          >
            {PRIORITIES.map((p) => (
              <option
                key={p}
                value={p}
              >
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DUE DATE + ESTIMATED TIME */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Due Date
          </label>

          <div className="date-input-wrapper">
            <input
              type="text"
              value={dueDateText}
              onChange={handleDueDateTextChange}
              placeholder="DD/MM/YYYY"
              inputMode="numeric"
              maxLength="10"
              className="form-input"
            />

            <button
              type="button"
              className="calendar-button"
              aria-label="Choose due date"
              onClick={() =>
                dueDatePickerRef.current?.showPicker?.()
              }
            >
              📅
            </button>

            <input
              ref={dueDatePickerRef}
              type="date"
              value={dueDate}
              min={`${currentYear}-01-01`}
              max={lastDateOfCurrentYear}
              onChange={handleDueDateCalendarChange}
              className="hidden-date-picker"
              tabIndex="-1"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Estimated Time (min)
          </label>

          <input
            type="number"
            value={estimatedTime}
            onChange={(e) =>
              setEstimatedTime(e.target.value)
            }
            placeholder="e.g., 60"
            min="0"
            className="form-input"
          />
        </div>
      </div>

      {/* REMINDER */}
      <div className="reminder-panel">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => {
              setReminderEnabled(e.target.checked)
              setFormError('')
            }}
          />

          <span
            className="toggle-control"
            aria-hidden="true"
          />

          <span>
            <strong>Enable reminder</strong>

            <small>
              Get a nudge while StudyFlow is open.
            </small>
          </span>
        </label>

        {reminderEnabled && (
          <div className="reminder-fields">
            <div className="form-row">

              {/* REMINDER DATE */}
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="reminder-date-text"
                >
                  Reminder Date
                </label>

                <div className="date-input-wrapper">
                  <input
                    id="reminder-date-text"
                    type="text"
                    value={reminderDateText}
                    onChange={
                      handleReminderDateTextChange
                    }
                    placeholder="DD/MM/YYYY"
                    inputMode="numeric"
                    maxLength="10"
                    className="form-input"
                  />

                  <button
                    type="button"
                    className="calendar-button"
                    aria-label="Choose reminder date"
                    onClick={() =>
                      reminderDatePickerRef.current?.showPicker?.()
                    }
                  >
                    📅
                  </button>

                  <input
                    ref={reminderDatePickerRef}
                    type="date"
                    value={reminderDate}
                    min={todayISO}
                    max={lastDateOfCurrentYear}
                    onChange={
                      handleReminderDateCalendarChange
                    }
                    className="hidden-date-picker"
                    tabIndex="-1"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* REMINDER TIME */}
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="reminder-time"
                >
                  Reminder Time
                </label>

                <input
  id="reminder-time"
  type="time"
  value={reminderTime}
  min={
    reminderDate === todayISO
      ? new Date().toTimeString().slice(0, 5)
      : undefined
  }
  onChange={(e) => {
    const selectedTime = e.target.value

    if (
      reminderDate === todayISO &&
      selectedTime &&
      selectedTime < new Date().toTimeString().slice(0, 5)
    ) {
      setFormError(
        'Please choose a future time for today.'
      )
      return
    }

    setReminderTime(selectedTime)
    setFormError('')
  }}
  className="form-input"
/>
              </div>
            </div>

            <small className="reminder-hint">
              Choose a future date and time within {currentYear}.
            </small>
          </div>
        )}

        {/* ERROR */}
        {formError && (
          <p
            className="form-error"
            role="alert"
          >
            {formError}
          </p>
        )}
      </div>

      {/* BUTTONS */}
      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
        >
          {editingTask
            ? 'Save Changes'
            : 'Add Task'}
        </button>

        {editingTask && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}