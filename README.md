# UniMak Online Voting System (OVS)

A secure, modern online voting platform for the University of Makeni (UniMak) designed to facilitate student elections for both SRC (Student Representative Council) and Department-level positions.

## 🎯 Overview

The UniMak OVS is a full-stack web application built with Next.js 15 that enables:
- **Secure student voting** via email OTP authentication
- **Admin dashboard** for Electoral Commissioners to manage elections
- **Two-tier election system**: SRC (university-wide) and Department-specific elections
- **Real-time vote tracking** and result management
- **Voter key-based authentication** for enhanced security

## ✨ Features

### For Students (Voters)
- **Secure Login**: Student ID + Voter Key + Email OTP authentication
- **Election Access**: View and participate in active elections
- **Multi-Position Voting**: Vote for multiple positions within an election
- **Vote Verification**: One vote per position per election (enforced at database level)

### For Administrators (Electoral Commissioners)
- **Admin Dashboard**: Comprehensive overview with statistics
- **Election Management**: Create, configure, and manage elections
- **Voter Management**: Import, register, and manage student voters
- **Results Dashboard**: View tallies and publish election results
- **System Settings**: Configure system-level preferences
- **Secure Authentication**: NextAuth-based admin login with role-based access control

## 🛠️ Tech Stack

- **Framework**: [Next.js 15.5.3](https://nextjs.org/) (App Router)
- **Language**: TypeScript 5
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/) 6.16.2
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) v4.24.11
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4.1.13
- **Email**: [Nodemailer](https://nodemailer.com/) for OTP delivery
- **Password Hashing**: bcryptjs
- **Validation**: Zod

## 📁 Project Structure

```
unimak-ovs/
├── app/
│   ├── admin/                    # Admin routes (protected)
│   │   ├── login/                # Admin login page
│   │   ├── page.tsx              # Admin dashboard
│   │   ├── elections/            # Election management
│   │   ├── voters/               # Voter management
│   │   ├── results/              # Results dashboard
│   │   ├── settings/             # System settings
│   │   └── _components/          # Admin-specific components
│   │       ├── NavLink.tsx       # Navigation with active state
│   │       └── SignOutButton.tsx # Sign out functionality
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth API routes
│   │   └── test-mail/            # Email testing endpoint
│   ├── components/               # Shared UI components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── PublicHeader.tsx
│   │   ├── PublicFooter.tsx
│   │   └── VoteIllustration.tsx
│   ├── vote/[electionId]/        # Voter voting interface
│   ├── page.tsx                  # Public landing page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── mailer.ts                 # Email service (Nodemailer)
│   └── utils.ts                  # Utility functions
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Database migrations
│   └── seed.cjs                  # Database seeding script
├── types/
│   └── next-auth.d.ts           # NextAuth type augmentations
├── middleware.ts                 # Route protection middleware
└── package.json
```

## 🗄️ Database Schema

### Core Models

#### User
- Represents both **Admins** (Electoral Commissioners) and **Students**
- Admins have `passwordHash` for NextAuth credentials
- Students have `studentId` and belong to a `Department`
- Roles: `ADMIN` | `STUDENT`

#### Election
- Two categories: `SRC` (university-wide) or `DEPARTMENT` (department-specific)
- Status: `DRAFT` → `RUNNING` → `ENDED`
- Contains multiple `Position`s (e.g., President, Secretary)
- Created by an Admin user

#### Position
- Belongs to an `Election`
- Has `maxChoices` (default: 1) for voting flexibility
- Contains multiple `Candidate`s

#### Candidate
- Runs for a specific `Position`
- Optional link to a `User` (student candidate)
- Can have `manifesto` and `photoUrl`

#### Vote
- Records a vote: `voterId` → `candidateId` for a `positionId` in an `electionId`
- **Unique constraint**: One vote per voter per position per election
- Timestamped for audit trail

#### VoterKey
- Hashed secret key per voter per election
- Sent via email when election starts
- Can be disabled if compromised

#### LoginOTP
- 6-digit OTP codes for voter authentication
- Hashed with bcrypt
- Time-limited with expiration
- One-time use (consumed flag)

#### Department
- University departments (e.g., "Computer Science", "Mass Communication")
- Links students and department-specific elections

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL database
- Gmail account (or SMTP server) for email delivery

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd unimak-ovs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/unimak_ovs"
   DIRECT_URL="postgresql://user:password@localhost:5432/unimak_ovs"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here" # Generate with: openssl rand -base64 32
   
   # Email (Gmail example)
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASS="your-app-password" # Gmail App Password, not regular password
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed initial data (creates admin user and sample departments)
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Public site: [http://localhost:3000](http://localhost:3000)
   - Admin login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

### Default Admin Credentials

After seeding:
- **Email**: `ec@unimak.edu.sl`
- **Password**: `Admin@12345`

⚠️ **Change these credentials in production!**

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio (database GUI)

## 🔐 Authentication Flow

### Admin Authentication
1. Admin visits `/admin/login`
2. Enters email and password
3. NextAuth validates credentials against database
4. JWT token created with `role: "ADMIN"`
5. Redirected to `/admin` dashboard
6. Middleware protects all `/admin/*` routes

### Student/Voter Authentication
1. Student visits public landing page
2. Enters: Student ID + Voter Key + Email
3. System generates 6-digit OTP
4. OTP sent to student's email
5. Student enters OTP to verify
6. Access granted to voting interface

## 🗳️ Voting Process

1. **Election Creation** (Admin)
   - Admin creates election (SRC or DEPARTMENT)
   - Adds positions (e.g., President, Secretary)
   - Adds candidates for each position
   - Sets start/end dates

2. **Voter Registration** (Admin)
   - Admin imports/registers eligible voters
   - System generates unique VoterKey per voter per election
   - VoterKey sent to voter's email

3. **Voting** (Student)
   - Student logs in with Student ID + VoterKey + OTP
   - Views ballot for active election
   - Selects candidate(s) for each position
   - Submits vote (one vote per position enforced)

4. **Results** (Admin)
   - Admin views tallies in real-time
   - Can publish results when election ends

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Voter Key Hashing**: Stored as hash, never plaintext
- **OTP Security**: Time-limited, one-time use codes
- **Role-Based Access**: Middleware enforces admin-only routes
- **Database Constraints**: Unique votes per position per voter
- **Email Verification**: OTP required for voter login
- **Session Management**: JWT-based sessions via NextAuth

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first, works on all devices
- **Modern UI**: Clean, professional interface with Tailwind CSS
- **Brand Colors**: UniMak-themed color scheme
- **Accessibility**: Semantic HTML and ARIA-friendly components
- **Loading States**: User feedback during async operations
- **Error Handling**: Clear error messages for users

## 🔄 Development Workflow

1. **Database Changes**
   ```bash
   # Edit prisma/schema.prisma
   npm run db:migrate --name your_migration_name
   npm run db:generate
   ```

2. **Testing Email**
   ```bash
   # Visit http://localhost:3000/api/test-mail
   # Checks if email configuration works
   ```

3. **Database Inspection**
   ```bash
   npm run db:studio
   # Opens Prisma Studio at http://localhost:5555
   ```

## 📦 Production Deployment

### Environment Variables (Production)
- Set `NEXTAUTH_URL` to your production domain
- Use a strong `NEXTAUTH_SECRET`
- Configure production database URLs
- Set up production email service (SMTP)

### Build & Deploy
```bash
npm run build
npm run start
```

### Recommended Platforms
- **Vercel** (recommended for Next.js)
- **Railway** (good for PostgreSQL + Next.js)
- **AWS/Azure/GCP** (for enterprise deployments)

## 🚧 Future Enhancements

- [ ] Real-time vote counting dashboard
- [ ] Email notifications for election updates
- [ ] Voter registration via CSV import
- [ ] Candidate profile pages with photos/manifestos
- [ ] Vote receipt/confirmation emails
- [ ] Analytics and reporting
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Export results to PDF/Excel
- [ ] Audit log for admin actions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software for the University of Makeni.

## 👥 Support

For issues, questions, or support:
- Contact the Electoral Commissioner IT Officer
- Email: ec@unimak.edu.sl

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Prisma](https://www.prisma.io/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Authentication by [NextAuth.js](https://next-auth.js.org/)

---

**University of Makeni - Online Voting System**  
*Secure. Transparent. Democratic.*
