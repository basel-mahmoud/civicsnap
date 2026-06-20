import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'
import { Layout } from '@/components/Layout'
import { RequireAuth } from '@/components/RequireAuth'
import { Spinner } from '@/components/ui'
import { Landing } from '@/pages/Landing'

// Code-split the heavier routes (the map pages pull in Leaflet).
const SignIn = lazy(() => import('@/pages/SignIn').then((m) => ({ default: m.SignIn })))
const MapPage = lazy(() => import('@/pages/MapPage').then((m) => ({ default: m.MapPage })))
const ReportPage = lazy(() => import('@/pages/ReportPage').then((m) => ({ default: m.ReportPage })))
const ReportDetail = lazy(() =>
  import('@/pages/ReportDetail').then((m) => ({ default: m.ReportDetail })),
)
const MyReports = lazy(() => import('@/pages/MyReports').then((m) => ({ default: m.MyReports })))
const Admin = lazy(() => import('@/pages/Admin').then((m) => ({ default: m.Admin })))
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })))

function PageFallback() {
  return (
    <div className="flex-1 grid place-items-center py-24 text-soft">
      <Spinner />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Landing />} />
              <Route
                path="/map"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <MapPage />
                  </Suspense>
                }
              />
              <Route
                path="/report/:id"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ReportDetail />
                  </Suspense>
                }
              />
              <Route
                path="/report"
                element={
                  <RequireAuth>
                    <Suspense fallback={<PageFallback />}>
                      <ReportPage />
                    </Suspense>
                  </RequireAuth>
                }
              />
              <Route
                path="/signin"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <SignIn />
                  </Suspense>
                }
              />
              <Route
                path="/me"
                element={
                  <RequireAuth>
                    <Suspense fallback={<PageFallback />}>
                      <MyReports />
                    </Suspense>
                  </RequireAuth>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAuth adminOnly>
                    <Suspense fallback={<PageFallback />}>
                      <Admin />
                    </Suspense>
                  </RequireAuth>
                }
              />
              <Route
                path="*"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <NotFound />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Analytics />
    </ThemeProvider>
  )
}
