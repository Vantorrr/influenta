#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Проверяем наличие dist директории
const distPath = path.join(__dirname, '..', 'dist');

console.log('Checking for dist directory...');
console.log('Current directory:', process.cwd());
console.log('Expected dist path:', distPath);

if (!fs.existsSync(distPath)) {
  console.error('❌ dist directory not found!');
  console.log('Running build...');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Проверяем наличие main.js
const mainPath = path.join(distPath, 'main.js');

if (!fs.existsSync(mainPath)) {
  console.error('❌ main.js not found in dist directory!');
  console.log('Contents of dist directory:');
  
  try {
    const files = fs.readdirSync(distPath);
    files.forEach(file => console.log(' -', file));
  } catch (error) {
    console.error('Could not read dist directory:', error.message);
  }
  
  process.exit(1);
}

console.log('✅ Found main.js, starting application...');

// Запускаем приложение
require(mainPath);

