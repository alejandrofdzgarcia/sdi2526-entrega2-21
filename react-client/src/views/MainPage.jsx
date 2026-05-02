import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../assets/MainPage.css"
import AddReservation from "./AddReservation";
import UserReservations from "./UserReservations";
import EditReservation from "./EditReservation";
import RecurrentReservation from "./RecurrentReservation";

const MainPage = () => {
    const [view, setView] = useState("reservations");
    const [reservationToEdit, setReservationToEdit] = useState(null);
    const [selectedSongId, setSelectedSongId] = useState(null);

    const handleEdit = (reservation) => {
        setReservationToEdit(reservation);
        setView("edit");
    };

    const handleEditDone = () => {
        setReservationToEdit(null);
        setView("reservations");
    };

    return (
        <div className="page">
            <Header
                onChangeView={setView}
            />
            <main className="content">
                {view === "add" && <AddReservation onReservationAdded={() => setView("reservations")} />}
                {view === "reservations" && <UserReservations />}
                {view === "edit" && reservationToEdit && (
                    <EditReservation
                        reservation={reservationToEdit}
                        onDone={handleEditDone}
                    />
                )}
                {view === "recurrent" && <RecurrentReservation onDone={() => setView("reservations")} />}
            </main>
            <Footer />
        </div>
    );
};
export default MainPage;