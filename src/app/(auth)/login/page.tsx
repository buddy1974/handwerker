'use client'

import { useState, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Mindestens 6 Zeichen'),
})

type FormData = z.infer<typeof schema>

const demoAccounts = [
  { name: 'Marcel Admin', role: 'Admin DE', email: 'admin@handwerkos.de', password: 'admin123456', color: '#0d9488' },
  { name: 'Barry Adoghe', role: 'PSL Services', email: 'admin@pslservicesllc.com', password: 'psl123456', color: '#1a56db' },
  { name: 'Msusong Babessi', role: 'MM Flooring', email: 'admin@mmflooringsolutions.com', password: 'mm123456', color: '#f59e0b' },
]

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const submitRef = useRef<HTMLButtonElement>(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const emailReg = register('email')
  const passwordReg = register('password')

  const fillAccount = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email)
    setPassword(acc.password)
    setValue('email', acc.email)
    setValue('password', acc.password)
    setTimeout(() => submitRef.current?.focus(), 50)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setError('E-Mail oder Passwort falsch.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">HandwerkOS</h1>
          <p className="text-gray-400 mt-1 text-sm">Anmelden</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <label className="block text-sm text-gray-300 mb-1">E-Mail</label>
            <input
              {...emailReg}
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => { setEmail(e.target.value); emailReg.onChange(e) }}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              placeholder="max@firma.de"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Passwort</label>
            <input
              {...passwordReg}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); passwordReg.onChange(e) }}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg px-3 py-2">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            ref={submitRef}
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-400 text-white font-medium rounded-lg py-2 text-sm transition-colors"
          >
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-xs text-gray-600 whitespace-nowrap">Quick access — click to fill</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>
            <div className="flex flex-col gap-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillAccount(acc)}
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-full border bg-gray-900 hover:bg-opacity-90 transition-all text-sm group"
                  style={{ borderColor: acc.color }}
                >
                  <span className="font-medium text-gray-200 group-hover:text-white">
                    {acc.name}
                  </span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: acc.color + '22', color: acc.color }}
                  >
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </form>

        <p className="text-center text-gray-600 text-xs mt-8">
          Developed by{' '}
          <a
            href="https://maxpromo.digital"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400 transition-colors"
          >
            maxpromo.digital
          </a>
        </p>
      </div>
    </div>
  )
}
