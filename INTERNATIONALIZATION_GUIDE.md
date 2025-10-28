# Internationalization (i18n) Guide

This guide explains how to add translations to the Sparkle application for English and Finnish language support.

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Translation File Structure](#translation-file-structure)
3. [Using Translations in Components](#using-translations-in-components)
4. [Adding New Translation Keys](#adding-new-translation-keys)
5. [Best Practices](#best-practices)
6. [Common Patterns](#common-patterns)
7. [Testing Translations](#testing-translations)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### For New Pages
When creating a new page, you MUST add translations for both languages:

1. **Add translation keys** to both language files:
   - `/public/locales/en.json`
   - `/public/locales/fi.json`

2. **Import the useLanguage hook** in your component:
```typescript
import { useLanguage } from "@/context/LanguageContext";
```

3. **Use the translation function** in your component:
```typescript
const { t } = useLanguage();

return <h1>{t("page.title")}</h1>;
```

4. **Update the tracking document**:
   - Mark your page in `TRANSLATION_PROGRESS.md`

---

## Translation File Structure

Translation files are located in `/public/locales/` and use JSON format with nested objects.

### Example Structure
```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "submit": "Submit"
  },
  "home": {
    "heroTitle": "Find Trusted Cleaners",
    "heroSubtitle": "Book professional cleaning services"
  },
  "booking": {
    "selectDate": "Select Date",
    "totalPrice": "Total Price"
  }
}
```

### Naming Convention
Use dot notation with the following structure:
```
{section}.{page}.{element}

Examples:
✅ home.heroTitle
✅ booking.selectDate
✅ dashboard.welcome
✅ common.loading

❌ HomePageTitle
❌ booking_select_date
❌ dashboard_welcome_message
```

---

## Using Translations in Components

### Basic Usage

#### 1. Import the Hook
```typescript
import { useLanguage } from "@/context/LanguageContext";
```

#### 2. Get the Translation Function
```typescript
export default function MyComponent() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t("page.title")}</h1>
      <p>{t("page.description")}</p>
    </div>
  );
}
```

### Using Language State
```typescript
const { language, setLanguage, t } = useLanguage();

// Check current language
if (language === "fi") {
  // Finnish-specific logic
}

// Change language
setLanguage("fi");
```

### Client Components
Most components using `useLanguage()` need to be client components:
```typescript
"use client";

import { useLanguage } from "@/context/LanguageContext";
```

### Server Components
For server components that need translations, pass translated strings as props from a parent client component.

---

## Adding New Translation Keys

### Step 1: Add to English (`/public/locales/en.json`)
```json
{
  "myNewPage": {
    "title": "Welcome to My Page",
    "subtitle": "This is a subtitle",
    "button": "Click Here"
  }
}
```

### Step 2: Add Finnish Translation (`/public/locales/fi.json`)
```json
{
  "myNewPage": {
    "title": "Tervetuloa sivulleni",
    "subtitle": "Tämä on alaotsikko",
    "button": "Klikkaa tästä"
  }
}
```

### Step 3: Use in Component
```typescript
"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function MyNewPage() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t("myNewPage.title")}</h1>
      <p>{t("myNewPage.subtitle")}</p>
      <button>{t("myNewPage.button")}</button>
    </div>
  );
}
```

---

## Best Practices

### 1. Keep Keys Organized
Group related translations together:
```json
{
  "booking": {
    "form": {
      "selectDate": "Select Date",
      "selectTime": "Select Time",
      "submit": "Book Now"
    },
    "confirmation": {
      "title": "Booking Confirmed",
      "message": "Your booking has been confirmed"
    }
  }
}
```

### 2. Use Common Strings
Reuse common translations across pages:
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "loading": "Loading..."
  }
}
```

Then use: `t("common.save")`

### 3. Avoid Hardcoded Text
❌ Bad:
```typescript
<button>Submit</button>
```

✅ Good:
```typescript
<button>{t("common.submit")}</button>
```

### 4. Handle Missing Keys
The translation system will return the key itself if a translation is missing:
```typescript
t("missing.key") // Returns: "missing.key"
```

Check console for warnings about missing keys during development.

### 5. Keep Translation Files in Sync
Always add translations to BOTH `en.json` and `fi.json` at the same time to avoid missing translations.

---

## Common Patterns

### Pattern 1: Dynamic Content
```typescript
// For dynamic content, add all variations to translation files
{
  "booking": {
    "duration": {
      "hours": "hours",
      "hour": "hour"
    }
  }
}

// Then use conditionally in code
const hours = 2;
const label = hours === 1 ? t("booking.duration.hour") : t("booking.duration.hours");
```

### Pattern 2: Lists and Arrays
```typescript
// Translation file
{
  "services": {
    "list": {
      "cleaning": "Cleaning",
      "deepClean": "Deep Clean",
      "moveOut": "Move-Out Clean"
    }
  }
}

// Component
const serviceNames = [
  t("services.list.cleaning"),
  t("services.list.deepClean"),
  t("services.list.moveOut")
];
```

### Pattern 3: Form Labels
```typescript
// Translation file
{
  "form": {
    "email": {
      "label": "Email Address",
      "placeholder": "Enter your email",
      "error": "Invalid email address"
    }
  }
}

// Component
<div>
  <label>{t("form.email.label")}</label>
  <input placeholder={t("form.email.placeholder")} />
  {error && <span>{t("form.email.error")}</span>}
</div>
```

### Pattern 4: Conditional Rendering
```typescript
const { language } = useLanguage();

// Show Finnish-specific content
{language === "fi" && (
  <div>Finnish-only promo code</div>
)}
```

---

## Testing Translations

### Manual Testing Checklist
When adding translations to a page:

1. **Switch to English**
   - [ ] All text displays correctly in English
   - [ ] No missing translation keys visible
   - [ ] Layout looks good

2. **Switch to Finnish**
   - [ ] All text displays correctly in Finnish
   - [ ] No missing translation keys visible
   - [ ] Layout accommodates longer Finnish text

3. **Test Language Persistence**
   - [ ] Refresh page - language setting persists
   - [ ] Navigate to different pages - language persists
   - [ ] Open in new tab - language setting is maintained

4. **Test Edge Cases**
   - [ ] Very long text doesn't break layout
   - [ ] Special characters (ä, ö, å) display correctly
   - [ ] Numbers and dates format appropriately

### Browser Console
Check for warnings:
```
Translation key not found: page.missingKey
```

---

## Troubleshooting

### Problem: Translations Not Showing
**Symptoms:** Seeing translation keys instead of text (e.g., "home.title")

**Solutions:**
1. Check that translation key exists in both `en.json` and `fi.json`
2. Verify the key path is correct (case-sensitive)
3. Check browser console for errors
4. Clear browser cache and reload

### Problem: Language Not Persisting
**Symptoms:** Language resets to English on page refresh

**Solutions:**
1. Check browser localStorage (should have `sparkle_language` key)
2. Verify LanguageProvider wraps the entire app in `layout.tsx`
3. Check browser console for errors in LanguageContext

### Problem: Component Not Using Translations
**Symptoms:** Component shows hardcoded English text

**Solutions:**
1. Add `"use client"` directive at top of file
2. Import and use `useLanguage()` hook
3. Replace hardcoded strings with `t("key")`

### Problem: Translation Files Not Loading
**Symptoms:** All translations show as keys

**Solutions:**
1. Verify files are in `/public/locales/` directory
2. Check file names are exactly `en.json` and `fi.json`
3. Verify JSON syntax is valid (use JSON linter)
4. Restart development server

---

## Examples

### Full Page Example
```typescript
"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";

export default function BookingPage() {
  const { t } = useLanguage();
  const [date, setDate] = useState("");

  return (
    <div className="container">
      <h1>{t("booking.title")}</h1>
      <p>{t("booking.subtitle")}</p>

      <form>
        <label>{t("booking.form.date")}</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder={t("booking.form.datePlaceholder")}
        />

        <button type="submit">
          {t("booking.form.submit")}
        </button>
      </form>

      <div className="info">
        {t("booking.helpText")}
      </div>
    </div>
  );
}
```

### Component with Language Switcher
```typescript
"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-switcher">
      <button
        onClick={() => setLanguage("en")}
        className={language === "en" ? "active" : ""}
      >
        English
      </button>
      <button
        onClick={() => setLanguage("fi")}
        className={language === "fi" ? "active" : ""}
      >
        Suomi
      </button>
    </div>
  );
}
```

---

## Translation Resources

### Finnish Translation Tips
- Use formal "you" (te/Te) for customer-facing content
- Keep translations natural, not literal word-for-word
- Common terms:
  - Booking = Varaus
  - Cleaner = Siivooja
  - Service = Palvelu
  - Price = Hinta
  - Available = Saatavilla

### Tools
- **DeepL**: https://www.deepl.com/translator (better for Finnish than Google Translate)
- **JSON Validator**: https://jsonlint.com/
- **Translation Memory**: Keep a glossary of common terms for consistency

---

## Getting Help

### When Adding Translations
1. Check this guide first
2. Look at similar pages in the codebase for examples
3. Refer to `TRANSLATION_PROGRESS.md` to see completed pages
4. Check the translation files for existing similar keys

### Resources
- React Context API: https://react.dev/reference/react/useContext
- Next.js App Router: https://nextjs.org/docs/app
- TypeScript: https://www.typescriptlang.org/docs/

---

## Maintenance

### Quarterly Review
- Review all translation keys for consistency
- Check for unused keys
- Update translations based on user feedback
- Verify all new pages have translations

### When Deploying
- [ ] All new pages have translations in both languages
- [ ] Test language switching on new features
- [ ] Update `TRANSLATION_PROGRESS.md`
- [ ] No console warnings about missing keys

---

**Last Updated:** 2025-01-28
**Version:** 1.0.0
**Maintainers:** Sparkle Development Team
