import React, { useState } from 'react';
import '../assets/ReservationForm.css';

const ReservationForm = ({ onSubmit, isLoading, spaces = [] }) => {
  const [formData, setFormData] = useState({
    spaceId: '',
    startDate: '',
    endDate: '',
    userDni: localStorage.getItem("userDni") || '',
    reason: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="reservation-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="spaceId">Espacio</label>
        <select
          id="spaceId"
          name="spaceId"
          value={formData.spaceId}
          onChange={handleChange}
          required
        >
          <option value="">Seleccione un espacio...</option>
          {spaces.map(space => (
            <option key={space._id} value={space._id}>
              {space.name} ({space.location})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="startDate">Fecha y Hora de Inicio</label>
        <input
          type="datetime-local"
          id="startDate"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="endDate">Fecha y Hora de Fin</label>
        <input
          type="datetime-local"
          id="endDate"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="reason">Motivo (Opcional)</label>
        <textarea
          id="reason"
          name="reason"
          placeholder="Describa el motivo de la reserva..."
          value={formData.reason}
          onChange={handleChange}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="submit-btn"
      >
        {isLoading ? 'Registrando...' : 'Registrar Reserva'}
      </button>
    </form>
  );
};

export default ReservationForm;
