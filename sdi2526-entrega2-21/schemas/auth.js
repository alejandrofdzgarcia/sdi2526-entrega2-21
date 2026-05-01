const loginRequestSchema = {
    type: 'object',
    required: ['dni', 'password'],
    properties: {
        dni: { type: 'string', example: '12345678Z' },
        password: { type: 'string', example: 'password123' }
    }
};

const signupRequestSchema = {
    type: 'object',
    required: ['dni', 'nombre', 'apellidos', 'password', 'confirmPassword'],
    properties: {
        dni: { type: 'string', example: '87654321A' },
        nombre: { type: 'string', example: 'Juan' },
        apellidos: { type: 'string', example: 'García López' },
        password: { type: 'string', example: 'Segur@Pass1234' },
        confirmPassword: { type: 'string', example: 'Segur@Pass1234' }
    }
};

module.exports = {
    LoginRequest: loginRequestSchema,
    SignupRequest: signupRequestSchema
};
