import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'
import { Layout } from '@/components/Layout'
import { RequireAuth } from '@/components/RequireAuth'
import { Landing } from '@/pages/Landing'
import { SignIn } from '@/pages/SignIn'
import { MapPage } from '@/pages/MapPage'
import { ReportPage } from '@/pages/ReportPage'
import { ReportDetail } from '@/pages/ReportDetail'
import { MyReports } from '@/pages/MyReports'
import { Admin } from '@/pages/Admin'
import { Placeholder } from '@/pages/Placeholder'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Landing />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/report/:id" element={<ReportDetail />} />
              <Route
                path="/report"
                element={
                  <RequireAuth>
                    <ReportPage />
                  </RequireAuth>
                }
              />
              <Route path="/signin" element={<SignIn />} />
              <Route
                path="/me"
                element={
                  <RequireAuth>
                    <MyReports />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAuth adminOnly>
                    <Admin />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<Placeholder title="Page not found" />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
