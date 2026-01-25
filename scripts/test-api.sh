#!/bin/bash

# Ustawienia
BASE_URL="http://localhost:3000"
# UWAGA: Podstaw tutaj swój ciasteczko sesji po zalogowaniu w przeglądarce
COOKIE="sb-127-auth-token=base64-..."

echo "--- 1. Tworzenie fiszki (POST /api/flashcards) ---"
CREATE_RES=$(curl -s -X POST "$BASE_URL/api/flashcards" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{
    "front": "Testowy Front Curl",
    "back": "Testowy Tył Curl",
    "source": "manual"
  }')
echo $CREATE_RES
FLASHCARD_ID=$(echo $CREATE_RES | grep -oP '(?<="id":")[^"]+' | head -n 1)

if [ -z "$FLASHCARD_ID" ]; then
  echo "Nie udało się stworzyć fiszki lub wyciągnąć ID."
  exit 1
fi

echo -e "\n--- 2. Lista fiszek (GET /api/flashcards) ---"
curl -s -X GET "$BASE_URL/api/flashcards?limit=5" \
  -H "Cookie: $COOKIE"

echo -e "\n--- 3. Szczegóły fiszki (GET /api/flashcards/$FLASHCARD_ID) ---"
curl -s -X GET "$BASE_URL/api/flashcards/$FLASHCARD_ID" \
  -H "Cookie: $COOKIE"

echo -e "\n--- 4. Aktualizacja fiszki (PUT /api/flashcards/$FLASHCARD_ID) ---"
curl -s -X PUT "$BASE_URL/api/flashcards/$FLASHCARD_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{
    "front": "Zaktualizowany Front",
    "back": "Zaktualizowany Tył"
  }'

echo -e "\n--- 5. Usuwanie fiszki (DELETE /api/flashcards/$FLASHCARD_ID) ---"
curl -s -X DELETE "$BASE_URL/api/flashcards/$FLASHCARD_ID" \
  -H "Cookie: $COOKIE"

echo -e "\n--- 6. Weryfikacja usunięcia (GET /api/flashcards/$FLASHCARD_ID) ---"
curl -s -X GET "$BASE_URL/api/flashcards/$FLASHCARD_ID" \
  -H "Cookie: $COOKIE"
