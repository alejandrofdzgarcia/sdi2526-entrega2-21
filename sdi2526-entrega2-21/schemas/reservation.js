const reservationSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', description: 'ID de la reserva' },
        userDni: { type: 'string', description: 'DNI del solicitante' },
        spaceId: { type: 'string', description: 'ID del espacio reservado' },
        startDate: { type: 'string', description: 'Fecha y hora de inicio' },
        endDate: { type: 'string', description: 'Fecha y hora de fin' },
        status: { type: 'string', description: 'Estado (ACTIVE, CANCELLED)' }
    },
    example: {
        id: "64f123abc456def789",
        userDni: "12345678Z",
        spaceId: "64f123abc456def789",
        startDate: "01/10/2025, 10:00",
        endDate: "01/10/2025, 12:00",
        status: "ACTIVE"
    }
};

const reservationRequestSchema = {
    type: 'object',
    required: ['spaceId', 'startDate', 'endDate', 'userDni'],
    properties: {
        spaceId: { type: 'string', example: '64f123abc456def789' },
        startDate: { type: 'string', format: 'date-time', example: '2025-10-01T10:00:00Z' },
        endDate: { type: 'string', format: 'date-time', example: '2025-10-01T12:00:00Z' },
        reason: { type: 'string', example: 'Reunión de equipo' },
        userDni: { type: 'string', example: '10000001S' }
    }
};

module.exports = {
    Reservation: reservationSchema,
    ReservationRequest: reservationRequestSchema
};
