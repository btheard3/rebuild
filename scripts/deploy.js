#!/usr/bin/env node

/**
 * Netlify Deployment Script
 * 
 * This script automates the deployment process to Netlify.
 * It handles building the web app, preparing assets, and deploying to Netlify.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  siteName: 'rebuild-disaster-recovery',
  buildCommand: 'npm run build:web',
  buildDir: 'dist',
  deployTeam: process.env.NETLIFY_TEAM || '',
  deployToken: process.env.NETLIFY_AUTH_TOKEN || '',
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}${colors.blue}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function executeCommand(command, silent = false) {
  try {
    if (!silent) {
      log(`${colors.dim}$ ${command}${colors.reset}`);
    }
    return execSync(command, { stdio: silent ? 'ignore' : 'inherit' });
  } catch (error) {
    logError(`Command failed: ${command}`);
    throw error;
  }
}

// Check if Netlify CLI is installed
function checkNetlifyCLI() {
  try {
    executeCommand('netlify --version', true);
    return true;
  } catch (error) {
    return false;
  }
}

// Main deployment function
async function deploy() {
  try {
    logStep('1', 'Preparing for deployment');
    
    // Check if Netlify CLI is installed
    if (!checkNetlifyCLI()) {
      logWarning('Netlify CLI not found. Installing...');
      executeCommand('npm install -g netlify-cli');
    }
    
    // Check for Netlify token
    if (!config.deployToken) {
      logError('NETLIFY_AUTH_TOKEN environment variable not set');
      log('Please set your Netlify auth token using:');
      log('export NETLIFY_AUTH_TOKEN=your_token', colors.dim);
      process.exit(1);
    }
    
    // Verify build directory exists
    if (!fs.existsSync(path.resolve(config.buildDir))) {
      logStep('2', 'Building the application');
      executeCommand(config.buildCommand);
    } else {
      logSuccess('Build directory already exists');
    }
    
    // Deploy to Netlify
    logStep('3', 'Deploying to Netlify');
    
    let deployCommand = `netlify deploy --dir=${config.buildDir} --prod`;
    
    if (config.deployTeam) {
      deployCommand += ` --team=${config.deployTeam}`;
    }
    
    executeCommand(deployCommand);
    
    logSuccess('Deployment completed successfully!');
    
  } catch (error) {
    logError('Deployment failed');
    console.error(error);
    process.exit(1);
  }
}

// Run the deployment
deploy().catch(console.error);