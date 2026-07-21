# Mechanical extractor: splits ComptaIA_Pro_original.html into css/*.css + js/*.js
# based on exact <style>/<script> block line ranges, and rebuilds index.html with
# <link>/<script src> references in the same position. No content is altered -
# this is a pure cut-and-paste automated by line number, so behavior stays identical.
#
# Rewritten with an explicit line-pointer loop (no array range-slicing) to avoid
# PowerShell range-operator ambiguity.

$ErrorActionPreference = 'Stop'
$root = 'C:\comptaIA'
$srcPath = Join-Path $root 'ComptaIA_Pro_original.html'

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$lines = [System.IO.File]::ReadAllLines($srcPath, [System.Text.Encoding]::UTF8)
$total = $lines.Length

New-Item -ItemType Directory -Force -Path (Join-Path $root 'css') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root 'js')  | Out-Null

$blocks = @(
  @{s=12;    e=204;   t='css'; f='css/01-core.css';                          label='Core layout & design tokens (root CSS variables, sidebar, main, cards, tables, forms)'}
  @{s=1148;  e=2484;  t='js';  f='js/01-core.js';                            label='Core state + facture/journal/GL/lettrage/bilan/resultats/balance/solde/analyse/IS/exercice/stock/demo'}
  @{s=2514;  e=2834;  t='js';  f='js/02-immo-bilan-pdf-ia.js';               label='Immobilisations, Bilan OHADA v9 fix, PDF export, Assistant IA chat'}
  @{s=2837;  e=2878;  t='css'; f='css/02-v10-dashboard.css';                 label='v10: Dashboard IA / Score / OCR / Fraude / Multi-entreprise / Benchmarks styles'}
  @{s=2880;  e=3063;  t='js';  f='js/03-v10-panes-inject.js';                label='v10: injects Dashboard/Scoring/OCR/Fraude/MultiEntreprise/Benchmarks panes into DOM'}
  @{s=3065;  e=3483;  t='js';  f='js/04-v10-functions.js';                   label='v10: Dashboard/Score/OCR/Fraude-detection/Multi-entreprise/Benchmarks logic'}
  @{s=3489;  e=3517;  t='css'; f='css/03-v11.css';                           label='v11: Forme juridique selector + Prevision IA vocal styles'}
  @{s=3519;  e=4276;  t='js';  f='js/05-v11-forme-juridique-prevision.js';   label='v11: SARL/SA forme juridique logic + voice-driven business plan assistant'}
  @{s=4393;  e=4400;  t='css'; f='css/04-jtab.css';                          label='v12: journal tabs / pagination button styles'}
  @{s=4402;  e=4963;  t='js';  f='js/06-v12-core-module.js';                 label='v12: auth, journal tabs+pagination, TVA declaration, rapprochement bancaire, dashboard chart, facture PDF, alerts, unified go()'}
  @{s=5333;  e=6136;  t='js';  f='js/07-v13.js';                             label='v13: profil entreprise, devis, bons de commande/livraison, recurrentes, inventaire, provisions, multi-devises, TFT, calendrier fiscal'}
  @{s=6383;  e=6390;  t='css'; f='css/05-v14.css';                           label='v14: secteur/multi-lignes/audit row styles'}
  @{s=6392;  e=7063;  t='js';  f='js/08-v14.js';                             label='v14: emprunts, mobile money, compta analytique, piste audit, simulateur fiscal, multi-lignes facture, production, caisse/PDV'}
  @{s=7065;  e=7089;  t='js';  f='js/09-correctif-orphan-panes.js';          label='Correctif: adopts orphan pane divs into .content'}
  @{s=7091;  e=7172;  t='js';  f='js/10-v15-accordion.js';                   label='v15: accordion sidebar groups'}
  @{s=7245;  e=8144;  t='js';  f='js/11-v16-devis-paie.js';                  label='v16: devis multi-lignes rewrite + full payroll (paie) module with Togo IR/CNSS'}
  @{s=8250;  e=8260;  t='css'; f='css/06-v17-liasse-annexes.css';            label='v17: liasse fiscale / notes annexes tab styles'}
  @{s=8262;  e=8867;  t='js';  f='js/12-v17-tft-liasse-annexes.js';          label='v17: official TFT (SYSCOHADA), liasse fiscale DGI, notes annexes'}
  @{s=8879;  e=8892;  t='css'; f='css/07-v18-stock.css';                     label='v18: stock management styles'}
  @{s=8894;  e=9584;  t='js';  f='js/13-v18-stock.js';                       label='v18: full stock management (entrees/sorties/alertes/rapport, CMUP/FIFO)'}
  @{s=9590;  e=9676;  t='css'; f='css/08-mobile.css';                        label='Mobile/Android responsive optimization styles'}
  @{s=9677;  e=9765;  t='js';  f='js/14-mobile.js';                          label='Mobile drawer menu + touch/table-scroll JS'}
  @{s=9772;  e=9851;  t='css'; f='css/09-v19.css';                           label='v19: specialization hub + bottom taskbar styles'}
  @{s=9852;  e=10188; t='js';  f='js/15-v19-specializations.js';             label='v19: Admin/Comptable/Fiscalite/RH specialization hub + taskbar navigation'}
  @{s=10197; e=10214; t='css'; f='css/10-v20.css';                           label='v20: SA/SARL top-bar selector styles'}
  @{s=10215; e=10306; t='js';  f='js/16-v20-notifications-sa-sarl.js';       label='v20: notification filtering + SA/SARL status + color theme'}
  @{s=10319; e=10376; t='css'; f='css/11-v21.css';                           label='v21: global search bar + invoice import styles'}
  @{s=10377; e=10940; t='js';  f='js/17-v21-recherche-import.js';            label='v21: global search (tabs/accounts/entries/dates), account autocomplete, PDF/photo invoice import+OCR'}
  @{s=10943; e=10965; t='css'; f='css/12-pro-theme.css';                     label='Pro theme accent overrides'}
  @{s=10972; e=10996; t='css'; f='css/13-v22-rh.css';                        label='v22: HR module styles'}
  @{s=10997; e=11755; t='js';  f='js/18-v22-rh.js';                          label='v22: full HR module (employees, contracts, presence, conges, perf, formation, recrutement, sante, discipline, docs)'}
)

$blocksSorted = $blocks | Sort-Object { [int]$_.s }

# --- sanity check: no overlaps, ascending order ---
$prevEnd = 0
foreach ($b in $blocksSorted) {
  if ([int]$b.s -le $prevEnd) { throw "Overlap detected at block starting line $($b.s) (previous block ended at $prevEnd)" }
  $prevEnd = [int]$b.e
}
Write-Host "Overlap check passed. $($blocksSorted.Count) blocks, all ascending/non-overlapping."

# --- extract each block's inner content (excludes the tag lines) into its own file ---
foreach ($b in $blocksSorted) {
  $s = [int]$b.s; $e = [int]$b.e
  $content = New-Object System.Collections.Generic.List[string]
  $header = if ($b.t -eq 'css') { "/* $($b.label) - extracted from ComptaIA_Pro_original.html lines $s-$e */" }
            else { "// $($b.label) - extracted from ComptaIA_Pro_original.html lines $s-$e" }
  $content.Add($header)
  for ($j = $s + 1; $j -le $e - 1; $j++) {
    $content.Add($lines[$j - 1])
  }
  $outPath = Join-Path $root $b.f
  [System.IO.File]::WriteAllLines($outPath, $content, $utf8NoBom)
}

# --- rebuild index.html: copy everything, but skip block line-ranges and insert one tag instead ---
$out = New-Object System.Collections.Generic.List[string]
$i = 1
foreach ($b in $blocksSorted) {
  $s = [int]$b.s; $e = [int]$b.e
  while ($i -lt $s) {
    $out.Add($lines[$i - 1])
    $i++
  }
  # $i now equals $s; skip the whole block (lines s..e) and emit the replacement tag
  if ($b.t -eq 'css') {
    $out.Add('<link rel="stylesheet" href="' + $b.f + '"/>')
  } else {
    $out.Add('<script src="' + $b.f + '"></script>')
  }
  $i = $e + 1
}
while ($i -le $total) {
  $out.Add($lines[$i - 1])
  $i++
}

[System.IO.File]::WriteAllLines((Join-Path $root 'index.html'), $out, $utf8NoBom)

$expected = $total - ($blocksSorted | ForEach-Object { [int]$_.e - [int]$_.s + 1 } | Measure-Object -Sum).Sum + $blocksSorted.Count
Write-Host "Original lines: $total"
Write-Host "New index.html lines: $($out.Count)  (expected: $expected)"
if ($out.Count -ne $expected) { throw "MISMATCH: rebuild did not match expected line count." }
Write-Host "OK - line count matches expectation."
