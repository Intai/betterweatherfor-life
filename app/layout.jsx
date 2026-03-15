import { Geist, Geist_Mono } from 'next/font/google'
import I18nProvider from '@/app/components/i18n-provider'
import LocaleProvider from '@/app/components/locale-provider'
import { getAcceptLanguage } from '@/app/utils/request'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: {
    default: 'Better Weather For Life',
    template: '%s | Better Weather For Life',
  },
  description: 'Find the best places for outdoor activities like SUP, kayaking, snorkeling, and cycling based on weather, tide, and sea conditions.',
  keywords: [
    'weather',
    'outdoor activities',
    'SUP',
    'kayaking',
    'snorkeling',
    'cycling',
    'tide',
    'sea conditions',
  ],
  authors: [{ name: 'Intai', url: 'https://github.com/Intai' }],
  creator: 'Intai',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://betterweatherfor.life'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_NZ',
    siteName: 'Better Weather For Life',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default async function RootLayout({ children }) {
  const { lang, locale } = await getAcceptLanguage()

  return (
    <html lang={lang}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LocaleProvider locale={locale}>
          <I18nProvider>{children}</I18nProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
