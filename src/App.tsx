import { BrowserRouter, Routes, Route } from "react-router";
import { Layout } from "./components/Layout";
import { Today } from "./pages/Today";
import { Habits } from "./pages/Habits";
import { HabitDetail } from "./pages/HabitDetail";
import { Overview } from "./pages/Overview";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Today />} />
          <Route path="overview" element={<Overview />} />
          <Route path="habits" element={<Habits />} />
          <Route path="habits/:id" element={<HabitDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
