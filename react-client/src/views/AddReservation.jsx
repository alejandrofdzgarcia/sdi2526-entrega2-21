import React, { useState, useEffect } from "react";
import ReservationForm from "../components/ReservationForm";
import ReservationToast from "../components/ReservationToast";
import "../assets/ReservationForm.css";

const AddReservation = ({ onReservationAdded }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [spaces, setSpaces] = useState([]);
    const [toast, setToast] = useState({ message: null, type: 'error' });
    const [formKey, setFormKey] = useState(0);

    useEffect(() => {
        fetchSpaces();
    }, []);

    const fetchSpaces = async () => {
        try {
            const response = await fetch(`http://localhost:8081/api/v1.0/spaces`, {
                headers: {
                    "token": localStorage.getItem("token")
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSpaces(data);
            } else {
                console.error("Error fetching spaces");
            }
        } catch (error) {
            console.error("Connection error while fetching spaces:", error);
        }
    };

    const handleAddReservation = async (formData) => {
        setIsLoading(true);
        setToast({ message: null, type: 'error' });

        try {
            const response = await fetch(`http://localhost:8081/api/v1.0/reservations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "token": localStorage.getItem("token")
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setIsLoading(false);
                setToast({
                    message: data.message || "Reserva registrada correctamente",
                    type: 'success'
                });
                setFormKey(prev => prev + 1); // Reset form
                if (onReservationAdded) {
                    onReservationAdded();
                }
            } else {
                setIsLoading(false);
                if (response.status === 401) {
                    localStorage.removeItem("token");
                    setToast({ message: "Sesión expirada. Por favor, inicie sesión de nuevo.", type: 'error' });
                } else {
                    setToast({
                        message: data.error || data.errors || "Error al registrar la reserva",
                        type: 'error'
                    });
                }
            }
        } catch (error) {
            setIsLoading(false);
            setToast({ message: "Error de conexión con el servidor", type: 'error' });
        }
    };

    return (
        <div className="add-reservation-container">
            <h2>Registrar Nueva Reserva</h2>

            <ReservationToast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ message: null, type: 'error' })}
            />

            <ReservationForm
                key={formKey}
                onSubmit={handleAddReservation}
                isLoading={isLoading}
                spaces={spaces}
            />
        </div>
    );
};

export default AddReservation;
