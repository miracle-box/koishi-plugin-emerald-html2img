import { Context, Schema, Service } from "koishi";
import satori, { SatoriOptions } from "satori";
import { ResvgRenderOptions, renderAsync as resvg } from "@resvg/resvg-js";
import React from "react";
import fs from "node:fs";
import { DefaultSatoriOptions, OverrideSatoriOptions } from "./types";
import { table } from "node:console";

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
    satori: {
      embedFont: boolean;
      debug: boolean;
      graphemeImages: Record<string, string>;
    };
    resvg: {
      font: {
        loadSystemFonts: boolean;
        defaultFontSize: number;
        defaultFontFamily: string;
        serifFamily: string;
        sansSerifFamily: string;
        cursiveFamily: string;
        fantasyFamily: string;
        monospaceFamily: string;
      };
      dpi: number;
      shapeRendering: 0 | 1 | 2;
      textRendering: 0 | 1 | 2;
      imageRendering: 0 | 1;
      fitTo:
        | { mode: "original" }
        | { mode: "width"; value: number }
        | { mode: "height"; value: number }
        | { mode: "zoom"; value: number };
      logLevel: "off" | "error" | "warn" | "info" | "debug" | "trace";
    };
  }

  export const Config: Schema<Config> = Schema.object({
    fonts: Schema.array(
      Schema.object({
        name: Schema.string().required().description("名称"),
        path: Schema.path({
          allowCreate: true,
          filters: [{ name: "Font file", extensions: [".ttf", ".otf"] }],
        })
          .required()
          .description("文件路径（TTF / OTF）"),
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
        ]).description("字重"),
        style: Schema.union([
          Schema.const(undefined).description("不指定"),
          Schema.const("normal"),
          Schema.const("italic"),
        ]).description("字体样式"),
        lang: Schema.union([
          Schema.const(undefined).description("不指定"),
          Schema.string().description("在右侧输入语言"),
        ]).description("对应语言"),
      }).description("字体选项")
    )
      .required()
      .description("字体列表"),
    satori: Schema.object({
      embedFont: Schema.boolean()
        .default(true)
        .description("将文字转为 Path 嵌入 SVG"),
      graphemeImages: Schema.dict(String)
        .role("table")
        .description("指定字形图片（键为要指定的字符，值为图片 URL）"),
      debug: Schema.boolean().default(false).description("调试模式"),
    }).description("Satori 默认选项（HTML 到 SVG）"),
    resvg: Schema.object({
      font: Schema.object({
        loadSystemFonts: Schema.boolean()
          .default(false)
          .description("加载系统字体（关闭时转换更快）"),
        defaultFontSize: Schema.number()
          .default(12)
          .description("默认字体大小"),
        defaultFontFamily: Schema.string()
          .default("")
          .description("默认字体家族"),
        serifFamily: Schema.string().default("").description("衬线字体家族"),
        sansSerifFamily: Schema.string()
          .default("")
          .description("无衬线字体家族"),
        cursiveFamily: Schema.string().default("").description("草书字体家族"),
        fantasyFamily: Schema.string().default("").description("艺术字体家族"),
        monospaceFamily: Schema.string()
          .default("")
          .description("等宽字体家族"),
      }),
      dpi: Schema.number().default(192).description("默认 DPI（96dpi 为 1x）"),
      shapeRendering: Schema.union([
        Schema.const(0).description("optimizeSpeed"),
        Schema.const(1).description("crispEdges"),
        Schema.const(2).description("geometricPrecision"),
      ])
        .default(1)
        .description("形状渲染质量"),
      textRendering: Schema.union([
        Schema.const(0).description("optimizeSpeed"),
        Schema.const(1).description("optimizeLegibility"),
        Schema.const(2).description("geometricPrecision"),
      ])
        .default(1)
        .description("文字渲染质量"),
      imageRendering: Schema.union([
        Schema.const(0).description("optimizeQuality"),
        Schema.const(1).description("optimizeSpeed"),
      ])
        .default(1)
        .description("图像渲染质量"),
      fitTo: Schema.union([
        Schema.object({
          mode: Schema.const("original").required(),
        }).description("保持原图大小"),
        Schema.object({
          mode: Schema.const("width").required(),
          value: Schema.number()
            .required()
            .default(480)
            .description("固定宽度值"),
        }).description("固定宽度"),

        Schema.object({
          mode: Schema.const("height").required(),
          value: Schema.number()
            .required()
            .default(240)
            .description("固定高度值"),
        }).description("固定高度"),
        Schema.object({
          mode: Schema.const("zoom").required(),
          value: Schema.number()
            .required()
            .default(1.25)
            .description("缩放倍数"),
        }).description("按倍数缩放"),
      ]).description("缩放模式"),
      logLevel: Schema.union([
        Schema.const("off"),
        Schema.const("error"),
        Schema.const("warn"),
        Schema.const("info"),
        Schema.const("debug"),
        Schema.const("trace"),
      ])
        .default("info")
        .description("日志等级"),
    }).description("resvg 默认选项（SVG 到位图）"),
  });
}

export default HtmlToImage;

declare module "koishi" {
  interface Context {
    html2img: HtmlToImage;
  }
}
