# weather-app

Vue 3 + TypeScript weather application powered by the OpenWeather API.

## Features

- City search with autocomplete
- Multiple independent weather widgets
- Favorites stored in localStorage
- Day / 5-day temperature charts with Chart.js
- EN / UK interface toggle
- Light / dark theme toggle
- Auto deploy to GitHub Pages on push to `main`

## Environment

Create `.env` from `.env.example` and set your API key:

```dotenv
VITE_WEATHER_API_KEY=your_api_key
```

## Local development

```sh
npm install
npm run dev
```

## Production build

```sh
npm run build
```

## Lint

```sh
npm run lint
```

## GitHub Pages

Deployment runs automatically after every push to `main` through GitHub Actions.

Project URL:

`https://matyushkin-s.github.io/weather-app/`