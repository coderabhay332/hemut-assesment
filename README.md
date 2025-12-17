# Hemut Assignment

A full-stack web application with a FastAPI backend and Next.js frontend.

## Prerequisites

- Python 3.8+
- Node.js 18+
- npm or yarn

## Installation

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend/my-app
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

## Running Locally

### Backend

Start the FastAPI server:
```bash
cd backend
uvicorn main:app --reload
```

The backend will be available at [http://localhost:8000](http://localhost:8000).

### Frontend

Start the Next.js development server:
```bash
cd frontend/my-app
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

## API Documentation

Once the backend is running, you can access the API documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

## Database

The application uses SQLite by default. The database file `app.db` will be created automatically in the backend directory when you first run the application.

## Environment Variables

You can set the following environment variables:

- `DATABASE_URL`: Database connection string (default: `sqlite:///./app.db`)
- `SECRET_KEY`: JWT secret key (default: `your-secret-key-change-in-production`)
- `ADMIN_TOKEN`: Admin token for privileged operations (default: `secret-admin-token`)

Create a `.env` file in the backend directory to override these defaults.</content>
<parameter name="filePath">d:\project\hemut-assignment\README.md