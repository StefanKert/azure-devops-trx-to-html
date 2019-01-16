import ma = require("azure-pipelines-task-lib/mock-answer");
import tmrm = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

let taskPath: string = path.join(__dirname, "../task", "index.js");
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput("templateFilePath", path.join(__dirname, "test-files", "template.html"));
tmr.setInput("outputFilePath", path.join(__dirname, "test-files", "test.html"));

tmr.run();