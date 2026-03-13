# Supabase Integration Guide

This guide explains how to migrate from Firebase to Supabase for the Control application.

## 1. Supabase Project Setup
1. Create a new project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** and paste the contents of `supabase_schema.sql` found in the root of this repository. Run the script.
3. Go to **Project Settings > API** and copy your `Project URL` and `anon public` key.

## 2. Environment Variables
Add the following to your `.env` file in the repository root:
```
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

## 3. Website Migration
The files in the `website/` folder have been updated to use the Supabase JS SDK.
1. Replace the Firebase CDN scripts in `index.html`, `login.html`, and `signup.html` with:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```
2. Update the logic in `login.js` and `signup.js` to use `supabase.auth.signInWithPassword` and `supabase.auth.signUp`.

## 4. User Entry IDs
Control uses a 12-digit Entry ID for desktop login. This is generated when a user signs up on the website and is stored in the `users` table.

## 5. Security Policies (RLS)
Row Level Security is enabled by default in the provided schema.
- Users can only read and update their own profiles.
- API keys in `app_config` are read-only for authenticated users.
