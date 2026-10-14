# Supabase setup for DebateLab

Use this when you are ready to make accounts and scores persist for real users.

## 1. Create the free Supabase project

1. Go to Supabase.
2. Create a new project on the free plan.
3. Open **SQL Editor**.
4. Paste and run the contents of `supabase/schema.sql`.

## 2. Copy these keys

Open **Project Settings > API** and copy:

- Project URL
- anon public key
- service_role secret key

## 3. Add the keys to Vercel

In the Vercel project settings, add these environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Keep `SUPABASE_SERVICE_ROLE_KEY` private. Do not put it in browser code.

## 4. Configure Supabase magic links

In Supabase, open **Authentication > URL Configuration**.

Set the site URL to:

```text
https://debatelab-smoky.vercel.app
```

Add this redirect URL:

```text
https://debatelab-smoky.vercel.app/api/login/callback
```

## 5. Redeploy

After the variables are saved, redeploy the Vercel site. Then:

1. Open `/register`.
2. Create a profile.
3. Click the Supabase email magic link.
4. Complete a bot debate.
5. Check that the dashboard remembers the score after refresh.
