#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Installing AI Thinktank Room Extension...${NC}"

# 1. Verify git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed.${NC}"
    echo "Please install git and try again."
    exit 1
fi

# 2. Verify pi is installed
if ! command -v pi &> /dev/null; then
    echo -e "${RED}Error: pi is not installed.${NC}"
    echo "Please install the Pi Coding Agent first:"
    echo -e "${GREEN}npm install -g @earendil-works/pi-coding-agent${NC}"
    exit 1
fi

# Target reference (branch or tag) to install from, defaulting to main
AI_THINKTANK_REF="${AI_THINKTANK_REF:-main}"

# 3. Setup install directory
INSTALL_DIR="$HOME/.ai-thinktank/ai-thinktank"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${BLUE}Updating existing repository at $INSTALL_DIR...${NC}"
    cd "$INSTALL_DIR"
    git fetch origin "$AI_THINKTANK_REF"
    git checkout "$AI_THINKTANK_REF"
    git reset --hard "origin/$AI_THINKTANK_REF"
else
    echo -e "${BLUE}Cloning repository to $INSTALL_DIR...${NC}"
    mkdir -p "$HOME/.ai-thinktank"
    git clone https://github.com/juanrgon/ai-thinktank.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    git checkout "$AI_THINKTANK_REF"
fi

# 4. Install the extension using pi
echo -e "${BLUE}Registering extension with Pi...${NC}"
pi install "$INSTALL_DIR/packages/coding-agent/examples/extensions/thinktank-room"

echo -e "${GREEN}Installation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run ${GREEN}pi${NC} to start the agent"
echo "2. Type ${GREEN}/reload${NC}"
echo "3. Type ${GREEN}/roster${NC} (if no models appear, run /login first)"
echo "4. Type ${GREEN}/thinktank on${NC} to enter the room"
