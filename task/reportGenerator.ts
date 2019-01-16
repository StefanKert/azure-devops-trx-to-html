import * as azdev from "azure-devops-node-api";
import * as Mustache from "mustache";
import tl = require("azure-pipelines-task-lib/task");
import { IRequestHandler } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces";
import { ITestApi } from "azure-devops-node-api/TestApi";
import {
  TestRun,
  TestAttachment,
  AttachmentType
} from "azure-devops-node-api/interfaces/TestInterfaces";
import convert = require("xml-js");

export class ReportGenerator {
  serverConnection: azdev.WebApi;
  buildId: number;
  project: string;
  template: string;
  reportVersion: string;

  constructor(template: string, reportVersion: string) {
    this.buildId = Number(tl.getVariable("Build.BuildId"));
    this.project = tl.getVariable("System.TeamProject");
    let serverUrl: string = tl.getVariable(
      "System.TeamFoundationCollectionUri"
    );
    let authHandler: IRequestHandler = null;

    if (tl.getVariable("UserAccessToken")) {
      authHandler = azdev.getHandlerFromToken(
        tl.getVariable("UserAccessToken")
      );
      this.serverConnection = new azdev.WebApi(serverUrl, authHandler);
    } else {
      let serverCreds: string = tl.getEndpointAuthorizationParameter(
        "SYSTEMVSSCONNECTION",
        "ACCESSTOKEN",
        false
      );
      authHandler = azdev.getPersonalAccessTokenHandler(serverCreds);
    }
    this.template = template;
    this.reportVersion = reportVersion;
    this.serverConnection = new azdev.WebApi(serverUrl, authHandler);
  }

  async generateReport(testRunTitle: string): Promise<string> {
    let viewModel: ReportViewModel = new ReportViewModel();
    viewModel.ReportVersion = this.reportVersion;
    viewModel.TestRuns = await this.getTestRuns(testRunTitle);
    viewModel.TestResults = await this.getTestResult(viewModel.TestRuns);
    return Mustache.render(this.template, viewModel);
  }

  async getTestRuns(testRunTitle: string): Promise<TestRun[]> {
    let testApi: ITestApi = await this.serverConnection.getTestApi();
    var minimumDate: Date = new Date();
    minimumDate.setDate(minimumDate.getDate() - 3);
    var maximumDate: Date = new Date();
    maximumDate.setDate(maximumDate.getDate() + 3);
    if (testRunTitle) {
      return await testApi.queryTestRuns(
        this.project,
        minimumDate,
        maximumDate,
        undefined,
        undefined,
        undefined,
        undefined,
        [this.buildId],
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        testRunTitle
      );
    } else {
      return await testApi.queryTestRuns(
        this.project,
        minimumDate,
        maximumDate,
        undefined,
        undefined,
        undefined,
        undefined,
        [this.buildId]
      );
    }
  }

  async getTestResult(testRuns: TestRun[]): Promise<TestResult[]> {
    let testApi: ITestApi = await this.serverConnection.getTestApi();
    let testResults: Array<TestResult> = new Array<TestResult>();
    for (let testRun of testRuns) {
      let attachments: TestAttachment[] = await testApi.getTestRunAttachments(
        this.project,
        testRun.id
      );
      for (let attachment of attachments) {
        if (attachment.attachmentType !== AttachmentType.TmiTestRunSummary) {
          continue;
        }
        let readableStream: NodeJS.ReadableStream = await testApi.getTestRunAttachmentContent(
          this.project,
          testRun.id,
          attachment.id
        );
        let attachmentContent: convert.ElementCompact = convert.xml2js(
          await this.streamToString(readableStream),
          { compact: true }
        );

        var unitTestResults: any =
          attachmentContent.TestRun.Results.UnitTestResult;
        if (Array.isArray(unitTestResults)) {
          testResults.concat(
            unitTestResults.map(x => {
              var t: TestResult = new TestResult();
              t.TestRunTitle = testRun.name;
              t.Outcome = x._attributes.outcome;
              t.TestName = x._attributes.testName;
              t.ComputerName = x._attributes.computerName;
              t.Passed = x._attributes.outcome === "Passed";
              return t;
            })
          );
        } else {
          var t: TestResult = new TestResult();
          t.TestRunTitle = testRun.name;
          t.Outcome = unitTestResults._attributes.outcome;
          t.TestName = unitTestResults._attributes.testName;
          t.ComputerName = unitTestResults._attributes.computerName;
          t.Passed = unitTestResults._attributes.outcome === "Passed";
          testResults.push(t);
        }
      }
    }
    return testResults;
  }

  streamToString(stream: NodeJS.ReadableStream): Promise<string> {
    const chunks: Uint8Array[] = [];
    return new Promise((resolve, reject) => {
      stream.on("data", chunk => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
  }
}

export class ReportViewModel {
  ReportVersion: string;

  TestRuns: TestRun[];

  TestResults: Array<TestResult>;

  Runs(): number {
    return this.TestRuns.length;
  }

  TestRunIds(): string {
    return this.TestRuns.map(x => x.id).join(",");
  }

  PassedAmount(): number {
    return this.TestResults.filter(x => x.Passed).length;
  }

  FailedAmount(): number {
    return this.TestResults.filter(x => !x.Passed).length;
  }

  TotalAmount(): number {
    return this.PassedAmount() + this.FailedAmount();
  }

  PassPercentage(): string {
    if (this.PassedAmount() === 0 || this.TotalAmount() === 0) {
      return "0%";
    } else {
      return Math.floor((this.PassedAmount() / this.TotalAmount()) * 100) + "%";
    }
  }
}

export class TestResult {
  Outcome: string;
  TestName: string;
  ComputerName: string;
  Passed: boolean;
  TestRunTitle: string;
}
