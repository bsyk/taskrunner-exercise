const ProcessHandler = require('./processhandler')
const RunHistory = require('./runhistory')

const STATUS = Object.freeze({
  CREATED: 'CREATED',
  RUNNING: 'RUNNING',
  COMPLETE: 'COMPLETE',
  ERROR: 'ERROR',
  CANCELED: 'CANCELED'
})

module.exports = class TaskManager {
  constructor() {
    this.taskId = 1
    this.runningTasks = {}
    this.proc = new ProcessHandler()
    this.history = new RunHistory()
  }

  _allocateId() {
    return this.taskId++
  }

  run(taskName) {
    const runId = this._allocateId()
    console.log(`[Job ${runId}] Requested task '${taskName}'...`)
    const task = this.history.saveRun({
      runId,
      taskName,
      status: STATUS.CREATED,
      startTime: Date.now()
    })

    const job = this.runningTasks[runId] = this.proc.executeTask(task)
    task.status = STATUS.RUNNING

    job.then(result => {
      task.stopTime = Date.now()
      task.elapsedTimeMs = task.stopTime - task.startTime
      task.status = STATUS.COMPLETE
      task.stdout = result.stdout
      task.stderr = result.stderr
      delete this.runningTasks[runId]
      console.log(`[Job ${runId}] Complete.`)
    }).catch(result => {
      if (task.status !== STATUS.CANCELED) {
        task.stopTime = Date.now()
        task.elapsedTimeMs = task.stopTime - task.startTime
        task.status = STATUS.ERROR
        task.err = result.err
        task.stdout = result.stdout
        task.stderr = result.stderr
      }
      delete this.runningTasks[runId]
      console.log(`[Job ${runId}] Incomplete.`)
    })

    return task
  }

  status(runId) {
    const result = this.history.getRun(runId)
    if (result && (result.status === STATUS.CREATED || result.status === STATUS.RUNNING))
      return { ...result, elapsedTimeMs: Date.now() - result.startTime }

    return result
  }

  allStatuses() {
    return this.history.getAllRuns().map(result => {
      if (result && (result.status === STATUS.CREATED || result.status === STATUS.RUNNING))
        return { ...result, elapsedTimeMs: Date.now() - result.startTime }

      return result
    })
  }

  stop(runId) {
    const result = this.history.getRun(runId)

    if (result) {
      console.log(`[Job ${result.runId}] Stop requested.`)

      if (result.status === STATUS.CREATED || result.status === STATUS.RUNNING) {
        // Job exists and is running
        const killed = this.proc.killTask(result.runId)
        if (killed) {
          result.stopTime = Date.now()
          result.elapsedTimeMs = result.stopTime - result.startTime
          result.status = STATUS.CANCELED
        }
        return killed
      }
      return false
    }
    return null
  }
}
