const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Script to create .crx file (for local testing only)
// NOTE: For Chrome Web Store, use the ZIP file

const distPath = path.join(__dirname, '..', 'dist');
const keyPath = path.join(__dirname, '..', 'extension', 'key.pem');
const crxPath = path.join(__dirname, '..', 'extension', 'extension.crx');

console.log('Creating .crx file for local testing...');
console.log('WARNING: For Chrome Web Store, use ZIP file!');

try {
  // Check if dist folder exists
  if (!fs.existsSync(distPath)) {
    console.error('Dist folder not found. Run "npm run build" first.');
    process.exit(1);
  }

  // Create extension folder if it doesn't exist
  const extensionDir = path.dirname(crxPath);
  if (!fs.existsSync(extensionDir)) {
    fs.mkdirSync(extensionDir, { recursive: true });
  }

  // Generate key if it doesn't exist
  if (!fs.existsSync(keyPath)) {
    console.log('Generating private key...');
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
  }

  // Create .crx file
  console.log('Packaging extension...');
  const chromeCommand = `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --pack-extension="${distPath}" --pack-extension-key="${keyPath}"`;
  
  try {
    execSync(chromeCommand, { stdio: 'inherit' });
    console.log('.crx file created successfully!');
  } catch (error) {
    console.log('Chrome not found in default path.');
    console.log('Manual instructions:');
    console.log('1. Open Chrome');
    console.log('2. Go to chrome://extensions/');
    console.log('3. Enable "Developer mode"');
    console.log('4. Click "Load unpacked extension"');
    console.log('5. Select the "dist" folder');
  }

} catch (error) {
  console.error('Error:', error.message);
}
