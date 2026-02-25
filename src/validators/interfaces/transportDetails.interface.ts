import { IStoreable } from '../../session_store/storeable';

interface TransportDetails extends IStoreable {
    departurePlace: string,
    vehicle: string,
    user_id: string,
    railwayBillNumber? : string,
    containerNumbers? : string,
    flightNumber? : string,
    nationalityOfVehicle? : string,
    registrationNumber? : string,
    flagState? : string,
    vesselName? : string,
    cmr? : string
}

export default TransportDetails;
