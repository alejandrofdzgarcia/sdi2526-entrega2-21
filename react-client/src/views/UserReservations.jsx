import React, { useEffect, useState } from "react";
import "../assets/UserReservations.css";


const UserReservations = ({ onEdit }) => {

    const [reservations, setReservations] = useState([]);
    const [filterStatus, setFilterStatus] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchReservations();
    }, []);

    //obtener las reservas
    const fetchReservations = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("http://localhost:8081/api/v1.0/reservations", {
                headers: {
                    "token": localStorage.getItem("token")
                }
            });

            if (response.ok) {
                const data = await response.json();
                setReservations(data);
            } else {
                console.error("Error al obtener reservas");
            }
        } catch (error) {
            console.error("Error de conexión:", error);
        }
        setIsLoading(false);
    };

    const handleCancel = async (id) => {
        if (!window.confirm("¿Está seguro de que desea cancelar esta reserva?")) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8081/api/v1.0/reservations/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "token": localStorage.getItem("token")
                },
                body: JSON.stringify({
                    userDni: localStorage.getItem("userDni")
                })
            });

            if (response.ok) {
                fetchReservations();
            } else {
                const data = await response.json();
                alert(data.error || "Error al cancelar la reserva");
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("Error de conexión con el servidor");
        }
    };

    // filtrar por estado
    const filteredReservations = reservations.filter(r => {
        if (!filterStatus) return true;
        return r.status === filterStatus;
    });

    return (
        <div className="my-reservations-container">
            <h2>Mis Reservas</h2>

            <div className="filter-container" style={{ maxWidth: "250px" }}>
                <label className="form-label">Filtrar por estado:</label>
                <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">Todas</option>
                    <option value="ACTIVE">Activas</option>
                    <option value="CANCELLED">Canceladas</option>
                </select>
            </div>


            {isLoading && <p>Cargando reservas...</p>}


            {!isLoading && filteredReservations.length === 0 && (
                <p>No hay reservas para mostrar.</p>
            )}

            {!isLoading && filteredReservations.length > 0 && (
                <div className="reservations-table-container" id="tableReservation">
                    <table className="reservations-table">
                        <thead className="table-dark">
                        <tr>
                            <th>Espacio</th>
                            <th>Inicio</th>
                            <th>Fin</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredReservations.map((r, index) => (
                            <tr key={index}>
                                <td>{r.space}</td>
                                <td>{r.startDate}</td>
                                <td>{r.endDate}</td>
                                <td>
                                        <span className={
                                            r.status === "ACTIVE"
                                                ? "badge badge-active"
                                                : "badge badge-cancelled"
                                        }>
                                            {r.status}
                                        </span>
                                </td>
                                <td>
                                    {r.status === "ACTIVE" && (
                                        <div className="actions-cell">
                                            <button className="edit-btn" onClick={() => onEdit(r)}>
                                                Editar
                                            </button>
                                            <button className="cancel-btn" onClick={() => handleCancel(r._id)}>
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UserReservations;