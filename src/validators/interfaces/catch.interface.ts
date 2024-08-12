import { IStoreable } from '../../session_store/storeable';

interface MyCatch extends IStoreable {
  vessel: string,
  area: string,
  presentation: string,
  landing_port: string,
  date: string,
  species: string,
  id: string,
  vessel_master: string,
  pln: string,
  licence_number: string,
  imo_number: string,
  weight: number | void,
  user_id: string,
  added: boolean | void,
  state: string | void,
  commodity_code: string | void,
  species_id: string
}

export default MyCatch;