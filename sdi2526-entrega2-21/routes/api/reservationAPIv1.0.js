const { ObjectId } = require("mongodb");

module.exports = function (app, spacesRepository, reservationsRepository, maintenanceRepository) {

    /**
     * Devuelve las la info de las reservas del usuario logeado
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
                _id:       r._id,
                spaceId:   r.spaceId,
                startDateRaw: r.startDate,
                endDateRaw:   r.endDate,
                reason:    r.reason || "",
                userDni:   r.userDni,
                space:     spaceMap[r.spaceId.toString()] || "Error Espacio",
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

    app.put('/api/v1.0/reservations/:id', async (req, res) => {
        try {
            const reservationId = req.params.id;
            const { userDni, spaceId, startDate, endDate, reason } = req.body;

            if (!userDni) {
                return res.status(400).json({ error: "Falta el DNI del usuario" });
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

            if (reservation.status === "CANCELADA") {
                return res.status(400).json({ error: "No se puede editar una reserva cancelada" });
            }

            const start = new Date(startDate);
            const end   = new Date(endDate);
            const now   = new Date();

            if (start >= end) return res.status(400).json({ error: "Rango de fechas inválido" });
            if (start < now)  return res.status(400).json({ error: "La reserva no puede ser en el pasado" });

            const targetSpaceId = spaceId ? new ObjectId(spaceId) : reservation.spaceId;
            const space = await spacesRepository.findSpace({ _id: targetSpaceId });
            if (!space)        return res.status(404).json({ error: "Espacio no encontrado" });
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
