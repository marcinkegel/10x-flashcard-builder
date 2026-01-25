# Ustawienia
$BaseUrl = "http://localhost:3000"
# UWAGA: Podstaw tutaj swój ciasteczko sesji po zalogowaniu w przeglądarce
$Cookie = "sb-127-auth-token=base64-..."

$Headers = @{
    "Content-Type" = "application/json"
    "Cookie" = $Cookie
}

Write-Host "--- 1. Tworzenie fiszki (POST /api/flashcards) ---"
$CreateBody = @{
    front = "Testowy Front PowerShell"
    back = "Testowy Tył PowerShell"
    source = "manual"
} | ConvertTo-Json

$CreateRes = Invoke-RestMethod -Uri "$BaseUrl/api/flashcards" -Method Post -Headers $Headers -Body $CreateBody
$CreateRes | ConvertTo-Json
$FlashcardId = $CreateRes.data[0].id

if (-not $FlashcardId) {
    Write-Error "Nie udało się stworzyć fiszki lub wyciągnąć ID."
    exit
}

Write-Host "`n--- 2. Lista fiszek (GET /api/flashcards) ---"
$ListRes = Invoke-RestMethod -Uri "$BaseUrl/api/flashcards?limit=5" -Method Get -Headers $Headers
$ListRes | ConvertTo-Json

Write-Host "`n--- 3. Szczegóły fiszki (GET /api/flashcards/$FlashcardId) ---"
$SingleRes = Invoke-RestMethod -Uri "$BaseUrl/api/flashcards/$FlashcardId" -Method Get -Headers $Headers
$SingleRes | ConvertTo-Json

Write-Host "`n--- 4. Aktualizacja fiszki (PUT /api/flashcards/$FlashcardId) ---"
$UpdateBody = @{
    front = "Zaktualizowany Front PS"
    back = "Zaktualizowany Tył PS"
} | ConvertTo-Json
$UpdateRes = Invoke-RestMethod -Uri "$BaseUrl/api/flashcards/$FlashcardId" -Method Put -Headers $Headers -Body $UpdateBody
$UpdateRes | ConvertTo-Json

Write-Host "`n--- 5. Usuwanie fiszki (DELETE /api/flashcards/$FlashcardId) ---"
$DeleteRes = Invoke-RestMethod -Uri "$BaseUrl/api/flashcards/$FlashcardId" -Method Delete -Headers $Headers
$DeleteRes | ConvertTo-Json

Write-Host "`n--- 6. Weryfikacja usunięcia (GET /api/flashcards/$FlashcardId) ---"
try {
    Invoke-RestMethod -Uri "$BaseUrl/api/flashcards/$FlashcardId" -Method Get -Headers $Headers
} catch {
    Write-Host "Oczekiwany błąd 404: $($_.Exception.Message)"
}
