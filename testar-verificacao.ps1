# Script para testar Edge Function de verificacao
# Execute no PowerShell

# Suas configuracoes
$supabaseUrl = "https://vakfmjdbmlzuoenqpquc.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZha2ZtamRibWx6dW9lbnFwcXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4OTQ2ODYsImV4cCI6MjA4NzQ3MDY4Nn0.Y4Rd7OC0uC6YlGczaGARj4qy71J82qcZAIHvabyGdyc"

# URL da Edge Function
$url = "$supabaseUrl/functions/v1/verificar-movimentacoes"

# Headers
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $anonKey"
}

Write-Host "Testando Edge Function de verificacao..." -ForegroundColor Yellow
Write-Host "URL: $url" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -Headers $headers -Body '{}' -ContentType "application/json"
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Resposta:" -ForegroundColor Green
    Write-Host $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}
