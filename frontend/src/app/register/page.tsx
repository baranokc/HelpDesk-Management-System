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

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
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
                  <span className="label-text font-medium text-slate-700">First Name</span>
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
                  className="input input-bordered w-full bg-white text-slate-900 focus:input-primary text-sm"
                  placeholder="John"
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-slate-700">Last Name</span>
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
                  className="input input-bordered w-full bg-white text-slate-900 focus:input-primary text-sm"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-slate-700">Email Address</span>
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
                className="input input-bordered w-full bg-white text-slate-900 focus:input-primary text-sm"
                placeholder="john@example.com"
              />
            </div>

            {/* Password */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-slate-700">Password</span>
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
                className="input input-bordered w-full bg-white text-slate-900 focus:input-primary text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Department Selection */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-slate-700">Department</span>
              </label>
              <select
                id="department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="select select-bordered w-full bg-white text-slate-900 focus:select-primary text-sm"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
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
                    Creating Account...
                  </>
                ) : (
                  'Register'
                )}
              </button>
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