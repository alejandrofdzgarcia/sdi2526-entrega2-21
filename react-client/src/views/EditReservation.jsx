import React, { useState, useEffect } from "react";
import ReservationToast from "../components/ReservationToast";
import "../assets/ReservationForm.css";

// Convierte fecha ISO a formato datetime-local
const toLocalInput = (isoStr) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EditReservation = ({ reservation, onDone }) => {
    const [spaces, setSpaces] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState({ message: null, type: "error" });

    const [formData, setFormData] = useState({
        spaceId:   reservation.spaceId?.toString() || "",
        startDate: toLocalInput(reservation.startDateRaw),
        endDate:   toLocalInput(reservation.endDateRaw),
        reason:    reservation.reason || ""
    });

    useEffect(() => {
        fetch("http://localhost:8081/api/v1.0/spaces", {
            headers: { token: localStorage.getItem("token") }
        })
            .then(r => r.ok ? r.json() : [])
            .then(setSpaces)
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

        try {
            const response = await fetch(
                `http://localhost:8081/api/v1.0/reservations/${reservation._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        token: localStorage.getItem("token")
                    },
                    body: JSON.stringify(formData)
                }
            );
            const data = await response.json();

            if (response.ok) {
                setToast({ message: data.message || "Reserva actualizada", type: "success" });
                setTimeout(() => onDone(), 1500);
            } else {
                setToast({ message: data.error || "Error al actualizar", type: "error" });
            }
        } catch {
            setToast({ message: "Error de conexión con el servidor", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="add-reservation-container">
            <h2>Editar Reserva</h2>

            <ReservationToast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ message: null, type: "error" })}
            />

            <form className="reservation-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Espacio</label>
                    <select name="spaceId" value={formData.spaceId} onChange={handleChange} required>
                        <option value="">Seleccione un espacio...</option>
                        {spaces.map(s => (
                            <option key={s._id} value={s._id}>
                                {s.name} ({s.location})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Fecha y Hora de Inicio</label>
                    <input
                        type="datetime-local"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Fecha y Hora de Fin</label>
                    <input
                        type="datetime-local"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Motivo (Opcional)</label>
                    <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        placeholder="Describa el motivo de la reserva..."
                    />
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                    <button type="submit" disabled={isLoading} className="submit-btn">
                        {isLoading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                    <button type="button" onClick={onDone} className="submit-btn">
                        Volver
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditReservation;