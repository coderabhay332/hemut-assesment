# CI/CD Pipeline Documentation

This repository includes GitHub Actions workflows for continuous integration and deployment.

## Workflows

### 1. Backend CI/CD (`backend-ci.yml`)
Runs on changes to the `backend/` directory.

**Jobs:**
- **test**: Runs code quality checks, linting, and verifies the FastAPI app starts
- **build**: Verifies the backend can be built successfully

**Checks:**
- Python code formatting (Black)
- Code linting (flake8)
- Import verification
- Database connection test
- FastAPI app startup test

### 2. Full CI/CD Pipeline (`full-ci.yml`)
Runs on all pushes and pull requests to main/master branches.

**Jobs:**
- **backend**: Backend tests and checks
- **integration**: Integration summary

### 3. Deploy (`deploy.yml`)
Runs on pushes to main/master branches (production deployment).

**Jobs:**
- **deploy-backend**: Creates backend deployment package

## Usage

### Running Locally

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  
pip install -r requirements.txt
pip install black flake8 pytest pytest-cov




### GitHub Actions

Workflows run automatically on:
- Push to `main`, `master`, or `develop` branches
- Pull requests to `main`, `master`, or `develop` branches
- Manual trigger via `workflow_dispatch`

### Viewing Workflow Results

1. Go to your GitHub repository
2. Click on the "Actions" tab
3. Select a workflow run to see detailed logs

## Environment Variables

For local development, create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=sqlite:///./app.db
ADMIN_TOKEN=your-admin-token-here
SECRET_KEY=your-secret-key-here
```

For CI/CD, these are set in the workflow files or should be configured as GitHub Secrets for production deployments.

## Deployment

The deploy workflow creates artifacts that can be used for deployment:

- **Backend**: `backend-deploy.tar.gz` - Contains all Python files and requirements

### AWS Deployment (Optional)

To deploy to AWS, you can:

1. Use the deployment artifacts from GitHub Actions
2. Set up AWS credentials as GitHub Secrets
3. Add deployment steps to the workflow to upload to AWS (EC2, ECS, Lambda, etc.)

## Troubleshooting

### Backend CI Fails

- Check Python version compatibility (currently 3.11)
- Verify all dependencies are in `requirements.txt`
- Ensure database connection string is valid

### Workflow Not Running

- Ensure workflow files are in `.github/workflows/`
- Check branch names match workflow triggers
- Verify file paths in `paths:` filters are correct

## Next Steps

1. Add unit tests for backend (`pytest`)
2. Set up AWS deployment automation
3. Add webhook notifications for failed builds
