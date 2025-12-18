#!/bin/bash

echo "Installing Sequential Hub dependencies..."

# Try to install with npm first
if command -v npm &> /dev/null; then
    echo "Using npm to install dependencies..."
    npm install --legacy-peer-deps --no-audit
    if [ $? -eq 0 ]; then
        echo "Dependencies installed successfully with npm!"
        exit 0
    fi
fi

# Try yarn if npm fails
if command -v yarn &> /dev/null; then
    echo "Using yarn to install dependencies..."
    yarn install
    if [ $? -eq 0 ]; then
        echo "Dependencies installed successfully with yarn!"
        exit 0
    fi
fi

# Try pnpm if both npm and yarn fail
if command -v pnpm &> /dev/null; then
    echo "Using pnpm to install dependencies..."
    pnpm install
    if [ $? -eq 0 ]; then
        echo "Dependencies installed successfully with pnpm!"
        exit 0
    fi
fi

echo "Failed to install dependencies. Please try manually:"
echo "npm install --legacy-peer-deps"
echo "or"
echo "yarn install"
echo "or"
echo "pnpm install"

