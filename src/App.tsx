import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'
import { Layout } from '@/components/Layout'
import { RequireAuth } from '@/components/RequireAuth'
import { Landing } from '@/pages/Landing'
import { SignIn } from '@/pages/SignIn'
import { ReportPage } from '@/pages/ReportPage'
import { Placeholder } from '@/pages/Placeholder'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Landing />} />
              <Route path="/map" element={<Placeholder title="Issue map" />} />
              <Route
                path="/report"
                element={
                  <RequireAuth>
                    <ReportPage />
                  </RequireAuth>
                }
              />
              <Route path="/report/:id" element={<Placeholder title="Report detail" />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/me" element={<Placeholder title="My reports" />} />
              <Route path="/admin" element={<Placeholder title="Admin dashboard" />} />
              <Route path="*" element={<Placeholder title="Page not found" />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
