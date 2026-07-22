# Renames the product name ComptaIA / ComptaIA Pro -> GEST Africa everywhere
# in the app's user-facing text and comments, while protecting the literal
# filename "ComptaIA_Pro_original.html" (a real, accurate file reference used
# throughout the extraction-provenance header comments, not a brand mention).
$ErrorActionPreference = 'Stop'
$root = 'C:\comptaIA'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$placeholder = "FILENAME_PLACEHOLDER"

$targets = @()
$targets += Get-ChildItem (Join-Path $root 'css') -Filter *.css
$targets += Get-ChildItem (Join-Path $root 'js') -Filter *.js
$targets += Get-Item (Join-Path $root 'index.html')

$totalChanges = 0
foreach ($file in $targets) {
  $text = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
  $orig = $text
  $fileChanges = 0

  $countProtected = ([regex]::Matches($text, 'ComptaIA_Pro_original\.html')).Count
  if ($countProtected -gt 0) { $text = $text -replace 'ComptaIA_Pro_original\.html', $placeholder }

  $countLogo = ([regex]::Matches($text, [regex]::Escape('Compta<span>IA</span>'))).Count
  if ($countLogo -gt 0) { $text = $text.Replace('Compta<span>IA</span>', 'GEST<span> Africa</span>'); $fileChanges += $countLogo }

  $countPro = ([regex]::Matches($text, 'ComptaIA Pro')).Count
  if ($countPro -gt 0) { $text = $text -creplace 'ComptaIA Pro', 'GEST Africa'; $fileChanges += $countPro }

  $countPlain = ([regex]::Matches($text, 'ComptaIA')).Count
  if ($countPlain -gt 0) { $text = $text -creplace 'ComptaIA', 'GEST Africa'; $fileChanges += $countPlain }

  if ($countProtected -gt 0) { $text = $text -replace [regex]::Escape($placeholder), 'ComptaIA_Pro_original.html' }

  if ($fileChanges -gt 0) {
    [System.IO.File]::WriteAllText($file.FullName, $text, $utf8NoBom)
    Write-Host ("{0,-45} {1,4} replacements" -f $file.Name, $fileChanges)
    $totalChanges += $fileChanges
  }
}
Write-Host "TOTAL replacements applied: $totalChanges"
