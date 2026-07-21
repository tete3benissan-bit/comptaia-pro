# Global regex pass: thin 0.5/1/1.5px borders on structural chrome become the
# neubrutalist 2px, and blurred modal shadows become hard offset shadows.
# Deliberately leaves --border-soft (table row dividers) untouched.
$ErrorActionPreference = 'Stop'
$root = 'C:\comptaIA'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$targets = @()
$targets += Get-ChildItem (Join-Path $root 'css') -Filter *.css
$targets += Get-ChildItem (Join-Path $root 'js') -Filter *.js
$targets += Get-Item (Join-Path $root 'index.html')

$borderRx = [regex]'(0\.5|1(\.5)?)px solid var\(--(border|border-strong|blue-border|red-border|green-border|amber-border|purple-border)\)'
$modalShadowRx = [regex]'box-shadow:0 \d+px \d+px rgba\(0,0,0,\.\d+\)'

$totalChanges = 0
foreach ($file in $targets) {
  $text = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
  $orig = $text
  $fileChanges = 0

  $m1 = $borderRx.Matches($text)
  if ($m1.Count -gt 0) {
    $text = $borderRx.Replace($text, '2px solid var(--$3)')
    $fileChanges += $m1.Count
  }
  $m2 = $modalShadowRx.Matches($text)
  if ($m2.Count -gt 0) {
    $text = $modalShadowRx.Replace($text, 'box-shadow:8px 8px 0 var(--main)')
    $fileChanges += $m2.Count
  }

  if ($fileChanges -gt 0) {
    [System.IO.File]::WriteAllText($file.FullName, $text, $utf8NoBom)
    Write-Host ("{0,-45} {1,4} replacements" -f $file.Name, $fileChanges)
    $totalChanges += $fileChanges
  }
}
Write-Host "TOTAL replacements applied: $totalChanges"
