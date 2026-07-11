# نشر موقع مركز النشاط الاجتماعي بالمسقي — Render + GitHub
$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

Write-Host ""
Write-Host "=== نشر almasqi-sac.org.sa ===" -ForegroundColor Cyan
Write-Host ""

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "الأمر '$name' غير متوفر. ثبّته ثم أعد تشغيل السكربت."
  }
}

Require-Command git
Require-Command npm

Write-Host "[1/5] بناء المشروع..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { throw "فشل البناء." }

Write-Host "[2/5] تهيئة Git..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
  git init
  git branch -M main
}

git add -A
$status = git status --porcelain
if ($status) {
  git commit -m "Prepare Render deployment for almasqi-sac.org.sa"
  Write-Host "تم إنشاء commit." -ForegroundColor Green
} else {
  Write-Host "لا توجد تغييرات جديدة للـ commit." -ForegroundColor Gray
}

Write-Host "[3/5] GitHub..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>$null
if (-not $remote) {
  Write-Host ""
  Write-Host "أنشئ مستودعاً جديداً على GitHub (Private موصى به):" -ForegroundColor White
  Write-Host "  https://github.com/new" -ForegroundColor Cyan
  Write-Host ""
  $repoUrl = Read-Host "الصق رابط المستودع (مثال: https://github.com/USER/almasqi-sac.git)"
  if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    throw "لم يُدخل رابط المستودع."
  }
  git remote add origin $repoUrl.Trim()
}

Write-Host "رفع الكود إلى GitHub..." -ForegroundColor Yellow
git push -u origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "إذا طُلب منك تسجيل الدخول، استخدم Personal Access Token بدل كلمة المرور." -ForegroundColor Yellow
  Write-Host "https://github.com/settings/tokens" -ForegroundColor Cyan
  throw "فشل الرفع إلى GitHub."
}

Write-Host "[4/5] Render..." -ForegroundColor Yellow
Write-Host ""
Write-Host "افتح Render واربط المستودع:" -ForegroundColor White
Write-Host "  https://dashboard.render.com/select-repo?type=web" -ForegroundColor Cyan
Write-Host ""
Write-Host "أو استخدم Blueprint (render.yaml جاهز في المشروع):" -ForegroundColor White
Write-Host "  https://dashboard.render.com/blueprints" -ForegroundColor Cyan
Write-Host ""

$configPath = Join-Path $ProjectRoot "firebase-applet-config.json"
if (Test-Path $configPath) {
  $fb = Get-Content $configPath -Raw | ConvertFrom-Json
  Write-Host "[5/5] أضف هذه المتغيرات في Render > Environment:" -ForegroundColor Yellow
  Write-Host "  FIREBASE_API_KEY=$($fb.apiKey)"
  Write-Host "  FIREBASE_AUTH_DOMAIN=$($fb.authDomain)"
  Write-Host "  FIREBASE_PROJECT_ID=$($fb.projectId)"
  Write-Host "  FIREBASE_STORAGE_BUCKET=$($fb.storageBucket)"
  Write-Host "  FIREBASE_MESSAGING_SENDER_ID=$($fb.messagingSenderId)"
  Write-Host "  FIREBASE_APP_ID=$($fb.appId)"
  Write-Host "  PUBLIC_SITE_URL=https://almasqi-sac.org.sa"
  Write-Host "  NODE_ENV=production"
} else {
  Write-Host "[5/5] أضف متغيرات Firebase من .env.example في لوحة Render." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "بعد النشر: Settings > Custom Domains > almasqi-sac.org.sa" -ForegroundColor Green
Write-Host "تم." -ForegroundColor Green
