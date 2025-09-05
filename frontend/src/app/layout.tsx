import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata = {
  title: 'Speech to Text - Транскрипция аудио и видео',
  description: 'Конвертация аудио и видео файлов в текст с помощью WhisperX',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={`${inter.className} bg-gray-50`}>
        <main className="min-h-screen py-8">
          {children}
        </main>
      </body>
    </html>
  )
}