import { IProduct } from "./userAttributes";
import { Vessel } from "./frontEndModels/payload"

export interface IUploadedLanding {
  rowNumber : number,
  originalRow : string,
  productId : string,
  product : IProduct,
  startDate? : string,
  landingDate: string,
  faoArea: string,
  vessel : Vessel,
  vesselPln: string,
  exportWeight: number,
  gearCode?: string,
  gearCategory?: string,
  gearType?: string,
  errors : Array<ErrorObject | string>
}
export interface ErrorObject {
  key : string,
  params : number[]
}

export interface UploadedLandedFieldMeta {
  optional?: boolean;
}

export const UploadedLandingMeta: Record<string, UploadedLandedFieldMeta> = {
  productId: {},
  startDate: {optional: true},
  landingDate: {},
  faoArea: {},
  vesselPln: {},
  gearCode: {optional: true},
  exportWeight: {}
};