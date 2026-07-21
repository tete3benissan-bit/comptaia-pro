# Global, scripted find-and-replace to apply the new modern SaaS theme across
# every extracted file. Safe because each pattern is unambiguous CSS syntax
# (never appears inside jsPDF numeric RGB calls, which use plain numbers, not
# hex strings or the "border-radius" property).

$ErrorActionPreference = 'Stop'
$root = 'C:\comptaIA'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$replacements = [ordered]@{
  'border-radius:0'    = 'border-radius:var(--radius)'
  'rgba(236,48,19,'    = 'rgba(var(--accent-rgb),'
  '#ec3013'            = 'var(--accent)'
  '#b2240e'            = 'var(--accent-dark)'
  '#201e1d'            = 'var(--sidebar-bg)'
}

$targets = @()
$targets += Get-ChildItem (Join-Path $root 'css') -Filter *.css
$targets += Get-ChildItem (Join-Path $root 'js') -Filter *.js
$targets += Get-Item (Join-Path $root 'index.html')

$totalChanges = 0
foreach ($file in $targets) {
  $text = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
  $orig = $text
  $fileChanges = 0
  foreach ($k in $replacements.Keys) {
    $count = ([regex]::Matches($text, [regex]::Escape($k))).Count
    if ($count -gt 0) {
      $text = $text.Replace($k, $replacements[$k])
      $fileChanges += $count
    }
  }
  if ($fileChanges -gt 0) {
    [System.IO.File]::WriteAllText($file.FullName, $text, $utf8NoBom)
    Write-Host ("{0,-45} {1,4} replacements" -f $file.Name, $fileChanges)
    $totalChanges += $fileChanges
  }
}
Write-Host "TOTAL replacements applied: $totalChanges"
