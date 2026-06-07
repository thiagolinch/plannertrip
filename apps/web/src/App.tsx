import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { CreateTripPage } from "./pages/create-trip"
import { TripDetailsPage } from "./pages/trip-details"
import { LoginPage } from "./pages/login"
import { DashboardPage } from "./pages/dashboard"
import { ProtectedRoute } from "./components/protected-route"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    )
  },
  {
    path: "/trips/create",
    element: (
      <ProtectedRoute>
        <CreateTripPage />
      </ProtectedRoute>
    )
  },
  {
    path: "/trips/:tripId",
    element: (
      <ProtectedRoute>
        <TripDetailsPage />
      </ProtectedRoute>
    )
  },
])

export function App() {
  return <RouterProvider router={router} />
}