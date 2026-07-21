# Reconstructs the original monolith from index.html + css/js files (reversing the
# split), then diffs against ComptaIA_Pro_original.html line-by-line. Zero
# differences means the split lost or altered nothing.

$ErrorActionPreference = 'Stop'
$root = 'C:\comptaIA'
$origPath = Join-Path $root 'ComptaIA_Pro_original.html'
$indexPath = Join-Path $root 'index.html'

$orig = [System.IO.File]::ReadAllLines($origPath, [System.Text.Encoding]::UTF8)
$index = [System.IO.File]::ReadAllLines($indexPath, [System.Text.Encoding]::UTF8)

$rebuilt = New-Object System.Collections.Generic.List[string]
foreach ($line in $index) {
  $mCss = [regex]::Match($line, '^<link rel="stylesheet" href="(css/[^"]+)"/>$')
  $mJs  = [regex]::Match($line, '^<script src="(js/[^"]+)"></script>$')
  if ($mCss.Success -or $mJs.Success) {
    $relPath = if ($mCss.Success) { $mCss.Groups[1].Value } else { $mJs.Groups[1].Value }
    $fileLines = [System.IO.File]::ReadAllLines((Join-Path $root $relPath), [System.Text.Encoding]::UTF8)
    if ($mCss.Success) { $rebuilt.Add('<style>') } else { $rebuilt.Add('<script>') }
    for ($k = 1; $k -lt $fileLines.Length; $k++) {   # skip our added header comment (index 0)
      $rebuilt.Add($fileLines[$k])
    }
    if ($mCss.Success) { $rebuilt.Add('</style>') } else { $rebuilt.Add('</script>') }
  } else {
    $rebuilt.Add($line)
  }
}

Write-Host "Original line count : $($orig.Length)"
Write-Host "Rebuilt line count  : $($rebuilt.Count)"

if ($orig.Length -ne $rebuilt.Count) {
  Write-Host "MISMATCH IN LINE COUNT" -ForegroundColor Red
} else {
  Write-Host "Line counts match. Comparing content..."
}

$diffCount = 0
$max = [Math]::Max($orig.Length, $rebuilt.Count)
for ($n = 0; $n -lt $max; $n++) {
  $o = if ($n -lt $orig.Length) { $orig[$n] } else { '<<MISSING>>' }
  $r = if ($n -lt $rebuilt.Count) { $rebuilt[$n] } else { '<<MISSING>>' }
  if ($o -ne $r) {
    $diffCount++
    if ($diffCount -le 10) {
      Write-Host "DIFF at line $($n+1):" -ForegroundColor Yellow
      Write-Host "  ORIG: $o"
      Write-Host "  REBU: $r"
    }
  }
}
Write-Host "Total differing lines: $diffCount"
if ($diffCount -eq 0) { Write-Host "PERFECT MATCH - no content lost or altered." -ForegroundColor Green }
