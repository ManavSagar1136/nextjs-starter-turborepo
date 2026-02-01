# Media Library User Guide

## Overview

The Media Library provides a comprehensive interface for managing your digital assets, including images, documents, and other files.

## Features

### Asset Management

- Upload assets
- Organize assets into folders
- Tag assets for easy categorization
- Search and filter assets (with debounced search)
- Bulk operations (delete, move, assign/remove tags)
- Advanced sorting (name, size, date, type)
- Drag and drop assets to folders
- Keyboard shortcuts for quick actions

### Folder Management

- Create nested folder structures (up to 10 levels)
- Move folders (with circular reference prevention)
- Delete folders (with recursive option)
- Visual folder tree navigation

### Tag Management

- Create and manage tags with colors
- Assign multiple tags to assets (max 20 per asset)
- Filter assets by tags
- Bulk tag assignment/removal

## Keyboard Shortcuts

- **Ctrl/Cmd + K**: Focus search
- **Ctrl/Cmd + A**: Select all assets
- **Delete**: Delete selected assets
- **Ctrl/Cmd + M**: Move selected assets
- **Ctrl/Cmd + T**: Assign tags to selected assets
- **Escape**: Clear selection / Close dialogs

## Bulk Operations

Bulk operations allow you to perform actions on multiple assets at once.

**How to use:**

1. Select assets using checkboxes (or use Ctrl/Cmd + A to select all)
2. The bulk actions toolbar appears at the bottom of the screen
3. Choose an action:
   - **Move**: Move selected assets to a folder
   - **Assign Tags**: Add tags to selected assets
   - **Delete**: Remove selected assets

**Limits:**

- Maximum 100 assets per bulk operation
- Maximum 20 tags per asset (applies to tag assignment)

## Drag and Drop

- Drag assets to folders in the sidebar to move them
- Visual feedback shows valid drop zones

## Sorting

Use the sort dropdown in the search bar to sort assets by:

- **Name** (A-Z or Z-A)
- **Size** (Smallest to Largest or Largest to Smallest)
- **Date Created** (Newest or Oldest)
- **Date Updated** (Newest or Oldest)
- **Type** (Content type A-Z or Z-A)

The sort preference is maintained during your session.

## Troubleshooting

### Can't move folder

- Check folder depth (max 10 levels)
- Ensure you're not moving a folder into its own descendant
- Verify you have permission to access the target folder

### Can't assign more tags

- Maximum 20 tags per asset
- Remove existing tags before adding new ones
- Check if tags exist and belong to your workspace

### Search not working

- Search is debounced (300ms delay) - wait a moment after typing
- Try typing more characters for better results
- Clear filters if search seems stuck

### Bulk operation failed

- Maximum 100 assets per bulk operation
- Some assets may fail if they don't belong to your workspace
- Check error messages in the notification for details

### Drag and drop not working

- Ensure you're dragging to a valid folder in the sidebar
- Check that the folder is visible and expanded
- Try refreshing the page if drag and drop stops responding
