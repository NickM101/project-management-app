#!/bin/bash
# Script to copy generated Prisma client to dist directory after build

SRC_DIR="src/generated/prisma"
DEST_DIR="dist/src/generated/prisma"

echo "Copying Prisma client from $SRC_DIR to $DEST_DIR"

mkdir -p "$DEST_DIR"
cp -r "$SRC_DIR/"* "$DEST_DIR/"

echo "Copy completed."
