#!/bin/bash
set -e
REGION=ap-south-1
BUCKET=cloudclean-deploy-647106553742

echo "Step: installing packages"
# Amazon Linux 2023's default python3 is 3.9, which can't parse this codebase's
# `X | None` type hints (needs 3.10+) — install python3.12 explicitly.
dnf install -y python3.12 python3.12-pip nginx unzip

echo "Step: downloading + extracting app packages"
mkdir -p /opt/cloudclean/backend /opt/cloudclean/frontend
cd /opt/cloudclean
aws s3 cp s3://$BUCKET/backend.zip backend.zip --region $REGION
aws s3 cp s3://$BUCKET/frontend.zip frontend.zip --region $REGION
unzip -o backend.zip -d backend || true
unzip -o frontend.zip -d frontend || true

echo "Step: setting up python venv"
rm -rf /opt/cloudclean/backend/.venv
python3.12 -m venv /opt/cloudclean/backend/.venv
/opt/cloudclean/backend/.venv/bin/pip install --upgrade pip -q
/opt/cloudclean/backend/.venv/bin/pip install -r /opt/cloudclean/backend/requirements.txt -q

echo "Step: fetching config from SSM Parameter Store (values not echoed)"
POOL_ID=$(aws ssm get-parameter --name /cloudclean/prod/cognito_user_pool_id --region $REGION --query Parameter.Value --output text)
CLIENT_ID=$(aws ssm get-parameter --name /cloudclean/prod/cognito_app_client_id --region $REGION --query Parameter.Value --output text)
CLIENT_SECRET=$(aws ssm get-parameter --name /cloudclean/prod/cognito_app_client_secret --with-decryption --region $REGION --query Parameter.Value --output text)
AWS_REGION_VAL=$(aws ssm get-parameter --name /cloudclean/prod/aws_region --region $REGION --query Parameter.Value --output text)
ACCOUNT_ID=$(aws ssm get-parameter --name /cloudclean/prod/platform_aws_account_id --region $REGION --query Parameter.Value --output text)

cat > /opt/cloudclean/backend/.env << ENVEOF
COGNITO_USER_POOL_ID=$POOL_ID
COGNITO_APP_CLIENT_ID=$CLIENT_ID
COGNITO_APP_CLIENT_SECRET=$CLIENT_SECRET
AWS_REGION=$AWS_REGION_VAL
PLATFORM_AWS_ACCOUNT_ID=$ACCOUNT_ID
ENVEOF
chmod 600 /opt/cloudclean/backend/.env
chown -R ec2-user:ec2-user /opt/cloudclean
unset CLIENT_SECRET POOL_ID CLIENT_ID AWS_REGION_VAL ACCOUNT_ID
echo "Step: wrote .env (600 perms, values withheld from this log)"

echo "Step: writing systemd unit"
cat > /etc/systemd/system/cloudclean.service << 'UNITEOF'
[Unit]
Description=CloudClean FastAPI backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/cloudclean/backend
Environment=PYTHONUNBUFFERED=1
ExecStart=/opt/cloudclean/backend/.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
User=ec2-user

[Install]
WantedBy=multi-user.target
UNITEOF

echo "Step: writing nginx config"
cat > /etc/nginx/conf.d/cloudclean.conf << 'NGINXEOF'
server {
    listen 80 default_server;
    server_name _;
    root /opt/cloudclean/frontend;
    index index.html;

    location /api/ {
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri /index.html;
    }
}
NGINXEOF

rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

echo "Step: starting services"
systemctl daemon-reload
systemctl enable cloudclean
systemctl restart cloudclean
sleep 2
nginx -t
systemctl enable nginx
systemctl restart nginx

sleep 2
echo "=== cloudclean.service status ==="
systemctl is-active cloudclean
echo "=== nginx status ==="
systemctl is-active nginx
echo "=== local health check ==="
curl -s http://127.0.0.1:8000/health
echo
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
