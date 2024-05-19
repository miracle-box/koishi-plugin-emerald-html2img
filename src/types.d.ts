import { HtmlToImage } from ".";

declare module "koishi" {
  interface Context {
    html2img: HtmlToImagex;
  }
}
