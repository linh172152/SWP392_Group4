const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace imports with version numbers
    const newContent = content.replace(/from ["']([^"']+)@[\d.]+["']/g, (match, packageName) => {
      modified = true;
      return `from "${packageName}"`;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function fixImportsInDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let fixedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixedCount += fixImportsInDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fixImportsInFile(filePath)) {
        fixedCount++;
      }
    }
  });
  
  return fixedCount;
}

const uiComponentsPath = path.join(__dirname, 'src', 'components', 'ui');
console.log('Fixing imports in UI components...\n');
const fixedCount = fixImportsInDirectory(uiComponentsPath);
console.log(`\n✅ Fixed ${fixedCount} files`);

