import React, { useState, useEffect } from "react";
import ReservationToast from "../components/ReservationToast";
import "../assets/ReservationForm.css";

const RecurrentReservation = ({ onDone }) => {
    const [myReservations, setMyReservations] = useState([]);
    const [isLoading, setIsLoading]           = useState(false);
    const [toast, setToast]                   = useState({ message: null, type: "error" });
    const [createdList, setCreatedList]       = useState([]);

    const [formData, setFormData] = useState({
        reservationId: "",
        frequency:     "semanal",
        endRecurrence: ""
    });

    // Cargar las reservas ACTIVE del usuario para el desplegable
    useEffect(() => {
        fetch("http://localhost:8081/api/v1.0/reservations", {
            headers: { token: localStorage.getItem("token") }
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => setMyReservations(data.filter(r => r.status === "ACTIVE")))
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setToast({ message: null, type: "error" });
        setCreatedList([]);

        // Obtener el userDni de la reserva seleccionada
        const selected = myReservations.find(r => r._id === formData.reservationId);
        if (!selected) {
            setToast({ message: "Selecciona una reserva base válida", type: "error" });
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:8081/api/v1.0/reservations/${formData.reservationId}/recurrent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        token: localStorage.getItem("token")
                    },
                    body: JSON.stringify({
                        userDni:       selected.userDni,
                        frequency:     formData.frequency,
                        endRecurrence: formData.endRecurrence
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setToast({ message: data.message, type: "success" });
                setCreatedList(data.created || []);
            } else {
                setToast({ message: data.error || "Error al crear reservas recurrentes", type: "error" });
            }
        } catch {
            setToast({ message: "Error de conexión con el servidor", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="add-reservation-container">
            <h2>Crear Reservas Recurrentes</h2>

            <ReservationToast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ message: null, type: "error" })}
            />

            <form className="reservation-form" onSubmit={handleSubmit}>

                <div className="form-group">
                    <label>Reserva Base</label>
                    <select name="reservationId" value={formData.reservationId} onChange={handleChange} required>
                        <option value="">Selecciona una reserva activa...</option>
                        {myReservations.map(r => (
                            <option key={r._id} value={r._id}>
                                {r.space} — {r.startDate} → {r.endDate}
                            </option>
                        ))}
                    </select>
                    {myReservations.length === 0 && (
                        <small style={{ color: "#888" }}>No tienes reservas activas disponibles como base.</small>
                    )}
                </div>

                <div className="form-group">
                    <label>Frecuencia</label>
                    <select name="frequency" value={formData.frequency} onChange={handleChange} required>
                        <option value="diaria">Diaria</option>
                        <option value="semanal">Semanal</option>
                        <option value="mensual">Mensual</option>
                        <option value="anual">Anual</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Fecha límite de recurrencia</label>
                    <input
                        type="datetime-local"
                        name="endRecurrence"
                        value={formData.endRecurrence}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                    <button type="submit" disabled={isLoading} className="submit-btn">
                        {isLoading ? "Creando..." : "Crear Reservas Recurrentes"}
                    </button>
                    <button type="button" onClick={onDone} className="submit-btn">
                        Volver
                    </button>
                </div>
            </form>

            {/* Tabla con las reservas creadas */}
            {createdList.length > 0 && (
                <div style={{ marginTop: "2rem" }}>
                    <h3>Reservas creadas ({createdList.length})</h3>
                    <table className="reservations-table">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Inicio</th>
                            <th>Fin</th>
                        </tr>
                        </thead>
                        <tbody>
                        {createdList.map((r, i) => (
                            <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{r.startDate}</td>
                                <td>{r.endDate}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RecurrentReservation;