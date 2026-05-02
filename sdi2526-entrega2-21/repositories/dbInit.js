const crypto = require('crypto');
const HMAC_KEY = 'sdi2526-hmac-key';

function hash(password) {
    return crypto.createHmac('sha256', HMAC_KEY).update(password).digest('hex');
}

module.exports = {
    dbClient: null,
    database: 'spaceReservationManagement',

    init: async function (app, dbClient) {
        this.dbClient = dbClient;
        try {
            await dbClient.connect();
            const db = dbClient.db(this.database);
            await this._seedUsers(db);
            const spaceIds = await this._seedSpaces(db);
            await this._seedReservations(db, spaceIds);
            await this._seedMaintenanceBlocks(db, spaceIds);
            console.log('Base de datos inicializada correctamente.');
        } catch (err) {
            console.error('Error al inicializar la BD:', err);
        }
    },

    _seedUsers: async function (db) {
        const col = db.collection('users');

        const users = [
            {
                dni: '12345678Z',
                nombre: 'Admin',
                apellidos: 'Sistema',
                password: hash('@Dm1n1str@D0r'),
                role: 'admin'
            },
            { dni: '10000001S', nombre: 'Usuario', apellidos: 'Uno',    password: hash('Us3r@1-PASSW'), role: 'standard' },
            { dni: '10000002Q', nombre: 'Usuario', apellidos: 'Dos',    password: hash('Us3r@2-PASSW'), role: 'standard' },
            { dni: '10000003V', nombre: 'Usuario', apellidos: 'Tres',   password: hash('Us3r@3-PASSW'), role: 'standard' },
            { dni: '10000004H', nombre: 'Usuario', apellidos: 'Cuatro', password: hash('Us3r@4-PASSW'), role: 'standard' },
            { dni: '10000005J', nombre: 'Usuario', apellidos: 'Cinco',  password: hash('Us3r@5-PASSW'), role: 'standard' },
        ];

        for (const user of users) {
            const exists = await col.findOne({ dni: user.dni });
            if (!exists) {
                await col.insertOne(user);
                console.log(`[dbInit] Usuario insertado: ${user.dni}`);
            }
        }
    },

    _seedSpaces: async function (db) {
        const col = db.collection('spaces');

        const spaces = [
            { name: 'Sala A',       type: 'sala',   location: 'Planta 1', capacity: 10, description: 'Sala de reuniones para grupos pequeños',      active: true  },
            { name: 'Sala B',       type: 'sala',   location: 'Planta 1', capacity: 6,  description: 'Sala de reuniones íntima',                     active: true  },
            { name: 'Aula 1',       type: 'aula',   location: 'Planta 2', capacity: 30, description: 'Aula formativa con proyector y pizarra',        active: true  },
            { name: 'Aula 2',       type: 'aula',   location: 'Planta 2', capacity: 25, description: 'Aula formativa con equipos informáticos',       active: true  },
            { name: 'Cowork Alpha', type: 'cowork', location: 'Planta 0', capacity: 4,  description: 'Espacio de coworking en planta baja',           active: true  },
            { name: 'Cowork Beta',  type: 'cowork', location: 'Planta 0', capacity: 4,  description: 'Espacio de coworking en planta baja (cerrado)', active: false },
        ];

        const ids = [];
        for (const space of spaces) {
            const existing = await col.findOne({ name: space.name });
            if (!existing) {
                const result = await col.insertOne(space);
                ids.push(result.insertedId);
                console.log(`[dbInit] Espacio insertado: ${space.name}`);
            } else {
                ids.push(existing._id);
            }
        }
        return ids;
    },

    _seedReservations: async function (db, spaceIds) {
        const col = db.collection('reservations');
        const count = await col.countDocuments();
        if (count > 0) return;

        const reservations = [
            {
                userDni: '10000001S',
                spaceId: spaceIds[0],
                startDate: new Date('2026-05-10T09:00:00'),
                endDate:   new Date('2026-05-10T11:00:00'),
                reason: 'Reunión de equipo',
                status: 'ACTIVE',
                createdAt: new Date()
            },
            {
                userDni: '10000002Q',
                spaceId: spaceIds[2],
                startDate: new Date('2026-05-12T10:00:00'),
                endDate:   new Date('2026-05-12T12:00:00'),
                reason: 'Formación interna',
                status: 'ACTIVE',
                createdAt: new Date()
            },
            {
                userDni: '10000003V',
                spaceId: spaceIds[4],
                startDate: new Date('2026-05-08T08:00:00'),
                endDate:   new Date('2026-05-08T10:00:00'),
                reason: 'Trabajo remoto',
                status: 'CANCELLED',
                createdAt: new Date()
            },
        ];

        for (const reservation of reservations) {
            await col.insertOne(reservation);
            console.log(`[dbInit] Reserva insertada: ${reservation.userDni} → ${reservation.reason}`);
        }
    },

    _seedMaintenanceBlocks: async function (db, spaceIds) {
        const col = db.collection('maintenanceBlocks');
        const count = await col.countDocuments();
        if (count > 0) return;

        const blocks = [
            {
                spaceId: spaceIds[1],
                startDate: new Date('2026-05-20T07:00:00'),
                endDate:   new Date('2026-05-20T09:00:00'),
                status: 'ACTIVE'
            },
            {
                spaceId: spaceIds[3],
                startDate: new Date('2026-05-22T14:00:00'),
                endDate:   new Date('2026-05-22T18:00:00'),
                status: 'ACTIVE'
            },
        ];

        for (const block of blocks) {
            await col.insertOne(block);
            console.log(`[dbInit] Bloque de mantenimiento insertado en espacio: ${block.spaceId}`);
        }
    }
};