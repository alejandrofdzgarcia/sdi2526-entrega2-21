const { ObjectId } = require("mongodb");

module.exports = function (app, spacesRepository, reservationsRepository, maintenanceRepository) {

    /**
     * @swagger
     * /api/v1.0/reservations:
     *   get:
     *     summary: Obtener reservas del usuario autenticado
     *     description: Devuelve todas las reservas asociadas al usuario logeado con formato de fecha legible.
     *     tags:
     *       - Reservations
     *     security:
     *       - tokenAuth: []
     *     responses:
     *       200:
     *         description: Lista de reservas del usuario
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Reservation'
     *       500:
     *         description: Error interno del servidor
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Error interno del servidor al obtener las reservas propias" }
     */
    app.get('/api/v1.0/reservations', async (req, res) => {
        try {
            let user = res.user || "";

            if (user === "") {
                return res.status(500).json({ error: "Error: Usuario no autenticado" });
            }

            let filter = { userDni: user };
            let reservations = await reservationsRepository.getReservations(filter, {});

            const spaces = await spacesRepository.getSpaces({}, {});
            const spaceMap = {};
            spaces.forEach(s => { spaceMap[s._id.toString()] = s.name; });

            const resultReservations = reservations.map(r => ({
                _id: r._id,
                spaceId: r.spaceId,
                startDateRaw: r.startDate,
                endDateRaw: r.endDate,
                reason: r.reason || "",
                userDni: r.userDni,
                space: spaceMap[r.spaceId.toString()] || "Error Espacio",
                startDate: new Date(r.startDate).toLocaleString("es-ES", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                }),
                endDate: new Date(r.endDate).toLocaleString("es-ES", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                }),
                status: r.status
            }));

            res.status(200).json(resultReservations);

        } catch (error) {
            res.status(500).json({ error: "Error interno del servidor al obtener las reservas propias: " + error.message });
        }
    });

    /**
     * @swagger
     * /api/v1.0/reservations:
     *   post:
     *     summary: Crear una nueva reserva
     *     description: Permite registrar una nueva reserva si no hay conflictos de horario ni mantenimiento.
     *     tags:
     *       - Reservations
     *     security:
     *       - tokenAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ReservationRequest'
     *     responses:
     *       201:
     *         description: Reserva creada correctamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message: { type: string, example: "Reserva registrada con éxito" }
     *                 reservationId: { type: string, example: "64f123abc456def789" }
     *       400:
     *         description: Error en los datos enviados (campos faltantes o fechas en el pasado)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Faltan datos obligatorios: spaceId, startDate, endDate" }
     *       404:
     *         description: Espacio no encontrado
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Espacio no encontrado" }
     *       409:
     *         description: Conflicto de horario o mantenimiento
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Ya existe una reserva en ese horario" }
     *       500:
     *         description: Error interno del servidor
     */
    app.post('/api/v1.0/reservations', async (req, res) => {
        try {
            const { spaceId, startDate, endDate, reason } = req.body;
            const userDni = res.user;

            if (!spaceId || !startDate || !endDate || !userDni) {
                const missing = [];
                if (!spaceId) missing.push("spaceId");
                if (!startDate) missing.push("startDate");
                if (!endDate) missing.push("endDate");
                if (!userDni) missing.push("userDni (res.user)");
                return res.status(400).json({ error: "Faltan datos obligatorios: " + missing.join(", ") });
            }

            const start = new Date(startDate);
            const end = new Date(endDate);
            const now = new Date();

            if (start >= end) {
                return res.status(400).json({ error: "Rango de fechas inválido" });
            }

            if (start < now) {
                return res.status(400).json({ error: "La reserva no puede ser en el pasado" });
            }

            const space = await spacesRepository.findSpace({ _id: new ObjectId(spaceId) });
            if (!space) {
                return res.status(404).json({ error: "Espacio no encontrado" });
            }
            if (!space.active) {
                return res.status(400).json({ error: "El espacio está desactivado" });
            }

            const overlapFilter = {
                spaceId: new ObjectId(spaceId),
                status: "ACTIVE",
                startDate: { $lt: end },
                endDate: { $gt: start }
            };

            const otherRes = await reservationsRepository.getReservations(overlapFilter);
            if (otherRes.length > 0) {
                return res.status(409).json({ error: "Ya existe una reserva en ese horario" });
            }

            const blocks = await maintenanceRepository.getMaintenanceBlocks(overlapFilter);
            if (blocks.length > 0) {
                return res.status(409).json({ error: "Hay un bloqueo de mantenimiento programado" });
            }

            const newReservation = {
                userDni: userDni,
                spaceId: new ObjectId(spaceId),
                startDate: start,
                endDate: end,
                reason: reason || "",
                status: "ACTIVE",
                createdAt: new Date()
            };

            const result = await reservationsRepository.insertReservation(newReservation);

            if (result.insertedId) {
                res.status(201).json({
                    message: "Reserva registrada con éxito",
                    reservationId: result.insertedId
                });
            } else {
                res.status(500).json({ error: "No se pudo registrar la reserva" });
            }

        } catch (error) {
            res.status(500).json({ error: "Error interno del servidor: " + error.message });
        }
    });

    /**
     * @swagger
     * /api/v1.0/reservations/{id}/recurrent:
     *   post:
     *     summary: Crear una reserva recurrente
     *     description: Permite crear una nueva reserva recurrente si no hay conflictos de horario ni mantenimiento.
     *     tags:
     *       - Reservations
     *     security:
     *       - tokenAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID de la reserva base
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RecurrenceRequest'
     *     responses:
     *       201:
     *         description: Reservas recurrentes creadas correctamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message: { type: string, example: "Se crearon 4 reservas recurrentes correctamente" }
     *                 frequency: { type: string, example: "semanal" }
     *                 created:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id: { type: string }
     *                       startDate: { type: string }
     *                       endDate: { type: string }
     *       400:
     *         description: Error en los datos enviados o reserva base inválida
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Frecuencia inválida" }
     *       403:
     *         description: No autorizado (solo el dueño puede crear recurrentes)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Solo puedes crear recurrentes a partir de tus propias reservas" }
     *       404:
     *         description: Reserva base no encontrada
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Reserva base no encontrada" }
     *       409:
     *         description: Conflicto de horario o mantenimiento en alguna ocurrencia
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Solape detectado en la ocurrencia del 15/10/2025" }
     *       500:
     *         description: Error interno del servidor
     */
    app.post('/api/v1.0/reservations/:id/recurrent', async (req, res) => {
        try {
            const reservationId = req.params.id;
            const { frequency, endRecurrence } = req.body;
            const userDni = res.user;

            if (!userDni || !frequency || !endRecurrence) {
                const missing = [];
                if (!userDni) missing.push("userDni (res.user)");
                if (!frequency) missing.push("frequency");
                if (!endRecurrence) missing.push("endRecurrence");
                return res.status(400).json({ error: "Faltan datos obligatorios: " + missing.join(", ") });
            }

            const validFrequencies = ["diaria", "semanal", "mensual", "anual"];
            if (!validFrequencies.includes(frequency)) {
                return res.status(400).json({ error: "Frecuencia inválida. Valores permitidos: diaria, semanal, mensual, anual" });
            }

            const reservations = await reservationsRepository.getReservations({ _id: new ObjectId(reservationId) });
            if (reservations.length === 0) {
                return res.status(404).json({ error: "Reserva base no encontrada" });
            }
            const base = reservations[0];

            if (base.userDni !== userDni) {
                return res.status(403).json({ error: "Solo puedes crear recurrentes a partir de tus propias reservas" });
            }

            if (base.status === "CANCELLED") {
                return res.status(400).json({ error: "No se puede usar una reserva cancelada como base" });
            }

            const baseStart = new Date(base.startDate);
            const baseEnd = new Date(base.endDate);
            const duration = baseEnd.getTime() - baseStart.getTime();
            const endLimit = new Date(endRecurrence);

            if (endLimit <= baseStart) {
                return res.status(400).json({ error: "La fecha de fin de recurrencia debe ser posterior a la reserva base" });
            }

            const occurrences = [];
            let currentStart = new Date(baseStart);

            const advance = (date) => {
                const d = new Date(date);
                if (frequency === "diaria") d.setDate(d.getDate() + 1);
                if (frequency === "semanal") d.setDate(d.getDate() + 7);
                if (frequency === "mensual") d.setMonth(d.getMonth() + 1);
                if (frequency === "anual") d.setFullYear(d.getFullYear() + 1);
                return d;
            };

            currentStart = advance(currentStart);
            while (currentStart <= endLimit) {
                const currentEnd = new Date(currentStart.getTime() + duration);
                occurrences.push({ start: new Date(currentStart), end: new Date(currentEnd) });
                currentStart = advance(currentStart);
            }

            if (occurrences.length === 0) {
                return res.status(400).json({ error: "No se generó ninguna ocurrencia con la frecuencia y fecha de fin indicadas" });
            }

            for (const occ of occurrences) {
                const overlapFilter = {
                    spaceId: base.spaceId,
                    status: "ACTIVE",
                    startDate: { $lt: occ.end },
                    endDate: { $gt: occ.start }
                };

                const otherRes = await reservationsRepository.getReservations(overlapFilter);
                if (otherRes.length > 0) {
                    return res.status(409).json({
                        error: `Solape detectado en la ocurrencia del ${occ.start.toLocaleString("es-ES")}. No se creó ninguna reserva.`
                    });
                }

                const blocks = await maintenanceRepository.getMaintenanceBlocks(overlapFilter);
                if (blocks.length > 0) {
                    return res.status(409).json({
                        error: `Bloqueo de mantenimiento en la ocurrencia del ${occ.start.toLocaleString("es-ES")}. No se creó ninguna reserva.`
                    });
                }
            }

            // 7. Insertar todas las ocurrencias
            const inserted = [];
            for (const occ of occurrences) {
                const newRes = {
                    userDni: base.userDni,
                    spaceId: base.spaceId,
                    startDate: occ.start,
                    endDate: occ.end,
                    reason: base.reason || "",
                    status: "ACTIVE",
                    createdAt: new Date()
                };
                const result = await reservationsRepository.insertReservation(newRes);
                inserted.push({
                    id: result.insertedId,
                    startDate: occ.start.toLocaleString("es-ES"),
                    endDate: occ.end.toLocaleString("es-ES")
                });
            }

            res.status(201).json({
                message: `Se crearon ${inserted.length} reservas recurrentes correctamente`,
                frequency: frequency,
                created: inserted
            });

        } catch (error) {
            res.status(500).json({ error: "Error interno del servidor: " + error.message });
        }
    });

    /**
     * @swagger
     * /api/v1.0/reservations/{id}:
     *   put:
     *     summary: Editar una reserva
     *     description: Permite editar una reserva si pertenece al usuario.
     *     tags:
     *       - Reservations
     *     security:
     *       - tokenAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID de la reserva
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ReservationRequest'
     *     responses:
     *       200:
     *         description: Reserva actualizada correctamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message: { type: string, example: "Reserva actualizada correctamente" }
     *       400:
     *         description: Error en la solicitud (datos inválidos o reserva cancelada)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Rango de fechas inválido" }
     *       403:
     *         description: Solo puedes editar tus propias reservas
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Solo puedes editar tus propias reservas" }
     *       404:
     *         description: Reserva o espacio no encontrado
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Reserva no encontrada" }
     *       409:
     *         description: Conflicto de horario o mantenimiento
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Ya existe una reserva en ese horario" }
     *       500:
     *         description: Error interno del servidor
     */
    app.put('/api/v1.0/reservations/:id', async (req, res) => {
        try {
            const reservationId = req.params.id;
            const { spaceId, startDate, endDate, reason } = req.body;
            const userDni = res.user;

            if (!userDni) {
                return res.status(400).json({ error: "Faltan datos obligatorios: userDni (res.user)" });
            }

            const reservations = await reservationsRepository.getReservations(
                { _id: new ObjectId(reservationId) }
            );
            if (reservations.length === 0) {
                return res.status(404).json({ error: "Reserva no encontrada" });
            }
            const reservation = reservations[0];

            if (reservation.userDni !== userDni) {
                return res.status(403).json({ error: "Solo puedes editar tus propias reservas" });
            }

            if (reservation.status === "CANCELLED") {
                return res.status(400).json({ error: "No se puede editar una reserva cancelada" });
            }

            const start = new Date(startDate);
            const end = new Date(endDate);
            const now = new Date();

            if (start >= end) return res.status(400).json({ error: "Rango de fechas inválido" });
            if (start < now) return res.status(400).json({ error: "La reserva no puede ser en el pasado" });

            const targetSpaceId = spaceId ? new ObjectId(spaceId) : reservation.spaceId;
            const space = await spacesRepository.findSpace({ _id: targetSpaceId });
            if (!space) return res.status(404).json({ error: "Espacio no encontrado" });
            if (!space.active) return res.status(400).json({ error: "El espacio está desactivado" });

            const overlapFilter = {
                _id: { $ne: new ObjectId(reservationId) },
                spaceId: targetSpaceId,
                status: "ACTIVE",
                startDate: { $lt: end },
                endDate: { $gt: start }
            };

            const otherRes = await reservationsRepository.getReservations(overlapFilter);
            if (otherRes.length > 0) return res.status(409).json({ error: "Ya existe una reserva en ese horario" });

            const blocks = await maintenanceRepository.getMaintenanceBlocks(overlapFilter);
            if (blocks.length > 0) return res.status(409).json({ error: "Hay un bloqueo de mantenimiento programado" });

            const result = await reservationsRepository.updateReservation(
                { _id: new ObjectId(reservationId) },
                { spaceId: targetSpaceId, startDate: start, endDate: end, reason: reason || "" }
            );

            if (result.modifiedCount > 0) {
                res.status(200).json({ message: "Reserva actualizada correctamente" });
            } else {
                res.status(500).json({ error: "No se pudo actualizar la reserva" });
            }

        } catch (error) {
            res.status(500).json({ error: "Error interno del servidor: " + error.message });
        }
    });

    /**
     * @swagger
     * /api/v1.0/reservations/{id}:
     *   delete:
     *     summary: Cancelar una reserva
     *     description: Permite cancelar una reserva si pertenece al usuario.
     *     tags:
     *       - Reservations
     *     security:
     *       - tokenAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID de la reserva
     *     responses:
     *       200:
     *         description: Reserva cancelada correctamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message: { type: string, example: "Reserva cancelada correctamente" }
     *                 status: { type: string, example: "CANCELLED" }
     *       400:
     *         description: Error en la solicitud (ej. ya cancelada)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "La reserva ya se encuentra cancelada" }
     *       403:
     *         description: No autorizado para cancelar esta reserva
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Solo se pueden cancelar reservas propias" }
     *       404:
     *         description: Reserva no encontrada
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error: { type: string, example: "Reserva no encontrada" }
     *       500:
     *         description: Error interno del servidor
     */
    app.delete('/api/v1.0/reservations/:id', async (req, res) => {
        try {
            const reservationId = req.params.id;
            const userDni = res.user;

            if (!userDni) {
                return res.status(400).json({ error: "Falta el DNI del usuario para verificar la propiedad" });
            }

            const reservations = await reservationsRepository.getReservations({ _id: new ObjectId(reservationId) });

            if (reservations.length === 0) {
                return res.status(404).json({ error: "Reserva no encontrada" });
            }

            const reservation = reservations[0];

            if (reservation.userDni !== userDni) {
                return res.status(403).json({ error: "Solo se pueden cancelar reservas propias" });
            }

            if (reservation.status === "CANCELLED") {
                return res.status(400).json({ error: "La reserva ya se encuentra cancelada" });
            }

            const result = await reservationsRepository.updateReservation(
                { _id: new ObjectId(reservationId) },
                { status: "CANCELLED" }
            );

            if (result.modifiedCount > 0) {
                res.status(200).json({
                    message: "Reserva cancelada correctamente",
                    status: "CANCELLED"
                });
            } else {
                res.status(500).json({ error: "No se pudo actualizar el estado de la reserva" });
            }

        } catch (error) {
            res.status(500).json({ error: "Error interno del servidor: " + error.message });
        }
    });

};
