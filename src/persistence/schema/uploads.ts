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
  errors : Array<ErrorObject | string>
}
export interface ErrorObject {
  key : string,
  params : number[]
}