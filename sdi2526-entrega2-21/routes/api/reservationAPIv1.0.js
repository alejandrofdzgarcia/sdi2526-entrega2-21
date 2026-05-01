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
     */
    app.get('/api/v1.0/reservations', async (req, res) => {
        try {
            let user = res.user || "";

            user = "10000001S"

            if (user === "") {
                return res.status(500).json({ error: "Error: Usuario no autenticado" });
            }

            let filter = { userDni: user };

            let reservations = await reservationsRepository.getReservations(filter, {});

            //Se obtienen todos los espacios
            const spaces = await spacesRepository.getSpaces({}, {});

            //se mapean los nombres para acceder a ellos por su id
            const spaceMap = {};
            spaces.forEach(s => {
                spaceMap[s._id.toString()] = s.name;
            });

            //se formatea la fecha de las reservas y se mapean
            const resultReservations = reservations.map(r => {

                const startDate = new Date(r.startDate).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });

                const endDate = new Date(r.endDate).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });

                return {
                    id: r._id.toString(),
                    user: r.userDni,
                    space: spaceMap[r.spaceId.toString()] || "Error Espacio",
                    startDate: startDate,
                    endDate: endDate,
                    status: r.status
                };
            });

            res.status(200).json(resultReservations);

        } catch (error) {
            res.status(500).json({
                error: "Error interno del servidor al " +
                    "obtener las reservas propias: " + error.message
            });
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
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ReservationRequest'
     *     responses:
     *       201:
     *         description: Reserva creada correctamente
     *       400:
     *         description: Error en los datos enviados
     *       404:
     *         description: Espacio no encontrado
     *       409:
     *         description: Conflicto de horario o mantenimiento
     *       500:
     *         description: Error interno del servidor
     */
    app.post('/api/v1.0/reservations', async (req, res) => {
        try {
            const { spaceId, startDate, endDate, reason, userDni } = req.body;

            if (!spaceId || !startDate || !endDate || !userDni) {
                return res.status(400).json({ error: "Faltan datos obligatorios" });
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
     * /api/v1.0/reservations/{id}:
     *   delete:
     *     summary: Cancelar una reserva
     *     description: Permite cancelar una reserva si pertenece al usuario.
     *     tags:
     *       - Reservations
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
     *             type: object
     *             required:
     *               - userDni
     *             properties:
     *               userDni:
     *                 type: string
     *                 example: "10000001S"
     *     responses:
     *       200:
     *         description: Reserva cancelada correctamente
     *       400:
     *         description: Error en la solicitud
     *       403:
     *         description: No autorizado para cancelar esta reserva
     *       404:
     *         description: Reserva no encontrada
     *       500:
     *         description: Error interno del servidor
     */
    app.delete('/api/v1.0/reservations/:id', async (req, res) => {
        try {
            const reservationId = req.params.id;
            const { userDni } = req.body;

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

            if (reservation.status === "CANCELADA") {
                return res.status(400).json({ error: "La reserva ya se encuentra cancelada" });
            }

            const result = await reservationsRepository.updateReservation(
                { _id: new ObjectId(reservationId) },
                { status: "CANCELADA" }
            );

            if (result.modifiedCount > 0) {
                res.status(200).json({
                    message: "Reserva cancelada correctamente",
                    status: "CANCELADA"
                });
            } else {
                res.status(500).json({ error: "No se pudo actualizar el estado de la reserva" });
            }

        } catch (error) {
            res.status(500).json({ error: "Error interno del servidor: " + error.message });
        }
    });

};
