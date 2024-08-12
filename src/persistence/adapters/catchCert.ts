import * as moment from 'moment';
import { CatchCertificate, Product as CatchCertProduct, Catch } from '../schema/catchCert';

interface CodeAndLabel {
  code: string;
  label: string;
}

type Presentation = CodeAndLabel;
type State = CodeAndLabel;
type Species = CodeAndLabel;

interface Vessel {
  pln: string,
  vesselName: string,
  homePort: string,
  flag: string,
  registrationNumber: string,
  licenceNumber: string,
  licenceValidTo: string,
  imoNumber: string,
  label: string
}

interface Landing {
  addMode: boolean,
  editMode: boolean,
  model: {
    id: string,
    vessel: Vessel,
    dateLanded: string,
    faoArea: string,
    exportWeight: string
  }
}

interface Product {
  id: string,
  commodityCode: string,
  presentation: Presentation,
  state: State,
  species: Species
}


export interface ProductWithLandings {
  product: Product,
  landings: Landing[]
}

export interface ExportPayload {
  items: ProductWithLandings[]
}


export interface UserDetails {
  email: string,
  principal: string
}

export interface TransientData {
  exportPayload: ExportPayload,
  exporter: object,
  transport: object,
  conservation: object,
  documentNumber: string,
  status: string,
  user: UserDetails,
  documentUri: string,
  createdAt?: Date
}

export const mapToPersistableSchema = (data: TransientData): CatchCertificate => {
  const products = buildProducts(data.exportPayload.items);
  return {
    documentNumber: data.documentNumber,
    createdAt: moment.utc().toISOString(),
    createdBy: data.user.principal,
    createdByEmail: data.user.email,
    exportData: {
      products,
      transportation: data.transport,
      conservation: data.conservation,
      exporterDetails: data.exporter
    },
    status: data.status,
    documentUri: data.documentUri
  } as CatchCertificate;

}


export const buildProducts = (prodWithLandings: ProductWithLandings[]): CatchCertProduct[] => {
  return prodWithLandings.map(prodWithLanding => {
    return {
      species: prodWithLanding.product.species.label,
      speciesId: prodWithLanding.product.id,
      speciesCode: prodWithLanding.product.species.code,
      commodityCode: prodWithLanding.product.commodityCode,
      state: {
        code: prodWithLanding.product.state.code,
        name: prodWithLanding.product.state.label
      },
      presentation: {
        code: prodWithLanding.product.presentation.code,
        name: prodWithLanding.product.presentation.label
      },
      caughtBy: buildCaughtBy(prodWithLanding.landings)
    } as CatchCertProduct
  });
}


const buildCaughtBy = (landings: Landing[]): Catch[] => {
  const caughtBy = [];
  for(const landing of landings) {
    const obj = {} as any;
    obj.vessel = landing.model.vessel.vesselName;
    obj.pln = landing.model.vessel.pln;
    obj.id = landing.model.id;
    obj.date = moment(landing.model.dateLanded).format('YYYY-MM-DD');
    obj.faoArea = landing.model.faoArea;
    obj.weight = landing.model.exportWeight;
    caughtBy.push(obj);
  }
  return caughtBy;
}
