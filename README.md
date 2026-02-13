# Dashboard Display Manager

A web application for building customizable dashboard screens with drag-and-drop widgets. Create screens, configure widgets, and display them on any monitor or TV via a public URL.

## Tech Stack

**Backend:** Laravel 12 (PHP 8.2+), Inertia.js, Sanctum
**Frontend:** React 18 (TypeScript), Tailwind CSS, Radix UI
**Build:** Vite 7
**Database:** SQLite (default)

## Features

- **Screen Builder** — Visual canvas editor with drag-and-drop powered by `@dnd-kit`
- **6 Widget Types:**
  - **Clock/Date/Weather** — Real-time time, date, and weather info
  - **Announcements** — Scrolling text announcements
  - **Birthday** — Upcoming birthday display
  - **Room Availability** — Live room status via Google Calendar integration
  - **Toggl Time Tracking** — Weekly team stats from Toggl Track
  - **Image Slideshow** — Rotating image gallery with upload management
- **Layout Modes** — Bento grid layouts (small/large or large/small) and single-widget fullscreen mode
- **Public Display** — Share screens via a public URL with configurable auto-refresh (5–300s)
- **Dark Mode** — Dark theme enabled by default

## Getting Started

### Prerequisites

- PHP 8.2+
- Composer
- Node.js & npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd dashboard-intro-week

# Install dependencies
composer install
npm install

# Set up environment
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate

# Start the development servers
composer run dev
# or run them separately:
php artisan serve    # Backend at http://localhost:8000
npm run dev          # Vite dev server
```

### External Services (Optional)

These widgets require API credentials configured in your `.env` file:

- **Room Availability** — Requires Google Calendar API credentials
- **Toggl Time Tracking** — Requires a Toggl Track API token

## Usage

1. **Register/Login** — Create an account to access the screen builder
2. **Create a Screen** — Add a new screen from the dashboard
3. **Add Widgets** — Drag widgets from the library panel onto the canvas
4. **Configure** — Click a widget to open its settings panel and customize it
5. **Choose a Layout** — Pick a bento layout or switch to single-widget fullscreen mode
6. **Display** — Open the public display URL (`/display/{screen}`) on any browser or monitor

## Project Structure

```
app/
├── Http/Controllers/       # Screen, Widget, Display, Settings controllers
├── Models/                  # Screen, Widget, User, Setting
└── Services/                # GoogleCalendarService, TogglTimeTrackingService
resources/js/
├── Pages/                   # React pages (Dashboard, Display, Auth, Settings)
├── Components/
│   ├── Screens/             # Canvas editor, widget library, settings panel
│   ├── Widgets/             # Individual widget implementations
│   └── ui/                  # Reusable UI components (shadcn/ui style)
├── Layouts/                 # App and guest layouts
└── constants/               # Widget type definitions
routes/
├── web.php                  # Application routes
└── auth.php                 # Authentication routes
```
