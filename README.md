# QR code

Live QR code generator. Type a link or any text and the preview updates immediately.

- Foreground and background colors, including hex entry and swap
- PNG export size from 128 to 640 pixels
- Error correction levels L, M, Q, and H
- PNG download
- Runs in the browser. Nothing is uploaded.

## Source

The generator lives in `src/components/qr-studio.tsx`, with form controls in `src/components/ui/`, styles in `src/styles.css`, and the page route in `src/routes/`.

Runtime libraries: `qrcode`, React, TanStack Router, Tailwind CSS, Radix UI, and lucide-react.
