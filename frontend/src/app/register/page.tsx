'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/src/components/ui/Button';
import { authService } from '@/src/services/authService';
import { registerSchema } from '@/src/schemas/authSchemas';
import {
  type FormErrors,
  getFormErrors,
} from '@/src/lib/validation';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('1');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});

  const departments = [
    { id: '1', name: 'Software' },
    { id: '2', name: 'Human Resources' },
    { id: '3', name: 'Information Technologies (IT)' },
    { id: '4', name: 'Customer Services' },
  ];

  const handleSubmit = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setError(null);

    const result = registerSchema.safeParse({
      name,
      lastName,
      email,
      password,
      departmentId,
    });

    if (!result.success) {
      setValidationErrors(
        getFormErrors(result.error),
      );
      return;
    }

    setValidationErrors({});
    setLoading(true);

    try {
      await authService.register(result.data);

      router.push(
        '/login?registered=true',
      );
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
        )?.response?.data?.message ||
        'Registration failed. Please check your information.';

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
              Create New Account
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Enter your details to join the Helpdesk system
            </p>
          </div>

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
            {/* First Name & Last Name Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-slate-700">
                  First Name
                </span>
              </label>

              <input
                id="name"
                type="text"
                required
                aria-invalid={Boolean(
                  validationErrors.name,
                )}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);

                  setValidationErrors((current) => ({
                    ...current,
                    name: undefined,
                  }));
                }}
                className={`input input-bordered w-full bg-white text-slate-900 focus:input-primary text-sm ${
                  validationErrors.name
                    ? 'input-error'
                    : ''
                }`}
                placeholder="John"
              />

              {validationErrors.name && (
                <p className="mt-1 text-sm text-error">
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-slate-700">
                  Last Name
                </span>
              </label>

              <input
                id="lastName"
                type="text"
                required
                aria-invalid={Boolean(
                  validationErrors.lastName,
                )}
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);

                  setValidationErrors((current) => ({
                    ...current,
                    lastName: undefined,
                  }));
                }}
                className={`input input-bordered w-full bg-white text-slate-900 focus:input-primary text-sm ${
                  validationErrors.lastName
                    ? 'input-error'
                    : ''
                }`}
                placeholder="Doe"
              />

              {validationErrors.lastName && (
                <p className="mt-1 text-sm text-error">
                  {validationErrors.lastName}
                </p>
              )}
              </div>
            </div>

            {/* Email */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-slate-700">
                    Email Address
                  </span>
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  aria-invalid={Boolean(
                    validationErrors.email,
                  )}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);

                    setValidationErrors((current) => ({
                      ...current,
                      email: undefined,
                    }));
                  }}
                  className={`input input-bordered w-full bg-white text-slate-900 focus:input-primary text-sm ${
                    validationErrors.email
                      ? 'input-error'
                      : ''
                  }`}
                  placeholder="john@example.com"
                />

                {validationErrors.email && (
                  <p className="mt-1 text-sm text-error">
                    {validationErrors.email}
                  </p>
                )}
              </div>

                        {/* Password */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-slate-700">
                    Password
                  </span>
                </label>

                <input
                  id="password"
                  type="password"
                  required
                  aria-invalid={Boolean(
                    validationErrors.password,
                  )}
                  value={password} onChange={(e) => {
                    setPassword(e.target.value);

                    setValidationErrors((current) => ({
                      ...current,
                      password: undefined,
                    }));
                  }}
                  className={`input input-bordered w-full bg-white text-slate-900 focus:input-primary text-sm ${
                    validationErrors.password
                      ? 'input-error'
                      : ''
                  }`}
                  placeholder="••••••••"
                />

                {validationErrors.password && (
                  <p className="mt-1 text-sm text-error">
                    {validationErrors.password}
                  </p>
                )}
              </div>

            {/* Department Selection */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-slate-700">
                  Department
                </span>
              </label>

              <select
                id="department"
                aria-invalid={Boolean(
                  validationErrors.departmentId,
                )}
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);

                  setValidationErrors((current) => ({
                    ...current,
                    departmentId: undefined,
                  }));
                }}
                className={`select select-bordered w-full bg-white text-slate-900 focus:select-primary text-sm ${
                  validationErrors.departmentId
                    ? 'select-error'
                    : ''
                }`}
              >
                {departments.map((dept) => (
                  <option
                    key={dept.id}
                    value={dept.id}
                  >
                    {dept.name}
                  </option>
                ))}
              </select>

              {validationErrors.departmentId && (
                <p className="mt-1 text-sm text-error">
                  {validationErrors.departmentId}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="form-control mt-6">
              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                {loading ? 'Creating Account...' : 'Register'}
              </Button>
            </div>
          </form>

          <div className="text-center text-sm mt-4">
            <span className="text-slate-600">Already have an account? </span>
            <Link href="/login" className="link link-primary font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
