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
    { id: '3', name: 'Information Technologies (IT)' },
    { id: '4', name: 'Customer Services' },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    const form = e.currentTarget;
    let isValid = true;

    Array.from(form.elements).forEach((element) => {
      const input = element as HTMLInputElement;
      if (input.hasAttribute('required') && !input.value.trim()) {
        input.setCustomValidity('Please fill out this field.');
        isValid = false;
      } else {
        input.setCustomValidity('');
      }
    });

    if (!isValid) {
      form.reportValidity();
      return;
    }

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
        'Registration failed. Please check your information.';
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
            Create New Account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Enter your details to join the Helpdesk system
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
          {/* First Name & Last Name Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                First Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  e.target.setCustomValidity('');
                }}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  e.target.setCustomValidity('');
                }}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                e.target.setCustomValidity('');
              }}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              placeholder="john@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                e.target.setCustomValidity('');
              }}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              placeholder="••••••••"
            />
          </div>

          {/* Department Selection */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-slate-700">
              Department
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
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <span className="text-slate-600">Already have an account? </span>
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}