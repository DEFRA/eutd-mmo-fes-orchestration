import * as Hapi from "@hapi/hapi";
import logger from "../logger";
import acceptsHtml from "../helpers/acceptsHtml";
import ConservationService from "../services/conservation.service";
import { Conservation } from '../persistence/schema/frontEndModels/conservation'
import { HapiRequestApplicationStateExtended } from "../types";


export default class ConservationController {

  public static async addConservation(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, savingAsDraft: boolean, userPrincipal: string, documentNumber: string, contactId: string) {
    const payload = { ...(req.payload as any) };
    payload.user_id = userPrincipal;

    const data: any = await ConservationService.addConservation(payload, documentNumber, contactId);

    if (acceptsHtml(req.headers)) {
      if (savingAsDraft) {
        return h.redirect(payload.dashboardUri);
      }

      if (data.conservationReference === 'Other') {
        if (!data.anotherConservation) {
          return h.redirect(payload.currentUri);
        }
      }
      return h.redirect(payload.nextUri);
    }
    return data;
  }

  public static async getConservation(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string): Promise<Conservation> {
    const payload: any = { ...(req.payload as any) };
    payload.user_id = userPrincipal;

    return await ConservationService.getConservation(payload, documentNumber, contactId);
  }

  public static async addConservationAndSaveAsDraft(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, saveAsDraft : boolean, userPrincipal: string, documentNumber: string, contactId: string) {
    logger.info({userPrincipal: (req.app as HapiRequestApplicationStateExtended).claims.sub}, 'Received a request to add conservation and save as draft link');
    return ConservationController.addConservation(req, h, saveAsDraft, userPrincipal, documentNumber, contactId);
  }
}
