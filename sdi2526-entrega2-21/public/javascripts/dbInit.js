const { MongoClient, ObjectId } = require("mongodb");
const crypto = require("crypto");

const clave = "abcdefg";
const uri = "mongodb://localhost:27017";
const databaseName = "spaceReservationManagement";

(async () => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(databaseName);

        // 1. Eliminar todas las colecciones para reiniciar el estado
        const collections = await db.collections();
        for (const collection of collections) {
            await collection.drop();
        }

        // 2. Crear un usuario administrador
        await db.collection("users").insertOne({
            dni: "12345678Z",
            name: "Admin",
            email: "admin@gmail.com",
            lastname: "Principal",
            password: crypto.createHmac("sha256", clave).update("@Dm1n1str@D0r").digest("hex"),
            role: "Administrador"
        });

        // 3. Crear 15 usuarios empleados
        const employeeUsers = Array.from({ length: 15 }, (_, i) => {
            const loginNumber = (i + 1).toString().padStart(2, "0");
            const dni = `100000${loginNumber}${String.fromCharCode(83 + (i % 5))}`;
            return {
                _id: new ObjectId(),
                dni,
                name: `Empleado${i + 1}`,
                lastname: `Apellido${i + 1}`,
                password: crypto.createHmac("sha256", clave).update(`Us3r@${i + 1}-PASSW`).digest("hex"),
                role: "Empleado Estándar",
                email: `a${i + 1}@gmail.com`
            };
        });
        await db.collection("users").insertMany(employeeUsers);

        // 4. Crear al menos 6 espacios (variados y 1 desactivado)
        const spaces = [
            { _id: new ObjectId(), name: "Sala Turing", type: "SALA", location: "Planta 1",
                capacity: 10, description: "Sala de reuniones principal", active: true },
            { _id: new ObjectId(), name: "Aula Newton", type: "AULA", location: "Planta 2",
                capacity: 40, description: "Aula con proyector multimedia", active: true },
            { _id: new ObjectId(), name: "Coworking A", type: "COWORK", location: "Planta 1",
                capacity: 1, description: "Puesto de trabajo individual", active: true },
            { _id: new ObjectId(), name: "Coworking B", type: "COWORK", location: "Planta 1",
                capacity: 1, description: "Puesto de trabajo individual", active: true },
            { _id: new ObjectId(), name: "Sala Lovelace", type: "SALA", location: "Planta 3",
                capacity: 6, description: "Sala de reuniones pequeña", active: true },
            { _id: new ObjectId(), name: "Aula Antigua", type: "AULA", location: "Sótano",
                capacity: 20, description: "Pendiente de reforma", active: false } // Espacio desactivado
        ];
        await db.collection("spaces").insertMany(spaces);

        // 5. Crear bloqueos de mantenimiento (al menos 2)
        const now = new Date();
        const maintenanceBlocks = [
            {
                spaceId: spaces[0]._id, // Sala Turing
                startDate: new Date(now.getTime() + 1000 * 60 * 60 * 24), // Mañana
                endDate: new Date(now.getTime() + 1000 * 60 * 60 * 26), // Mañana + 2 horas
                reason: "Mantenimiento del sistema de aire acondicionado",
                status: "ACTIVE"
            },
            {
                spaceId: spaces[1]._id, // Aula Newton
                startDate: new Date(now.getTime() + 1000 * 60 * 60 * 72), // En 3 días
                endDate: new Date(now.getTime() + 1000 * 60 * 60 * 78), // En 3 días + 6 horas
                reason: "Sustitución del proyector",
                status: "ACTIVE"
            }
        ];
        await db.collection("maintenanceBlocks").insertMany(maintenanceBlocks);

        // 6. Crear reservas (al menos 5 por usuario)
        const reservations = [];
        employeeUsers.forEach((user, userIndex) => {
            for (let i = 0; i < 5; i++) {
                // Hacer que la última reserva de cada usuario esté cancelada para tener variedad en las pruebas
                const isCancelled = i === 4;

                // Distribuir las reservas entre los espacios activos (los 5 primeros) para evitar solapes excesivos en la semilla
                const targetSpace = spaces[i % 5];

                // Generar fechas futuras secuenciales para evitar solapes.
                // Cada usuario reserva en días diferentes, y cada reserva es a una hora diferente.
                const day = String(15 + userIndex).padStart(2, '0');
                const month = String((i % 6) + 1).padStart(2, '0');
                const hour = String(9 + i).padStart(2, '0');
                const start = new Date(`2026-${month}-${day}T${hour}:00:00`);
                const end = new Date(start.getTime() + 1000 * 60 * 60 * 2);

                reservations.push({
                    userDni: user.dni,
                    spaceId: targetSpace._id,
                    startDate: start,
                    endDate: end,
                    reason: `Reunión de planificación ${i + 1}`,
                    status: isCancelled ? "CANCELLED" : "ACTIVE",
                    isRecurring: false,
                    recurrenceFrequency: null,
                    recurrenceEndDate: null,
                    recurrenceGroupId: null
                });
            }
        });
        await db.collection("reservations").insertMany(reservations);

        console.log("Base de datos inicializada correctamente con los datos requeridos.");
        console.log(`- 1 Administrador y ${employeeUsers.length} Empleados generados.`);
        console.log(`- ${spaces.length} Espacios generados (1 inactivo).`);
        console.log(`- ${maintenanceBlocks.length} Bloqueos de mantenimiento generados.`);
        console.log(`- ${reservations.length} Reservas generadas (5 por empleado).`);

    } catch (err) {
        console.error("Error al reiniciar la base de datos:", err);
        process.exit(1);
    } finally {
        await client.close();
    }
})();