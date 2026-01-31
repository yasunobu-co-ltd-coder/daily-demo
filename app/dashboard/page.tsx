'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import VoiceInput from '../../components/VoiceInput'
import ThemeToggle from '../../components/ThemeToggle'

interface Report {
  id: string
  content: string
  date: string
  created_at: string
  profiles: {
    email: string
  }
}

interface Profile {
  id: string
  email: string
  company_id: string
  companies: {
    name: string
  }
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [report, setReport] = useState('')
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, companies(name)')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        await fetchReports(profileData.company_id)
      }
      setLoading(false)
    }
    initialize()
  }, [router])

  const fetchReports = async (companyId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('reports')
      .select('*, profiles(email)')
      .eq('company_id', companyId)
      .eq('date', today)
      .order('created_at', { ascending: false })

    if (data) setReports(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile || !report.trim()) return

    setSubmitting(true)
    const { error } = await supabase
      .from('reports')
      .insert([{
        user_id: user.id,
        company_id: profile.company_id,
        content: report,
        date: new Date().toISOString().split('T')[0]
      }])

    if (error) {
      alert('エラー: ' + error.message)
    } else {
      setReport('')
      await fetchReports(profile.company_id)
    }
    setSubmitting(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">日報アプリ</h1>
            {profile?.companies && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{profile.companies.name}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 日報入力フォーム */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}の日報
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={6}
                placeholder="今日の業務内容を入力してください..."
              />
            </div>
            <div className="flex gap-3">
              <VoiceInput onTranscript={(transcript) => setReport(prev => prev + transcript)} />
              <button
                type="submit"
                disabled={submitting || !report.trim()}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '送信中...' : '日報を提出'}
              </button>
            </div>
          </form>
        </div>

        {/* 本日の日報一覧 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            本日の日報一覧
          </h2>
          {reports.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              まだ日報が提出されていません
            </p>
          ) : (
            <div className="space-y-4">
              {reports.map((r) => (
                <div key={r.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {r.profiles?.email || '不明'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(r.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{r.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-4 text-gray-500 dark:text-gray-400 text-xs">
        Ver 0.1 - 安信工業 Performax
      </footer>
    </div>
  )
}
