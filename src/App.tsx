import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import OrderPage from "./components/OrderPage";
import TranslationServices from "./components/TranslationServices";
import EvaluationServices from "./components/EvaluationServices";
import ExpertOpinionLetters from "./components/ExpertOpinionLetters";
import AboutUs from "./components/AboutUs";
import ContactUs from "./components/ContactUs";
import Login from "./components/Auth/Login"; // Import Login
import Register from "./components/Auth/Register"; // Import Register
import ProtectedRoute from "./components/Auth/ProtectedRoute"; // Import ProtectedRoute
import AdminDashboard from "./components/AdminDashboard"; // Import AdminDashboard
import OrderWizard from "./components/OrderWizard"; // Import OrderWizard
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/translation" element={<TranslationServices />} />
          <Route path="/evaluation" element={<EvaluationServices />} />
          <Route path="/expert-opinion" element={<ExpertOpinionLetters />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/order" element={<OrderPage />} />
            <Route path="/order-wizard" element={<OrderWizard />} /> {/* Add OrderWizard route */}
            <Route path="/dashboard" element={<AdminDashboard />} /> {/* Add protected dashboard route */}
            {/* Add other protected routes here */}
          </Route>
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
