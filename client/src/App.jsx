import { BrowserRouter, Routes, Route } from "react-router-dom";
import Services from "./pages/Services";
import Cart from "./pages/Cart";
import Bookings from "./pages/Bookings";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";
import Collection from "./pages/Collection";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollProgress from "./components/ScrollProgress";
import CursorBubble from "./components/CursorBubble";
import Footer from "./components/Footer";
import Nav from "./components/Nav";
import AuthModal from "./components/AuthModal";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { UIProvider } from "./context/UIContext";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <CartProvider>
            <ScrollProgress />
            <CursorBubble />
            <Nav />
            <AuthModal />
            <Routes>
              <Route path="/" element={<Services />} />
              <Route path="/collection/:slug" element={<Collection />} />
              <Route path="/cart" element={<Cart />} />
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute role="customer">
                    <Bookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/professional/dashboard"
                element={
                  <ProtectedRoute role="professional">
                    <ProfessionalDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Footer />
          </CartProvider>
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
