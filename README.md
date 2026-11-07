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


## Platform source

Also included so the page shell can be read in one place:

- `src/lib/auth` — sign-in, sessions, and gates
- `src/lib/app-data` and `src/lib/db.ts` — database and connector access
- `migrations/auth` — auth schema
- `src/lib/preview-host-bridge.ts` and `src/components/preview-host-bridge.tsx` — live preview bridge

`node_modules` is not in the repo. Install dependencies with npm.
The shared preview OAuth client secret is not committed. Set `GROK_AUTH_CLIENT_SECRET` if you need real sign-in.
