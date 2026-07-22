# One-time fix: rename_brand.ps1's first run used PowerShell's default
# case-insensitive -replace, which also corrupted lowercase internal
# localStorage/sessionStorage key names (comptaia_users -> "GEST Africa_users",
# etc). This restores those specific internal identifiers.
$ErrorActionPreference = 'Stop'
$root = 'C:\comptaIA'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$fixes = [ordered]@{
  'GEST Africa_data'          = 'comptaia_data'
  'GEST Africa_fj'            = 'comptaia_fj'
  'GEST Africa_alerts'        = 'comptaia_alerts'
  'GEST Africa_portefeuille'  = 'comptaia_portefeuille'
  'GEST Africa_users'         = 'comptaia_users'
  'GEST Africa_session'       = 'comptaia_session'
  'GEST Africa_rh'            = 'comptaia_rh'
}

$targets = @()
$targets += Get-ChildItem (Join-Path $root 'css') -Filter *.css
$targets += Get-ChildItem (Join-Path $root 'js') -Filter *.js
$targets += Get-Item (Join-Path $root 'index.html')

$totalChanges = 0
foreach ($file in $targets) {
  $text = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
  $fileChanges = 0
  foreach ($k in $fixes.Keys) {
    $count = ([regex]::Matches($text, [regex]::Escape($k))).Count
    if ($count -gt 0) { $text = $text.Replace($k, $fixes[$k]); $fileChanges += $count }
  }
  if ($fileChanges -gt 0) {
    [System.IO.File]::WriteAllText($file.FullName, $text, $utf8NoBom)
    Write-Host ("{0,-45} {1,4} fixes" -f $file.Name, $fileChanges)
    $totalChanges += $fileChanges
  }
}
Write-Host "TOTAL fixes applied: $totalChanges"
