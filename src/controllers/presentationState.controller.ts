import * as Hapi from '@hapi/hapi';
import Services from '../services/presentationState.service';
import acceptsHtml from '../helpers/acceptsHtml';

export default class PresentationStateController {
  public static async getPS(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
    const result = await Services.getPS();
    if (acceptsHtml(req.headers)) {
      return h.redirect((req.payload as any).redirect);
    }
    return result;
  }
}
