# Script para testar Edge Function

$supabaseUrl = "https://vakfmjdbmlzuoenqpquc.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZha2ZtamRibWx6dW9lbnFwcXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4OTQ2ODYsImV4cCI6MjA4NzQ3MDY4Nn0.Y4Rd7OC0uC6YlGczaGARj4qy71J82qcZAIHvabyGdyc"

$url = "$supabaseUrl/functions/v1/verificar-movimentacoes"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $anonKey"
}

Write-Host "TESTE DE EDGE FUNCTION" -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -Headers $headers -Body '{}' -ContentType "application/json"

    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resposta completa:" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor White

} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}
