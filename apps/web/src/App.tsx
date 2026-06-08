import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { CreateTripPage } from "./pages/create-trip"
import { TripDetailsPage } from "./pages/trip-details"
import { LoginPage } from "./pages/login"
import { DashboardPage } from "./pages/dashboard"
import { ErrorPage } from "./pages/error-page"
import { ProtectedRoute } from "./components/protected-route"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <ErrorPage />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: "/trips/create",
    element: (
      <ProtectedRoute>
        <CreateTripPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: "/trips/:tripId",
    element: (
      <ProtectedRoute>
        <TripDetailsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: "*",
    element: <ErrorPage />
  }
])

export function App() {
  return <RouterProvider router={router} />
}