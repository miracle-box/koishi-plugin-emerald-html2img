import { Context, Schema, Service } from "koishi";
import satori, { SatoriOptions } from "satori";
import { ResvgRenderOptions, renderAsync as resvg } from "@resvg/resvg-js";
import React from "react";
import fs from "node:fs";
import { DefaultSatoriOptions, OverrideSatoriOptions } from "./types";

class HtmlToImage extends Service {
  static [Service.provide] = "html2img";

  private defaultSatoriOptions: DefaultSatoriOptions = {
    fonts: [],
  };

  private defaultResvgOptions: ResvgRenderOptions = {
    font: {
      fontFiles: [],
    },
  };

  constructor(ctx: Context, public config: HtmlToImage.Config) {
    // Check fonts for existence
    for (const font of config.fonts) {
      const fileExists = fs.existsSync(font.path);

      if (!fileExists) {
        throw new Error(
          `File for font "${font.name}" is not found at ${font.path}`
        );
      }
    }

    // Register service
    super(ctx, "html2img");
    ctx.logger.info("HTML to image service started.");

    // Fill satori font options
    this.defaultSatoriOptions.fonts = config.fonts.map((font) => ({
      data: fs.readFileSync(font.path),
      name: font.name,
      weight: font.weight,
      style: font.style,
      lang: font.lang,
    }));

    // Fill resvg font options
    this.defaultResvgOptions.font.fontFiles = config.fonts.map(
      (font) => font.path
    );
  }

  private mergeSatoriOptions(options: OverrideSatoriOptions): SatoriOptions {
    const mergedFonts = [
      ...this.defaultSatoriOptions.fonts,
      ...(options?.fonts ?? []),
    ];

    return { ...this.defaultSatoriOptions, ...options, fonts: mergedFonts };
  }

  private mergeResvgOptions(
    options: Partial<ResvgRenderOptions>
  ): ResvgRenderOptions {
    const mergedFonts = [
      ...this.defaultResvgOptions.font.fontFiles,
      ...(options?.font.fontFiles ?? []),
    ];

    const mergedOptions = { ...this.defaultResvgOptions, ...options };
    mergedOptions.font.fontFiles = mergedFonts;

    return mergedOptions;
  }

  public async htmlToSvg(
    element: React.ReactNode,
    options?: OverrideSatoriOptions
  ) {
    return satori(element, this.mergeSatoriOptions(options));
  }

  public async svgToImage(
    svg: string | Buffer,
    options?: Partial<ResvgRenderOptions>
  ) {
    return resvg(svg, this.mergeResvgOptions(options));
  }

  public async htmlToImage(
    element: React.ReactNode,
    satoriOptions?: OverrideSatoriOptions,
    resvgOptions?: Partial<ResvgRenderOptions>
  ) {
    const svg = await this.htmlToSvg(element, satoriOptions);

    return this.svgToImage(svg, resvgOptions);
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

declare module "koishi" {
  interface Context {
    html2img: HtmlToImage;
  }
}
