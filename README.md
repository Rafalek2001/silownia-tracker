# GymTracker

Mobilny dziennik treningów (plany A/B, serie, historia, wykresy progresu, timer odpoczynku). Działa offline, dane trzyma w `localStorage` telefonu.

- `index.html` — gotowa aplikacja w jednym pliku (to jest serwowane).
- `app/` — źródła: React + TypeScript + Tailwind CSS + shadcn/ui, Vite.

## Praca nad kodem

```bash
cd app
pnpm install
pnpm dev        # serwer deweloperski
pnpm release    # build do jednego pliku i kopia do ../index.html
```

Po zmianach w `app/` zawsze uruchom `pnpm release` i commituj razem z nowym `index.html`.
