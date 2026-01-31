'use client'

import { useState } from 'react'
import { supabase } from '../../utils/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        // 新規登録
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              company_name: companyName
            }
          }
        })

        if (authError) throw authError

        if (authData.user) {
          // 企業を作成または取得
          let companyId = null

          // 既存の企業を検索
          const { data: existingCompany } = await supabase
            .from('companies')
            .select('id')
            .eq('name', companyName)
            .single()

          if (existingCompany) {
            companyId = existingCompany.id
          } else {
            // 新規企業作成
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert([{ name: companyName }])
              .select()
              .single()

            if (companyError) throw companyError
            companyId = newCompany.id
          }

          // ユーザープロファイル作成
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: authData.user.id,
              email: email,
              company_id: companyId
            }])

          if (profileError) throw profileError
        }

        setError('確認メールを送信しました。メールをご確認ください。')
      } else {
        // ログイン
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (authError) throw authError
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">日報アプリ</h1>
            <p className="text-gray-600">
              {isSignUp ? '新規アカウント登録' : 'ログイン'}
            </p>
          </div>

          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              error.includes('確認メール')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  企業名
                </label>
                <input
                  type="text"
                  required={isSignUp}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-900"
                  placeholder="株式会社〇〇"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-900"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-900"
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '処理中...' : (isSignUp ? '登録する' : 'ログイン')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              {isSignUp
                ? 'すでにアカウントをお持ちの方はこちら'
                : '新規登録はこちら'}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          Ver 0.1 - 安信工業 Performax
        </p>
      </div>
    </div>
  )
}
