import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import SelecaoAno from "./pages/SelecaoAno";
import TelaInicial from "./pages/TelaInicial";
import SelecaoEquipe from "./pages/SelecaoEquipe";
import Chat from "./pages/Chat";
import Resultado from "./pages/Resultado";
import Desclassificado from "./pages/Desclassificado";

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<SelecaoAno />} />
        <Route path="/inicio" element={<TelaInicial />} />
        <Route path="/equipe" element={<SelecaoEquipe />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/resultado" element={<Resultado />} />
        <Route path="/desclassificado" element={<Desclassificado />} />
      </Routes>
    </AnimatePresence>
  );
}
