// Simple array access, but could be a map or lookup if runIds are non-numeric or non-sequential
function toIndex(runId) {
  return runId - 1
}

module.exports = class RunHistory {
  constructor() {
    this.taskHistory = []
  }

  getRun(runId) {
    const index = this._getRunIndex(runId)
    return index !== null ? this.taskHistory[index] : null
  }

  getAllRuns() {
    // Return a copy
    return Array.from(this.taskHistory)
  }

  saveRun(results) {
    if (results && results.runId) {
      const index = toIndex(results.runId)
      if (index !== null) {
        this.taskHistory[index] = results
        return results
      }
    }
    return null
  }

  _getRunIndex(runId) {
    const numId = Number.parseInt(runId, 10)
    if (!Number.isNaN(numId) && numId <= this.taskHistory.length && numId > 0)
      return toIndex(numId)
    return null
  }
}
