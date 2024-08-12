import * as FrontEndModel from "./conservation"
import * as BackEndCatchCertificate from "../catchCert"


describe("When mapping from a front end Conservation to a back end Conservation", () => {
    it("will just contain the conservation reference", async() => {
        const conservation : FrontEndModel.Conservation = {
            conservationReference : "UK Fisheries Policy, Common Fisheries Policy, Iranian Waters",
            caughtInUKWaters : 'Y',
            caughtInEUWaters: 'Y',
            caughtInOtherWaters: 'Y',
            legislation: ["UK Fisheries","Common Market", "Iranian Waters"],
            otherWaters : "Iranian Waters",
            user_id: "4308324093284230958203532",
            currentUri: "test/test.html",
            nextUri: "test/test.asx"
        }

        const expectedOutput : BackEndCatchCertificate.Conservation = {
            conservationReference : "UK Fisheries Policy, Common Fisheries Policy, Iranian Waters"
        }

        const result = FrontEndModel.toBackEndConservationDetails(conservation);

        expect(result).toStrictEqual(expectedOutput);
    });
});