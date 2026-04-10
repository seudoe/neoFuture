# PowerShell script to get your IP address for phone scanning

Write-Host "`n🔍 Finding your IP address for phone scanning...`n" -ForegroundColor Cyan

# Get all network adapters
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual"
}

if ($adapters.Count -eq 0) {
    Write-Host "❌ No active network connection found!" -ForegroundColor Red
    Write-Host "   Make sure you're connected to WiFi or Ethernet`n" -ForegroundColor Yellow
    exit
}

Write-Host "✅ Found your IP addresses:`n" -ForegroundColor Green

foreach ($adapter in $adapters) {
    $ip = $adapter.IPAddress
    $interface = (Get-NetAdapter -InterfaceIndex $adapter.InterfaceIndex).Name
    
    Write-Host "   📡 $interface" -ForegroundColor White
    Write-Host "   IP: $ip" -ForegroundColor Cyan
    Write-Host ""
}

# Get the most likely IP (first non-loopback)
$mainIp = $adapters[0].IPAddress

Write-Host "`n🎯 Use this URL for phone scanning:" -ForegroundColor Green
Write-Host "   http://$mainIp:3000`n" -ForegroundColor Yellow

Write-Host "📱 Steps to test on your phone:" -ForegroundColor Cyan
Write-Host "   1. Connect your phone to the SAME WiFi network" -ForegroundColor White
Write-Host "   2. Open browser on your phone" -ForegroundColor White
Write-Host "   3. Go to: http://$mainIp:3000" -ForegroundColor Yellow
Write-Host "   4. If it loads, scan QR codes will work!`n" -ForegroundColor White

Write-Host "🔧 If it doesn't work:" -ForegroundColor Cyan
Write-Host "   - Check Windows Firewall settings" -ForegroundColor White
Write-Host "   - Make sure dev server is running (npm run dev)" -ForegroundColor White
Write-Host "   - Verify phone is on same WiFi network`n" -ForegroundColor White

# Test if port 3000 is listening
$listening = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if ($listening) {
    Write-Host "✅ Dev server is running on port 3000" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dev server not detected on port 3000" -ForegroundColor Yellow
    Write-Host "   Run: npm run dev`n" -ForegroundColor White
}

Write-Host "`n🚀 Quick test:" -ForegroundColor Cyan
Write-Host "   curl http://$mainIp:3000`n" -ForegroundColor Yellow

# Offer to test
$test = Read-Host "Would you like to test the connection now? (y/n)"

if ($test -eq "y" -or $test -eq "Y") {
    Write-Host "`n🧪 Testing connection...`n" -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "http://$mainIp:3000" -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ SUCCESS! Your app is accessible at http://$mainIp:3000" -ForegroundColor Green
        Write-Host "   Phone scanning will work!`n" -ForegroundColor Green
    } catch {
        Write-Host "❌ Connection failed!" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "`n   Troubleshooting:" -ForegroundColor Cyan
        Write-Host "   1. Is dev server running? (npm run dev)" -ForegroundColor White
        Write-Host "   2. Check Windows Firewall" -ForegroundColor White
        Write-Host "   3. Try: npm run dev -- -H 0.0.0.0`n" -ForegroundColor White
    }
}

Write-Host "`n📋 Copy this for QR codes:" -ForegroundColor Cyan
Write-Host "   http://$mainIp:3000/track/YOUR-TRACKING-CODE`n" -ForegroundColor Yellow

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
