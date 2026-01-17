# Dokument wymagań produktu (PRD) - Flashcard Builder MVP

## 1\. Przegląd produktu

Projekt Flashcard Builder MVP to webowa aplikacja wspierająca naukę metodą powtórek w interwałach (spaced repetition). Głównym celem aplikacji jest drastyczne skrócenie czasu potrzebnego na przygotowanie materiałów edukacyjnych poprzez wykorzystanie sztucznej inteligencji (LLM) do automatycznego generowania fiszek z tekstu źródłowego. System integruje się z gotowym algorytmem powtórek, oferując użytkownikowi kompletne narzędzie do efektywnego przyswajania wiedzy.

## 2\. Problem użytkownika

Głównym problemem osób korzystających z metody spaced repetition jest wysoki koszt czasowy i poznawczy manualnego tworzenia wysokiej jakości fiszek. Proces ten często zniechęca do regularnej nauki lub prowadzi do tworzenia fiszek o niskiej jakości, co obniża efektywność zapamiętywania. Użytkownicy potrzebują narzędzia, które przełoży ich materiały do nauki (notatki, fragmenty książek) na gotowe pary pytanie-odpowiedź w sposób zautomatyzowany i szybki.

## 3\. Wymagania funkcjonalne

1. Automatyczne generowanie fiszek przez AI

* System pozwala na wklejenie tekstu źródłowego o długości od 1 000 do 10 000 znaków.
* Po wywołaniu API LLM, system prezentuje listę proponowanych fiszek (przód i tył).
* Użytkownik ma możliwość akceptacji, edycji lub trwałego odrzucenia każdej propozycji.
* Zaakceptowane fiszki są automatycznie dodawane do bazy użytkownika i harmonogramu powtórek.

2. Ręczne zarządzanie fiszkami

* Formularz tworzenia nowej fiszki z limitami: 200 znaków na przód i 500 znaków na tył.
* Liczniki znaków widoczne w czasie rzeczywistym podczas wpisywania tekstu.
* Pełna funkcjonalność CRUD (Create, Read, Update, Delete) dla wszystkich fiszek użytkownika.
* Widok listy Moje fiszki (podgląd przód/tył).

3. System użytkowników i bezpieczeństwo

* Rejestracja i logowanie za pomocą adresu e-mail i hasła.
* Automatyczne logowanie po poprawnej rejestracji. Po rejestracji użytkownik jest od razu logowany (bez potwierdzeń e-mail).
* Walidacja formularzy po stronie klienta z czytelnymi komunikatami o błędach.
* Możliwość usunięcia konta wraz ze wszystkimi powiązanymi danymi zgodnie z RODO.

4. Integracja z algorytmem powtórek

* Wykorzystanie zewnętrznej biblioteki open-source do zarządzania harmonogramem nauki.
* Automatyczne przypisywanie nowych fiszek do harmonogramu po ich utworzeniu (manualnym lub przez AI).
* Brak zaawansowanych powiadomień w wersji MVP.

5. Statystyki i analityka

* Zliczanie wygenerowanych propozycji AI (generated\_count).
* Zliczanie zaakceptowanych fiszek AI (accepted\_count).
* Zliczenie procentowego udziału fiszek AI w całym zbiorze oraz wskaźnika akceptacji propozycji AI.

6. Obsługa błędów

* Wyświetlanie czytelnych komunikatów w przypadku awarii API LLM lub problemów z połączeniem.
* Brak mechanizmów automatycznego ponawiania prób (retry) w MVP.

## 4\. Granice produktu

W zakres MVP NIE wchodzą następujące elementy:

* Import plików zewnętrznych (PDF, DOCX, obrazy).
* Zaawansowane algorytmy powtórek (własna implementacja).
* Współdzielenie zestawów fiszek między użytkownikami.
* Integracja z platformami trzecimi (Anki, Quizlet itp.).
* Aplikacje mobilne (dostępność wyłącznie przez przeglądarkę internetową).
* System powiadomień push lub e-mail o nadchodzących powtórkach.
* Przechowywanie historii odrzuconych propozycji AI.

## 5\. Historyjki użytkowników

ID: US-001
Tytuł: Rejestracja nowego użytkownika
Opis: Jako nowy użytkownik chcę założyć konto w aplikacji, aby móc przechowywać swoje fiszki.
Kryteria akceptacji:

1. Formularz wymaga podania poprawnego e-maila i hasła.
2. Walidacja po stronie klienta sprawdza format e-maila i minimalną długość hasła. Hasło musi zawierać małe i wielkie litery, cyfry oraz znaki specjalne (np. !, @, #, $).
3. Po kliknięciu Zarejestruj użytkownik jest automatycznie logowany i przekierowany do panelu głównego.
4. System wyświetla komunikat o błędzie, jeśli e-mail jest już zajęty lub hasło nie spełnia wymagań.

ID: US-002
Tytuł: Logowanie do systemu
Opis: Jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do moich danych.
Kryteria akceptacji:

1. Formularz logowania przyjmuje e-mail i hasło.
2. Po podaniu prawidłowych danych logowania użytkownik zostaje przekierowany do widoku dodawania/generowania fiszek.
3. Błędne dane logowania skutkują wyświetleniem komunikatu o niepowodzeniu bez zdradzania, które pole jest błędne.

ID: US-003
Tytuł: Generowanie fiszek przez AI
Opis: Jako użytkownik chcę wkleić tekst, aby AI przygotowało dla mnie propozycje fiszek.
Kryteria akceptacji:

1. Pole tekstowe przyjmuje od 1 000 do 10 000 znaków.
2. Przycisk generowania jest aktywny tylko po spełnieniu limitu znaków.
3. Podczas oczekiwania na odpowiedź z API wyświetlany jest wskaźnik ładowania.
4. Wyniki od LLM pojawiają się jako lista kart.

ID: US-004
Tytuł: Recenzja propozycji AI
Opis: Jako użytkownik chcę zdecydować, które z wygenerowanych fiszek chcę zachować.
Kryteria akceptacji:

1. Każda propozycja posiada przyciski: Akceptuj, Edytuj, Odrzuć.
2. Dla każdej propozycji wyświetlany jest przód i tył fiszki. 
3. Kliknięcie Akceptuj zapisuje fiszkę i pokazuje Toast z potwierdzeniem dodania do harmonogramu.
4. Kliknięcie Odrzuć wymaga potwierdzenia w modalu (akcja bezzwrotna).
5. Kliknięcie Edytuj otwiera formularz z możliwością zmiany treści przed zapisem.
6. Zaakceptowana lub odrzucona fiszka znika z listy propozycji.

ID: US-005
Tytuł: Ręczne tworzenie fiszek
Opis: Jako użytkownik chcę samodzielnie stworzyć fiszkę, aby dodać specyficzną informację do nauki.
Kryteria akceptacji:

1. W widoku dodawania/generowania fiszek dostępna jest zakładka pozwalający na manualne utworzenie fiszki. Kliknięcie jej pokazuje formularz manualnego dodawania.
2. Dostępny formularz z polami Przód (max 200 znaków) i Tył (max 500 znaków).
3. Liczniki znaków pokazują pozostałe miejsce pod każdym polem.
4. Przycisk Zapisz jest nieaktywny, jeśli pola są puste lub przekraczają limity.
5. Po zapisie wyświetla się potwierdzenie dodanie do zapisanych fiszek.

ID: US-006
Tytuł: Zarządzanie istniejącymi fiszkami
Opis: Jako użytkownik chcę przeglądać i edytować moje fiszki, aby utrzymać bazę wiedzy w porządku.
Kryteria akceptacji:

1. Widok Moje fiszki wyświetla listę wszystkich zapisanych kart - przód i tył każdej fiszki.
2. Każda karta ma przyciski Edytuj i Usuń.
3. Usunięcie fiszki wymaga potwierdzenia w modalu.
4. Edycja podlega tym samym limitom znaków co tworzenie manualne.

ID: US-007
Tytuł: Sesja nauki z algorytmem powtórek
Opis: Jako zalogowany użytkownik chcę, aby dodane fiszki były dostępne w widoku "Sesja nauki" opartym na zewnętrznym algorytmie, aby móc efektywnie się uczyć (spaced repetition).
Kryteria akceptacji:

1. W widoku "Sesja nauki" algorytm przygotowuje dla mnie sesję nauki fiszek
2. Na start wyświetlany jest przód fiszki. Kliknięcie w kartę powoduje jej wizualne odwrócenie i pokazanie tyłu.
3. Użytkownik ocenia zgodnie z oczekiwaniami algorytmu na ile przyswoił fiszkę
4. Następnie algorytm pokazuje kolejną fiszkę w ramach sesji nauki

ID: US-008
Tytuł: Usuwanie konta (RODO)
Opis: Jako użytkownik chcę mieć możliwość trwałego usunięcia moich danych z systemu.
Kryteria akceptacji:

1. Opcja Usuń konto jest dostępna w ustawieniach profilu.
2. Akcja wymaga potwierdzenia w modalu z ostrzeżeniem o bezpowrotnej utracie danych.
3. Po potwierdzeniu konto użytkownika oraz wszystkie jego fiszki są usuwane z bazy danych.
4. Użytkownik zostaje wylogowany i przekierowany do strony głównej.

ID: US-009
Tytuł: Obsługa błędów generowania
Opis: Jako użytkownik chcę wiedzieć, gdy proces generowania fiszek się nie powiedzie.
Kryteria akceptacji:

1. W przypadku błędu API LLM (timeout, błąd serwera), użytkownik widzi jasny komunikat o błędzie.
2. Użytkownik ma możliwość skopiowania swojego tekstu wejściowego, aby nie stracić pracy.
3. Aplikacja nie zawiesza się i pozwala na ponowną próbę po poprawieniu tekstu.

## 6\. Metryki sukcesu

1. Wskaźnik akceptacji AI: 75% fiszek zaproponowanych przez model LLM zostaje zaakceptowanych przez użytkowników.
2. Adopcja AI: 75% wszystkich nowych fiszek w systemie jest tworzonych przy użyciu modułu generowania AI (zamiast wprowadzania ręcznego).
