#!/bin/bash

# Elite Canine Academy - AWS Deployment Scripts
# This script helps deploy your app to AWS Free Tier

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="elite-canine-academy"
REGION="us-east-1"  # Required for CloudFront
PROJECT_DIR="."

echo -e "${BLUE}🐕 Elite Canine Academy - AWS Deployment Script${NC}"
echo "=============================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first:${NC}"
    echo "   macOS: brew install awscli"
    echo "   Ubuntu: sudo apt install awscli"
    echo "   Windows: Download from https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run:${NC}"
    echo "   aws configure"
    echo "   Enter your AWS Access Key ID and Secret Access Key"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Function to deploy with CloudFormation
deploy_cloudformation() {
    echo -e "${BLUE}🚀 Deploying infrastructure with CloudFormation...${NC}"
    
    aws cloudformation deploy \
        --template-file cloudformation-template-simple.yaml \
        --stack-name $STACK_NAME \
        --region $REGION \
        --parameter-overrides DomainName=elite-canine-academy
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Infrastructure deployed successfully!${NC}"
        
        # Get outputs
        S3_BUCKET=$(aws cloudformation describe-stacks \
            --stack-name $STACK_NAME \
            --region $REGION \
            --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
            --output text)
        
        WEBSITE_URL=$(aws cloudformation describe-stacks \
            --stack-name $STACK_NAME \
            --region $REGION \
            --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
            --output text)
        
        echo -e "${BLUE}📦 S3 Bucket: ${NC}$S3_BUCKET"
        echo -e "${BLUE}🌐 Website URL: ${NC}$WEBSITE_URL"
        
        # Build and deploy the app
        build_and_deploy $S3_BUCKET $WEBSITE_URL
    else
        echo -e "${RED}❌ Infrastructure deployment failed${NC}"
        exit 1
    fi
}

# Function to build and deploy the React app
build_and_deploy() {
    local bucket_name=$1
    local website_url=$2
    
    echo -e "${BLUE}🔨 Building React app...${NC}"
    
    cd $PROJECT_DIR
    
    # Install dependencies and build
    npm ci
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build successful!${NC}"
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}📤 Uploading to S3...${NC}"
    
    # Sync build folder to S3
    aws s3 sync build/ s3://$bucket_name \
        --region $REGION \
        --delete \
        --cache-control "public, max-age=31536000" \
        --exclude "*.html" \
        --exclude "service-worker.js"
    
    # Upload HTML files with no-cache headers
    aws s3 sync build/ s3://$bucket_name \
        --region $REGION \
        --cache-control "public, max-age=0, must-revalidate" \
        --exclude "*" \
        --include "*.html" \
        --include "service-worker.js"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Upload successful!${NC}"
        echo ""
        echo -e "${YELLOW}🎉 Deployment Complete!${NC}"
        echo -e "${BLUE}Your app is live at: ${NC}$website_url"
        echo ""
        echo -e "${YELLOW}⏱️  Note: Your website is immediately available!${NC}"
        echo -e "${BLUE}💰 Monthly cost: ${GREEN}\$0.00${NC} (within AWS Free Tier)"
    else
        echo -e "${RED}❌ Upload failed${NC}"
        exit 1
    fi
    
    cd ..
}

# Function to update existing deployment
update_deployment() {
    echo -e "${BLUE}🔄 Updating existing deployment...${NC}"
    
    # Get existing bucket name
    S3_BUCKET=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
        --output text 2>/dev/null)
    
    if [ -z "$S3_BUCKET" ]; then
        echo -e "${RED}❌ No existing deployment found. Use 'deploy' option first.${NC}"
        exit 1
    fi
    
    WEBSITE_URL=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
        --output text)
    
    build_and_deploy $S3_BUCKET $WEBSITE_URL
}

# Function to destroy the deployment
destroy_deployment() {
    echo -e "${RED}🗑️  Destroying deployment...${NC}"
    
    # Get bucket name before deleting stack
    S3_BUCKET=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
        --output text 2>/dev/null)
    
    if [ ! -z "$S3_BUCKET" ]; then
        echo -e "${BLUE}🗑️  Emptying S3 bucket...${NC}"
        aws s3 rm s3://$S3_BUCKET --recursive --region $REGION
    fi
    
    echo -e "${BLUE}🗑️  Deleting CloudFormation stack...${NC}"
    aws cloudformation delete-stack \
        --stack-name $STACK_NAME \
        --region $REGION
    
    echo -e "${GREEN}✅ Deployment destroyed. No more AWS charges.${NC}"
}

# Main menu
case "${1:-}" in
    "deploy")
        deploy_cloudformation
        ;;
    "update")
        update_deployment
        ;;
    "destroy")
        read -p "Are you sure you want to destroy the deployment? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            destroy_deployment
        else
            echo "Cancelled."
        fi
        ;;
    *)
        echo -e "${YELLOW}Usage: $0 {deploy|update|destroy}${NC}"
        echo ""
        echo -e "${BLUE}Commands:${NC}"
        echo -e "  ${GREEN}deploy${NC}   - Deploy new infrastructure and app"
        echo -e "  ${GREEN}update${NC}   - Update existing deployment with latest code"
        echo -e "  ${GREEN}destroy${NC}  - Remove all AWS resources (stops billing)"
        echo ""
        echo -e "${BLUE}Examples:${NC}"
        echo -e "  ./deploy-scripts.sh deploy   # First time deployment"
        echo -e "  ./deploy-scripts.sh update   # Update after code changes"
        echo -e "  ./deploy-scripts.sh destroy  # Clean up everything"
        exit 1
        ;;
esac
