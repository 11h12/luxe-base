const REMINDER_PREFIX = 'luxe-task-reminder:'
const REMINDER_TITLES_KEY = 'luxe_task_reminder_titles'

chrome.runtime.onMessage.addListener(message => {
  if (message?.type === 'sync-task-reminders' && Array.isArray(message.tasks)) {
    void syncTaskReminders(message.tasks)
  }
})

async function syncTaskReminders(tasks) {
  const existing = await chrome.alarms.getAll()
  await Promise.all(existing
    .filter(alarm => alarm.name.startsWith(REMINDER_PREFIX))
    .map(alarm => chrome.alarms.clear(alarm.name)))

  const titles = {}
  for (const task of tasks) {
    if (task.done || !task.dueDate || !task.dueTime) continue
    const when = new Date(`${task.dueDate}T${task.dueTime}:00`).getTime()
    if (!Number.isFinite(when) || when <= Date.now()) continue
    const name = `${REMINDER_PREFIX}${task.id}`
    titles[name] = task.title
    chrome.alarms.create(name, { when })
  }
  await chrome.storage.local.set({ [REMINDER_TITLES_KEY]: titles })
}

chrome.alarms.onAlarm.addListener(alarm => {
  if (!alarm.name.startsWith(REMINDER_PREFIX)) return
  void chrome.storage.local.get(REMINDER_TITLES_KEY).then(result => {
    const title = result[REMINDER_TITLES_KEY]?.[alarm.name]
    if (!title) return
    chrome.notifications.create(alarm.name, {
      type: 'basic',
      iconUrl: 'icons/logo.png',
      title: 'Task reminder',
      message: title,
    })
  })
})
