# TaskRunner Service

This service provides an API to execute, monitor and cancel test suites contained within the `simpletestrunner` module.

### Using The Service

The service is provided as a cloud service and utilized an in-memory non-persistent store of results.  Subsequently, and restart of the service would reset the IDs and clear any previous results.
To run a sample set of tasks, use the `runcloud.sh` bash script in the `tests` folder.

The service exposes the following endpoints:

#### `/tasks`
This is a REST-style endpoint that returns the status of all tasks that have been submitted to the service.

Sample CURL command:
```
curl -X GET https://netflix.bensykes.com/tasks
```

Sample response:
```
[
    {
        "runId": 1,
        "taskName": "testSuite1",
        "status": "SUCCESS",
        "startTime": 1520024039777,
        "stopTime": 1520024044861,
        "elapsedTimeMs": 5084,
        "result": {
            "passed": 10,
            "failed": 0,
            "log": "Passed: 10\n",
            "failures": []
        }
    }
]
```

Possible responses:

| Code        | Reason           | Notes            |
| ----------- |:----------------:| ----------------:|
| 200         | Everything is OK |     :)           |
| 401         | https is needed  | Use https scheme |
| 404         | My server broke  | Try again?       |


#### `/tasks/:taskName/run`
This is an RPC-style endpoint to submit a request to run the task named 'taskName' from the `simpletestrunner` module.  The response will include the runId and a URL to monitor the progress and retrieve the status and results.  The status URL will also be included in the `Link` header for easy access without having to parse the response body.

Sample CURL command:
```
curl -X POST https://netflix.bensykes.com/tasks/testSuite1/run

```

Sample response:
```
{
    "runId": 1,
    "taskName": "testSuite1",
    "status": "RUNNING",
    "startTime": 1520026078242,
    "href": "/tasks/1/status"
}
```

Possible responses:

| Code | Reason                | Notes            |
| ---- |:---------------------:| ----------------:|
| 201  | Your task was created |     :)           |
| 401  | https is needed       | Use https scheme |
| 404  | My server broke       | Try again?       |


#### `/tasks/:runId/status`
This is a REST-style endpoint to query the status and results of a submitted task. The `runId` should be obtained from the response of the original request to run the task. The response will include the runId, taskName, current status, start/stop times, elapsed time in milliseconds and possibly a result if the task completed.  The elapsed time will be current while the task is still running and absolute once the task has completed.  In the event of a failure, there may be additional details included in the failures section, detailing out the testName, exception type and reason for failure.

Sample CURL command:
```
curl -X GET https://netflix.bensykes.com/tasks/3/status

```

Sample response:
```
{
    "runId": 3,
    "taskName": "testSuite2",
    "status": "FAILED",
    "startTime": 1520026540637,
    "stopTime": 1520026545722,
    "elapsedTimeMs": 5085,
    "result": {
        "passed": 8,
        "failed": 2,
        "log": "Test 'UsernameCannotExceed64Bytes' failed with TestAssertionException.\n\tReason: Profile creation succeeded, but should have failed.\nTest 'ModifyUsernameForExistingProfile' failed with ArrayIndexOutOfBoundsException.\n\tReason: Index: 2 Length: 2.\nPassed: 8 Failed: 2\n",
        "failures": [
            {
                "testName": "UsernameCannotExceed64Bytes",
                "exception": "TestAssertionException",
                "reason": "Profile creation succeeded, but should have failed."
            },
            {
                "testName": "ModifyUsernameForExistingProfile",
                "exception": "ArrayIndexOutOfBoundsException",
                "reason": "Index: 2 Length: 2."
            }
        ]
    }
}
```

Possible responses:

| Code | Reason                | Notes            |
| ---- |:---------------------:| ----------------:|
| 200  | Everything is OK      |     :)           |
| 401  | https is needed       | Use https scheme |
| 404  | That's not a valid `runId`| Use a `runId` from a run request |

#### `/tasks/:runId/cancel`
This is a RPC-style endpoint to cancel a running task. The `runId` should be obtained from the response of the original request to run the task.  The response will include the updated (or previous) status of the task.  Only running tasks can be canceled, an error will be returned in a finished task is attempted to be canceled.

Sample CURL command:
```
curl -X POST https://netflix.bensykes.com/tasks/4/cancel

```

Sample response:
```
{
    "runId": 4,
    "taskName": "testSuite4",
    "status": "CANCELED",
    "startTime": 1520024039938,
    "stopTime": 1520024048081,
    "elapsedTimeMs": 8143
}
```

Possible responses:

| Code | Reason                | Notes            |
| ---- |:---------------------:| ----------------:|
| 200  | The task was stopped  |     :)           |
| 401  | https is needed       | Use https scheme |
| 404  | That's not a valid `runId`| Use a `runId` from a run request |
| 409  | The task with `runId` had already finished | No need to cancel it |

### Running Locally

```git clone https://github.com/bsyk/taskrunner-exercise
cd taskrunner-exercise
npm install
npm start
```

This will print a message similar to `API started on port 3000`. You can use the same API calls to the local server on `http://localhost:3000`
