import * as Hapi from '@hapi/hapi';
import {
  JOURNEY,
  PROTECTIVE_MONITORING_PRIORITY_NORMAL,
  PROTECTIVE_MONITORING_DOWNLOADED_TRANSACTION
} from '../services/constants';
import DocumentNumberService from '../services/documentNumber.service';
import { postEventData } from '../services/protective-monitoring.service';
import { HapiRequestApplicationStateExtended } from '../types';

export default class ProtectionMonitoringController {

  public static async postEvent(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
    const app = req.app as HapiRequestApplicationStateExtended;
    const documentNumber = (req as any).payload.documentNumber;
    const userPrincipal = app.claims.sub;
    const clientip = (req as any).payload.clientip;
    const journey = (req as any).payload.journey;
    const priority = PROTECTIVE_MONITORING_PRIORITY_NORMAL;

    const monitoringInfo = `viewed/${JOURNEY[journey]}/dn:${documentNumber}`;
    const message = `User successfully downloaded a ${JOURNEY[journey]}`;
    const sessionId = `${app.claims.auth_time}:${app.claims.contactId}`;
    const transaction = `${PROTECTIVE_MONITORING_DOWNLOADED_TRANSACTION}-${DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber)}`;

    await postEventData(userPrincipal, message, monitoringInfo, clientip, priority, sessionId, transaction);

    return h.response().code(200);
  }
}