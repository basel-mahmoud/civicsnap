export function Placeholder({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-app">{title}</h1>
      <p className="mt-2 text-soft">This section is being built. Check back shortly.</p>
    </div>
  )
}
