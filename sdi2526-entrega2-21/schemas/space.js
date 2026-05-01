const spaceSchema = {
    type: 'object',
    properties: {
        _id: { type: 'string', description: 'ID único del espacio' },
        name: { type: 'string', description: 'Nombre del espacio' },
        type: { type: 'string', description: 'Tipo (SALA, AULA, COWORK)' },
        location: { type: 'string', description: 'Ubicación física' },
        capacity: { type: 'integer', description: 'Capacidad máxima' },
        description: { type: 'string', description: 'Descripción detallada' },
        active: { type: 'boolean', description: 'Estado de disponibilidad' }
    },
    example: {
        _id: "64f123abc456def789",
        name: "Sala Turing",
        type: "SALA",
        location: "Planta 1",
        capacity: 10,
        description: "Sala de reuniones principal",
        active: true
    }
};
module.exports = {
    Space: spaceSchema
};
