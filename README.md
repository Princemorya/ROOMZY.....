# 🏠 RoomZy

> Find your perfect room or roommate — smart, simple, and fast.

## 📋 Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🧭 Overview

**RoomZy** is a modern web application designed to simplify the process of finding rooms and roommates. Whether you're a student, a working professional, or a landlord, RoomZy connects people with compatible living arrangements quickly and effortlessly.

🔗 **Live:** [https://roomzy-lyart.vercel.app/](https://roomzy-lyart.vercel.app/)

---

## 🌐 Live Demo

🔗 [https://roomzy-lyart.vercel.app/](https://roomzy-lyart.vercel.app/)

Hosted on **Vercel** with continuous deployment from the main branch.

---

## ✨ Features

- 🔍 **Search & Filter** — Browse rooms and listings by location, price range, and preferences
- 📋 **Post Listings** — List your room or property with photos and key details
- 👤 **User Profiles** — Create and manage your personal profile
- 💬 **Connect with Roommates** — Reach out to potential roommates directly
- ❤️ **Save Favourites** — Bookmark listings you're interested in
- 🏷️ **Category Filters** — Filter by room type, budget, and availability
- 📱 **Responsive Design** — Fully optimized for mobile, tablet, and desktop
- ⚡ **Fast Performance** — Instant load times powered by Vercel's global CDN

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React / Next.js | Frontend Framework |
| Tailwind CSS | Styling & UI |
| Node.js / Express | Backend API *(if applicable)* |
| Firebase / Supabase | Database & Authentication *(if applicable)* |
| Vercel | Hosting & Deployment |

> ⚠️ *Update this table to reflect your actual stack.*

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18+`
- npm or yarn
- A modern web browser

---

## 📦 Installation

**1. Clone the Repository**

```bash
git clone https://github.com/your-username/roomzy.git
cd roomzy
```

**2. Install Dependencies**

```bash
npm install
```

**3. Set Up Environment Variables**

```bash
cp .env.example .env.local
```

Fill in the required values in `.env.local` (see [Environment Variables](#environment-variables) below).

**4. Run the Development Server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Usage

1. **Visit the App** — Go to [https://roomzy-lyart.vercel.app/](https://roomzy-lyart.vercel.app/)
2. **Sign Up / Log In** — Create your profile to get started
3. **Browse Listings** — Search for rooms in your preferred location
4. **Post a Room** — List your room with photos, price, and preferences
5. **Connect** — Reach out to potential roommates
6. **Save Listings** — Favourite rooms to revisit later

---

## 📁 Project Structure

```
roomzy/
├── public/                 # Static assets (images, icons)
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/              # App pages / routes
│   ├── hooks/              # Custom React hooks
│   ├── context/            # Global state / context providers
│   ├── utils/              # Helper functions
│   ├── styles/             # Global stylesheets
│   └── lib/                # API clients, DB config
├── .env.example            # Example environment variables
├── .gitignore
├── package.json
├── vercel.json             # Vercel deployment config (if any)
└── README.md
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (update with your provider)
DATABASE_URL=your_database_url

# Authentication
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000

# Firebase / Supabase (if used)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Other API Keys
NEXT_PUBLIC_MAPS_API_KEY=your_maps_api_key
```

> ⚠️ **Never commit your `.env.local` file.** It is already listed in `.gitignore`.

---

## 🌍 Deployment

This app is deployed on **Vercel** with automatic CI/CD.

### Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Fork this repository
2. Import the repo into [Vercel](https://vercel.com)
3. Add your environment variables in **Vercel → Project Settings → Environment Variables**
4. Click **Deploy** — Vercel handles the rest!

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

🐛 **Found a bug or have a suggestion?** → [Open an issue](https://github.com/your-username/roomzy/issues)

---

## 📜 Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Your Name**

- 🌐 Live App: [roomzy-lyart.vercel.app](https://roomzy-lyart.vercel.app)
- 🐙 GitHub: [@your-username](https://github.com/your-username)
- 💼 LinkedIn: [Your Name](https://linkedin.com/in/your-profile)

---

<div align="center">
  Made with ❤️ — <a href="https://roomzy-lyart.vercel.app">roomzy-lyart.vercel.app</a>
</div>
