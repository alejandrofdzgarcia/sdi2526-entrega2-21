const userSchema = {
    type: 'object',
    properties: {
        dni: { type: 'string', description: 'DNI del usuario' },
        name: { type: 'string', description: 'Nombre' },
        lastname: { type: 'string', description: 'Apellidos' },
        email: { type: 'string', description: 'Correo electrónico' },
        role: { type: 'string', description: 'Rol en el sistema' }
    },
    example: {
        dni: "12345678Z",
        name: "Juan",
        lastname: "Pérez",
        email: "juan@example.com",
        role: "Empleado Estándar"
    }
};
module.exports = {
    User: userSchema
};
