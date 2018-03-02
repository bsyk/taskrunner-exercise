const app = require('express')()
const TaskManager = require('./taskmanager')

const mgr = new TaskManager()

app.post('/tasks/:taskName/run', (req, res) => {
  const task = mgr.run(req.params.taskName)
  const link = `/tasks/${task.runId}/status`
  res.set('Link', link)
  res.status(201).json({ ...task, href: link })
})

app.get('/tasks', (req, res) => {
  res.json(mgr.allStatuses())
})

app.get('/tasks/:runId/status', (req, res) => {
  const status = mgr.status(req.params.runId)
  if (status)
    res.json(status)
  else
    res.sendStatus(404)
})

app.post('/tasks/:runId/cancel', (req, res) => {
  const killed = mgr.stop(req.params.runId)
  if (killed === null)
    res.sendStatus(404)
  else if (killed === false)
    // Can't kill something that's not running, respond with 409 Conflict.
    // Provide the previous status
    res.status(409).json(mgr.status(req.params.runId))
  else
    res.json(mgr.status(req.params.runId))
})

app.listen(process.env.PORT || 3000)
