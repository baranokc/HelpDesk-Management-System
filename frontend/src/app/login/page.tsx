'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/src/services/authService';
import { loginSchema } from '@/src/schemas/authSchemas';
import { type FormErrors, getFormErrors } from '@/src/lib/validation';
import { useAuth } from '@/src/context/AuthContext';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 🚀 useAuth hook'unu bileşenin içine aldık
  const { login } = useAuth(); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Account created successfully! You can now sign in.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setSuccessMessage(null);

    const result = loginSchema.safeParse({
      email,
      password,
    });

    if (!result.success) {
      setValidationErrors(getFormErrors(result.error));
      return;
    }

    setValidationErrors({});
    setLoading(true);

    try {
      await authService.login(result.data);

      window.location.href = '/tickets';
      
    } catch (err: unknown) {

      const errorMessage =
        (
          err as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        )?.response?.data?.message ??
        'Failed to sign in. Please check your credentials.';

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="card w-full max-w-md border border-slate-200 bg-white shadow-lg">
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
            <div className="alert alert-success mt-4 text-sm text-white shadow-sm">
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error mt-4 text-sm text-white shadow-sm">
              <span>{error}</span>
            </div>
          )}

          <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-control w-full">
              <label className="label" htmlFor="email">
                <span className="label-text font-medium text-slate-700">
                  Email Address
                </span>
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                aria-invalid={Boolean(validationErrors.email)}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationErrors((current) => ({
                    ...current,
                    email: undefined,
                  }));
                }}
                className={`input input-bordered w-full bg-white text-sm text-slate-900 focus:input-primary ${
                  validationErrors.email ? 'input-error' : ''
                }`}
                placeholder="name@example.com"
              />

              {validationErrors.email && (
                <p className="mt-1 text-sm text-error">{validationErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="form-control w-full">
              <label className="label" htmlFor="password">
                <span className="label-text font-medium text-slate-700">
                  Password
                </span>
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                aria-invalid={Boolean(validationErrors.password)}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationErrors((current) => ({
                    ...current,
                    password: undefined,
                  }));
                }}
                className={`input input-bordered w-full bg-white text-sm text-slate-900 focus:input-primary ${
                  validationErrors.password ? 'input-error' : ''
                }`}
                placeholder="••••••••"
              />

              {validationErrors.password && (
                <p className="mt-1 text-sm text-error">{validationErrors.password}</p>
              )}
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
                    <span className="loading loading-spinner loading-sm" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-slate-600">Don&apos;t have an account? </span>
            <Link href="/register" className="link link-primary font-medium">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <span className="loading loading-spinner loading-lg" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}