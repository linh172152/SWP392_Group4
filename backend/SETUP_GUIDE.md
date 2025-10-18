# 🚀 EV Battery Swap Station - Setup Guide

## 📋 Prerequisites

- Node.js 20+ installed
- Git installed
- Text editor (VS Code recommended)

---

## 🗄️ Database Setup Guide

### **Step 1: Install PostgreSQL + pgAdmin4**

#### **Windows Installation:**

1. **Download PostgreSQL:**
   ```
   https://www.postgresql.org/download/windows/
   → Download PostgreSQL 15 or 16
   → Run installer: postgresql-15.x-windows-x64.exe
   ```

2. **Installation Options:**
   ```
   ✅ Components:
      [x] PostgreSQL Server
      [x] pgAdmin 4  
      [x] Command Line Tools
   
   ✅ Port: 5432 (default)
   ✅ Superuser password: [Choose a strong password - REMEMBER THIS!]
   ✅ Locale: Default
   ```

3. **Verify Installation:**
   ```bash
   # Open Command Prompt
   psql --version
   # Should output: psql (PostgreSQL) 15.x
   ```

---

### **Step 2: Create Database using pgAdmin4**

1. **Launch pgAdmin4:**
   ```
   Start Menu → pgAdmin 4
   → Browser opens at: http://localhost:xxxx
   ```

2. **Connect to Server:**
   ```
   - Left sidebar: Servers → PostgreSQL 15 (right-click) → Connect
   - Enter master password (set during installation)
   ```

3. **Create New Database:**
   ```
   - Servers → PostgreSQL 15 → Databases (right-click)
   → Create → Database...
   
   Database name: ev_battery_swap_db
   Owner: postgres
   Encoding: UTF8
   Template: template0
   
   → Click "Save"
   ```

4. **Test Connection:**
   ```
   - Click on: ev_battery_swap_db
   - Click: Tools → Query Tool (or press F5)
   - Run query:
   
   SELECT version();
   
   → Should show PostgreSQL version
   ```

---

### **Step 3: Setup Backend Project**

1. **Navigate to backend folder:**
   ```bash
   cd D:/FPT/SWP/SWP392_Group4/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Prisma:**
   ```bash
   npm install prisma @prisma/client
   npm install -D typescript ts-node @types/node
   ```

4. **Initialize Prisma:**
   ```bash
   npx prisma init
   ```
   
   This creates:
   ```
   backend/
   ├── prisma/
   │   └── schema.prisma
   └── .env
   ```

---

### **Step 4: Configure Database Connection**

1. **Edit `.env` file:**
   ```env
   # .env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ev_battery_swap_db?schema=public"
   
   # Replace YOUR_PASSWORD with your PostgreSQL password
   ```

2. **Example:**
   ```env
   # If your password is "admin123"
   DATABASE_URL="postgresql://postgres:admin123@localhost:5432/ev_battery_swap_db?schema=public"
   ```

---

### **Step 5: Run Prisma Migrations**

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Create and run migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```
   
   This will:
   - Create all 13 tables
   - Create all indexes
   - Create all constraints
   - Generate Prisma Client

3. **Verify in pgAdmin4:**
   ```
   - Refresh: ev_battery_swap_db → Schemas → public → Tables
   - You should see 13 tables:
     ✅ User
     ✅ Vehicle
     ✅ Station
     ✅ Battery
     ✅ Booking
     ✅ Transaction
     ✅ Payment
     ✅ ServicePackage
     ✅ UserSubscription
     ✅ SupportTicket
     ✅ TicketReply
     ✅ StationRating
     ✅ BatteryTransferLog
   ```

---

### **Step 6: Open Prisma Studio (Optional)**

```bash
npx prisma studio
```

→ Opens at: http://localhost:5555
→ GUI to view/edit database data

---

## 🐳 Alternative: Docker Setup (Advanced)

Create `docker-compose.yml` in backend folder:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ev_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ev_battery_swap_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: ev_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@evbss.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

**Usage:**
```bash
# Start services
docker-compose up -d

# Access pgAdmin at: http://localhost:5050
# Email: admin@evbss.com
# Password: admin

# Stop services
docker-compose down
```

---

## 🛠️ Troubleshooting

### **Error: "psql: error: connection to server"**
```bash
# Check if PostgreSQL is running
# Windows: Services → postgresql-x64-15 → Start

# Or restart service:
net stop postgresql-x64-15
net start postgresql-x64-15
```

### **Error: "password authentication failed"**
```bash
# Check your password in .env
# Or reset password:
# 1. Open pgAdmin
# 2. Servers → PostgreSQL 15 → Login/Group Roles → postgres (right-click)
# 3. Properties → Definition → Password
```

### **Error: "Port 5432 already in use"**
```bash
# Check what's using the port
netstat -ano | findstr :5432

# Stop conflicting service or change port in:
# - PostgreSQL config
# - DATABASE_URL in .env
```

### **Prisma migration fails**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually drop all tables in pgAdmin and re-run
npx prisma migrate dev --name init
```

---

## 📊 Verify Database Setup

Run this query in pgAdmin4 Query Tool:

```sql
-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return: 13

-- Check indexes
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## ✅ Checklist

```
Setup Checklist:
□ PostgreSQL 15+ installed
□ pgAdmin4 accessible
□ Database 'ev_battery_swap_db' created
□ .env configured with DATABASE_URL
□ npm install completed
□ Prisma initialized
□ prisma migrate dev completed
□ 13 tables visible in pgAdmin4
□ Prisma Studio works (optional)
```

---

## 🚀 Next Steps

After database setup:

1. **Seed initial data** (optional):
   ```bash
   npx prisma db seed
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Test API endpoints** with Postman/Thunder Client

---

## 📚 Useful Commands

```bash
# Prisma commands
npx prisma studio              # Open GUI
npx prisma migrate dev         # Create migration
npx prisma migrate reset       # Reset database
npx prisma generate            # Generate client
npx prisma db push             # Push schema without migration
npx prisma db pull             # Pull schema from database

# PostgreSQL commands
psql -U postgres -d ev_battery_swap_db    # Connect via CLI
\dt                                        # List tables
\d table_name                              # Describe table
\q                                         # Quit
```

---

**Setup guide complete! Ready to start coding! 🎉**

