const jwt = require('jsonwebtoken');
const JWT_SECRET = 'secreto';

const DNI_REGEX  = /^[0-9]{8}[A-Za-z]$/;
const PASS_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])\S{12,20}$/;

function validatorLogin(dni, password) {
    const errors = [];
    if (!dni || !dni.trim())
        errors.push({ value: dni, msg: 'El DNI es obligatorio', param: 'dni', location: 'body' });
    else if (!DNI_REGEX.test(dni))
        errors.push({ value: dni, msg: 'El DNI no tiene un formato válido', param: 'dni', location: 'body' });
    if (!password || !password.trim())
        errors.push({ value: password, msg: 'La contraseña es obligatoria', param: 'password', location: 'body' });
    return errors;
}

function validatorSignup(dni, nombre, apellidos, password, confirmPassword) {
    const errors = [];
    if (!dni || !dni.trim())
        errors.push({ value: dni, msg: 'El DNI es obligatorio', param: 'dni', location: 'body' });
    else if (!DNI_REGEX.test(dni))
        errors.push({ value: dni, msg: 'El DNI no tiene un formato válido', param: 'dni', location: 'body' });
    if (!nombre || !nombre.trim())
        errors.push({ value: nombre, msg: 'El nombre es obligatorio', param: 'nombre', location: 'body' });
    if (!apellidos || !apellidos.trim())
        errors.push({ value: apellidos, msg: 'Los apellidos son obligatorios', param: 'apellidos', location: 'body' });
    if (!password || !password.trim())
        errors.push({ value: password, msg: 'La contraseña es obligatoria', param: 'password', location: 'body' });
    else if (!PASS_REGEX.test(password))
        errors.push({ value: password, msg: 'La contraseña debe tener entre 12 y 20 caracteres, al menos 1 mayúscula, 1 minúscula, 1 dígito, 1 carácter especial y sin espacios', param: 'password', location: 'body' });
    if (!confirmPassword || !confirmPassword.trim())
        errors.push({ value: confirmPassword, msg: 'La confirmación de contraseña es obligatoria', param: 'confirmPassword', location: 'body' });
    else if (password && password !== confirmPassword)
        errors.push({ value: confirmPassword, msg: 'Las contraseñas no coinciden', param: 'confirmPassword', location: 'body' });
    return errors;
}

function hashPassword(app, password) {
    return app.get('crypto')
        .createHmac('sha256', app.get('clave'))
        .update(password).digest('hex');
}

module.exports = function (app, usersRepository) {

    /**
     * @swagger
     * /api/users/login:
     *   post:
     *     summary: Autenticación de usuario y obtención de token JWT
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginRequest'
     *     responses:
     *       200:
     *         description: Login correcto, devuelve token JWT
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 authorized: { type: boolean, example: true }
     *                 token: { type: string }
     *       401:
     *         description: Credenciales incorrectas
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 authorized: { type: boolean, example: false }
     *                 error: { type: string, example: "DNI o contraseña incorrectos" }
     *       422:
     *         description: Errores de validación
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 errors:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       msg: { type: string }
     *                       param: { type: string }
     *       500:
     *         description: Error interno del servidor
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 authorized: { type: boolean, example: false }
     *                 error: { type: string, example: "Error interno del servidor" }
     */
    app.post('/api/users/login', async function (req, res) {
        const { dni, password } = req.body;

        const errors = validatorLogin(dni, password);
        if (errors.length > 0)
            return res.status(422).json({ errors });

        try {
            const user = await usersRepository.findUser(
                { dni: dni.toUpperCase(), password: hashPassword(app, password) },
                {}
            );

            if (!user)
                return res.status(401).json({ authorized: false, error: 'DNI o contraseña incorrectos' });

            const token = jwt.sign(
                { user: user.dni, role: user.role || 'standard', time: Math.floor(Date.now() / 1000) },
                JWT_SECRET
            );

            return res.status(200).json({ authorized: true, token });
        } catch (error) {
            return res.status(500).json({ authorized: false, error: 'Error interno del servidor' });
        }
    });

    /**
     * @swagger
     * /api/users/signup:
     *   post:
     *     summary: Registro de un nuevo usuario
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SignupRequest'
     *     responses:
     *       201:
     *         description: Usuario registrado correctamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message: { type: string }
     *                 dni: { type: string }
     *       409:
     *         description: Ya existe un usuario con ese DNI
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Ya existe un usuario con ese DNI" }
     *       422:
     *         description: Errores de validación
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 errors:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       msg: { type: string }
     *                       param: { type: string }
     *       500:
     *         description: Error interno del servidor
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Error interno del servidor" }
     */
    app.post('/api/users/signup', async function (req, res) {
        const { dni, nombre, apellidos, password, confirmPassword } = req.body;

        const errors = validatorSignup(dni, nombre, apellidos, password, confirmPassword);
        if (errors.length > 0)
            return res.status(422).json({ errors });

        try {
            const dniUpper = dni.toUpperCase();
            const existing = await usersRepository.findUser({ dni: dniUpper }, {});
            if (existing)
                return res.status(409).json({ error: 'Ya existe un usuario con ese DNI' });

            const user = {
                dni: dniUpper,
                name: nombre,
                lastname: apellidos,
                password: hashPassword(app, password),
                role: 'Empleado Estándar'
            };

            await usersRepository.insertUser(user);
            return res.status(201).json({ message: 'Usuario registrado correctamente', dni: user.dni });
        } catch (error) {
            if (error.code === 11000)
                return res.status(409).json({ error: 'Ya existe un usuario con ese DNI' });
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

};