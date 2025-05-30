import { Suspense, useEffect } from "react"; // Import useEffect
import { useRoutes, Routes, Route } from "react-router-dom";
import { usePostHog } from "posthog-js/react"; // Import usePostHog
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
import AdminDashboard from "./pages/AdminDashboard";
import QuotePage from "./components/QuotePage"; // Import QuotePage
// import OrderWizard from "./pages/OrderWizard";
import OrderWizard from "./components/order/OrderWizard";
import OrderSuccessPage from "./components/OrderSuccessPage"; // Import OrderSuccessPage
import PricingPage from "./components/PricingPage"; // Import PricingPage
import PrivacyPolicy from "./components/PrivacyPolicy"; // Import PrivacyPolicy
import TermsOfService from "./components/TermsOfService"; // Import TermsOfService
import ContactSuccessPage from "./components/ContactSuccessPage"; // Import ContactSuccessPage
import FAQPage from "./components/FAQPage"; // Import FAQPage
// Import Use Case components
import AllUseCases from "./components/use-cases/AllUseCases";
import ImmigrationUseCase from "./components/use-cases/ImmigrationUseCase";
import AcademicUseCase from "./components/use-cases/AcademicUseCase";
import EmploymentUseCase from "./components/use-cases/EmploymentUseCase";
import { QuotePaymentPage } from "./components/QuotePaymentPage"; // Import the new payment page
import { PaymentSuccessPage } from "./components/PaymentSuccessPage"; // Import the payment success page
import { OrderProvider } from "./contexts/OrderContext"; // Import the OrderProvider
import routes from "tempo-routes";

function App() {
  const posthog = usePostHog(); // Get PostHog instance

  // Send manual event on component mount
  useEffect(() => {
    if (posthog) {
      posthog.capture("app_loaded", { component: "App" });
    }
  }, [posthog]);

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <OrderProvider>
        {" "}
        {/* Wrap Routes with OrderProvider */}
        <Routes>
          {/* Public Routes with Layout */}
          <Route
            path="/"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
          <Route
            path="/translation"
            element={
              <Layout>
                <TranslationServices />
              </Layout>
            }
          />
          <Route
            path="/evaluation"
            element={
              <Layout>
                <EvaluationServices />
              </Layout>
            }
          />
          <Route
            path="/expert-opinion"
            element={
              <Layout>
                <ExpertOpinionLetters />
              </Layout>
            }
          />
          <Route
            path="/about"
            element={
              <Layout>
                <AboutUs />
              </Layout>
            }
          />
          <Route
            path="/contact"
            element={
              <Layout>
                <ContactUs />
              </Layout>
            }
          />
          <Route
            path="/quote"
            element={
              <Layout>
                <QuotePage />
              </Layout>
            }
          />{" "}
          {/* Add QuotePage route with Layout */}
          <Route
            path="/pricing"
            element={
              <Layout>
                <PricingPage />
              </Layout>
            }
          />{" "}
          {/* Add PricingPage route with Layout */}
          <Route
            path="/privacy-policy"
            element={
              <Layout>
                <PrivacyPolicy />
              </Layout>
            }
          />{" "}
          {/* Add Privacy Policy route */}
          <Route
            path="/terms-of-service"
            element={
              <Layout>
                <TermsOfService />
              </Layout>
            }
          />{" "}
          {/* Add Terms of Service route */}
          <Route
            path="/contact-success"
            element={
              <Layout>
                <ContactSuccessPage />
              </Layout>
            }
          />{" "}
          {/* Add Contact Success route */}
          <Route
            path="/faq"
            element={
              <Layout>
                <FAQPage />
              </Layout>
            }
          />{" "}
          {/* Add FAQ route */}
          {/* Add Use Case Routes */}
          <Route
            path="/use-cases"
            element={
              <Layout>
                <AllUseCases />
              </Layout>
            }
          />
          <Route
            path="/use-cases/immigration"
            element={
              <Layout>
                <ImmigrationUseCase />
              </Layout>
            }
          />
          <Route
            path="/use-cases/academic"
            element={
              <Layout>
                <AcademicUseCase />
              </Layout>
            }
          />
          <Route
            path="/use-cases/employment"
            element={
              <Layout>
                <EmploymentUseCase />
              </Layout>
            }
          />
          {/* <Route path="/faq" element={<Layout><FAQPage /></Layout>} /> */}{" "}
          {/* REMOVED Duplicate FAQ route */}
          <Route
            path="/order-wizard"
            element={
              <Layout>
                <OrderWizard />
              </Layout>
            }
          />{" "}
          {/* Add Layout */}
          {/* Routes without standard Layout (Auth, Order Process, Admin, Quote Payment) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* <Route path="/order-wizard" element={<OrderWizard />} /> */}{" "}
          {/* Moved to Layout routes */}
          <Route path="/order-success" element={<OrderSuccessPage />} />{" "}
          {/* Existing order success page */}
          <Route
            path="/payment-success"
            element={<PaymentSuccessPage />}
          />{" "}
          {/* Add quote payment success route */}
          <Route
            path="/quote-payment/:quoteId"
            element={<QuotePaymentPage />}
          />{" "}
          {/* Add quote payment page route */}
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/order"
              element={
                <Layout>
                  <OrderPage />
                </Layout>
              }
            />{" "}
            {/* Add Layout */}
            {/* <Route path="/order-wizard" element={<OrderWizard />} /> */}{" "}
            {/* Moved to public */}
            {/* <Route path="/dashboard" element={<AdminDashboard />} /> */}{" "}
            {/* Removed duplicate dashboard route */}
            <Route path="/admin" element={<AdminDashboard />} />{" "}
            {/* Keep /admin as the route */}
            {/* Add other protected routes here */}
          </Route>
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </OrderProvider>{" "}
      {/* Close OrderProvider */}
    </Suspense>
  );
}

export default App;
