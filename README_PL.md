🇬🇧 [English version](README.md)

## 📚 Aplikacja wirtualnej biblioteki

W pełni funkcjonalna aplikacja webowa do zarządzania osobistą wirtualną biblioteką, zbudowana w nowoczesnej architekturze backendowej, z dużym naciskiem na bezpieczeństwo, skalowalność i doświadczenie użytkownika.

---

## 🚀 Przegląd

Aplikacja umożliwia użytkownikom tworzenie i zarządzanie własnymi kolekcjami książek oraz listami życzeń. Obsługuje zarówno tradycyjne logowanie, jak i OAuth przez GitHub oraz Discord.

Użytkownicy mogą:
* zarządzać książkami (dodawanie, edycja, usuwanie)
* importować dane przez ISBN lub JSON
* oceniać i recenzować książki
* przeglądać profile innych użytkowników
* kupować plany premium

Administratorzy mają dostęp do zaawansowanych funkcji zarządzania użytkownikami.

---

## ✨ Kluczowe funkcje

### 👤 Uwierzytelnianie i bezpieczeństwo

* uwierzytelnianie oparte na JWT (access + refresh tokens)
* mechanizm blacklisty tokenów (unieważnianie po wylogowaniu)
* logowanie OAuth (GitHub, Discord) z łączeniem kont
* bezpieczne hashowanie haseł (bcrypt)
* konfiguracja oparta na zmiennych środowiskowych (.env)

### 📚 Zarządzanie książkami

* dodawanie książek ręcznie, przez ISBN lub JSON
* edycja i usuwanie książek
* przenoszenie książek między kolekcją a listą życzeń
* zapobieganie duplikatom (np. walidacja ISBN)

### 🖼️ Wyszukiwanie obrazów
* integracja z **Google Custom Search**
* możliwość wyszukiwania okładek książek przy dodawaniu

### 🤖 Wsparcie AI
* integracja z **OpenRouter API**
* wykorzystanie **DeepSeek Chat v3 0324 (free)**
* automatyczne uzupełnianie metadanych książki (gatunek, wydawnictwo, data publikacji, opis itd.)

### ⭐ Recenzje i oceny

* dodawanie ocen i recenzji
* przechowywanie opinii użytkowników dla każdej książki

### 🔍 Wyszukiwanie i filtrowanie

* wyszukiwanie po tytule lub autorze
* sortowanie po wielu polach (tytuł, autor, data, ocena itd.)
* filtrowanie po gatunku, roku i liczbie stron

### 👥 Funkcje społecznościowe

* przeglądanie profili innych użytkowników
* statystyki użytkowników (np. liczba książek)

### 💳 Płatności

* integracja z Stripe
* plany subskrypcyjne PREMIUM i PREMIUM+
* logika upgrade/downgrade

### 📊 Logowanie
* logowanie zapytań backendu do pliku logs.txt
* rejestrowanie każdego żądania (metoda, endpoint, timestamp)
* przydatne do debugowania i monitorowania

### 🛠️ Panel administracyjny

* przegląd i zarządzanie użytkownikami
* zmiana ról użytkowników i planów subskrypcji
* dostęp do informacji systemowych

### 📩 System kontaktowy

* wbudowany formularz kontaktowy dla użytkowników

---

## 🧱 Architektura systemu

Aplikacja opiera się na architekturze klient-serwer:

* Frontend (React) komunikuje się z backendem przez REST API  
* Backend (Flask) obsługuje logikę biznesową, autoryzację i przetwarzanie danych  
* Baza danych (SQLite) przechowuje użytkowników, książki, recenzje i subskrypcje  

Usługi zewnętrzne:
* OpenRouter (funkcje AI)
* Google Custom Search (obrazy)
* Stripe (płatności)
* Dostawcy OAuth (GitHub, Discord)

---

### Architektura backendu

Backend opiera się na uporządkowanej architekturze typu **MVC (REST API)**:
```
backend/
├── controllers/
├── models/
├── routes/
├── tests/
├── config/
├── app.py
```

* Kontrolery – logika biznesowa  
* Modele – struktura bazy danych (ORM)  
* Trasy – endpointy API  
* Testy – testy jednostkowe i integracyjne  

---

## 🛠️ Technologie

### Backend

* Python 3.12  
* Flask (REST API)  
* SQLAlchemy (ORM)  
* SQLite (baza danych)  

### Uwierzytelnianie i bezpieczeństwo

* Flask-JWT-Extended  
* Flask-Bcrypt  
* Flask-Talisman  
* Flask-Limiter  
* Flask-CORS  

### OAuth

* Authlib (GitHub)  
* Flask-Discord  

### Płatności

* Stripe API  

### Narzędzia

* dotenv  
* datetime / pytz  
* regex (re)  
* urllib  
* os  
* json  

### Testowanie

* Pytest (testy integracyjne)  
* Unittest (testy jednostkowe)  
* Postman (testowanie API)  

---

## 🔐 Najważniejsze aspekty bezpieczeństwa

* walidacja JWT przy każdym żądaniu  
* mechanizm wygaśnięcia i odświeżania tokenów  
* blacklista tokenów (wylogowanie)  
* rate limiting (ochrona przed atakami DDoS / brute force)  
* bezpieczne nagłówki HTTP (Talisman)  
* ochrona CORS  
* limit rozmiaru żądań (2 MB)  
* wyłączone niebezpieczne nagłówki  
* wrażliwe dane przechowywane w zmiennych środowiskowych  

---

## 📡 API

* ~26 endpointów REST  
* metody: `GET`, `POST`, `PATCH`, `DELETE`  
* autoryzacja oparta na tokenach (headers i cookies)  

---

## 🧪 Testowanie

* testy jednostkowe dla logiki  
* testy integracyjne endpointów  
* testowanie API za pomocą Postmana  

---

## 🧰 Wymagania i instalacja

### Wymagane biblioteki

* `Authlib` – biblioteka do obsługi OAuth i autoryzacji  
* `bcrypt` – narzędzie do bezpiecznego hashowania haseł  
* `Flask` – lekki framework do budowy API w Pythonie  
* `Flask-Bcrypt` – integracja Flask z bcrypt  
* `Flask-Cors` – obsługa CORS (komunikacja frontend–backend)  
* `Flask-Discord` – integracja logowania przez Discord  
* `Flask-JWT-Extended` – obsługa JWT  
* `Flask-Limiter` – ograniczanie liczby żądań  
* `Flask-SQLAlchemy` – integracja ORM  
* `Flask-Talisman` – nagłówki bezpieczeństwa i HTTPS  
* `python-dotenv` – obsługa pliku `.env`  
* `pytz` – obsługa stref czasowych  
* `requests` – zapytania HTTP  
* `SQLAlchemy` – ORM do pracy z bazą danych  
* `stripe` – integracja płatności  
* `pytest` – framework do testów  

### Uruchamianie przez Docker

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

### Instalacja zależności

Można je zainstalować pojedynczo z określoną wersją:
  ```bash
  pip install Authlib==1.6.9 bcrypt==5.0.0 Flask==3.1.3 Flask-Bcrypt==1.0.1 Flask-Cors==6.0.2 Flask-Discord==0.1.69 Flask-JWT-Extended==4.7.1 Flask-Limiter==4.1.1 Flask-SQLAlchemy==3.1.1 Flask-Talisman==1.1.0 python-dotenv==1.2.2 pytz==2026.1.post1 requests==2.33.0 SQLAlchemy==2.0.48 stripe==15.0.0 pytest==8.4.2
  ```

Lub za pomocą pliku `requirements.txt`:
  ```bash
  pip install -r requirements.txt
  ```

### Instalacja

Backend:
```bash
git clone https://github.com/Vyroxes/BD_Projekt.git
cd BD_Projekt
python -m venv venv
source venv/bin/activate
```

Frontend:
```bash
cd src
npm install
```

Utwórz plik `.env`:
```
JWT_SECRET_KEY=
JWT_REFRESH_TOKEN_SECRET_KEY=
FLASK_SECRET_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_CALLBACK_URL=http://localhost:5000/api/auth/discord
GOOGLE_CS_API_KEY=
GOOGLE_CS_ID=
OPENROUTER_API_KEY=
URL=http://localhost
VITE_API_URL=http://localhost:5000
VITE_ADMIN_USERNAME=
ADMIN_USERNAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Uruchamianie aplikacji:

Backend:
```bash
flask run
```

`http://localhost:5000`

Frontend:
```bash
cd src
npm run dev
```

`http://localhost:5173`

---

## 🧠 Możliwe kierunki rozwoju

* Migracja do PostgreSQL dla środowiska produkcyjnego
* Dodanie Docker (konteneryzacja)
* Pipeline CI/CD (np. GitHub Actions)
* Wdrożenie frontendu (React) na platformie produkcyjnej (np. Vercel, Netlify) i połączenie z backendem
* Dodanie weryfikacji email i 2FA
* Poprawa cache i wydajności (np. Redis)
* Rozszerzenie OAuth o dodatkowych dostawców (np. Google, Facebook, Microsoft)

---

## 📄 Licencja

Projekt ma charakter edukacyjny i służy celom portfolio.

---

📌 Autor: Michał Rusek (Vyroxes)