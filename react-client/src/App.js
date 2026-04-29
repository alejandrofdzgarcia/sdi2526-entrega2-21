import './assets/App.css';
import { useState } from "react";
import Login from "./views/Login";
import MainPage from "./views/MainPage";

function App() {
  const [logged, setLogged] = useState(
    !!localStorage.getItem("token")
  );
  return (
    <>
      <MainPage />
    </>
  );
}
export default App;
/*
return (
    <>
      {!logged ? (
        <Login onLogin={() => setLogged(true)} />
      ) : (
        <MainPage />
      )}
    </>
  );*/