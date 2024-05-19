import { HtmlToImage } from "./service";

declare module "koishi" {
  interface Context {
    html2img: HtmlToImage;
  }
}
