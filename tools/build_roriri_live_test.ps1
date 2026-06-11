param(
  [string]$Mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
  [string]$MysqlDump = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
  [string]$HostName = "localhost",
  [string]$RootUser = "root",
  [string]$RootPassword = "admin123",
  [string]$AppUser = "nexacrm_user",
  [string]$AppPassword = "admin123",
  [string]$TargetDb = "roriri_live_test",
  [string]$MainDb = "nexacrm_db",
  [string]$ErpDb = "db_Roriri_ERP",
  [string]$CollegeDb = "college_db",
  [string]$InvoiceDb = "invoice_db"
)

$ErrorActionPreference = "Stop"

function Invoke-MySqlFile {
  param([string]$Sql)
  $temp = Join-Path $env:TEMP ("roriri_merge_" + [guid]::NewGuid().ToString("N") + ".sql")
  try {
    Set-Content -LiteralPath $temp -Value $Sql -Encoding UTF8
    & $Mysql "-h$HostName" "-u$RootUser" "-p$RootPassword" "-e" "source $temp"
    if ($LASTEXITCODE -ne 0) { throw "mysql exited with code $LASTEXITCODE" }
  } finally {
    if (Test-Path $temp) { Remove-Item -LiteralPath $temp -Force }
  }
}

function Import-Dump {
  param([string]$SourceDb, [string[]]$Tables = @(), [string[]]$IgnoreTables = @())
  $dumpFile = Join-Path $env:TEMP ("roriri_dump_" + [guid]::NewGuid().ToString("N") + ".sql")
  try {
    $args = @("-h$HostName", "-u$RootUser", "-p$RootPassword", "--single-transaction", "--skip-lock-tables")
    foreach ($table in $IgnoreTables) { $args += "--ignore-table=$SourceDb.$table" }
    $args += $SourceDb
    foreach ($table in $Tables) { $args += $table }
    & $MysqlDump @args | Set-Content -LiteralPath $dumpFile -Encoding UTF8
    if ($LASTEXITCODE -ne 0) { throw "mysqldump exited with code $LASTEXITCODE" }
    & $Mysql "-h$HostName" "-u$RootUser" "-p$RootPassword" $TargetDb "-e" "source $dumpFile"
    if ($LASTEXITCODE -ne 0) { throw "mysql import exited with code $LASTEXITCODE" }
  } finally {
    if (Test-Path $dumpFile) { Remove-Item -LiteralPath $dumpFile -Force }
  }
}

if (-not (Test-Path $Mysql)) { throw "mysql.exe not found: $Mysql" }
if (-not (Test-Path $MysqlDump)) { throw "mysqldump.exe not found: $MysqlDump" }

$appTables = @(
  "admins",
  "clients",
  "documents",
  "notes",
  "activity_logs",
  "enquiries",
  "messages",
  "milestones",
  "ratings",
  "projects",
  "interns",
  "employees",
  "business_groups",
  "entities",
  "roshan_products",
  "roshan_suppliers",
  "roshan_clients",
  "roshan_transactions"
)

$invoiceTables = @("app_settings", "invoices", "invoice_items")
$collegeTables = @(
  "colleges",
  "current_working_data",
  "enquiries",
  "enquiry_replies",
  "gallery_images",
  "internship_data",
  "iv_data",
  "placement_data",
  "users",
  "workshop_data"
)

Write-Output "Creating fresh $TargetDb..."
Invoke-MySqlFile @"
SET FOREIGN_KEY_CHECKS=0;
DROP DATABASE IF EXISTS $TargetDb;
CREATE DATABASE $TargetDb CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER IF NOT EXISTS '$AppUser'@'localhost' IDENTIFIED BY '$AppPassword';
ALTER USER '$AppUser'@'localhost' IDENTIFIED BY '$AppPassword';
GRANT ALL PRIVILEGES ON $TargetDb.* TO '$AppUser'@'localhost';
FLUSH PRIVILEGES;
SET FOREIGN_KEY_CHECKS=1;
"@

Write-Output "Importing ERP/base tables from $ErpDb..."
Import-Dump -SourceDb $ErpDb -IgnoreTables @(
  "allenquiry_tbl_backup_20260602_145727",
  "allenquiry_tbl_backup_before_deals_20260602"
)

Write-Output "Importing app-owned tables from $MainDb..."
Import-Dump -SourceDb $MainDb -Tables $appTables

Write-Output "Importing invoice tables from $InvoiceDb..."
Import-Dump -SourceDb $InvoiceDb -Tables $invoiceTables

Write-Output "Copying college tables from $CollegeDb using college_ prefix..."
$collegeSql = New-Object System.Collections.Generic.List[string]
$collegeSql.Add("SET FOREIGN_KEY_CHECKS=0;")
foreach ($table in $collegeTables) {
  $targetTable = "college_$table"
  $collegeSql.Add("DROP TABLE IF EXISTS $TargetDb.$targetTable;")
  $collegeSql.Add("CREATE TABLE $TargetDb.$targetTable LIKE $CollegeDb.$table;")
  $collegeSql.Add("INSERT INTO $TargetDb.$targetTable SELECT * FROM $CollegeDb.$table;")
}
$collegeSql.Add("SET FOREIGN_KEY_CHECKS=1;")
Invoke-MySqlFile ($collegeSql -join "`r`n")

Write-Output "Verifying merged DB..."
$verifySql = @"
SELECT 'allenquiry_tbl' AS table_name, COUNT(*) AS rows_count FROM $TargetDb.allenquiry_tbl
UNION ALL SELECT 'clients', COUNT(*) FROM $TargetDb.clients
UNION ALL SELECT 'client_tbl', COUNT(*) FROM $TargetDb.client_tbl
UNION ALL SELECT 'milestones', COUNT(*) FROM $TargetDb.milestones
UNION ALL SELECT 'college_enquiries', COUNT(*) FROM $TargetDb.college_enquiries
UNION ALL SELECT 'invoices', COUNT(*) FROM $TargetDb.invoices;
"@
Invoke-MySqlFile $verifySql
Write-Output "$TargetDb build complete."
