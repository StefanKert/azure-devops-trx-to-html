import * as path from "path";
import * as assert from "assert";
import * as ttm from "azure-pipelines-task-lib/mock-test";

// tslint:disable-next-line:typedef
describe("NuGet validator task tests", function () {
    this.timeout(10000);
    it("should succeed for templateFilePath set", (done: MochaDone) => {
        let tp: string = path.join(__dirname, "integration.success.js");
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.stdout);

        assert.equal(tr.succeeded, true, "should have succeeded");
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 0, "should have no errors");

        done();
    });

    it("should succeed for templateFilePath set and specific runTitle", (done: MochaDone) => {
        let tp: string = path.join(__dirname, "integration.success.withRunTitle.js");
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        console.log(tr.stdout);

        assert.equal(tr.succeeded, true, "should have succeeded");
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 0, "should have no errors");

        done();
    });

    it("should fail if templateFilePath is missing", (done: MochaDone) => {
        let tp: string = path.join(__dirname, "integration.failure.missing_templateFilePath.js");
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert.equal(tr.succeeded, false, "should have failed");
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 1, "should have one errors");
        assert.equal(tr.errorIssues[0], "Input required: templateFilePath");
        done();
    });

    it("should fail if outputFilePath is missing", (done: MochaDone) => {
        let tp: string = path.join(__dirname, "integration.failure.missing_outputFilePath.js");
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert.equal(tr.succeeded, false, "should have failed");
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 1, "should have one errors");
        assert.equal(tr.errorIssues[0], "Input required: outputFilePath");
        done();
    });

    it("should fail if reportVersion is missing", (done: MochaDone) => {
        let tp: string = path.join(__dirname, "integration.failure.missing_reportVersion.js");
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert.equal(tr.succeeded, false, "should have failed");
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 1, "should have one errors");
        assert.equal(tr.errorIssues[0], "Input required: reportVersion");
        done();
    });
});