const { ObjectId } = require("mongodb");
const crypto = require("crypto");
const clave = "abcdefg";

/**
 * Rutas de gestión de espacios.
 * Incluye: listado público, detalle, registro admin, edición, activar/desactivar,
 * bloqueos de mantenimiento, disponibilidad, listado de usuarios y registro de usuario.
 *
 * @param {Object} app - Instancia de Express
 * @param {Object} spacesRepository - Repositorio de espacios
 * @param {Object} maintenanceRepository - Repositorio de bloqueos de mantenimiento
 * @param {Object} reservationsRepository - Repositorio de reservas
 * @param {Object} usersRepository - Repositorio de usuarios
 */
module.exports = function (app, spacesRepository, maintenanceRepository, reservationsRepository, usersRepository) {

    // ─────────────────────────────────────────────
    // MIDDLEWARE: Verificar sesión de administrador
    // ─────────────────────────────────────────────
    function requireAdmin(req, res, next) {
        if (!req.session || !req.session.user) {
            return res.redirect("/login?message=Debes iniciar sesión&messageType=alert-warning");
        }
        if (req.session.user.role !== "Administrador") {
            return res.redirect("/spaces/list?message=Acceso denegado&messageType=alert-danger");
        }
        next();
    }

    // ─────────────────────────────────────────────
    // MIDDLEWARE: Verificar sesión (cualquier usuario)
    // ─────────────────────────────────────────────
    function requireLogin(req, res, next) {
        if (!req.session || !req.session.user) {
            return res.redirect("/login?message=Debes iniciar sesión&messageType=alert-warning");
        }
        next();
    }

    // ══════════════════════════════════════════════
    // W1 – REGISTRO DE USUARIO ESTÁNDAR
    // ══════════════════════════════════════════════

    /** GET /signup — Formulario de registro */
    app.get("/signup", function (req, res) {
        if (req.session && req.session.user) {
            return res.redirect("/spaces/list");
        }
        res.render("users/signup.twig", { errors: [], formData: {} });
    });

    /** POST /signup — Procesar registro */
    app.post("/signup", async function (req, res) {
        try {
            const { dni, name, lastname, password, confirmPassword } = req.body;
            const errors = [];

            // Validar campos vacíos
            if (!dni || !name || !lastname || !password || !confirmPassword) {
                errors.push("Todos los campos son obligatorios.");
            }

            // Validar DNI español
            if (dni) {
                const dniRegex = /^[0-9]{8}[A-Z]$/;
                const letras = "TRWAGMYFPDXBNJZSQVHLCKE";
                if (!dniRegex.test(dni.toUpperCase()) ||
                    letras[parseInt(dni.slice(0, 8)) % 23] !== dni.toUpperCase().slice(-1)) {
                    errors.push("El DNI introducido no es válido.");
                }
            }

            // Validar contraseña
            if (password) {
                const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s]).{12,20}$/;
                if (!pwRegex.test(password)) {
                    errors.push("La contraseña debe tener entre 12 y 20 caracteres, con al menos 1 mayúscula, 1 minúscula, 1 dígito y 1 carácter especial, sin espacios.");
                }
                if (password !== confirmPassword) {
                    errors.push("Las contraseñas no coinciden.");
                }
            }

            if (errors.length > 0) {
                return res.render("users/signup.twig", { errors, formData: req.body });
            }

            // Comprobar DNI duplicado
            const existing = await usersRepository.findUser({ dni: dni.toUpperCase() });
            if (existing) {
                errors.push("Ya existe un usuario registrado con ese DNI.");
                return res.render("users/signup.twig", { errors, formData: req.body });
            }

            const hashedPassword = crypto.createHmac("sha256", clave).update(password).digest("hex");

            await usersRepository.insertUser({
                dni: dni.toUpperCase(),
                name,
                lastname,
                password: hashedPassword,
                role: "Empleado Estándar",
                email: ""
            });

            res.redirect("/spaces/list?message=Registro completado correctamente&messageType=alert-success");

        } catch (error) {
            res.render("users/signup.twig", {
                errors: ["Error interno del servidor: " + error.message],
                formData: req.body
            });
        }
    });

    // ══════════════════════════════════════════════
    // W3 – SALIR DE SESIÓN
    // ══════════════════════════════════════════════

    /** POST /logout — Cerrar sesión */
    app.post("/logout", function (req, res) {
        req.session.destroy(function (err) {
            if (err) {
                return res.redirect("/?message=Error al cerrar sesión&messageType=alert-danger");
            }
            res.redirect("/login?message=Ha cerrado sesión correctamente&messageType=alert-success");
        });
    });

    // ══════════════════════════════════════════════
    // W10 – LISTADO DE ESPACIOS DISPONIBLES (usuario estándar)
    // ══════════════════════════════════════════════

    /** GET /spaces/list — Listado de espacios activos con filtros */
    app.get("/spaces/list", requireLogin, function (req, res) {
        let filter = { active: true };

        if (req.query.type && req.query.type !== "") {
            filter.type = req.query.type;
        }
        if (req.query.capacity && req.query.capacity !== "") {
            filter.capacity = { $gte: parseInt(req.query.capacity) };
        }

        spacesRepository.getSpaces(filter, { sort: { name: 1 } }).then(spaces => {
            res.render("spaces/list.twig", {
                title: "Espacios Disponibles",
                spaces,
                activeFilters: req.query,
                user: req.session.user
            });
        }).catch(error => {
            res.send("Error al listar los espacios: " + error);
        });
    });

    // ══════════════════════════════════════════════
    // W11 – DETALLE DE UN ESPACIO
    // ══════════════════════════════════════════════

    /** GET /spaces/:id — Detalle de un espacio */
    app.get("/spaces/:id", requireLogin, async function (req, res) {
        try {
            const spaceId = new ObjectId(req.params.id);
            const space = await spacesRepository.findSpace({ _id: spaceId }, {});
            if (!space) {
                return res.redirect("/spaces/list?message=Espacio no encontrado&messageType=alert-danger");
            }
            res.render("spaces/details.twig", {
                space: {
                    ...space,
                    availability: space.active ? "Disponible" : "No disponible"
                },
                user: req.session.user
            });
        } catch (error) {
            res.redirect("/spaces/list?message=Error al cargar el espacio&messageType=alert-danger");
        }
    });

    // ══════════════════════════════════════════════
    // W12 – CONSULTAR DISPONIBILIDAD DE UN ESPACIO
    // ══════════════════════════════════════════════

    /** GET /spaces/:id/availability — Ver disponibilidad */
    app.get("/spaces/:id/availability", requireLogin, async function (req, res) {
        try {
            const spaceId = new ObjectId(req.params.id);
            const space = await spacesRepository.findSpace({ _id: spaceId }, {});
            if (!space) {
                return res.redirect("/spaces/list?message=Espacio no encontrado&messageType=alert-danger");
            }

            // Rango de fechas: por defecto los próximos 7 días
            const startRange = req.query.startDate
                ? new Date(req.query.startDate)
                : new Date();
            const endRange = req.query.endDate
                ? new Date(req.query.endDate)
                : new Date(startRange.getTime() + 7 * 24 * 60 * 60 * 1000);

            // Reservas activas en el rango
            const reservations = await reservationsRepository.getReservations({
                spaceId: spaceId,
                status: "ACTIVE",
                startDate: { $lt: endRange },
                endDate: { $gt: startRange }
            }, {});

            // Bloqueos activos en el rango
            const blocks = await maintenanceRepository.getMaintenanceBlocks({
                spaceId: spaceId,
                status: "ACTIVE",
                startDate: { $lt: endRange },
                endDate: { $gt: startRange }
            }, {});

            // Formatear eventos para la vista
            const events = [
                ...reservations.map(r => ({
                    type: "RESERVA",
                    start: new Date(r.startDate).toLocaleString("es-ES"),
                    end: new Date(r.endDate).toLocaleString("es-ES"),
                    detail: `Reserva de ${r.userDni}`,
                    badgeClass: "label-primary"
                })),
                ...blocks.map(b => ({
                    type: "MANTENIMIENTO",
                    start: new Date(b.startDate).toLocaleString("es-ES"),
                    end: new Date(b.endDate).toLocaleString("es-ES"),
                    detail: b.reason,
                    badgeClass: "label-warning"
                }))
            ].sort((a, b) => new Date(a.start) - new Date(b.start));

            // Formato ISO para los inputs de fecha
            const toInputDate = (d) => d.toISOString().slice(0, 16);

            res.render("spaces/availability.twig", {
                space,
                events,
                startDate: toInputDate(startRange),
                endDate: toInputDate(endRange),
                user: req.session.user
            });
        } catch (error) {
            res.redirect("/spaces/list?message=Error al consultar disponibilidad&messageType=alert-danger");
        }
    });

    // ══════════════════════════════════════════════
    // W4 – REGISTRAR NUEVO ESPACIO (admin)
    // ══════════════════════════════════════════════

    /** GET /admin/spaces/new — Formulario nuevo espacio */
    app.get("/admin/spaces/new", requireAdmin, function (req, res) {
        res.render("admin/spaces/form.twig", {
            title: "Registrar Nuevo Espacio",
            space: {},
            errors: [],
            isEdit: false,
            user: req.session.user
        });
    });

    /** POST /admin/spaces/new — Procesar nuevo espacio */
    app.post("/admin/spaces/new", requireAdmin, async function (req, res) {
        try {
            const { name, type, location, capacity, description } = req.body;
            const errors = [];

            if (!name || name.trim() === "") errors.push("El nombre no puede estar vacío.");
            if (!capacity || parseInt(capacity) < 1) errors.push("La capacidad debe ser un número entero mayor o igual que 1.");

            if (errors.length === 0) {
                // Comprobar unicidad de nombre entre espacios activos
                const existing = await spacesRepository.findSpace({ name: name.trim(), active: true });
                if (existing) errors.push("Ya existe un espacio activo con ese nombre.");
            }

            if (errors.length > 0) {
                return res.render("admin/spaces/form.twig", {
                    title: "Registrar Nuevo Espacio",
                    space: req.body,
                    errors,
                    isEdit: false,
                    user: req.session.user
                });
            }

            await spacesRepository.insertSpace({
                name: name.trim(),
                type,
                location,
                capacity: parseInt(capacity),
                description: description || "",
                active: true
            });

            res.redirect("/admin/spaces/list?message=Espacio registrado correctamente&messageType=alert-success");

        } catch (error) {
            res.render("admin/spaces/form.twig", {
                title: "Registrar Nuevo Espacio",
                space: req.body,
                errors: ["Error interno: " + error.message],
                isEdit: false,
                user: req.session.user
            });
        }
    });

    // ══════════════════════════════════════════════
    // W5 – EDITAR ESPACIO (admin)
    // ══════════════════════════════════════════════

    /** GET /admin/spaces/:id/edit — Formulario editar espacio */
    app.get("/admin/spaces/:id/edit", requireAdmin, async function (req, res) {
        try {
            const spaceId = new ObjectId(req.params.id);
            const space = await spacesRepository.findSpace({ _id: spaceId }, {});
            if (!space) {
                return res.redirect("/admin/spaces/list?message=Espacio no encontrado&messageType=alert-danger");
            }
            res.render("admin/spaces/form.twig", {
                title: "Editar Espacio",
                space,
                errors: [],
                isEdit: true,
                user: req.session.user
            });
        } catch (error) {
            res.redirect("/admin/spaces/list?message=Error al cargar el espacio&messageType=alert-danger");
        }
    });

    /** POST /admin/spaces/:id/edit — Procesar edición */
    app.post("/admin/spaces/:id/edit", requireAdmin, async function (req, res) {
        try {
            const spaceId = new ObjectId(req.params.id);
            const { name, type, location, capacity, description } = req.body;
            const errors = [];

            if (!name || name.trim() === "") errors.push("El nombre no puede estar vacío.");
            if (!capacity || parseInt(capacity) < 1) errors.push("La capacidad debe ser un número entero mayor o igual que 1.");

            if (errors.length === 0) {
                // Comprobar unicidad: ningún otro espacio activo con el mismo nombre
                const existing = await spacesRepository.findSpace({
                    name: name.trim(),
                    active: true,
                    _id: { $ne: spaceId }
                });
                if (existing) errors.push("Ya existe otro espacio activo con ese nombre.");
            }

            if (errors.length > 0) {
                const space = await spacesRepository.findSpace({ _id: spaceId }, {});
                return res.render("admin/spaces/form.twig", {
                    title: "Editar Espacio",
                    space: { ...space, ...req.body, _id: spaceId },
                    errors,
                    isEdit: true,
                    user: req.session.user
                });
            }

            await spacesRepository.updateSpace({ _id: spaceId }, {
                name: name.trim(),
                type,
                location,
                capacity: parseInt(capacity),
                description: description || ""
            });

            res.redirect("/admin/spaces/list?message=Espacio actualizado correctamente&messageType=alert-success");

        } catch (error) {
            res.redirect("/admin/spaces/list?message=Error al editar el espacio&messageType=alert-danger");
        }
    });

    // ══════════════════════════════════════════════
    // W6 – ACTIVAR / DESACTIVAR ESPACIO (admin)
    // ══════════════════════════════════════════════

    /** POST /admin/spaces/:id/toggle — Cambiar estado activo/inactivo */
    app.post("/admin/spaces/:id/toggle", requireAdmin, async function (req, res) {
        try {
            const spaceId = new ObjectId(req.params.id);
            const space = await spacesRepository.findSpace({ _id: spaceId }, {});
            if (!space) {
                return res.redirect("/admin/spaces/list?message=Espacio no encontrado&messageType=alert-danger");
            }

            const newActive = !space.active;
            await spacesRepository.updateSpace({ _id: spaceId }, { active: newActive });

            const msg = newActive ? "Espacio activado correctamente" : "Espacio desactivado correctamente";
            res.redirect(`/admin/spaces/list?message=${encodeURIComponent(msg)}&messageType=alert-success`);

        } catch (error) {
            res.redirect("/admin/spaces/list?message=Error al cambiar estado&messageType=alert-danger");
        }
    });

    // ══════════════════════════════════════════════
    // ADMIN: LISTADO DE TODOS LOS ESPACIOS
    // ══════════════════════════════════════════════

    /** GET /admin/spaces/list — Listado admin de espacios */
    app.get("/admin/spaces/list", requireAdmin, async function (req, res) {
        try {
            const spaces = await spacesRepository.getSpaces({}, { sort: { name: 1 } });
            res.render("admin/spaces/list.twig", {
                title: "Gestión de Espacios",
                spaces,
                user: req.session.user
            });
        } catch (error) {
            res.send("Error al listar los espacios: " + error);
        }
    });

    // ══════════════════════════════════════════════
    // W7 – CREAR BLOQUEO DE MANTENIMIENTO (admin)
    // ══════════════════════════════════════════════

    /** GET /admin/spaces/:id/maintenance/new — Formulario nuevo bloqueo */
    app.get("/admin/spaces/:id/maintenance/new", requireAdmin, async function (req, res) {
        try {
            const spaceId = new ObjectId(req.params.id);
            const space = await spacesRepository.findSpace({ _id: spaceId }, {});
            if (!space) {
                return res.redirect("/admin/spaces/list?message=Espacio no encontrado&messageType=alert-danger");
            }
            res.render("admin/maintenance/form.twig", {
                space,
                errors: [],
                formData: {},
                user: req.session.user
            });
        } catch (error) {
            res.redirect("/admin/spaces/list?message=Error&messageType=alert-danger");
        }
    });

    /** POST /admin/spaces/:id/maintenance/new — Crear bloqueo */
    app.post("/admin/spaces/:id/maintenance/new", requireAdmin, async function (req, res) {
        try {
            const spaceId = new ObjectId(req.params.id);
            const space = await spacesRepository.findSpace({ _id: spaceId }, {});
            const { startDate, endDate, reason } = req.body;
            const errors = [];

            if (!startDate || !endDate || !reason || reason.trim() === "") {
                errors.push("Todos los campos son obligatorios.");
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            if (start >= end) {
                errors.push("La fecha de inicio debe ser anterior a la de fin.");
            }

            if (errors.length === 0) {
                // Comprobar solape con otros bloqueos activos
                const overlapBlock = await maintenanceRepository.getMaintenanceBlocks({
                    spaceId: spaceId,
                    status: "ACTIVE",
                    startDate: { $lt: end },
                    endDate: { $gt: start }
                });
                if (overlapBlock.length > 0) {
                    errors.push("El bloqueo se solapa con otro bloqueo activo en este espacio.");
                }
            }

            if (errors.length === 0) {
                // Comprobar solape con reservas activas
                const overlapRes = await reservationsRepository.getReservations({
                    spaceId: spaceId,
                    status: "ACTIVE",
                    startDate: { $lt: end },
                    endDate: { $gt: start }
                });
                if (overlapRes.length > 0) {
                    errors.push("El bloqueo se solapa con una reserva activa en este espacio.");
                }
            }

            if (errors.length > 0) {
                return res.render("admin/maintenance/form.twig", {
                    space,
                    errors,
                    formData: req.body,
                    user: req.session.user
                });
            }

            await maintenanceRepository.insertBlock({
                spaceId: spaceId,
                startDate: start,
                endDate: end,
                reason: reason.trim(),
                status: "ACTIVE"
            });

            res.redirect(`/admin/spaces/list?message=${encodeURIComponent("Bloqueo de mantenimiento creado correctamente")}&messageType=alert-success`);

        } catch (error) {
            res.redirect("/admin/spaces/list?message=Error al crear bloqueo&messageType=alert-danger");
        }
    });

    // ══════════════════════════════════════════════
    // W8 – CANCELAR BLOQUEO DE MANTENIMIENTO (admin)
    // ══════════════════════════════════════════════

    /** GET /admin/maintenance/list — Listado de bloqueos */
    app.get("/admin/maintenance/list", requireAdmin, async function (req, res) {
        try {
            const blocks = await maintenanceRepository.getMaintenanceBlocks({}, {});

            // Enriquecer con nombre del espacio
            const enrichedBlocks = await Promise.all(blocks.map(async (block) => {
                const space = await spacesRepository.findSpace({ _id: block.spaceId }, {});
                return {
                    ...block,
                    spaceName: space ? space.name : "Desconocido",
                    startFormatted: new Date(block.startDate).toLocaleString("es-ES"),
                    endFormatted: new Date(block.endDate).toLocaleString("es-ES")
                };
            }));

            res.render("admin/maintenance/list.twig", {
                blocks: enrichedBlocks,
                user: req.session.user
            });
        } catch (error) {
            res.send("Error al listar bloqueos: " + error);
        }
    });

    /** POST /admin/maintenance/:id/cancel — Cancelar bloqueo */
    app.post("/admin/maintenance/:id/cancel", requireAdmin, async function (req, res) {
        try {
            const blockId = new ObjectId(req.params.id);
            const block = await maintenanceRepository.findBlock({ _id: blockId });
            if (!block) {
                return res.redirect("/admin/maintenance/list?message=Bloqueo no encontrado&messageType=alert-danger");
            }
            if (block.status === "CANCELADO") {
                return res.redirect("/admin/maintenance/list?message=El bloqueo ya está cancelado&messageType=alert-warning");
            }

            await maintenanceRepository.updateBlock({ _id: blockId }, { status: "CANCELADO" });

            res.redirect(`/admin/maintenance/list?message=${encodeURIComponent("Bloqueo cancelado correctamente")}&messageType=alert-success`);

        } catch (error) {
            res.redirect("/admin/maintenance/list?message=Error al cancelar bloqueo&messageType=alert-danger");
        }
    });

    // ══════════════════════════════════════════════
    // W15 – LISTADO DE USUARIOS DEL SISTEMA (admin)
    // ══════════════════════════════════════════════

    /** GET /admin/users/list — Listado paginado de usuarios */
    app.get("/admin/users/list", requireAdmin, async function (req, res) {
        try {
            const limit = 5;
            let page = parseInt(req.query.page);
            if (!page || page < 1) page = 1;

            const result = await usersRepository.getUsersPg({}, {}, page);

            let lastPage = Math.ceil(result.total / limit);
            if (lastPage < 1) lastPage = 1;

            const pages = [];
            for (let i = page - 2; i <= page + 2; i++) {
                if (i > 0 && i <= lastPage) pages.push(i);
            }

            res.render("admin/users/list.twig", {
                users: result.users,
                pages,
                currentPage: page,
                lastPage,
                user: req.session.user
            });
        } catch (error) {
            res.send("Error al listar usuarios: " + error);
        }
    });
};