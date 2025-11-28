import { IProduct } from "./userAttributes";
import { Vessel } from "./frontEndModels/payload";
import { ICountry } from "./common";

export interface IUploadedLanding {
  rowNumber: number;
  originalRow: string;
  productId: string;
  product: IProduct;
  startDate: string;
  landingDate: string;
  faoArea: string;
  highSeasArea: string;
  rfmoCode: string;
  rfmoName?: string;
  eezCode: string;
  eezData?: ICountry[];
  vessel: Vessel;
  vesselPln: string;
  exportWeight: number;
  gearCode: string;
  gearCategory?: string;
  gearName?: string;
  errors: Array<ErrorObject | string>;
}
export interface ErrorObject {
  key: string;
  params: number[];
}

export interface UploadValidatorPayload {
  products: IProduct[];
  landingLimitDaysInFuture: number;
  rows?: string[];
  landings?: IUploadedLanding[];
}
