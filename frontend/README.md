# EcoSort AI frontend

Next.js App Router frontend for the EcoSort AI waste classifier.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_API_BASE_URL` to the running FastAPI backend.
3. Install and run the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

The browser sends the selected image directly to `POST /predict` as multipart form data under the `file` field. No upload occurs until the user presses **Classify waste**.
