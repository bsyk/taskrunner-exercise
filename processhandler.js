const { fork } = require('child_process')

const SCRIPT_NAME = 'simpletestrunner'

module.exports = class ProcessHandler {
  constructor() {
    this.runningProcesses = {}
  }

  executeTask(task) {
    return new Promise((resolve, reject) => {
      console.log(`[Job ${task.runId}] Starting '${task.taskName}'...`)
      const job = this.runningProcesses[task.runId] = fork(SCRIPT_NAME, [ task.taskName ], { silent: true })

      let stdout = ''
      let stderr = ''

      job.stdout.on('data', (data) => {
        const newData = data.toString()
        stdout += newData
        console.log(`[Job ${task.runId}] (out) ${newData}`)
      })

      job.stderr.on('data', (data) => {
        const newData = data.toString()
        stderr += newData
        console.log(`[Job ${task.runId}] (err) ${newData}`)
      })

      job.on('exit', (code) => {
        console.log(`[Job ${task.runId}] Child exited with code ${code}`)
        if (code === 0)
          resolve({ stdout, stderr, code })
        else
          reject({ stdout, stderr, code })

        delete this.runningProcesses[task.runId]
      })

      job.on('error', (err) => {
        console.log(`[Job ${task.runId}] Failed to start subprocess.`, err)
        reject({ err, stdout, stderr, code: -1 })
        delete this.runningProcesses[task.runId]
      })
    })
  }

  killTask(runId) {
    if (this.runningProcesses[runId]) {
      console.log(`[Job ${runId}] Killing...`)
      this.runningProcesses[runId].kill('SIGKILL')
      return true
    }
    console.log(`[Job ${runId}] Not a running process, refusing to kill.`)
    return false
  }
}
