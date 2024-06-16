import { Context, Service } from "koishi";
import satori, { SatoriOptions } from "satori";
import { ResvgRenderOptions, renderAsync as resvg } from "@resvg/resvg-js";
import React from "react";
import fs from "node:fs";
import { DefaultSatoriOptions, OverrideSatoriOptions } from "./types";
import { HtmlToImageConfig } from "./config";

class HtmlToImage extends Service {
  static [Service.provide] = "html2img";

  private defaultSatoriOptions: DefaultSatoriOptions;

  private defaultResvgOptions: ResvgRenderOptions;

  constructor(ctx: Context, public config: HtmlToImageConfig) {
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

    // Fill satori options
    this.defaultSatoriOptions = {
      ...config.satori,
      fonts: config.fonts.map((font) => ({
        ...font,
        data: fs.readFileSync(font.path),
      })),
    };

    // Fill resvg options
    this.defaultResvgOptions = config.resvg;
    this.defaultResvgOptions.font.fontFiles = config.fonts.map(
      ({ path }) => path
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
      ...(options?.font?.fontFiles ?? []),
    ];

    return {
      ...this.defaultResvgOptions,
      ...options,
      font: {
        ...this.defaultResvgOptions.font,
        ...options?.font,
        fontFiles: mergedFonts,
      },
    };
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
  export const Config = HtmlToImageConfig;
}

export default HtmlToImage;

declare module "koishi" {
  interface Context {
    html2img: HtmlToImage;
  }
}
