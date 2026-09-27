import { useEffect, useState } from 'react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import FilterBar from './components/FilterBar'
import './App.css'

const STORAGE_KEY = 'studyflow.tasks.v1'

/* -------------------------------------------------------
   TASK NORMALIZATION
------------------------------------------------------- */

const normalizeTask = (task) => ({
  id: task.id ?? Date.now(),
  title: task.title ?? '',
  description: task.description ?? '',
  subject: task.subject ?? '',
  priority: task.priority ?? 'Medium',
  dueDate: task.dueDate ?? '',
  estimatedTime: task.estimatedTime ?? null,
  completed: Boolean(task.completed),
  createdAt: task.createdAt ?? new Date().toISOString(),

  reminder: {
    enabled: Boolean(
      task.reminder?.enabled && task.reminder?.remindAt
    ),
    remindAt: task.reminder?.remindAt ?? null,
    notified: Boolean(task.reminder?.notified),
  },
})

/* -------------------------------------------------------
   LOAD TASKS FROM LOCAL STORAGE
------------------------------------------------------- */

const loadTasks = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)

    return Array.isArray(parsed)
      ? parsed.map(normalizeTask)
      : []
  } catch {
    return []
  }
}

/* -------------------------------------------------------
   REMINDER AUDIO
------------------------------------------------------- */

let reminderAudioContext = null

/*
  Create/unlock the AudioContext after a real user action.

  Browsers often block audio that is started automatically
  without a previous user interaction.
*/
const unlockReminderAudio = async () => {
  try {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext

    if (!AudioContext) {
      return
    }

    if (!reminderAudioContext) {
      reminderAudioContext = new AudioContext()
    }

    if (reminderAudioContext.state === 'suspended') {
      await reminderAudioContext.resume()
    }
  } catch {
    // Audio is optional and may be blocked by the browser.
  }
}

/*
  Play a small 3-tone reminder sound.

  The AudioContext was already unlocked when the user
  interacted with StudyFlow.
*/
const playReminderSound = () => {
  try {
    if (!reminderAudioContext) {
      return
    }

    const context = reminderAudioContext

    if (context.state === 'suspended') {
      context.resume()
    }

    const now = context.currentTime

    const frequencies = [660, 880, 660]

    frequencies.forEach((frequency, index) => {
      const startTime = now + index * 0.22

      const oscillator = context.createOscillator()
      const gain = context.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.value = frequency

      gain.gain.setValueAtTime(
        0.0001,
        startTime
      )

      gain.gain.exponentialRampToValueAtTime(
        0.12,
        startTime + 0.02
      )

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + 0.18
      )

      oscillator.connect(gain)
      gain.connect(context.destination)

      oscillator.start(startTime)
      oscillator.stop(startTime + 0.2)
    })
  } catch {
    // Audio is optional and may be blocked by the browser.
  }
}

/* -------------------------------------------------------
   APP
------------------------------------------------------- */

function App() {
  const [tasks, setTasks] = useState(loadTasks)

  const [editingTask, setEditingTask] =
    useState(null)

  const [searchQuery, setSearchQuery] =
    useState('')

  const [selectedSubject, setSelectedSubject] =
    useState('')

  const [selectedPriority, setSelectedPriority] =
    useState('')

  const [selectedStatus, setSelectedStatus] =
    useState('all')

  const [sortBy, setSortBy] =
    useState('newest')

  const [reminderAlert, setReminderAlert] =
    useState(null)

  const [notificationState, setNotificationState] =
    useState('idle')

  /* -----------------------------------------------------
     CHECK EXISTING NOTIFICATION PERMISSION
  ----------------------------------------------------- */

  useEffect(() => {
    if (!('Notification' in window)) {
      setNotificationState('unavailable')
      return
    }

    if (Notification.permission === 'granted') {
      setNotificationState('granted')
    } else if (Notification.permission === 'denied') {
      setNotificationState('denied')
    } else {
      setNotificationState('idle')
    }
  }, [])

  /* -----------------------------------------------------
     SAVE TASKS TO LOCAL STORAGE
  ----------------------------------------------------- */

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
      )
    } catch {
      // Ignore localStorage errors.
    }
  }, [tasks])

  /* -----------------------------------------------------
     REMINDER CHECKER
  ----------------------------------------------------- */

  useEffect(() => {
    /*
      This function checks the CURRENT tasks directly.

      The previous version used a variable such as:

        let dueTask = null

      and then tried to update it inside setTasks().

      React state updates are asynchronous, so the code
      outside setTasks() could run before dueTask was set.

      This version avoids that problem completely.
    */

    const checkReminders = () => {
      const now = Date.now()

      const dueTasks = tasks.filter((task) => {
        if (!task.reminder?.enabled) {
          return false
        }

        if (task.reminder?.notified) {
          return false
        }

        if (task.completed) {
          return false
        }

        if (!task.reminder?.remindAt) {
          return false
        }

        const reminderTime = new Date(
          task.reminder.remindAt
        ).getTime()

        if (Number.isNaN(reminderTime)) {
          return false
        }

        return reminderTime <= now
      })

      /*
        Nothing is due right now.
      */
      if (dueTasks.length === 0) {
        return
      }

      /*
        Handle one reminder at a time.

        If multiple reminders are due, the next one will
        be picked on the next state update/check.
      */
      const dueTask = dueTasks[0]

      /*
        Mark this reminder as notified immediately.

        This prevents the same reminder from repeatedly
        triggering every second.
      */
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === dueTask.id
            ? {
                ...task,
                reminder: {
                  ...task.reminder,
                  notified: true,
                },
              }
            : task
        )
      )

      /*
        Show StudyFlow's own reminder popup.
      */
      setReminderAlert(dueTask)

      /*
        Play reminder sound.
      */
      playReminderSound()

      /*
        Show browser notification if permission was granted.
      */
      if (
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(
            'StudyFlow reminder',
            {
              body: dueTask.title,
              icon: '/vite.svg',
            }
          )
        } catch {
          // Browser notification failed; popup still works.
        }
      }
    }

    /*
      Check immediately when this effect starts.
    */
    checkReminders()

    /*
      Check every second.

      This means a reminder does not have to wait up to
      30 seconds before being detected.
    */
    const interval = window.setInterval(
      checkReminders,
      1000
    )

    return () => {
      window.clearInterval(interval)
    }
  }, [tasks])

  /* -----------------------------------------------------
     GET UNIQUE SUBJECTS
  ----------------------------------------------------- */

  const subjects = [
    ...new Set(
      tasks
        .map((task) => task.subject)
        .filter(Boolean)
    ),
  ]

  /* -----------------------------------------------------
     FILTER + SEARCH + SORT
  ----------------------------------------------------- */

  const getFilteredAndSortedTasks = () => {
    let filtered = [...tasks]

    /* Search */

    if (searchQuery.trim()) {
      const query =
        searchQuery.toLowerCase()

      filtered = filtered.filter(
        (task) =>
          task.title
            .toLowerCase()
            .includes(query) ||

          task.description
            ?.toLowerCase()
            .includes(query) ||

          task.subject
            ?.toLowerCase()
            .includes(query)
      )
    }

    /* Status */

    if (selectedStatus === 'active') {
      filtered = filtered.filter(
        (task) => !task.completed
      )
    } else if (
      selectedStatus === 'completed'
    ) {
      filtered = filtered.filter(
        (task) => task.completed
      )
    } else if (
      selectedStatus === 'overdue'
    ) {
      filtered = filtered.filter((task) => {
        if (!task.dueDate || task.completed) {
          return false
        }

        return (
          new Date(task.dueDate) <
          new Date()
        )
      })
    }

    /* Subject */

    if (selectedSubject) {
      filtered = filtered.filter(
        (task) =>
          task.subject === selectedSubject
      )
    }

    /* Priority */

    if (selectedPriority) {
      filtered = filtered.filter(
        (task) =>
          task.priority === selectedPriority
      )
    }

    /* Sort */

    filtered.sort((a, b) => {
      if (sortBy === 'oldest') {
        return (
          new Date(a.createdAt) -
          new Date(b.createdAt)
        )
      }

      if (sortBy === 'duedate') {
        if (!a.dueDate) {
          return 1
        }

        if (!b.dueDate) {
          return -1
        }

        return (
          new Date(a.dueDate) -
          new Date(b.dueDate)
        )
      }

      if (sortBy === 'priority') {
        const priorityOrder = {
          High: 0,
          Medium: 1,
          Low: 2,
        }

        return (
          (priorityOrder[a.priority] ?? 3) -
          (priorityOrder[b.priority] ?? 3)
        )
      }

      /* Default: newest first */

      return (
        new Date(b.createdAt) -
        new Date(a.createdAt)
      )
    })

    return filtered
  }

  const filteredTasks =
    getFilteredAndSortedTasks()

  /* -----------------------------------------------------
     ADD TASK
  ----------------------------------------------------- */

  const handleAddTask = async (newTask) => {
    /*
      Unlock audio because this function is triggered
      by the user's Add Task click.
    */
    await unlockReminderAudio()

    /*
      Ask for notification permission when the user
      actually creates a reminder.

      This is much better than asking only AFTER the
      reminder has already fired.
    */
    if (
      newTask.reminder?.enabled &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      try {
        const permission =
          await Notification.requestPermission()

        if (permission === 'granted') {
          setNotificationState('granted')
        } else {
          setNotificationState('denied')
        }
      } catch {
        setNotificationState('denied')
      }
    }

    /*
      Save the task.
    */
    setTasks((currentTasks) => [
      normalizeTask(newTask),
      ...currentTasks,
    ])
  }

  /* -----------------------------------------------------
     SAVE / EDIT TASK
  ----------------------------------------------------- */

  const handleSaveTask = async (updatedTask) => {
    /*
      Unlock audio again when an edited task contains
      a reminder.
    */
    await unlockReminderAudio()

    /*
      If the user adds a reminder while editing and
      notification permission has not been requested,
      ask now.
    */
    if (
      updatedTask.reminder?.enabled &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      try {
        const permission =
          await Notification.requestPermission()

        if (permission === 'granted') {
          setNotificationState('granted')
        } else {
          setNotificationState('denied')
        }
      } catch {
        setNotificationState('denied')
      }
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === updatedTask.id
          ? normalizeTask(updatedTask)
          : task
      )
    )

    setEditingTask(null)
  }

  /* -----------------------------------------------------
     TOGGLE COMPLETE
  ----------------------------------------------------- */

  const handleToggleComplete = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      )
    )
  }

  /* -----------------------------------------------------
     DELETE TASK
  ----------------------------------------------------- */
const handleDeleteTask = (taskId) => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this task?'
  )

  if (!confirmed) {
    return
  }

  setTasks((currentTasks) =>
    currentTasks.filter(
      (task) => task.id !== taskId
    )
  )

  if (editingTask?.id === taskId) {
    setEditingTask(null)
  }

  if (reminderAlert?.id === taskId) {
    setReminderAlert(null)
  }
}

  /* -----------------------------------------------------
     CANCEL EDIT
  ----------------------------------------------------- */

  const handleCancelEdit = () => {
    setEditingTask(null)
  }

  /* -----------------------------------------------------
     SNOOZE REMINDER
  ----------------------------------------------------- */

  const handleSnoozeReminder = () => {
    if (!reminderAlert) {
      return
    }

    /*
      Snooze for 10 minutes.
    */
    const snoozedUntil =
      new Date(
        Date.now() +
          10 * 60 * 1000
      ).toISOString()

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === reminderAlert.id
          ? {
              ...task,
              reminder: {
                ...task.reminder,
                enabled: true,
                remindAt: snoozedUntil,
                notified: false,
              },
            }
          : task
      )
    )

    setReminderAlert(null)
  }

  /* -----------------------------------------------------
     DISMISS REMINDER
  ----------------------------------------------------- */

  const handleDismissReminder = () => {
    setReminderAlert(null)
  }

  /* -----------------------------------------------------
     COMPLETE FROM REMINDER
  ----------------------------------------------------- */

  const handleCompleteReminder = () => {
    if (!reminderAlert) {
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === reminderAlert.id
          ? {
              ...task,
              completed: true,
              reminder: {
                ...task.reminder,
                notified: true,
              },
            }
          : task
      )
    )

    setReminderAlert(null)
  }

  /* -----------------------------------------------------
     REQUEST NOTIFICATIONS MANUALLY
  ----------------------------------------------------- */

  const handleRequestNotifications =
    async () => {
      if (!('Notification' in window)) {
        setNotificationState(
          'unavailable'
        )
        return
      }

      try {
        const permission =
          await Notification.requestPermission()

        if (permission === 'granted') {
          setNotificationState('granted')
        } else {
          setNotificationState('denied')
        }
      } catch {
        setNotificationState('denied')
      }
    }

  /* -----------------------------------------------------
     UPCOMING REMINDERS
  ----------------------------------------------------- */

  const upcomingReminders = tasks
    .filter(
      (task) =>
        task.reminder?.enabled &&
        !task.reminder?.notified &&
        !task.completed
    )
    .sort(
      (a, b) =>
        new Date(a.reminder.remindAt) -
        new Date(b.reminder.remindAt)
    )
    .slice(0, 3)

  /* -----------------------------------------------------
     UI
  ----------------------------------------------------- */

  return (
    <div className="app">
      <Header />

      <main className="app-main">
        <div className="app-container">

          {/* Dashboard */}

          <Dashboard
            tasks={tasks}
            upcomingReminders={
              upcomingReminders
            }
          />

          {/* Add / Edit Task */}

          <section className="app-section">
            <h2>
              {editingTask
                ? 'Edit Task'
                : 'Add a New Task'}
            </h2>

            <TaskForm
              key={
                editingTask?.id ||
                'new-task'
              }
              onAddTask={handleAddTask}
              onSaveTask={
                handleSaveTask
              }
              editingTask={
                editingTask
              }
              onCancelEdit={
                handleCancelEdit
              }
            />
          </section>

          {/* Tasks */}

          <section className="app-section">
            <h2>Tasks</h2>

            <FilterBar
              searchQuery={
                searchQuery
              }
              onSearchChange={
                setSearchQuery
              }
              selectedSubject={
                selectedSubject
              }
              onSubjectChange={
                setSelectedSubject
              }
              selectedPriority={
                selectedPriority
              }
              onPriorityChange={
                setSelectedPriority
              }
              selectedStatus={
                selectedStatus
              }
              onStatusChange={
                setSelectedStatus
              }
              sortBy={sortBy}
              onSortChange={
                setSortBy
              }
              subjects={subjects}
            />

            <TaskList
              tasks={filteredTasks}
              onToggleComplete={
                handleToggleComplete
              }
              onDelete={
                handleDeleteTask
              }
              onEdit={
                setEditingTask
              }
            />
          </section>
        </div>
      </main>

      {/* -------------------------------------------------
          REMINDER POPUP
      ------------------------------------------------- */}

      {reminderAlert && (
        <div
          className="reminder-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reminder-title"
        >
          <div className="reminder-modal">

            <div className="reminder-kicker">
              Reminder due
            </div>

            <h2 id="reminder-title">
              {reminderAlert.title}
            </h2>

            <p>
              It is time to make progress
              on this study task.
            </p>

            <div className="reminder-actions">

              <button
                className="btn btn-primary"
                onClick={
                  handleCompleteReminder
                }
              >
                Mark Complete
              </button>

              <button
                className="btn btn-secondary"
                onClick={
                  handleSnoozeReminder
                }
              >
                Snooze 10 min
              </button>

              <button
                className="btn btn-ghost"
                onClick={
                  handleDismissReminder
                }
              >
                Dismiss
              </button>

            </div>

            {/* Browser notification option */}

            {notificationState !==
              'granted' && (
              <button
                className="notification-link"
                onClick={
                  handleRequestNotifications
                }
              >
                {notificationState ===
                'denied'
                  ? 'Browser notifications are blocked'
                  : notificationState ===
                    'unavailable'
                  ? 'Browser notifications are unavailable'
                  : 'Enable browser notifications'}
              </button>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

export default App