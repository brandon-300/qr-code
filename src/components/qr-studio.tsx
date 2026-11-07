import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Download, QrCode } from "lucide-react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { create, toDataURL, type ErrorCorrectionLevel } from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE = "https://grok.com";
const DEFAULT_FG = "#111111";
const DEFAULT_BG = "#ffffff";
const MIN_SIZE = 128;
const MAX_SIZE = 640;
const SIZE_STEP = 16;
const DEFAULT_SIZE = 320;

const LEVELS: { value: ErrorCorrectionLevel; label: string; percent: string; name: string }[] = [
  { value: "L", label: "L", percent: "7%", name: "Low, about 7 percent recovery" },
  { value: "M", label: "M", percent: "15%", name: "Medium, about 15 percent recovery" },
  { value: "Q", label: "Q", percent: "25%", name: "Quartile, about 25 percent recovery" },
  { value: "H", label: "H", percent: "30%", name: "High, about 30 percent recovery" },
];

const LEVEL_DETAIL: Record<ErrorCorrectionLevel, string> = {
  L: "Low. Recovers about 7% of a damaged code and keeps it small.",
  M: "Medium. Recovers about 15%. A solid default for links and notes.",
  Q: "Quartile. Recovers about 25% if the code might get scuffed.",
  H: "High. Recovers about 30% when part of the code may be covered.",
};

type Status = "empty" | "ready" | "error";

type Meta = {
  version: number;
  modules: number;
};

function normalizeHex(input: string): string | null {
  const raw = input.trim();
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const r = withHash[1];
    const g = withHash[2];
    const b = withHash[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toLowerCase();
  return null;
}

function channel(hex: string, index: number): number {
  const value = Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);
}

function contrastWarning(fg: string, bg: string): string | null {
  const fgL = luminance(fg);
  const bgL = luminance(bg);
  const ratio = (Math.max(fgL, bgL) + 0.05) / (Math.min(fgL, bgL) + 0.05);
  if (ratio < 2) {
    return "Foreground and background are too similar. Scanners will not read this.";
  }
  if (fgL > bgL + 0.02) {
    return "Foreground is lighter than the background. Some phones expect dark marks on a light field.";
  }
  return null;
}

function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/too big/i.test(message)) {
    return "That text is too long for this error correction level. Shorten it, or switch to a lower level.";
  }
  return "Could not build a code for this text.";
}

function isLevel(value: string): value is ErrorCorrectionLevel {
  return value === "L" || value === "M" || value === "Q" || value === "H";
}

export function QrStudio() {
  const requestId = useRef(0);
  const [value, setValue] = useState("");
  const [fg, setFg] = useState(DEFAULT_FG);
  const [bg, setBg] = useState(DEFAULT_BG);
  const [fgDraft, setFgDraft] = useState(DEFAULT_FG);
  const [bgDraft, setBgDraft] = useState(DEFAULT_BG);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [ecc, setEcc] = useState<ErrorCorrectionLevel>("M");
  const [status, setStatus] = useState<Status>("empty");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const id = ++requestId.current;

    if (value.length === 0) {
      setStatus("empty");
      setMeta(null);
      setErrorMessage(null);
      setImageUrl(null);
      return;
    }

    void (async () => {
      try {
        const created = create(value, { errorCorrectionLevel: ecc });
        const url = await toDataURL(value, {
          errorCorrectionLevel: ecc,
          margin: 4,
          width: size,
          color: { dark: fg, light: bg },
        });
        if (id !== requestId.current) return;
        setImageUrl(url);
        setMeta({ version: created.version, modules: created.modules.size });
        setErrorMessage(null);
        setStatus("ready");
      } catch (error) {
        if (id !== requestId.current) return;
        setImageUrl(null);
        setMeta(null);
        setErrorMessage(friendlyError(error));
        setStatus("error");
      }
    })();
  }, [value, fg, bg, size, ecc]);

  const warning = contrastWarning(fg, bg);
  const fgInvalid = normalizeHex(fgDraft) === null;
  const bgInvalid = normalizeHex(bgDraft) === null;

  function commitDraft(next: string, setColor: (hex: string) => void, setDraft: (hex: string) => void) {
    setDraft(next);
    const hex = normalizeHex(next);
    if (hex) setColor(hex);
  }

  function swapColors() {
    setFg(bg);
    setBg(fg);
    setFgDraft(bg);
    setBgDraft(fg);
  }

  function download() {
    if (!imageUrl || status !== "ready") return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "qr-code.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  const previewLabel =
    value.length > 0 && value.length <= 80
      ? `QR code for ${value}`
      : "QR code for the text you entered";

  return (
    <main className="page">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-11 items-center justify-center rounded-sm border border-border bg-surface text-fg"
            >
              <QrCode className="size-5" strokeWidth={1.75} />
            </span>
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">QR code</h1>
          </div>
          <p className="max-w-prose text-base text-muted">
            Type a link or any text. The preview updates as you go.
          </p>
        </header>

        <section
          aria-labelledby="preview-heading"
          data-qr-status={status}
          className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
        >
          <h2 id="preview-heading" className="text-base font-medium">
            Preview
          </h2>
          <div className="flex h-72 items-center justify-center overflow-hidden rounded-sm bg-bg">
            {status === "ready" && imageUrl ? (
              <img src={imageUrl} alt={previewLabel} className="qr-canvas" />
            ) : null}
            {status === "empty" ? (
              <div className="flex flex-col items-center gap-3 px-4 text-center">
                <QrCode className="size-10 text-muted" strokeWidth={1.5} aria-hidden="true" />
                <p className="text-base text-muted">Your code shows up here.</p>
                <Button variant="secondary" onClick={() => setValue(SAMPLE)}>
                  Use a sample link
                </Button>
              </div>
            ) : null}
            {status === "error" ? (
              <p role="alert" className="max-w-xs px-4 text-center text-base text-fg">
                {errorMessage}
              </p>
            ) : null}
          </div>
          <p id="preview-status" className="min-h-6 text-sm text-muted tabular-nums">
            {status === "ready" && meta ? `Version ${meta.version} · ${meta.modules}×${meta.modules}` : ""}
          </p>
          <Button className="w-full" onClick={download} disabled={status !== "ready"}>
            <Download className="size-4" aria-hidden="true" />
            Download PNG
          </Button>
        </section>

        <section
          aria-labelledby="options-heading"
          className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-4"
        >
          <h2 id="options-heading" className="text-base font-medium">
            Options
          </h2>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="payload">Text or URL</Label>
              <span id="payload-count" className="text-sm text-muted tabular-nums">
                {value.length} characters
              </span>
            </div>
            <Textarea
              id="payload"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="https:// or any text"
              aria-describedby="payload-count"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              id="foreground"
              label="Foreground"
              color={fg}
              draft={fgDraft}
              invalid={fgInvalid}
              onDraft={(next) => commitDraft(next, setFg, setFgDraft)}
              onPick={(next) => {
                const hex = normalizeHex(next) ?? DEFAULT_FG;
                setFg(hex);
                setFgDraft(hex);
              }}
              onBlur={() => setFgDraft(fg)}
            />
            <ColorField
              id="background"
              label="Background"
              color={bg}
              draft={bgDraft}
              invalid={bgInvalid}
              onDraft={(next) => commitDraft(next, setBg, setBgDraft)}
              onPick={(next) => {
                const hex = normalizeHex(next) ?? DEFAULT_BG;
                setBg(hex);
                setBgDraft(hex);
              }}
              onBlur={() => setBgDraft(bg)}
            />
          </div>

          <p aria-live="polite" className={warning ? "text-sm text-muted" : "sr-only"}>
            {warning}
          </p>

          <Button variant="secondary" className="w-full" onClick={swapColors}>
            <ArrowLeftRight className="size-4" aria-hidden="true" />
            Swap colors
          </Button>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label id="size-label" htmlFor="png-size">
                PNG size
              </Label>
              <span className="font-mono text-sm text-muted tabular-nums">{size} px</span>
            </div>
            <Slider
              id="png-size"
              aria-labelledby="size-label"
              aria-valuetext={`${size} pixels`}
              min={MIN_SIZE}
              max={MAX_SIZE}
              step={SIZE_STEP}
              value={[size]}
              onValueChange={(next) => {
                const resolved = next[0];
                if (typeof resolved === "number") setSize(resolved);
              }}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend id="ecc-label" className="text-sm font-medium text-fg">
              Error correction
            </legend>
            <RadioGroup.Root
              className="grid grid-cols-4 gap-1 rounded-sm bg-bg p-1"
              value={ecc}
              onValueChange={(next) => {
                if (isLevel(next)) setEcc(next);
              }}
              aria-labelledby="ecc-label"
              aria-describedby="ecc-hint"
            >
              {LEVELS.map((level) => (
                <RadioGroup.Item
                  key={level.value}
                  value={level.value}
                  aria-label={level.name}
                  className="flex min-h-11 flex-col items-center justify-center rounded-xs text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg data-[state=checked]:bg-accent data-[state=checked]:text-accent-fg data-[state=checked]:focus-visible:outline-accent-fg"
                >
                  <span className="text-sm font-medium">{level.label}</span>
                  <span className="text-sm">{level.percent}</span>
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
            <p id="ecc-hint" className="text-sm text-muted">
              {LEVEL_DETAIL[ecc]}
            </p>
          </fieldset>
        </section>

        <p className="text-sm text-muted">Built in your browser. Nothing is uploaded.</p>
      </div>
    </main>
  );
}

function ColorField({
  id,
  label,
  color,
  draft,
  invalid,
  onDraft,
  onPick,
  onBlur,
}: {
  id: string;
  label: string;
  color: string;
  draft: string;
  invalid: boolean;
  onDraft: (value: string) => void;
  onPick: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`${id}-hex`}>{label}</Label>
      <div className="flex gap-2">
        <input
          id={`${id}-picker`}
          className="color-well"
          type="color"
          value={color}
          aria-label={`${label} color`}
          onChange={(event) => onPick(event.target.value)}
        />
        <Input
          id={`${id}-hex`}
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          onBlur={onBlur}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          maxLength={7}
          aria-invalid={invalid}
          className="font-mono"
          inputMode="text"
        />
      </div>
    </div>
  );
}
