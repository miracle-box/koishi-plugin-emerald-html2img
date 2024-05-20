import { SatoriOptions } from "satori";

export type SatoriSizeOptions =
  | {
      width: number;
      height: number;
    }
  | {
      width: number;
    }
  | {
      height: number;
    };

export type DefaultSatoriOptions = Omit<SatoriOptions, "width" | "height">;
export type OverrideSatoriOptions = SatoriSizeOptions &
  Partial<DefaultSatoriOptions>;
