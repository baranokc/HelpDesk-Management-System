'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/src/services/authService';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('1');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departments = [
    { id: '1', name: 'Software' },
    { id: '2', name: 'Human Resources' },
    { id: '3', name: 'Information Technoogies(IT)' },
    { id: '4', name: 'Customer Services' },
  ];

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.register({
        name,
        lastName,
        email,
        password,
        departmentId,
      });

      router.push('/login?registered=true');
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Kayıt işlemi başarısız oldu. Lütfen bilgilerinizi kontrol edin.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg border border-slate-100">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900">
            Yeni Hesap Oluştur
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Helpdesk sistemine katılmak için bilgilerinizi girin
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {/* Ad & Soyad Yan Yana */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Ad
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                placeholder="Ahmet"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                Soyad
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                placeholder="Yılmaz"
              />
            </div>
          </div>

          {/* E-posta */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              E-posta Adresi
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              placeholder="ahmet@example.com"
            />
          </div>

          {/* Şifre */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              placeholder="••••••••"
            />
          </div>

          {/* Departman Seçimi (Dropdown) */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-slate-700">
              Departman
            </label>
            <select
              id="department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-white"
            >
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <span className="text-slate-600">Zaten hesabınız var mı? </span>
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}