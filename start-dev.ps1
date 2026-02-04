# Start both backend and frontend servers
Write-Host "Starting Product Builder Development Environment..." -ForegroundColor Green

# Start backend in a new window
Write-Host "`nStarting backend server on port 3001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new window
Write-Host "Starting frontend dev server on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\client'; npm start"

Write-Host "`n✅ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host "   - Backend: http://localhost:3001" -ForegroundColor Yellow
Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "`nPress any key to exit this script (servers will keep running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
