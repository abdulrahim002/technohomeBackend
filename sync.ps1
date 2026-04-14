# Script to sync project with GitHub automatically
# تذكير: يجب أن تكون قد قمت بالرفع الأول يدوياً لمرة واحدة

Write-Host "🔄 Starting synchronization with GitHub..." -ForegroundColor Cyan

# 1. إضافة كل التعديلات
git add .

# 2. إنشاء تعليق تلقائي بالوقت والتاريخ
$currentDate = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "Auto-update: $currentDate"

# 3. الرفع إلى GitHub
Write-Host "🚀 Pushing changes to origin main..." -ForegroundColor Green
git push origin main

Write-Host "✅ Done! Your project is now up to date on GitHub." -ForegroundColor Yellow
Pause
