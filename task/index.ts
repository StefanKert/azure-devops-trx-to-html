import tl = require("azure-pipelines-task-lib/task");
import fs = require("fs");
import * as azdev from "azure-devops-node-api";
import { ReportGenerator } from "./reportGenerator";


async function run(): Promise<void> {
    try {
        let outputFile: string = tl.getInput("outputFilePath", true);
        let templateFilePath: string = tl.getInput("templateFilePath", true);
        let reportVersion: string = tl.getInput("reportVersion", true);
        let testRunTitle: string = tl.getInput("testRunTitle", false);

        if (!fs.existsSync(templateFilePath)) {
            tl.setResult(tl.TaskResult.Failed, `The specified input file '${templateFilePath}' does not exist.`);
            return;
        }

        let template: string = fs.readFileSync(templateFilePath, "utf8");
        let reportGenerator: ReportGenerator = new ReportGenerator(template, reportVersion);
        let report:string = await reportGenerator.generateReport(testRunTitle);

        fs.writeFileSync(outputFile, report);
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();