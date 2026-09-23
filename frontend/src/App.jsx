import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import SelecaoAno from "./pages/SelecaoAno";
import TelaInicial from "./pages/TelaInicial";
import SelecaoEquipe from "./pages/SelecaoEquipe";
import Chat from "./pages/Chat";
import Resultado from "./pages/Resultado";
import Desclassificado from "./pages/Desclassificado";
import { useAppStore } from "./store/useAppStore";

// Enquanto a equipe estiver desclassificada, nenhuma outra tela fica acessível
// (nem pela URL, nem pelo botão voltar do navegador): o único caminho é o
// botão REINICIAR da tela de desclassificação, que limpa tudo.
function Protegida({ children }) {
  const desclassificado = useAppStore((s) => s.desclassificado);
  return desclassificado ? <Navigate to="/desclassificado" replace /> : children;
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Protegida><SelecaoAno /></Protegida>} />
        <Route path="/inicio" element={<Protegida><TelaInicial /></Protegida>} />
        <Route path="/equipe" element={<Protegida><SelecaoEquipe /></Protegida>} />
        <Route path="/chat" element={<Protegida><Chat /></Protegida>} />
        <Route path="/resultado" element={<Protegida><Resultado /></Protegida>} />
        <Route path="/desclassificado" element={<Desclassificado />} />
      </Routes>
    </AnimatePresence>
  );
}
