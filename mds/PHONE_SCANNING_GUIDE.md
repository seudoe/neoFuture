# 📱 How to Scan QR Codes from Your Phone

## 🎯 The Problem

QR codes currently show URLs like:
```
http://localhost:3000/track/TRK-00000015-16AA45
```

This ONLY works on your computer, not on your phone!

## ✅ The Solution

You need to use your computer's IP address instead of `localhost`.

### Step 1: Find Your Computer's IP Address

**On Windows:**
```bash
ipconfig
```

Look for "IPv4 Address" under your active network adapter.
Example: `192.168.1.100` or `10.5.0.2`

**On Mac/Linux:**
```bash
ifconfig
```

Look for `inet` address.

### Step 2: Update the QR Code Component

The QR code component needs to use your IP address instead of localhost.

**Option A: Automatic (Recommended)**

I'll update the component to automatically detect and use the correct URL.

**Option B: Manual**

Edit `components/OrderQRCode.tsx` and change:
```tsx
const trackingUrl = `${window.location.origin}/track/${trackingCode}`;
```

To use your IP:
```tsx
const trackingUrl = `http://192.168.1.100:3000/track/${trackingCode}`;
```

### Step 3: Make Sure Your Phone Can Access

1. **Connect phone to same WiFi** as your computer
2. **Test in phone browser**: Open `http://YOUR_IP:3000` (replace YOUR_IP)
3. If it works, QR codes will work too!

## 🔥 Quick Fix (I'll Do This For You)

I'll update the QR code component to:
1. Detect if running on localhost
2. Show a warning
3. Provide the correct URL with your IP

## 🚀 For Production

When you deploy to production (Vercel, Netlify, etc.), this problem goes away!
The QR codes will use your production domain like:
```
https://yourdomain.com/track/TRK-00000015-16AA45
```

## 📱 Testing Steps

1. Find your IP address
2. On your phone, open browser
3. Go to: `http://YOUR_IP:3000`
4. If you see your app, QR codes will work!
5. If not, check:
   - Same WiFi network?
   - Firewall blocking?
   - Dev server running?

## 🔧 Firewall Fix (Windows)

If your phone can't connect:

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find "Node.js" or your terminal
4. Check both "Private" and "Public"
5. Click OK

## 💡 Alternative: Use ngrok

For easy testing without IP issues:

```bash
# Install ngrok
npm install -g ngrok

# Run ngrok
ngrok http 3000
```

This gives you a public URL like:
```
https://abc123.ngrok.io
```

Use this URL in QR codes and it works from anywhere!

---

**I'll fix the QR component now to handle this automatically!**
