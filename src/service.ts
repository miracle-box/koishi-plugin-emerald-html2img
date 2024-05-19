import { Context, Service } from "koishi";

export class HtmlToImage extends Service {
  constructor(ctx: Context) {
    super(ctx, "html2img", true);
  }
}
