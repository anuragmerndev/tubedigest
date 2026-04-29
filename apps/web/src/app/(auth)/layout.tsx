import { Logo } from '@/components/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Subtle grid glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(139,92,246,0.08), transparent 55%)',
        }}
      />
      <div className="relative w-full max-w-[380px]">
        <div className="flex justify-center mb-8">
          <Logo size={22} />
        </div>
        {children}
      </div>
    </div>
  )
}
