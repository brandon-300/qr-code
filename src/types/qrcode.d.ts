declare module "qrcode" {
  export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

  export interface ToCanvasOptions {
    errorCorrectionLevel?: ErrorCorrectionLevel;
    margin?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export interface CreatedQr {
    version: number;
    modules: {
      size: number;
    };
  }

  export function create(
    text: string,
    options?: { errorCorrectionLevel?: ErrorCorrectionLevel },
  ): CreatedQr;

  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: ToCanvasOptions,
  ): Promise<void>;

  export function toDataURL(text: string, options?: ToCanvasOptions): Promise<string>;
}
