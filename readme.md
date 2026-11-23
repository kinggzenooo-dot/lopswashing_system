# Lops Carwash Management System

A cloud-ready Flask web application for carwash operations, inventory tracking, sales processing, and customer ordering.

## Cloud Architecture

- **Backend**: Python (Flask, Gunicorn)
- **Database**: [Supabase](https://supabase.com) (Cloud PostgreSQL) - No XAMPP or local MySQL required!
- **Hosting**: [Render](https://render.com) (Python Web Service)

---

## 1. Quick Supabase Setup (2 Minutes)

1. Sign up or log in at **[supabase.com](https://supabase.com)** and create a new project.
2. In your Supabase Dashboard, navigate to the **SQL Editor** tab on the left sidebar.
3. Open the file [`database/supabase_setup.sql`](database/supabase_setup.sql), copy its entire contents, paste it into the SQL Editor, and click **Run**.
   - This creates all necessary tables (`users`, `customers`, `products`, `suppliers`, `sales`, `sale_items`) with Row Level Security open for the anon key.
   - It also automatically provisions the default administrator account:
     - **Email**: `admin@lopscarwash.ph`
     - **Password**: `thelegend54`
4. Go to **Project Settings** -> **API** and copy:
   - **Project URL** (e.g., `https://xyzproject.supabase.co`)
   - **Project API Keys** -> `anon` / `public`

---

## 2. Deploy to Render

1. Log in to **[render.com](https://render.com)**.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `https://github.com/kinggzenooo-dot/lopswashing_system.git`.
4. Configure the service:
   - **Name**: `lops-carwash`
   - **Language**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m gunicorn app:app`
5. Under **Environment Variables**, add:
   - `SUPABASE_URL`: `<your-supabase-project-url>`
   - `SUPABASE_KEY`: `<your-supabase-anon-key>`
   - `SECRET_KEY`: `<any-random-string>`
   - `PYTHON_VERSION`: `3.12.6`
6. Click **Deploy Web Service**.

Once deployed, visit `https://<your-render-subdomain>.onrender.com`!

---

## 3. Local Development

To run locally without XAMPP:

1. Create a `.env` file in the root directory:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   SECRET_KEY=your-local-secret-key
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Test connection:
   ```bash
   python init_db.py
   ```
4. Start server:
   ```bash
   python app.py
   ```
   Open `http://localhost:5000` in your browser.
