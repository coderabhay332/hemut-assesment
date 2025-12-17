#!/bin/bash

set -e

APP_DIR="/opt/hemut-backend"
SERVICE_NAME="hemut-backend"
DEPLOY_USER="ubuntu"

echo "🚀 Starting deployment..."

if [ ! -d "$APP_DIR" ]; then
    echo "📁 Creating application directory..."
    sudo mkdir -p $APP_DIR
    sudo chown $DEPLOY_USER:$DEPLOY_USER $APP_DIR
fi

echo "📦 Extracting deployment package..."
cd /tmp
tar -xzf backend-deploy.tar.gz -C $APP_DIR --strip-components=1

echo "🐍 Setting up Python virtual environment..."
cd $APP_DIR
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "🔧 Setting up systemd service..."
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=Hemut Backend FastAPI Application
After=network.target

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
EnvironmentFile=$APP_DIR/.env
ExecStart=$APP_DIR/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

if [ ! -f "$APP_DIR/.env" ]; then
    echo "⚠️  Creating .env file template..."
    sudo tee $APP_DIR/.env > /dev/null <<EOF
DATABASE_URL=sqlite:///./app.db
ADMIN_TOKEN=your-admin-token-here
SECRET_KEY=your-secret-key-here
EOF
    sudo chown $DEPLOY_USER:$DEPLOY_USER $APP_DIR/.env
    echo "⚠️  Please update $APP_DIR/.env with your actual values!"
fi

echo "🔄 Reloading systemd and restarting service..."
sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}
sudo systemctl restart ${SERVICE_NAME}

echo "⏳ Waiting for service to start..."
sleep 5

if sudo systemctl is-active --quiet ${SERVICE_NAME}; then
    echo "✅ Service is running!"
    sudo systemctl status ${SERVICE_NAME} --no-pager
else
    echo "❌ Service failed to start. Checking logs..."
    sudo journalctl -u ${SERVICE_NAME} -n 50 --no-pager
    exit 1
fi

echo "🧹 Cleaning up..."
rm -f /tmp/backend-deploy.tar.gz
rm -f /tmp/deploy.sh

echo "✅ Deployment completed successfully!"
