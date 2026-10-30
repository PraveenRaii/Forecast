const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[36m%s\x1b[0m', '   Starting WeatherGuard AI (Backend & Frontend)  ');
console.log('\x1b[36m%s\x1b[0m', '==================================================');

const rootDir = __dirname;
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

if (!fs.existsSync(backendDir)) {
  console.error('\x1b[31m[Error]\x1b[0m Backend directory not found at: ' + backendDir);
  process.exit(1);
}
if (!fs.existsSync(frontendDir)) {
  console.error('\x1b[31m[Error]\x1b[0m Frontend directory not found at: ' + frontendDir);
  process.exit(1);
}

// Find Python executable in backend/venv
let pythonExe = path.join(backendDir, 'venv', 'Scripts', 'python.exe');
if (!fs.existsSync(pythonExe)) {
  pythonExe = path.join(backendDir, 'venv', 'bin', 'python');
}
if (!fs.existsSync(pythonExe)) {
  pythonExe = 'python';
}

console.log(`\x1b[32m[Backend]\x1b[0m Using Python: ${pythonExe}`);
console.log('\x1b[32m[Backend]\x1b[0m Launching FastAPI server on http://127.0.0.1:8000 ...');

// Start backend without shell to prevent cmd.exe ENOENT
const backend = spawn(pythonExe, ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'], {
  cwd: backendDir,
  stdio: 'inherit'
});

backend.on('error', (err) => {
  console.error('\x1b[31m[Backend Error]\x1b[0m Failed to start backend:', err.message);
});

// Start frontend
console.log('\x1b[35m[Frontend]\x1b[0m Launching Vite frontend on http://localhost:5173 ...');

const isWin = process.platform === 'win32';
const frontendCmd = isWin ? (process.env.ComSpec || 'cmd.exe') : 'npm';
const frontendArgs = isWin ? ['/c', 'npm', 'run', 'dev'] : ['run', 'dev'];

const frontend = spawn(frontendCmd, frontendArgs, {
  cwd: frontendDir,
  stdio: 'inherit'
});

frontend.on('error', (err) => {
  console.error('\x1b[31m[Frontend Error]\x1b[0m Failed to start frontend:', err.message);
});

const cleanup = () => {
  console.log('\nStopping WeatherGuard AI services...');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
