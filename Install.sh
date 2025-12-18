#!/bin/bash

# Wingman Bot v2.0 - Installation Script
# Makes setup easier for non-technical users

set -e

echo "╔══════════════════════════════════════════════╗"
echo "║                                              ║"
echo "║          🤖 WINGMAN BOT v2.0                ║"
echo "║          Installation Script                 ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "🔍 Checking requirements..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo ""
    echo "Please install Node.js 18+ from: https://nodejs.org/"
    echo ""
    echo "Quick install options:"
    echo "  Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "  Mac: brew install node"
    echo "  Windows: Download from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Node.js version is ${NODE_VERSION}, but 18+ is recommended${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ Node.js $(node -v) installed${NC}"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "⚙️  Setting up configuration..."
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: You need to edit .env file with your details:${NC}"
    echo "   1. Your WhatsApp number (OWNER_NUMBER)"
    echo "   2. Your Google Gemini API key (GEMINI_API_KEY)"
    echo ""
    echo "   Get Gemini API key from: https://makersuite.google.com/app/apikey"
    echo ""
    read -p "Press Enter to open .env in editor..."
    
    # Try to open in various editors
    if command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    elif command -v vi &> /dev/null; then
        vi .env
    else
        echo "Please edit .env manually with a text editor"
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p data/conversations data/archives backups logs
echo -e "${GREEN}✅ Directories created${NC}"

# Set proper permissions
echo ""
echo "🔒 Setting file permissions..."
chmod 600 .env 2>/dev/null || true
chmod -R 700 data/ 2>/dev/null || true
echo -e "${GREEN}✅ Permissions set${NC}"

# Installation complete
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║                                              ║"
echo "║     ✅ INSTALLATION COMPLETE!                ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Make sure you've configured .env with:"
echo "   • Your WhatsApp number"
echo "   • Your Gemini API key"
echo ""
echo "2. Start the bot:"
echo "   ${GREEN}npm start${NC}"
echo ""
echo "3. Scan the QR code with WhatsApp"
echo "   (Settings > Linked Devices > Link a Device)"
echo ""
echo "4. Send unlock command via WhatsApp:"
echo "   ${GREEN}!unlock YourStrongPassword123${NC}"
echo ""
echo "5. Test with:"
echo "   ${GREEN}!help${NC}"
echo ""
echo "📚 Documentation:"
echo "   • README.md - Overview and features"
echo "   • SETUP_GUIDE.md - Detailed setup instructions"
echo "   • SECURITY_AUDIT.md - Security information"
echo "   • FEATURES_v2.0.md - All features explained"
echo ""
echo "🚀 Ready to use Wingman Bot!"
echo ""

# Offer to start bot
read -p "Start the bot now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Starting Wingman Bot..."
    echo ""
    npm start
fi