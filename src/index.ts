import { Context, Schema } from "koishi";
import { HtmlToImage } from "./service";

export const name = "emerald-html2img";

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.plugin(HtmlToImage);
}
