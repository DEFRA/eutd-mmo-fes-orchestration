import * as Hapi from '@hapi/hapi';

import acceptsHtml from '../helpers/acceptsHtml';
import logger from '../logger';
import ManageCertsService from '../services/manage-certs.service';
import DocumentNumberService from '../services/documentNumber.service';
import { postEventData } from '../services/protective-monitoring.service';
import {
  JOURNEY,
  PROTECTIVE_MONITORING_PRIORITY_NORMAL,
  PROTECTIVE_MONITORING_VOID_TRANSACTION,
  PROTECTIVE_MONITORING_PRIORITY_UNUSUAL
} from '../services/constants';
import { HapiRequestApplicationStateExtended } from '../types';

export default class ManageCertificatesController {

  public static async deleteDraftCertificate(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
    try {
      logger.info('deleteCertificate');
      const userPrincipal = <string>(req as any).app.claims.sub;
      const payload = { ...(req.payload as any) };
      payload.user_id = userPrincipal;

      let redirectUri = payload.previousUri;
      if (payload.documentDelete === 'Yes') {
        await ManageCertsService.deleteDraftCertificate(payload.documentNumber);

        redirectUri = payload.nextUri;
      }

      if (acceptsHtml(req.headers)) {
        return h.redirect(redirectUri);
      } else {
        return payload;
      }
    } catch (e) {
      console.error(e);
    }
  }

  public static async voidCertificate(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
    try {
      const payload = { ...(req.payload as any) };
      const redirectUri = payload.previousUri;

      if (payload.documentVoid === 'Yes') {
        const app = req.app as HapiRequestApplicationStateExtended;
        const userPrincipal = app.claims.sub;
        const contactId = app.claims.contactId;
        const clientIp = payload.ipAddress;
        const journey = payload.journey;
        const documentNumber = payload.documentNumber;
        const voidResult = await ManageCertsService.voidCertificate(documentNumber, userPrincipal, contactId);
        const message = voidResult ? `User voided a ${JOURNEY[journey]}` :
          `An attempt was made to void a ${JOURNEY[journey]} not created by the current user`;
        const monitoringInfo = `void/${JOURNEY[journey]}/dn:${documentNumber}`;
        const priorityCode = voidResult ? PROTECTIVE_MONITORING_PRIORITY_NORMAL : PROTECTIVE_MONITORING_PRIORITY_UNUSUAL;
        const sessionId = `${app.claims.auth_time}:${app.claims.contactId}`;
        const transaction = `${PROTECTIVE_MONITORING_VOID_TRANSACTION}-${DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber)}`

        postEventData(userPrincipal, message, monitoringInfo, clientIp, priorityCode, sessionId, transaction)
          .catch(error => 'post monitoring void event data error: ' + error);
      }

      if (acceptsHtml(req.headers)) {
        return h.redirect(redirectUri);
      } else {
        return payload;
      }
    } catch (e) {
      console.error(e);
    }
  }

}
