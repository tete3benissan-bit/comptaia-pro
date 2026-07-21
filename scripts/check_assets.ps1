$html = Get-Content C:\comptaIA\index.html -Raw -Encoding UTF8
$css = [regex]::Matches($html, 'href="(css/[^"]+)"') | ForEach-Object { $_.Groups[1].Value }
$js  = [regex]::Matches($html, 'src="(js/[^"]+)"') | ForEach-Object { $_.Groups[1].Value }
$all = $css + $js
$fail = 0
foreach ($a in $all) {
  try {
    $code = (Invoke-WebRequest -Uri "http://localhost:8934/$a" -UseBasicParsing).StatusCode
  } catch {
    $code = 'ERR'
  }
  if ($code -ne 200) { Write-Host "FAIL ($code): $a"; $fail++ }
}
Write-Host "Checked $($all.Count) assets, $fail failures"
$openScript = ([regex]::Matches($html,'<script')).Count
$closeScript = ([regex]::Matches($html,'</script>')).Count
Write-Host "script tags: open=$openScript close=$closeScript"
