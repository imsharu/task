<<<<<<< HEAD
#!/bin/bash
echo "Deploying application to staging environment..."
# Mock deployment actions here
echo "Deployment complete!"
=======
echo "Starting deployment..."
sudo apt update -y
sudo apt install python3-pip -y
pip3 install -r requirements.txt
nohup python3 app.py > app.log 2>&1 &
echo "Application deployed successfully!"
>>>>>>> 5d9e8c5 (initial commit)
