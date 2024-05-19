import { Context, Schema, Service } from "koishi";
import fs from "node:fs/promises";

class HtmlToImage extends Service {
  static [Service.provide] = "html2img";

  constructor(ctx: Context, public config: HtmlToImage.Config) {
    super(ctx, "html2img");
  }

  async start() {
    // Check config
    for (const font of this.config.fonts) {
      const fileExists = await fs.access(font.path).then(
        () => true,
        () => false
      );

      if (!fileExists) {
        throw new Error(
          `File for font "${font.name}" is not found at ${font.path}`
        );
      }
    }
  }
}

namespace HtmlToImage {
  export const name = "emerald-html2img";
  export const filter = false;

  export interface Config {
    fonts: {
      name: string;
      path: string;
      weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
      style?: "normal" | "italic";
      lang?: string;
    }[];
  }

  export const Config: Schema<Config> = Schema.object({
    fonts: Schema.array(
      Schema.object({
        name: Schema.string().required(),
        path: Schema.path({
          allowCreate: true,
          filters: [{ name: "Font file", extensions: [".ttf", ".otf"] }],
        }).required(),
        weight: Schema.union([
          Schema.const(undefined).description("不指定"),
          Schema.const(100),
          Schema.const(200),
          Schema.const(300),
          Schema.const(400),
          Schema.const(500),
          Schema.const(600),
          Schema.const(700),
          Schema.const(800),
          Schema.const(900),
        ]),
        style: Schema.union([
          Schema.const(undefined).description("不指定"),
          Schema.const("normal"),
          Schema.const("italic"),
        ]),
        lang: Schema.union([
          Schema.const(undefined).description("不指定"),
          Schema.string().description("在右侧输入语言"),
        ]),
      })
    ).required(),
  });
}
export default HtmlToImage;
