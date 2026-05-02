# 🏠 Roomzy

> Find your perfect room, roommate, or rental — effortlessly.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-roomzy--lyart.vercel.app-brightgreen?style=flat-square)](https://roomzy-lyart.vercel.app/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## 📖 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## About

**Roomzy** is a modern web application that helps users find rooms, list properties.Whether you're a student, a working professional, or a landlord, Roomzy makes the process of shared housing simple, fast, and stress-free.

🔗 **Live:** [https://roomzy-lyart.vercel.app/](https://roomzy-lyart.vercel.app/)

---

## ✨ Features

- 🔍 **Search & Filter** — Browse rooms and listings by location, price, and preferences
- 👤 **User Profiles** — Create and manage your personal profile
- 📋 **Post Listings** — List your room or property with photos and details
- 💬 **Messaging** — Connect and chat with potential roommates directly
- ❤️ **Favorites** — Save and revisit listings you're interested in
- 📱 **Responsive Design** — Fully optimized for desktop and mobile

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React / Next.js |
| Styling | Tailwind CSS |
| Backend | Node.js / Express *(or your backend)* |
| Database | MongoDB / PostgreSQL *(or your DB)* |
| Auth | Firebase / NextAuth *(or your auth)* |
| Deployment | Vercel |

> ⚠️ *Update the table above to reflect your actual stack.*

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 18.x`
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/roomzy.git
cd roomzy

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in the required values in .env.local

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
roomzy/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Next.js pages (or React routes)
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Helper functions
│   ├── styles/         # Global styles
│   └── lib/            # API clients, DB config, etc.
├── .env.example        # Example environment variables
├── package.json
└── README.md
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory and configure the following:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=your_database_url

# Authentication
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

# Other services (add as needed)
```

---

## 📜 Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run test       # Run tests
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please make sure your code follows the existing code style and passes linting.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  Made with ❤️ by the Roomzy team · <a href="https://roomzy-lyart.vercel.app">roomzy-lyart.vercel.app</a>
</div>
