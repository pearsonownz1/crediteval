import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import OrderPage from "./components/OrderPage";
import TranslationServices from "./components/TranslationServices";
import EvaluationServices from "./components/EvaluationServices";
import ExpertOpinionLetters from "./components/ExpertOpinionLetters";
import AboutUs from "./components/AboutUs";
import ContactUs from "./components/ContactUs";
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/translation" element={<TranslationServices />} />
          <Route path="/evaluation" element={<EvaluationServices />} />
          <Route path="/expert-opinion" element={<ExpertOpinionLetters />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
