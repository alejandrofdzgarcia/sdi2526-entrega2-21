import React, { useState } from 'react';
import '../assets/ReservationForm.css';

const ReservationForm = ({ onSubmit, isLoading, spaces = [] }) => {
  const [formData, setFormData] = useState({
    spaceId: '',
    startDate: '',
    endDate: '',
    userDni: '',
    reason: ''
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.spaceId) newErrors.spaceId = 'Debe seleccionar un espacio';
    if (!formData.startDate) newErrors.startDate = 'Debe seleccionar una fecha de inicio';
    if (!formData.endDate) newErrors.endDate = 'Debe seleccionar una fecha de fin';
    if (!formData.userDni) newErrors.userDni = 'El DNI es obligatorio';
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = 'La fecha de fin debe ser posterior a la de inicio';
      }
      if (new Date(formData.startDate) < new Date()) {
        newErrors.startDate = 'La fecha de inicio no puede ser en el pasado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
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
        {errors.spaceId && <span className="error-text">{errors.spaceId}</span>}
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
        {errors.startDate && <span className="error-text">{errors.startDate}</span>}
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
        {errors.endDate && <span className="error-text">{errors.endDate}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="userDni">DNI del Usuario</label>
        <input
          type="text"
          id="userDni"
          name="userDni"
          placeholder="12345678A"
          value={formData.userDni}
          onChange={handleChange}
          required
        />
        {errors.userDni && <span className="error-text">{errors.userDni}</span>}
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
