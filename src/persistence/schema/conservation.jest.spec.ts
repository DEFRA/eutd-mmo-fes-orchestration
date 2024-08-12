import * as FrontEndModel from "../schema/frontEndModels/conservation"
import * as BackEndCatchCertificate from "./catchCert"


describe("When mapping from a back end conservation to a front end conservation model", () =>{
    it("will contain the conservation reference", async () => {
        const backEndConservation : BackEndCatchCertificate.Conservation = {
            conservationReference : "UK Fisheries Policy"
        }

        const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

        expect(result.conservationReference).toEqual("UK Fisheries Policy")
    });

    describe("When generating the legislation property", () => {
        it("will contain an array with the different legislation", async () => {
            const backEndConservation : BackEndCatchCertificate.Conservation = {
                conservationReference : "UK Fisheries Policy"
            }

            const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

            expect(result.legislation).toEqual(["UK Fisheries Policy"])
        });

        it("will create an array containing all the different legislation from conservation reference", async () => {
            const backEndConservation : BackEndCatchCertificate.Conservation = {
                conservationReference : "Test1,Test2,Test3"
            }

            const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

            expect(result.legislation).toEqual(["Test1","Test2","Test3"])
        });
    });

    describe("Property specifying if the catch was in uk waters",() =>{
        it("Will be set `caughtInUKWaters` to `Y` if conservation reference is `UK Fisheries`", async () => {
            const backEndConservation : BackEndCatchCertificate.Conservation = {
                conservationReference : "UK Fisheries Policy"
            }

            const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

            expect(result.caughtInUKWaters).toEqual("Y")
        });

        it("Will not exist if conservation reference is not `UK Fisheries`", async () => {
            const backEndConservation : BackEndCatchCertificate.Conservation = {
                conservationReference : "Test"
            }

            const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

            expect(result.caughtInUKWaters).toBe(undefined)
        });
    });

    describe("Property specifying if the catch was in EU waters", () => {
        it("Will be set `caughtInEUWaters` to `Y` if conservation reference is `Common Fisheries Policy`", async () => {
            const backEndConservation: BackEndCatchCertificate.Conservation = {
                conservationReference: "Common Fisheries Policy"
            }

            const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

            expect(result.caughtInEUWaters).toEqual("Y")
        });

        it("Will not exist if conservation reference is not `Common Fisheries Policy`", async () => {
            const backEndConservation: BackEndCatchCertificate.Conservation = {
                conservationReference: "Test"
            }

            const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

            expect(result.caughtInEUWaters).toBe(undefined)
        });
    });

    describe("Property specifying if the catch was other waters", () => {
        it("Will be set `caughtInOtherWaters` to `Y` if conservation reference is anything other than `Common Fisheries Policy` or `UK Fisheries`", async () => {
            const backEndConservation: BackEndCatchCertificate.Conservation = {
                conservationReference: "Test"
            }

            const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

            expect(result.caughtInOtherWaters).toEqual("Y")
        });

      it("Will not exist if conservation reference is `UK Fisheries`", async () => {
            const backEndConservation: BackEndCatchCertificate.Conservation = {
                conservationReference: "UK Fisheries Policy"
            }

            const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

            expect(result.caughtInOtherWaters).toBe(undefined)
        });

      it("Will not exist if conservation reference is `Common Fisheries Policy`", async () => {
            const backEndConservation: BackEndCatchCertificate.Conservation = {
                conservationReference: "Common Fisheries Policy"
            }

            const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

            expect(result.caughtInOtherWaters).toBe(undefined)
        });
    });

    describe("Property specifying `other waters` policy", () => {
        it("will contain the policy for `other waters`", async () => {
            const backEndConservation: BackEndCatchCertificate.Conservation = {
                conservationReference: "Other Waters"
            }

            const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

            expect(result.otherWaters).toEqual("Other Waters")
        });
        it("will contain the policy of other waters if other waters is in a array of many location catches", async () => {
            const backEndConservation: BackEndCatchCertificate.Conservation = {
                conservationReference: "UK Fisheries Policy, Common Fisheries Policy, Test"
            }
            const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

            expect(result.otherWaters).toEqual("Test")
        })

        it("will not contain the policy of other waters if there is no other waters policy", async () => {
            const backEndConservation: BackEndCatchCertificate.Conservation = {
                conservationReference: "UK Fisheries Policy, Common Fisheries Policy"
            }
            const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

            expect(result.otherWaters).toEqual(undefined)
        })
    });

    it("Will have the correct properties", () => {
        const backEndConservation: BackEndCatchCertificate.Conservation = {
            conservationReference: "UK Fisheries Policy, Common Fisheries Policy, Iranian Waters"
        }

        const expectedOutput : FrontEndModel.Conservation = {
            conservationReference : "UK Fisheries Policy, Common Fisheries Policy, Iranian Waters",
            caughtInUKWaters : 'Y',
            caughtInEUWaters: 'Y',
            caughtInOtherWaters: 'Y',
            legislation: ["UK Fisheries Policy","Common Fisheries Policy", "Iranian Waters"],
            otherWaters : "Iranian Waters",
            user_id: "Test",
            currentUri: "Test",
            nextUri: "Test"
        }

        const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

        expect(result).toStrictEqual(expectedOutput);
    });

    it("will handle unspecifed conservationReference", () => {
      const backEndConservation: BackEndCatchCertificate.Conservation = {
          conservationReference: ""
      }

      const expectedOutput : FrontEndModel.Conservation = {
          conservationReference : "",
          legislation: [""],
          user_id: "Test",
          currentUri: "Test",
          nextUri: "Test"
      }

      const result = BackEndCatchCertificate.toFrontEndConservation(backEndConservation);

      expect(result).toStrictEqual(expectedOutput);
    });

    it("will handle undefined conservationReference", () => {
        const expectedOutput : FrontEndModel.Conservation = {
            conservationReference : "",
            legislation: [""],
            user_id: "Test",
            currentUri: "Test",
            nextUri: "Test"
        }

        const result = BackEndCatchCertificate.toFrontEndConservation(undefined);

        expect(result).toStrictEqual(expectedOutput);
    });
});