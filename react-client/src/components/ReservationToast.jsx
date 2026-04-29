import React, { useEffect } from 'react';
import '../assets/ReservationToast.css';

const ReservationToast = ({ message, type, onClose }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    return (
        <div className={`reservation-toast ${type}`}>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={onClose}>&times;</button>
        </div>
    );
};

export default ReservationToast;
