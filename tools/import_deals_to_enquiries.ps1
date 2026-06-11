param(
  [string]$WorkbookPath = "C:\Users\acer\Downloads\deals-2026-06-02-09-15-14.xlsx",
  [string]$MysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
  [string]$DbHost = "localhost",
  [string]$DbUser = "nexacrm_user",
  [string]$DbPassword = "admin123",
  [string]$Database = "db_Roriri_ERP",
  [string]$ImportDate = "2026-06-02"
)

$ErrorActionPreference = "Stop"

function Get-ZipText {
  param($Zip, [string]$Name)
  $entry = $Zip.GetEntry($Name)
  if (-not $entry) { return $null }
  $reader = New-Object System.IO.StreamReader($entry.Open())
  try { return $reader.ReadToEnd() } finally { $reader.Close() }
}

function Get-ColIndex {
  param([string]$CellRef)
  $letters = ([regex]::Match($CellRef, '^[A-Z]+')).Value
  $index = 0
  foreach ($char in $letters.ToCharArray()) {
    $index = ($index * 26) + ([int][char]$char - [int][char]'A' + 1)
  }
  return $index - 1
}

function Sql-String {
  param($Value)
  if ($null -eq $Value) { return "NULL" }
  $text = [string]$Value
  $text = $text.Replace("\", "\\").Replace("'", "''")
  return "'$text'"
}

function Clean-Cell {
  param($Value)
  if ($null -eq $Value) { return "" }
  return ([string]$Value).Trim()
}

function Normalize-Source {
  param([string]$Source)
  $sourceText = (Clean-Cell $Source)
  switch -Regex ($sourceText) {
    '^intership website$' { return 'Internship Website' }
    '^internship website$' { return 'Internship Website' }
    '^internship page$' { return 'Internship Page' }
    '^iv page$' { return 'IV Page' }
    '^iv website$' { return 'IV Website' }
    '^Nexgenit\s*academy$' { return 'Nexgen IT Academy' }
    '^Roriri software solutions$' { return 'Roriri Software Solutions' }
    default { return $sourceText }
  }
}

function Invoke-MysqlSql {
  param([string]$Sql)
  $temp = Join-Path $env:TEMP ("roriri_enquiry_import_" + [guid]::NewGuid().ToString("N") + ".sql")
  try {
    Set-Content -LiteralPath $temp -Value $Sql -Encoding UTF8
    & $MysqlPath "-h$DbHost" "-u$DbUser" "-p$DbPassword" $Database "-e" "source $temp"
    if ($LASTEXITCODE -ne 0) { throw "mysql exited with code $LASTEXITCODE" }
  } finally {
    if (Test-Path $temp) { Remove-Item -LiteralPath $temp -Force }
  }
}

if (-not (Test-Path $WorkbookPath)) { throw "Workbook not found: $WorkbookPath" }
if (-not (Test-Path $MysqlPath)) { throw "MySQL CLI not found: $MysqlPath" }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($WorkbookPath)
try {
  [xml]$sharedStringsXml = Get-ZipText $zip "xl/sharedStrings.xml"
  $sharedStrings = @()
  foreach ($si in $sharedStringsXml.sst.si) {
    if ($si.t) {
      $sharedStrings += [string]$si.t
    } else {
      $sharedStrings += (($si.r | ForEach-Object { [string]$_.t }) -join "")
    }
  }

  [xml]$sheetXml = Get-ZipText $zip "xl/worksheets/sheet1.xml"
  $rows = @()
  foreach ($row in @($sheetXml.worksheet.sheetData.row)) {
    $cells = @{}
    foreach ($cell in @($row.c)) {
      $columnIndex = Get-ColIndex ([string]$cell.r)
      $value = [string]$cell.v
      if ($cell.t -eq "s" -and $value -ne "") {
        $cells[$columnIndex] = $sharedStrings[[int]$value]
      } else {
        $cells[$columnIndex] = $value
      }
    }
    $rows += ,$cells
  }
} finally {
  $zip.Dispose()
}

$dataRows = $rows | Select-Object -Skip 1
$imports = @()
foreach ($row in $dataRows) {
  $id = Clean-Cell $row[1]
  $dealName = Clean-Cell $row[2]
  $leadName = Clean-Cell $row[3]
  $leadEmail = Clean-Cell $row[5]
  $leadMobile = Clean-Cell $row[7]
  $stage = Clean-Cell $row[13]

  if (-not $id -or -not $dealName) { continue }
  $nameSource = if ($leadName) { $leadName } else { $dealName }
  $source = "Manual / Direct"
  $cleanName = $nameSource
  $match = [regex]::Match($nameSource, '^\s*\[([^\]]+)\]\s*(.*)$')
  if ($match.Success) {
    $source = Normalize-Source $match.Groups[1].Value
    $cleanName = $match.Groups[2].Value.Trim()
  }
  $source = Normalize-Source $source
  if (-not $cleanName) { $cleanName = $nameSource }

  $imports += [pscustomobject]@{
    Id = [int]$id
    Source = $source
    Name = $cleanName
    Email = $leadEmail
    Phone = $leadMobile
    Stage = $stage
  }
}

if ($imports.Count -eq 0) { throw "No import rows found in workbook." }

$backupTable = "allenquiry_tbl_backup_" + (Get-Date -Format "yyyyMMdd_HHmmss")
$sqlParts = New-Object System.Collections.Generic.List[string]
$sqlParts.Add("SET SESSION sql_mode = REPLACE(REPLACE(@@SESSION.sql_mode, 'NO_ZERO_DATE', ''), 'NO_ZERO_IN_DATE', '');")
$sqlParts.Add("START TRANSACTION;")
$sqlParts.Add("SET @existing_enquiry_count := (SELECT COUNT(*) FROM allenquiry_tbl);")
$sqlParts.Add("SET @backup_sql := IF(@existing_enquiry_count > 0, 'CREATE TABLE ``$backupTable`` AS SELECT * FROM allenquiry_tbl', 'SELECT 1');")
$sqlParts.Add("PREPARE backup_stmt FROM @backup_sql;")
$sqlParts.Add("EXECUTE backup_stmt;")
$sqlParts.Add("DEALLOCATE PREPARE backup_stmt;")
$sqlParts.Add("DELETE FROM allenquiry_tbl;")

$sourceNames = $imports | Select-Object -ExpandProperty Source -Unique
foreach ($source in $sourceNames) {
  $sqlParts.Add("INSERT INTO enq_category (category_name) SELECT $(Sql-String $source) WHERE NOT EXISTS (SELECT 1 FROM enq_category WHERE category_name = $(Sql-String $source));")
}

foreach ($item in $imports) {
  $status = if ($item.Stage -eq "Generated") { "New" } else { "New" }
  $description = "Imported from deals export"
  $sqlParts.Add(@"
INSERT INTO allenquiry_tbl
  (event_id, enq_category_id, name, phone, email, enquiry_date, fee, description, location, follow_up, comment, follow_status, status, created_at, updated_at)
SELECT
  $($item.Id),
  c.enq_category_id,
  $(Sql-String $item.Name),
  $(Sql-String $item.Phone),
  $(Sql-String $item.Email),
  $(Sql-String $ImportDate),
  NULL,
  $(Sql-String $description),
  '',
  $(Sql-String $ImportDate),
  $(Sql-String $item.Stage),
  NULL,
  'Active',
  NOW(),
  NOW()
FROM enq_category c
WHERE c.category_name = $(Sql-String $item.Source);
"@)
}

$sqlParts.Add("COMMIT;")
Invoke-MysqlSql ($sqlParts -join "`r`n")

Write-Output "Imported $($imports.Count) enquiry rows."
Write-Output "Backup table: $backupTable"
Write-Output "Sources:"
$imports | Group-Object Source | Sort-Object Count -Descending | ForEach-Object {
  Write-Output ("  {0}: {1}" -f $_.Name, $_.Count)
}
