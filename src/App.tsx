import { BrowserRouter, Route, Routes } from "react-router-dom";
import ImageStudio from "./pages/ImageStudio";
import { ThemeProvider } from "@/components/theme-provider";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ImageStudio />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
