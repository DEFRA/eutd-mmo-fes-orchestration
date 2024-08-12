import { Document, Schema, model } from "mongoose";

const EmptySchema = new Schema({},{strict:false });

export interface ILandingAggregatedItemBreakdown {
  presentation? : string
  state? : string
  source : string
  isEstimate: boolean
  factor: number
  weight: number
  liveWeight: number
}

export interface ICcQueryResult {
  documentNumber: string;
  documentType: string;
  status: string;
  createdAt: string;
  rssNumber: string;
  da: string;
  dateLanded: string;
  species: string;
  weightFactor: number;
  weightOnCert: number;
  rawWeightOnCert: number;
  weightOnAllCerts: number;
  weightOnAllCertsBefore: number;
  weightOnAllCertsAfter: number;
  isLandingExists: boolean;
  hasSalesNote?: boolean;
  firstDateTimeLandingDataRetrieved?: string;
  isSpeciesExists: boolean;
  numberOfLandingsOnDay: number;
  weightOnLanding: number;
  landingTotalBreakdown?: ILandingAggregatedItemBreakdown[];
  weightOnLandingAllSpecies: number;
  isOverusedThisCert: boolean;
  isOverusedAllCerts: boolean;
  overUsedInfo: string[];
  durationSinceCertCreation: string;
  durationBetweenCertCreationAndFirstLandingRetrieved: string | null;
  durationBetweenCertCreationAndLastLandingRetrieved: string | null;
  extended: any;
  source?: string;
  isExceeding14DayLimit: boolean;
  isPreApproved?: boolean;
  speciesAlias?: string;
  speciesAnomaly?: string;
}

export interface ICcQueryResultModel extends ICcQueryResult, Document {}
export const FailedOnlineCertificates  = model<ICcQueryResultModel>('failedOnlineCertificates', EmptySchema);