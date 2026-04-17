interface LoginViewProps {
  onLogin: () => Promise<void>;
  onCancel: () => Promise<void>;
  waiting: boolean;
}

export function LoginView({ onLogin, onCancel, waiting }: LoginViewProps) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {/* Logo placeholder */}
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg">
        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      </div>

      <h1 className="mb-1 text-lg font-semibold text-gray-900">CMS</h1>
      <p className="mb-8 text-sm text-gray-500">
        {waiting ? "A sign-in tab has been opened. Complete login there." : "Sign in to access your workspace."}
      </p>

      {waiting ? (
        <div className="flex w-full flex-col gap-2">
          <button
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white opacity-60"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Waiting for sign-in…
          </button>
          <button
            onClick={onCancel}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={onLogin}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
            />
          </svg>
          Sign in with CMS
        </button>
      )}
    </div>
  );
}
