# School ERP Frontend Dashboard

A modern, highly responsive React single page application (SPA) built with Vite and Tailwind CSS. It serves as the primary administrative dashboard for School ERP management.

## 🎨 UI & UX Features

- **Rich Aesthetics & Visuals**: Sleek dark mode elements, modern gradients, glassmorphism sidebar transitions, and Outfit/Inter fonts.
- **Dynamic School Customization**: Excludes hardcoded metadata. Renders the school name, logo, address, and credentials dynamically from database configurations loaded via `AppContext`.
- **Print Formats System**: Production-grade printable views for **A4 Salary Slips**, **Student ID Cards (front and back)**, **Transfer Certificates (TC)**, and **Report Cards**.
- **Offline Caching**: Leverages Dexie.js (IndexedDB wrapper) to cache notifications and student details locally for rapid page transitions.
- **Responsive Layout**: Designed for administration use across desktops, laptops, and tablets.

---

## 🛠️ Tech Stack & Directory Structure

- **Core**: React 19, Vite (Fast build system)
- **Styling**: Vanilla CSS, Tailwind CSS (Utility-first styles)
- **Icons**: Lucide React
- **Local Cache**: Dexie (IndexedDB wrapper)
- **Router**: React Router Dom v7

```
ERP Frontend/
├── public/              # Static Assets (Fonts, Default Fallback Logos)
├── src/
│   ├── api/             # Axios API Client configurations & interceptors
│   ├── assets/          # Static media assets
│   ├── components/      # Reusable UI components (Sidebar, Topbar, Select, Toast)
│   ├── constants/       # Global static metadata config (Class definitions)
│   ├── context/         # AppContext (Dynamic user sessions & school profiles)
│   ├── pages/           # Pages & Administrative Layouts (Dashboard, Fees, Exams)
│   ├── db.js            # Dexie.js IndexedDB configuration
│   ├── index.css        # Core design system tokens and Tailwind setup
│   └── main.jsx         # App bootstrapping entry point
├── Dockerfile           # Multi-stage production container build config
└── nginx.conf           # SPA server configuration (handles client routing)
```

---

## 💻 Local Installation & Setup

### Prerequisites
- Node.js (>= 20) and npm (>= 10)
- Running ERP Backend API (locally or hosted)

### Steps
1. **Clone the repository**:
   ```bash
   cd school-erp-frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm ci
   ```

3. **Configure Environment Variables**:
   Create a `.env` file based on [.env.example](.env.example):
   ```properties
   VITE_API_URL=http://localhost:5001/api
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application will start at `http://localhost:5173`. You can log in using seeded user accounts:
   - **Role**: Principal Admin (seeded via backend)
   - **Username**: `admin@school.com`
   - **Password**: `Admin123`

5. **Linter Validation**:
   Validate code format and imports using ESLint:
   ```bash
   npm run lint
   ```

---

## 🐳 Running with Docker

This frontend is designed to build static assets and serve them via Nginx:

```bash
# Build the Docker image (automatically points to local backend)
docker build -t school-erp-frontend --build-arg VITE_API_URL=http://localhost:5001/api .

# Run the container (binds container port 80 to host port 80)
docker run -p 80:80 school-erp-frontend
```
The website will be available at `http://localhost`.
