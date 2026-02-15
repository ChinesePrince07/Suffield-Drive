# CloudDrive

A modern cloud file manager built with Next.js that connects to WebDAV storage backends. Browse, upload, download, preview, and organize your files through a clean web interface.

## Features

### File Management
- **Browse** — Navigate directories with breadcrumb paths and sortable columns
- **Upload** — Drag-and-drop single files or entire folders with parallel uploads (5 concurrent)
- **Download** — Single files or batch download as ZIP
- **Create folders** — Make new directories from the UI
- **Rename / Move / Delete** — Full file operations with confirmation dialogs
- **Copy & Cut** — Clipboard operations with `Ctrl/Cmd+C` and `Ctrl/Cmd+X`
- **Drag-to-select** — Click and drag to select multiple files at once

### File Preview
- **Images** — jpg, png, gif, webp, svg, bmp, ico, tiff
- **PDF** — Built-in PDF viewer (pdf.js)
- **Video** — mp4, webm, ogg, mov, avi, mkv
- **Audio** — mp3, wav, ogg, flac, m4a, aac
- **Documents** — DOCX rendering (via mammoth), plain text and code files
- **Office files** — DOC, XLS, XLSX, PPT, PPTX (download prompt)

### Interface
- **List and grid views** — Toggle between table and card layouts
- **Search** — Real-time search across the current directory and subdirectories
- **Context menus** — Right-click for quick file actions
- **Floating toolbar** — Batch actions bar when files are selected
- **Admin mode** — Password-protected access for destructive operations
- **Responsive** — Works on desktop and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui (Radix UI) |
| Data | SWR for caching, WebDAV client |
| File Processing | archiver (ZIP), pdf.js, mammoth (DOCX) |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- A WebDAV server (e.g. Koofr, Nextcloud, or any WebDAV-compatible service)

### 1. Clone and Install

```bash
git clone https://github.com/ChinesePrince07/Suffield-Drive.git
cd cloud-drive
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the project root:

```env
WEBDAV_URL=https://your-webdav-server.com/dav/path/
WEBDAV_USERNAME=your_email@example.com
WEBDAV_PASSWORD=your_app_password
```

### 3. Run

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
cloud-drive/
├── app/
│   ├── api/
│   │   ├── file/route.ts        # File streaming endpoint
│   │   ├── list/route.ts        # Directory listing with child counts
│   │   └── zip/route.ts         # ZIP creation for batch downloads
│   ├── actions.ts               # Server actions (CRUD operations)
│   ├── page.tsx                 # Main page (server component)
│   ├── layout.tsx               # Root layout with providers
│   └── globals.css
│
├── components/
│   ├── file-browser/            # Core file management components
│   │   ├── FileBrowser.tsx      # Main state and logic
│   │   ├── FileBrowserClient.tsx # SWR data fetching wrapper
│   │   ├── FileListView.tsx     # Table view
│   │   ├── FileGrid.tsx         # Grid view
│   │   ├── FilePreviewModal.tsx # File preview overlay
│   │   ├── UploadButton.tsx     # Upload with progress
│   │   ├── SelectionArea.tsx    # Drag-to-select
│   │   └── ...
│   ├── layout/                  # Header, search, user menu
│   └── ui/                      # shadcn/ui primitives
│
├── lib/
│   ├── webdav.ts                # WebDAV client setup
│   ├── types.ts                 # TypeScript interfaces
│   ├── auth-context.tsx         # Admin auth state
│   ├── clipboard-context.tsx    # Copy/cut state
│   └── confirm-context.tsx      # Confirmation dialog provider
│
├── public/                      # Static assets (logo, icons)
├── .env.local                   # WebDAV credentials (not committed)
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Architecture

### Data Flow

1. **Server component** (`page.tsx`) fetches the initial file list from WebDAV on page load
2. **SWR** (`FileBrowserClient`) handles client-side caching and revalidation via `/api/list`
3. **Server actions** (`actions.ts`) handle mutations — upload, delete, move, rename, create folder
4. **API routes** handle streaming downloads (`/api/file`) and ZIP creation (`/api/zip`)

### Contexts

| Context | Purpose |
|---------|---------|
| `AuthContext` | Manages admin login state for protected operations |
| `ClipboardContext` | Tracks copied/cut files and operation type |
| `ConfirmContext` | Provides promise-based confirmation dialogs |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/list?path=` | GET | List directory contents with child counts |
| `/api/file?path=&mime=` | GET | Stream a file download |
| `/api/zip` | POST | Create and download a ZIP from selected paths |

## Scripts

```bash
npm run dev      # Start dev server with hot reload
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## License

MIT

---

Made by Andy.
