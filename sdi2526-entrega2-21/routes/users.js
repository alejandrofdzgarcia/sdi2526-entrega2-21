const DNI_REGEX  = /^[0-9]{8}[A-Za-z]$/;
const PASS_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])[^\s]{12,20}$/;

function validateSignupFields(dni, nombre, apellidos, password, confirmPassword) {
  if (!dni || !nombre || !apellidos || !password || !confirmPassword)
    return 'Todos los campos son obligatorios';
  if (!DNI_REGEX.test(dni))
    return 'El DNI no es válido';
  if (!PASS_REGEX.test(password))
    return 'La contraseña debe tener entre 12 y 20 caracteres, al menos 1 mayúscula, 1 minúscula, 1 dígito, 1 carácter especial y sin espacios';
  if (password !== confirmPassword)
    return 'Las contraseñas no coinciden';
  return null;
}

function validateLoginFields(dni, password) {
  if (!dni || !password)
    return 'El DNI y la contraseña son obligatorios';
  if (!DNI_REGEX.test(dni))
    return 'El DNI no es válido';
  return null;
}

function validateChangePasswordFields(currentPassword, newPassword, confirmNewPassword) {
  if (!currentPassword || !newPassword || !confirmNewPassword)
    return 'Todos los campos son obligatorios';
  if (newPassword !== confirmNewPassword)
    return 'Las contraseñas nuevas no coinciden';
  if (!PASS_REGEX.test(newPassword))
    return 'La nueva contraseña debe tener entre 12 y 20 caracteres, al menos 1 mayúscula, 1 minúscula, 1 dígito, 1 carácter especial y sin espacios';
  return null;
}

function hashPassword(app, password) {
  return app.get('crypto')
    .createHmac('sha256', app.get('clave'))
    .update(password).digest('hex');
}

module.exports = function (app, usersRepository) {

  app.get('/users/signup', function (req, res) {
    if (req.session.user) return res.redirect('/spaces/list');
    res.render('signup.twig');
  });

  app.post('/users/signup', async function (req, res) {
    const { dni, nombre, apellidos, password, confirmPassword } = req.body;

    const error = validateSignupFields(dni, nombre, apellidos, password, confirmPassword);
    if (error)
      return res.redirect(`/users/signup?message=${error}&messageType=alert-danger`);

    const dniUpper = dni.toUpperCase();
    const existing = await usersRepository.findUser({ dni: dniUpper }, {});
    if (existing)
      return res.redirect('/users/signup?message=Ya existe un usuario con ese DNI&messageType=alert-danger');

    const user = {
      dni: dniUpper,
      name: nombre,
      lastname: apellidos,
      password: hashPassword(app, password),
      role: 'Empleado Estándar'
    };

    try {
      await usersRepository.insertUser(user);
      req.session.user   = user.dni;
      req.session.nombre = user.name;
      req.session.role   = 'Empleado Estándar';
      res.redirect('/spaces/list?message=Usuario registrado correctamente&messageType=alert-success');
    } catch (err) {
      if (err.code === 11000)
        return res.redirect('/users/signup?message=Ya existe un usuario con ese DNI&messageType=alert-danger');
      res.redirect('/users/signup?message=Error al registrar el usuario&messageType=alert-danger');
    }
  });

  app.get('/users/login', function (req, res) {
    if (req.session.user) {
      if (req.session.role === 'Administrador') return res.redirect('/admin/reservations/list');
      return res.redirect('/spaces/list');
    }
    res.render('login.twig');
  });

  app.post('/users/login', async function (req, res) {
    const { dni, password } = req.body;

    const error = validateLoginFields(dni, password);
    if (error)
      return res.redirect(`/users/login?message=${error}&messageType=alert-danger`);

    try {
      const user = await usersRepository.findUser(
        { dni: dni.toUpperCase(), password: hashPassword(app, password) },
        {}
      );

      if (!user) {
        req.session.user = null;
        return res.redirect('/users/login?message=DNI o contraseña incorrectos&messageType=alert-danger');
      }

      req.session.user   = user.dni;
      req.session.nombre = user.name;
      req.session.role   = user.role || 'Empleado Estándar';

      return user.role === 'Administrador'
        ? res.redirect('/admin/reservations/list')
        : res.redirect('/spaces/list');
    } catch (error) {
      req.session.user = null;
      return res.redirect('/users/login?message=Error al buscar el usuario&messageType=alert-danger');
    }
  });

  app.get('/users/logout', function (req, res) {
    req.session.destroy(function () {
      res.redirect('/users/login?message=Ha cerrado sesión correctamente&messageType=alert-info');
    });
  });

  app.get('/users/change-password', function (req, res) {
    if (!req.session.user) return res.redirect('/users/login');
    res.render('change-password.twig');
  });

  app.post('/users/change-password', async function (req, res) {
    if (!req.session.user) return res.redirect('/users/login');

    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    const error = validateChangePasswordFields(currentPassword, newPassword, confirmNewPassword);
    if (error)
      return res.redirect(`/users/change-password?message=${error}&messageType=alert-danger`);

    try {
      const user = await usersRepository.findUser(
        { dni: req.session.user, password: hashPassword(app, currentPassword) },
        {}
      );

      if (!user)
        return res.redirect('/users/change-password?message=La contraseña actual es incorrecta&messageType=alert-danger');

      await usersRepository.updatePassword(req.session.user, hashPassword(app, newPassword));
      res.redirect('/users/change-password?message=Contraseña modificada correctamente&messageType=alert-success');
    } catch (error) {
      res.redirect('/users/change-password?message=Error al cambiar la contraseña&messageType=alert-danger');
    }
  });

};