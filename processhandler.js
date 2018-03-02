const { fork } = require('child_process')
const parse = require('./outputhandler')

const SCRIPT_NAME = 'simpletestrunner'
const UNKNOWN_TASK_OUTPUT = 'simpletestrunner: test suite \'testSuite\' not recongnized' // [sic]

function isAppError(code, stdout, stderr) {
  return code !== 0
    || stdout.trim().length === 0 && stderr.trim().length > 0
    || stdout.includes(UNKNOWN_TASK_OUTPUT)
}

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
        if (!isAppError(code, stdout, stderr))
          resolve(parse(stdout, stderr))
        else
          reject(parse(stdout, stderr))

        delete this.runningProcesses[task.runId]
      })

      job.on('error', (err) => {
        console.log(`[Job ${task.runId}] Failed to start subprocess.`, err)
        reject(parse(stdout, stderr, err))
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
