# 🚀 MentorLaunch

**Your AI-Powered Career Guidance & Mentorship Platform**

MentorLaunch is a comprehensive career guidance platform designed to help students discover their ideal career paths, connect with experienced mentors, and build actionable roadmaps for success. Powered by AI and real human expertise, we make career planning accessible, personalized, and engaging.

---

## ✨ Features

### 🎯 **AI-Powered Career Suggestions**
- Get personalized career recommendations based on your grade, interests, skills, and goals
- Powered by Groq's Llama 3.3 70B for intelligent, context-aware suggestions
- Detailed career breakdowns including salary ranges, growth potential, required education, and skills
- Comprehensive fallback system ensures suggestions even during API rate limits

### 🤖 **MentorAssist - Your AI Career Coach (Sidebar)**
- Beautiful slide-in sidebar interface for seamless conversations
- 24/7 AI assistant with organized, formatted responses
- Context-aware responses based on your profile and career interests
- Structured answers with headings, bullet points, and numbered lists
- Quick-start suggestions for common questions
- Get custom 3-month and 6-month learning plans tailored to your goals

### 💰 **AI Financial & Scholarship Guidance**
- Dedicated modal showing 10+ universities with 70%+ scholarship opportunities
- Detailed information for each university:
  - Scholarship percentage and types (Merit-based, Need-based, etc.)
  - Application requirements and deadlines
  - Relevant programs and fields of study
  - Direct links to search and ask AI for more details
- Covers universities in Nepal, USA, UK, Canada, Australia, and Asia
- Smooth scrolling with hidden scrollbars for clean UI

### 👨‍🏫 **Live Mentor Connections**
- Browse active mentors in real-time in the sidebar
- View mentor profiles with their profession, experience, and expertise
- Send chat requests to connect with mentors for personalized guidance
- Real-time messaging system with request/accept workflow
- Active status indicators with pulse animations

### 📊 **Gamified Career Dashboard**
- Career Fit Score (0-100) showing how well careers match your profile
- Skill Gap Analysis with visual progress bars
- 5-Step Roadmap with timeline-based milestones
- Progress tracking and achievement badges
- Top 3 career recommendations with quick actions

### 🎓 **University Recommendations**
- Curated list of universities for each career path
- Mix of local (Nepal) and international institutions
- Direct links to research universities and ask AI for detailed information
- Hardcoded fallbacks for reliable suggestions

### 💾 **Save & Organize Careers**
- Save careers to your personal collection with one click
- Dedicated "Saved Careers" page to review bookmarked options
- Visual indicators showing saved status (✓ Saved)
- Easy removal of saved careers
- Persistent storage using localStorage

### 📚 **My Plans Page**
- Dedicated page for learning plans and study roadmaps
- Coming soon features: Study schedules, milestone tracking, progress analytics
- Integration with MentorAssist for personalized plan creation

### 🎨 **Modern Navigation**
- Clean navbar with Dashboard, My Plans, and Saved links
- Responsive design for mobile and desktop
- User profile dropdown with grade level and interests
- Quick access to update preferences

### 🔐 **Dual Role System**
- **Mentee Mode**: Get guidance, explore careers, connect with mentors
- **Mentor Mode**: Share your expertise, help students, manage mentee connections
- Separate dashboards optimized for each role

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **AI**: Groq API (Llama 3.3 70B Versatile)
- **Authentication**: Supabase Auth with email/password
- **Real-time**: Polling-based updates for chat and mentor status
- **Storage**: localStorage for saved careers and preferences

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- Groq API key (free tier available at [console.groq.com](https://console.groq.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <https://github.com/saintkatsu/100bits.git>
   cd 100bits
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```

   Get your Groq API key:
   - Sign up at [console.groq.com](https://console.groq.com)
   - Navigate to API Keys section
   - Create a new API key
   - Free tier includes 100,000 tokens per day

4. **Set up the database**

   Run the SQL schema in your Supabase SQL editor:
   ```bash
   # Copy the contents of supabase-schema.sql and run it in Supabase
   ```

   See `SUPABASE_SETUP.md` for detailed instructions.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
100bits/
├── app/
│   ├── api/              # API routes
│   │   ├── ai-chat/      # AI assistant endpoint (Groq)
│   │   ├── career-suggestions/  # Career recommendations with fallback
│   │   ├── chat/         # Mentor-mentee messaging
│   │   ├── mentees/      # Mentee management
│   │   └── mentors/      # Mentor management
│   ├── auth/             # Authentication pages
│   │   ├── mentee/       # Mentee signup/login
│   │   └── mentor/       # Mentor signup/login
│   ├── user/             # Mentee dashboard
│   │   ├── saved/        # Saved careers page
│   │   └── plans/        # My plans page
│   ├── mentor/           # Mentor dashboard
│   ├── welcome/          # Onboarding quiz
│   ├── globals.css       # Global styles with custom utilities
│   └── page.tsx          # Landing page
├── components/
│   ├── auth/             # Auth forms
│   ├── sections/         # Landing page sections
│   ├── ui/               # Reusable UI components
│   ├── Chat.tsx          # Global chat component
│   ├── Navbar.tsx        # Main navigation
│   ├── UserNavbar.tsx    # Mentee navigation with links
│   └── MentorNavbar.tsx  # Mentor navigation
├── database/             # SQL schema files
│   ├── 01-chat-tables.sql
│   ├── 02-chat-security.sql
│   └── 03-chat-functions.sql
├── lib/
│   └── supabase.ts       # Supabase client
└── public/               # Static assets
```

---

## 🎮 How to Use

### For Students (Mentees)

1. **Sign up** as a mentee
2. **Complete the onboarding quiz** to share your interests and goals
3. **Explore career suggestions** tailored to your profile with AI-powered recommendations
4. **Save careers** you're interested in for later review
5. **Get scholarship guidance** - Click the "Get AI Financial & Scholarship Guidance" button to see universities with 70%+ scholarships
6. **Chat with MentorAssist** - Open the sidebar to get organized, formatted responses about:
   - Study plans and learning roadmaps
   - Scholarship application tips
   - University selection advice
   - Career development strategies
7. **Browse active mentors** in the sidebar and send connection requests
8. **Message mentors** for personalized guidance
9. **Access saved careers** from the navbar to review your bookmarked options
10. **View My Plans** for future learning roadmaps (coming soon features)

### For Mentors

1. **Sign up** as a mentor with your profession and experience
2. **Toggle your active status** to appear in the mentee dashboard sidebar
3. **Receive chat requests** from students seeking guidance
4. **Accept or decline** requests based on your availability
5. **Chat with mentees** to share your expertise and advice

---

## 🔑 Key Features Explained

### Career Fit Score Algorithm
The system calculates a personalized fit score (0-100) based on:
- Match between your interests and career title
- Overlap between your skills and required skills
- Your tech confidence level
- Your education goals

### MentorAssist Sidebar
- Slides in from the right with smooth animation
- Parses AI responses into organized format:
  - **Bold headings** for sections
  - Numbered lists for sequential steps
  - Bullet points for items
  - Clean paragraph spacing
- Quick-start suggestions for common questions
- Typing indicator with animated dots
- Smooth scrolling with hidden scrollbars

### Scholarship Guidance System
- Modal displays 10 universities with 70%+ scholarships
- Each university card shows:
  - Name and location
  - Scholarship percentage badge
  - Types of scholarships (color-coded pills)
  - Detailed description
  - Application requirements
  - Relevant programs
- "Ask AI" button for detailed questions
- "Search" button for Google search
- Additional resources section with scholarship databases

### Save & Organize System
- Click "⭐ Save" on any career to bookmark it
- Button changes to "✓ Saved" with green styling
- Saved careers stored in localStorage
- Dedicated page shows all saved careers with:
  - Full career details
  - Quick actions (View Full Details, Remove)
  - Empty state with call-to-action

### Real-time Mentor Status
- Mentors can toggle their "active" status
- Active mentors appear in the mentee sidebar
- Status updates every 30 seconds
- Shows mentor name, profession, and experience
- Pulse animation on active indicator

### Chat Request Flow
1. Mentee sends a chat request to a mentor
2. Mentor receives notification (badge on chat icon)
3. Mentor can accept or decline the request
4. Once accepted, both parties can exchange messages
5. Messages are stored and retrieved in real-time

### Rate Limit Handling
- Comprehensive fallback system for API rate limits
- 6 diverse career options with complete data
- Graceful degradation - app never breaks
- Transparent logging for debugging
- Users always get high-quality suggestions

---

## 🔒 Security Features

- Row Level Security (RLS) policies on all database tables
- User authentication required for all protected routes
- Authorization checks on all API endpoints
- Secure token-based authentication with Supabase

---

## 📚 Documentation

- [Supabase Setup Guide](./SUPABASE_SETUP.md) - Database configuration
- [Chat System Guide](./CHAT_SETUP.md) - Messaging system details

---

## 🎨 Design Highlights

- **Modern UI**: Clean, gradient-rich design with smooth animations
- **Slide-in Sidebar**: Beautiful MentorAssist sidebar with smooth entrance animation
- **Hidden Scrollbars**: Clean scrolling experience with `scrollbar-hide` utility
- **Smooth Scrolling**: CSS `scroll-behavior: smooth` for better UX
- **Gradient Buttons**: Eye-catching gradients (indigo to purple)
- **Responsive**: Fully responsive across desktop, tablet, and mobile
- **Accessible**: Semantic HTML and ARIA labels
- **Visual Feedback**: Hover effects, transitions, and state indicators
- **Color-Coded Elements**: Scholarship types, saved status, and badges
- **Empty States**: Helpful empty states with call-to-action buttons

---

## 🚧 Roadmap

### Completed ✅
- [x] AI-powered career suggestions with fallback system
- [x] MentorAssist sidebar with formatted responses
- [x] Scholarship guidance modal with 70%+ opportunities
- [x] Save careers functionality
- [x] Saved careers page
- [x] My Plans page structure
- [x] Navigation in navbar (Dashboard, My Plans, Saved)
- [x] Smooth scrolling with hidden scrollbars
- [x] Rate limit handling for API

### In Progress 🚧
- [ ] Study schedule creation and tracking
- [ ] Milestone tracking system
- [ ] Progress analytics dashboard

### Planned 📋
- [ ] Email notifications for chat requests
- [ ] Video call integration for mentor sessions
- [ ] Group mentorship sessions
- [ ] Resource library with courses and articles
- [ ] Mobile app (React Native)
- [ ] Advanced analytics for mentors
- [ ] Mentor rating and review system
- [ ] Calendar integration for scheduling
- [ ] Export saved careers as PDF
- [ ] Share career plans with mentors
- [ ] AI-generated study schedules
- [ ] Integration with scholarship databases

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Groq** for providing fast AI inference with Llama 3.3 70B
- **Meta AI** for the Llama language model
- **Supabase** for backend infrastructure and authentication
- **Vercel** for hosting and deployment
- **Next.js** team for the amazing framework
- **Tailwind CSS** for the utility-first styling system

---

## 📞 Support

For support, email support@mentorlaunch.com or join our Discord community.

---

**Built with ❤️ to help students find their path**

