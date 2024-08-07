import { Schema } from "koishi";

export interface HtmlToImageConfig {
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

export const HtmlToImageConfig: Schema<HtmlToImageConfig> = Schema.object({
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
      defaultFontSize: Schema.number().default(12).description("默认字体大小"),
      defaultFontFamily: Schema.string()
        .default("")
        .description("默认字体家族"),
      serifFamily: Schema.string().default("").description("衬线字体家族"),
      sansSerifFamily: Schema.string()
        .default("")
        .description("无衬线字体家族"),
      cursiveFamily: Schema.string().default("").description("草书字体家族"),
      fantasyFamily: Schema.string().default("").description("艺术字体家族"),
      monospaceFamily: Schema.string().default("").description("等宽字体家族"),
    }),
    dpi: Schema.number().default(192).description("默认 DPI（96dpi 为 1x）"),
    shapeRendering: Schema.union([
      Schema.const(0).description("optimizeSpeed"),
      Schema.const(1).description("crispEdges"),
      Schema.const(2).description("geometricPrecision"),
    ])
      .default(2)
      .description("形状渲染质量"),
    textRendering: Schema.union([
      Schema.const(0).description("optimizeSpeed"),
      Schema.const(1).description("optimizeLegibility"),
      Schema.const(2).description("geometricPrecision"),
    ])
      .default(2)
      .description("文字渲染质量"),
    imageRendering: Schema.union([
      Schema.const(0).description("optimizeQuality"),
      Schema.const(1).description("optimizeSpeed"),
    ])
      .default(0)
      .description("图像渲染质量"),
    fitTo: Schema.object({
      mode: Schema.union([
        Schema.const("original").description("按原图"),
        Schema.const("width").description("固定宽度"),
        Schema.const("height").description("固定高度"),
        Schema.const("zoom").description("按比例缩放"),
      ]).default("zoom"),
      value: Schema.number().default(2).description("缩放值 (宽度/高度/倍数)"),
    }).description("缩放模式"),
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
