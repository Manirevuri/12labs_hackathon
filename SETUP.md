# Video Analysis Platform Setup Guide

This guide will help you set up the video analysis platform that integrates TwelveLabs Pegasus AI, OpenAI, Clerk authentication, and Neon PostgreSQL.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A TwelveLabs account and API key
- An OpenAI account and API key
- A Clerk account for authentication
- A Neon PostgreSQL database
- A Redis instance (for caching)

## Environment Variables

Copy the `.env.example` file to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

### Required Environment Variables

#### 1. TwelveLabs Configuration
```bash
TWELVELABS_API_KEY=your_twelvelabs_api_key_here
```
- **Where to get it**: [TwelveLabs Dashboard](https://dashboard.twelvelabs.io/)
- **Purpose**: Required for video analysis using Pegasus AI models

#### 2. OpenAI Configuration
```bash
OPENAI_API_KEY=your_openai_api_key_here
```
- **Where to get it**: [OpenAI API Keys](https://platform.openai.com/api-keys)
- **Purpose**: Used for GPT-4o-mini chat responses, sentence extraction, and embeddings

#### 3. Clerk Authentication
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```
- **Where to get it**: [Clerk Dashboard](https://dashboard.clerk.com/)
- **Purpose**: User authentication and session management

#### 4. Database Configuration
```bash
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
```
- **Where to get it**: [Neon Console](https://console.neon.tech/)
- **Purpose**: PostgreSQL database with pgvector extension for vector storage

#### 5. Redis Configuration
```bash
REDIS_URL=redis://default:password@host:port
```
- **Where to get it**: [Upstash Redis](https://upstash.com/) or any Redis provider
- **Purpose**: Caching video analysis results and session data

#### 6. Application URLs (Optional)
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```
- **Purpose**: Used for internal API calls and redirects
- **Note**: Set to your production domain when deploying

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
```bash
# Generate database schema
npm run db:generate

# Push schema to database
npm run db:push

# Optional: Open database studio
npm run db:studio
```

### 3. Create Database Tables
Visit `http://localhost:3000/api/db/create-tables` after starting the development server to initialize required tables.

### 4. Configure TwelveLabs
1. Create an account at [TwelveLabs](https://twelvelabs.io/)
2. Get your API key from the dashboard
3. Create at least one index for video uploads

### 5. Configure Clerk
1. Create a Clerk application
2. Set up authentication providers (email, Google, etc.)
3. Configure redirect URLs:
   - Sign-in: `http://localhost:3000/`
   - Sign-up: `http://localhost:3000/`
   - After sign-in: `http://localhost:3000/dashboard`

### 6. Set Up OpenAI
1. Create an OpenAI account
2. Add billing information (required for API access)
3. Generate an API key with sufficient credits

### 7. Configure Database
1. Create a Neon PostgreSQL database
2. Enable the `pgvector` extension:
   ```sql
   CREATE EXTENSION vector;
   ```
3. Copy the connection string to your `.env.local`

### 8. Set Up Redis
1. Create a Redis instance (Upstash recommended for serverless)
2. Copy the connection URL to your `.env.local`

## Development

Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Features

### Video Analysis
- Upload videos to TwelveLabs indexes
- Analyze videos using Pegasus AI models
- Store analysis results in Redis for fast access
- Extract sentences and create vector embeddings

### AI-Powered Chat
- Chat with your video content using GPT-4o-mini
- Context-aware responses based on video analysis
- Index-specific conversations
- Multi-turn chat with history

### Vector Search
- Semantic search across video content
- Similarity-based video discovery
- Graph visualization of video relationships

### User Management
- Secure authentication with Clerk
- User-specific video libraries
- Session management

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy

### Environment Variables for Production
- Update `NEXT_PUBLIC_BASE_URL` to your production domain
- Update `NEXTAUTH_URL` to your production domain
- Ensure all API keys are production-ready
- Use production Redis and database instances

## Troubleshooting

### Common Issues

1. **TwelveLabs API errors**
   - Verify API key is correct
   - Check if you have sufficient credits
   - Ensure video formats are supported

2. **Database connection issues**
   - Verify DATABASE_URL format
   - Ensure pgvector extension is installed
   - Check firewall settings for database access

3. **OpenAI API errors**
   - Verify API key and billing setup
   - Check rate limits and quotas
   - Ensure sufficient credits

4. **Clerk authentication issues**
   - Verify publishable and secret keys
   - Check redirect URLs configuration
   - Ensure domain is added to allowed origins

## Support

- TwelveLabs: [Documentation](https://docs.twelvelabs.io/)
- OpenAI: [API Documentation](https://platform.openai.com/docs)
- Clerk: [Documentation](https://clerk.com/docs)
- Neon: [Documentation](https://neon.tech/docs)

## License

This project is for educational and development purposes.