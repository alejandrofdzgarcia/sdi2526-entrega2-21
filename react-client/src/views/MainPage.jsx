import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../assets/MainPage.css"
import AddReservation from "./AddReservation";
import UserReservations from "./UserReservations";

const MainPage = () => {
    const [view, setView] = useState("reservations");
    const [selectedSongId, setSelectedSongId] = useState(null);
    return (
        <div className="page">
            <Header
                onChangeView={setView}
            />
            <main className="content">
                {view === "add" && <AddReservation onReservationAdded={() => setView("reservations")} />}
                {view === "reservations" && <UserReservations />}
            </main>
            <Footer />
        </div>
    );
};
export default MainPage;