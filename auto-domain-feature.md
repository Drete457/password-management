# Auto-Domain Detection Feature

## What it does:
When you click "Add New Password", the extension automatically detects the current website domain and pre-fills the "Website/Application" field.

## How it works:
1. **Domain Detection**: Uses Chrome's `tabs.query` API to get the active tab URL
2. **Clean Domain**: Extracts hostname and removes "www." prefix
3. **Auto-Fill**: Pre-fills the website field when creating new passwords

## Examples:
- If you're on `https://www.gmail.com/inbox` → auto-fills "gmail.com"
- If you're on `https://github.com/user/repo` → auto-fills "github.com"
- If you're on `https://facebook.com/profile` → auto-fills "facebook.com"

## Benefits:
- ⚡ **Faster**: No need to manually type the website
- ✅ **Accurate**: Reduces typos in domain names
- 🎯 **Context-aware**: Always matches the current page
- 🔄 **Fresh**: Updates every time you click "Add New Password"

## Technical Details:
- Uses `chrome.tabs.query({ active: true, currentWindow: true })`
- Requires `activeTab` permission in manifest.json
- Falls back gracefully if domain detection fails
- Only applies to new passwords (editing preserves original data)

## Code Changes:
- Added `getCurrentDomain()` function in SidePanel
- Modified PasswordForm to accept `currentDomain` prop
- Updated useEffect to pre-fill domain when no password is being edited
- Enhanced "Add New Password" button to refresh domain before showing form
