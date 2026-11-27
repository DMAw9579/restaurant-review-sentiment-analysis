# 🍽️ AI-Powered Restaurant Review & Sentiment Analysis System

An intelligent web application that helps users explore restaurants, submit reviews, analyze customer sentiment, and understand restaurant performance through review insights and AI-assisted features.

## 📌 Project Overview

The AI-Powered Restaurant Review & Sentiment Analysis System is a web-based application developed using Node.js, Express.js, MongoDB, Python, and EJS.

The application allows users to register, log in, browse restaurants, submit ratings and reviews, and view review-related insights. It also includes sentiment classification and optional AI-powered review summaries, recommendations, and chatbot responses using the Anthropic Claude API.

## 🎯 Project Objectives

- Collect and manage restaurant customer reviews.
- Classify customer feedback into positive, negative, and neutral sentiment.
- Help users understand restaurant ratings and customer opinions.
- Visualize review and sentiment-related information.
- Provide AI-assisted summaries and restaurant recommendations.

## ✨ Key Features

### 1. User Authentication
- User registration and login.
- Session-based authentication.
- User profile and review management.

### 2. Restaurant Review Management
- Browse available restaurants.
- Submit restaurant ratings and reviews.
- Manage restaurant information.
- Delete personal reviews.

### 3. Sentiment Analysis
- Analyze customer review text.
- Classify feedback into positive, negative, and neutral categories.
- Identify customer opinions using rule-based sentiment classification.

### 4. Dashboard and Data Visualization
- Review-related dashboard.
- Restaurant rating visualizations.
- Sentiment charts.
- Review insights.

### 5. AI-Powered Features
- AI-assisted restaurant review summaries.
- Restaurant recommendations.
- Interactive chatbot.
- Rule-based fallback when the Claude API is unavailable.

### 6. Admin Features
- Admin login.
- Admin-facing restaurant and review management pages.

## 🛠️ Technologies Used

| Category | Technologies |
|---|---|
| Programming Languages | JavaScript, Python |
| Backend | Node.js, Express.js |
| Frontend | HTML, CSS, JavaScript, EJS |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | Express Session, bcrypt |
| AI Integration | Anthropic Claude API |
| Data Processing | CSV, JSON |
| Version Control | Git, GitHub |

## 🏗️ Project Architecture

The application follows a modular MVC-style structure.

- **Models:** Define MongoDB data structures.
- **Views:** Display application pages using EJS templates.
- **Controllers:** Handle authentication, reviews, admin operations, and AI requests.
- **Routes:** Define application endpoints.
- **Middleware:** Handle authentication checks.
- **Utils:** Contain sentiment analysis, data aggregation, and AI service logic.

## 📂 Project Folder Structure

```text
restaurant-review-sentiment-analysis/
│
├── README.md
├── app.js
├── app.py
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
│
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── reviewController.js
│   └── aiController.js
│
├── models/
│   ├── Admin.js
│   ├── User.js
│   ├── UserReview.js
│   └── Restaurant.js
│
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── reviewRoutes.js
│   └── aiRoutes.js
│
├── middleware/
│   └── authMiddleware.js
│
├── utils/
│   ├── aiService.js
│   ├── dataAggregator.js
│   └── sentiment.js
│
├── views/
│   ├── index.ejs
│   ├── dashboard.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── profile.ejs
│   ├── admin.ejs
│   ├── adminLogin.ejs
│   ├── add_review.ejs
│   ├── add_restaurant.ejs
│   ├── edit_restaurant.ejs
│   ├── recommendations.ejs
│   ├── sentiment_chart.ejs
│   ├── views_chart.ejs
│   ├── views_rating.ejs
│   └── partials/
│       └── chatbot.ejs
│
├── public/
│   └── js/
│       └── charts.js
│
└── data/
    ├── reviews.csv
    └── reviews.json
```

## ⚙️ Installation and Setup

### Prerequisites

Install the following before running the project:

- Node.js (version 18 or later)
- npm
- MongoDB Community Server or MongoDB Atlas
- Git (optional)

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/restaurant-review-sentiment-analysis.git
```

### Step 2: Navigate to the Project

```bash
cd restaurant-review-sentiment-analysis
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

Create a `.env` file in the project root using `.env.example` as a template.

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/restaurant_reviews
SESSION_SECRET=your_private_random_secret
ANTHROPIC_API_KEY=
AI_MODEL=claude-haiku-4-5-20251001
```

Keep your actual `.env` file private. Never upload API keys or database credentials to GitHub.

### Step 5: Start MongoDB

Make sure your MongoDB service is running, or configure a valid MongoDB Atlas connection URI.

### Step 6: Run the Application

```bash
npm start
```

### Step 7: Open the Application

Visit the following address in your browser:

```text
http://localhost:3000
```

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| PORT | Application server port |
| MONGODB_URI | MongoDB connection string |
| SESSION_SECRET | Session security secret |
| ANTHROPIC_API_KEY | Optional Claude API key |
| AI_MODEL | Claude model identifier |

## 📊 Sample Dataset

The project includes sample restaurant review data in CSV and JSON formats.

The dataset contains fields such as:

- Restaurant name
- City
- Review date
- Review rating
- Review text
- Review sentiment

## 🚀 Future Enhancements

- Advanced NLP-based sentiment analysis.
- More detailed customer feedback analytics.
- Additional restaurant performance metrics.
- Improved dashboard visualizations.
- Deployment to a cloud platform.

## 👩‍💻 Author

Deepika Awachar

B.Tech – Computer Science and Engineering

GitHub: https://github.com/YOUR-DMAw9579

LinkedIn: https://linkedin.com/in/deepikaawachar718

---

⭐ If you find this project interesting, feel free to explore the repository and its features.
