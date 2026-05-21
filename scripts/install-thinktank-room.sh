#!/usr/bin/env bash
set -e

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

# 3. Setup install directory
INSTALL_DIR="$HOME/.ai-thinktank/ai-thinktank"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${BLUE}Updating existing repository at $INSTALL_DIR...${NC}"
    cd "$INSTALL_DIR"
    git fetch origin
    # If the user is testing the feature branch script, we use that branch. Otherwise main.
    BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")
    if [ "$BRANCH" = "feature/agent-interrupts" ]; then
        git reset --hard origin/feature/agent-interrupts
    else
        git reset --hard origin/main
    fi
else
    echo -e "${BLUE}Cloning repository to $INSTALL_DIR...${NC}"
    mkdir -p "$HOME/.ai-thinktank"
    git clone https://github.com/juanrgon/ai-thinktank.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    # Try to checkout the feature branch if it exists remotely, otherwise stick to main
    if git ls-remote --exit-code --heads origin feature/agent-interrupts >/dev/null 2>&1; then
        git checkout feature/agent-interrupts
    fi
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
