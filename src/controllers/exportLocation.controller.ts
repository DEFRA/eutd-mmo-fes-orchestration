import * as Hapi from '@hapi/hapi';
import Services from '../services/exportLocation.service';
import acceptsHtml from "../helpers/acceptsHtml";
import { EXPORT_LOCATION_KEY } from '../session_store/constants';

export default class ExportLocationController {

  public static async getExportLocation(userPrincipal: string, documentNumber: string, contactId: string) {
    return await Services.get(userPrincipal, EXPORT_LOCATION_KEY, documentNumber, contactId);
  }

  public static async addExportLocation(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, savingAsDraft: boolean, userPrincipal: string, documentNumber: string, contactId: string) {
    const payload = {...(req.payload as any) };
    const result = await Services.addExportLocation(userPrincipal, payload, documentNumber, contactId);

    if (acceptsHtml(req.headers)) {
      if (savingAsDraft) {
        return h.redirect(payload.dashboardUri);
      }
      return h.redirect(payload.nextUri);
    } else {
      return result;
    }
  }

  public static async addExportLocationAndSaveAsDraft(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, saveAsDraft: boolean, userPrincipal: string, documentNumber: string, contactId: string) {
    return ExportLocationController.addExportLocation(req, h, saveAsDraft, userPrincipal, documentNumber, contactId);
  }

}