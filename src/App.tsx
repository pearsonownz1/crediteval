import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout"; // Import the Layout component
import Home from "./components/home";
import OrderPage from "./components/OrderPage";
import TranslationServices from "./components/TranslationServices";
import EvaluationServices from "./components/EvaluationServices";
import ExpertOpinionLetters from "./components/ExpertOpinionLetters";
import AboutUs from "./components/AboutUs";
import ContactUs from "./components/ContactUs";
import Login from "./components/Auth/Login"; // Import Login
import Register from "./components/Auth/Register"; // Import Register
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import AdminDashboard from "./components/AdminDashboard";
import QuotePage from "./components/QuotePage"; // Import QuotePage
import OrderWizard from "./components/OrderWizard";
import OrderSuccessPage from "./components/OrderSuccessPage"; // Import OrderSuccessPage
import PricingPage from "./components/PricingPage"; // Import PricingPage
import PrivacyPolicy from "./components/PrivacyPolicy"; // Import PrivacyPolicy
import TermsOfService from "./components/TermsOfService"; // Import TermsOfService
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          {/* Public Routes with Layout */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/translation" element={<Layout><TranslationServices /></Layout>} />
          <Route path="/evaluation" element={<Layout><EvaluationServices /></Layout>} />
          <Route path="/expert-opinion" element={<Layout><ExpertOpinionLetters /></Layout>} />
          <Route path="/about" element={<Layout><AboutUs /></Layout>} />
          <Route path="/contact" element={<Layout><ContactUs /></Layout>} />
          <Route path="/quote" element={<Layout><QuotePage /></Layout>} /> {/* Add QuotePage route with Layout */}
          <Route path="/pricing" element={<Layout><PricingPage /></Layout>} /> {/* Add PricingPage route with Layout */}
          <Route path="/privacy-policy" element={<Layout><PrivacyPolicy /></Layout>} /> {/* Add Privacy Policy route */}
          <Route path="/terms-of-service" element={<Layout><TermsOfService /></Layout>} /> {/* Add Terms of Service route */}

          {/* Routes without standard Layout (Auth, Order Process, Admin) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/order-wizard" element={<OrderWizard />} /> {/* Made public */}
          <Route path="/order-success" element={<OrderSuccessPage />} /> {/* Add success page route */}

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/order" element={<OrderPage />} />
            {/* <Route path="/order-wizard" element={<OrderWizard />} /> */} {/* Moved to public */}
            {/* <Route path="/dashboard" element={<AdminDashboard />} /> */} {/* Removed duplicate dashboard route */}
            <Route path="/admin" element={<AdminDashboard />} /> {/* Keep /admin as the route */}
            {/* Add other protected routes here */}
          </Route>
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
