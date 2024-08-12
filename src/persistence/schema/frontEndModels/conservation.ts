import * as BackEndCatchCertificate from "../catchCert"

export interface Conservation {
  caughtInUKWaters? : string;
  caughtInEUWaters? : string;
  caughtInOtherWaters? : string;
  legislation: string[];
  conservationReference: string;
  otherWaters? : string;
  user_id: string;
  currentUri: string
  nextUri: string;
}

export const toBackEndConservationDetails = (exporterDetails : Conservation) : BackEndCatchCertificate.Conservation => {
  return {
           conservationReference : exporterDetails.conservationReference
         }
}