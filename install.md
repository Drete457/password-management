# Quick Installation Guide

## Steps to test the extension:

1. **Build the extension:**
   ```bash
   npm install
   npm run build
   ```

2. **Install in Chrome:**
   - Open Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right corner)
   - Click "Load unpacked"
   - Select the `dist` folder from the project

3. **Test the extension:**
   - Click the extension icon in the toolbar
   - The sidebar should open on the right
   - Add some test passwords
   - Test search, edit, and delete functionalities

## Implemented Features:

✅ **Sidebar Interface** - Opens when clicking the icon  
✅ **IndexedDB Storage** - Data saved locally  
✅ **Complete CRUD** - Create, read, update, delete passwords  
✅ **Real-time Search** - Filter by website or username  
✅ **Password Generator** - Secure random passwords  
✅ **Copy Credentials** - Buttons to copy data  
✅ **Show/Hide Passwords** - Visibility control  
✅ **Modern Interface** - Clean design with Tailwind CSS  

## Data Structure:

Each password entry contains:
- **Unique ID** (automatically generated)
- **Website/Application** (e.g. gmail.com)
- **Username/Email**
- **Password**
- **Creation date**
- **Last update date**

## Security:

- Data stored only locally (IndexedDB)
- No synchronization with external servers
- Browser's native encryption
- Source code available for audit
