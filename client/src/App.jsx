import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Services from "./pages/Services";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <Link to="/" className="logo">UrbanClone</Link>
        <div className="nav-links">
          <Link to="/">Services</Link>
          <Link to="/bookings">My Bookings</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Services />} />
      </Routes>
    </BrowserRouter>
  );
}