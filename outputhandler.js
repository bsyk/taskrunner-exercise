const PASS_FAIL_REGEX = /^Passed: (\d+)(?: Failed: (\d+))?/m
const EXCEPTION_REGEX = /^Test '(\S+)' failed with (\S+)\.[\r\n]+\tReason: (.*)$/mg

// Process all output and make sense of what's passed.
// Return a formatted object with the processed output.
module.exports = (stdout, stderr, err) => {
  if (err)
    // Real error occurred starting the process
    return {
      passed: 0,
      failed: 0,
      log: err.message,
      failures: []
    }
  else if (stderr.trim())
    // Treat anything printed to stderr as a node error (exception)
    return {
      passed: 0,
      failed: 0,
      log: stderr,
      failures: []
    }

  // Try to interpret the stdout messages
  // Extract the pass/fail counts
  const passFailMatches = PASS_FAIL_REGEX.exec(stdout)
  // passFail could be null if there is no Passed/Failed line
  const [, passed = 0, failed = 0] = passFailMatches === null ? [] : passFailMatches

  // Extract any exception messages
  const failureMatches = stdout.split(EXCEPTION_REGEX)
  // Capturing groups will mean our TestName, Exception, Cause
  // are in indexes 1,2,3 then 5,6,7 then 9,10,11 ...
  const failures = failureMatches.map((x, idx) => {
    // First split into smaller arrays, so we get 1 entry per exception
    return idx % 4 === 0 && idx + 4 <= failureMatches.length && failureMatches.slice(idx, idx + 4)
    // Filter to remove the empties
  }).filter(x => x !== false).map(x => {
    // Then map into a failure record object
    const [, testName, exception, reason] = x
    return { testName, exception, reason }
  })

  return {
    passed: Number.parseInt(passed),
    failed: Number.parseInt(failed),
    log: stdout,
    failures
  }
}
