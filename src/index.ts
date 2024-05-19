import { Context, Schema, Service } from "koishi";
import satori, { SatoriOptions } from "satori";
import fs from "node:fs";
import React from "react";

class HtmlToImage extends Service {
  static [Service.provide] = "html2img";

  private defaultSatoriOptions: SatoriOptions = {
    width: 600,
    height: 400,
    fonts: [],
  };

  constructor(ctx: Context, public config: HtmlToImage.Config) {
    super(ctx, "html2img");

    // Fill satori font options
    this.defaultSatoriOptions.fonts = config.fonts.map((font) => ({
      data: fs.readFileSync(font.path),
      name: font.name,
      weight: font.weight,
      style: font.style,
      lang: font.lang,
    }));
  }

  async start() {
    // Check config
    for (const font of this.config.fonts) {
      const fileExists = await fs.existsSync(font.path);

      if (!fileExists) {
        throw new Error(
          `File for font "${font.name}" is not found at ${font.path}`
        );
      }
    }

    this.ctx.logger.info("HTML to image service started.");
  }

  private mergeSatoriOptions(options: Partial<SatoriOptions>): SatoriOptions {
    const mergedFonts = [...this.defaultSatoriOptions.fonts, ...options.fonts];

    return { ...this.defaultSatoriOptions, ...options, fonts: mergedFonts };
  }

  public async htmlToSvg(
    element: React.ReactNode,
    options: Partial<SatoriOptions>
  ) {
    return satori(element, this.mergeSatoriOptions(options));
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
