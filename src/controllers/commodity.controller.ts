import * as Hapi from '@hapi/hapi';
import Services from '../services/commodity.service';
import acceptsHtml from '../helpers/acceptsHtml';

export default class CommodityController {
  public static async searchCC(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
    const result = await Services.searchCC();
    if (acceptsHtml(req.headers)) {
      return h.redirect((req.payload as any).redirect);
    }
    return h.response(result);
  }
}