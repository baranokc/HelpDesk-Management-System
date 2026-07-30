'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/src/services/authService';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Account created successfully! You can now sign in.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

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
      await authService.login({
        email,
        password,
      });

      router.push('/tickets');
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to sign in. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="card w-full max-w-md bg-white shadow-lg border border-slate-200">
        <div className="card-body">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              Sign In to Your Account
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Log in to manage your support tickets
            </p>
          </div>

          {successMessage && (
            <div className="alert alert-success text-sm mt-4 shadow-sm text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error text-sm mt-4 shadow-sm text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-slate-700">Email Address</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  e.target.setCustomValidity('');
                }}
                className="input input-bordered w-full bg-white text-slate-900 focus:input-primary text-sm"
                placeholder="name@example.com"
              />
            </div>

            {/* Password */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-slate-700">Password</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  e.target.setCustomValidity('');
                }}
                className="input input-bordered w-full bg-white text-slate-900 focus:input-primary text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <div className="form-control mt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full text-white"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="text-center text-sm mt-4">
            <span className="text-slate-600">Don't have an account? </span>
            <Link href="/register" className="link link-primary font-medium">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}