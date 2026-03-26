import type { AppLocale } from '@/types/weather'

export const localeLabels: Record<AppLocale, string> = {
  en: 'EN',
  uk: 'UK',
}

export const apiLanguageByLocale: Record<AppLocale, string> = {
  en: 'en',
  uk: 'uk',
}

const messages = {
  appTitle: {
    en: 'Weather App',
    uk: 'Додаток прогнозу погоди',
  },
  appSubtitle: {
    en: 'Search cities, compare forecasts, and save favorites.',
    uk: 'Шукайте міста, порівнюйте прогнози та зберігайте обране.',
  },
  dashboardTab: {
    en: 'Widgets',
    uk: 'Віджети',
  },
  favoritesTab: {
    en: 'Favorites',
    uk: 'Обране',
  },
  theme: {
    en: 'Theme',
    uk: 'Тема',
  },
  language: {
    en: 'Language',
    uk: 'Мова',
  },
  light: {
    en: 'Light',
    uk: 'Світла',
  },
  dark: {
    en: 'Dark',
    uk: 'Темна',
  },
  addBlock: {
    en: 'Add widget',
    uk: 'Додати віджет',
  },
  maxBlocksReached: {
    en: 'Maximum of 5 widgets reached.',
    uk: 'Досягнуто максимуму: 5 віджетів.',
  },
  searchPlaceholder: {
    en: 'Search city',
    uk: 'Пошук міста',
  },
  searchHint: {
    en: 'Start typing to see city suggestions.',
    uk: 'Почніть вводити, щоб побачити підказки міст.',
  },
  noResults: {
    en: 'No cities found.',
    uk: 'Міста не знайдено.',
  },
  loading: {
    en: 'Loading…',
    uk: 'Завантаження…',
  },
  chartLoading: {
    en: 'Rendering chart…',
    uk: 'Побудова графіка…',
  },
  currentConditions: {
    en: 'Current conditions',
    uk: 'Поточні умови',
  },
  humidity: {
    en: 'Humidity',
    uk: 'Вологість',
  },
  wind: {
    en: 'Wind',
    uk: 'Вітер',
  },
  favoriteAdd: {
    en: 'Add to favorites',
    uk: 'Додати в обране',
  },
  favoriteRemove: {
    en: 'Remove from favorites',
    uk: 'Видалити з обраного',
  },
  deleteBlock: {
    en: 'Delete widget',
    uk: 'Видалити віджет',
  },
  cannotDeleteLast: {
    en: 'At least one widget must remain.',
    uk: 'Має залишитися принаймні один віджет.',
  },
  confirmDeleteTitle: {
    en: 'Delete widget?',
    uk: 'Видалити віджет?',
  },
  confirmDeleteText: {
    en: 'This widget and its loaded weather data will be removed.',
    uk: 'Цей віджет і завантажені дані погоди буде видалено.',
  },
  cancel: {
    en: 'Cancel',
    uk: 'Скасувати',
  },
  confirm: {
    en: 'Confirm',
    uk: 'Підтвердити',
  },
  day: {
    en: 'Day',
    uk: 'День',
  },
  week: {
    en: '5 days',
    uk: '5 днів',
  },
  hourlyChart: {
    en: 'Today temperature',
    uk: 'Температура сьогодні',
  },
  weeklyChart: {
    en: 'Daily average',
    uk: 'Середня за день',
  },
  favoritesTitle: {
    en: 'Favorite cities',
    uk: 'Улюблені міста',
  },
  favoritesSubtitle: {
    en: 'Tracked cities from local storage.',
    uk: 'Міста збережені в локальному сховищі.',
  },
  favoritesEmpty: {
    en: 'No favorite cities yet. Add them from the widgets tab.',
    uk: 'Поки немає обраних міст. Додайте їх у вкладці віджетів.',
  },
  favoritesLimitTitle: {
    en: 'Favorites limit reached',
    uk: 'Досягнуто ліміту обраного',
  },
  favoritesLimitText: {
    en: 'You can save up to 5 favorite cities.',
    uk: 'Можна зберегти до 5 улюблених міст.',
  },
  apiKeyMissing: {
    en: 'Missing VITE_WEATHER_API_KEY. Add it to your environment.',
    uk: 'Відсутній VITE_WEATHER_API_KEY. Додайте його до середовища.',
  },
  searchPrompt: {
    en: 'Select a city to load weather data.',
    uk: 'Оберіть місто, щоб завантажити дані про погоду.',
  },
  updatedAt: {
    en: 'Updated',
    uk: 'Оновлено',
  },
  autoLocation: {
    en: 'Detected from your IP location.',
    uk: 'Визначено за вашою IP-локацією.',
  },
  refresh: {
    en: 'Refresh',
    uk: 'Оновити',
  },
  genericError: {
    en: 'Something went wrong. Please try again.',
    uk: 'Щось пішло не так. Спробуйте ще раз.',
  },
  feelsLike: {
    en: 'Forecast view',
    uk: 'Режим прогнозу',
  },
  widget: {
    en: 'Widget',
    uk: 'Віджет',
  },
  byHours: {
    en: '3-hour forecast points for today',
    uk: 'Точки прогнозу кожні 3 години на сьогодні',
  },
  byDays: {
    en: 'Average temperature for each forecast day',
    uk: 'Середня температура для кожного дня прогнозу',
  },
} as const

type MessageKey = keyof typeof messages

export function translate(locale: AppLocale, key: MessageKey): string {
  return messages[key][locale]
}

export function formatLocale(locale: AppLocale): string {
  return locale === 'uk' ? 'uk-UA' : 'en-US'
}
