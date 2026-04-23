const { MongoClient } = require("mongodb");
const crypto = require("crypto");

const clave = "abcdefg";
const uri = "mongodb://localhost:27017";
const databaseName = "spaceReservationManagement";

(async () => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(databaseName);

        // Eliminar todas las colecciones
        const collections = await db.collections();
        for (const collection of collections) {
            await collection.drop();
        }

        // Crear un usuario administrador
        await db.collection("users").insertOne({
            dni: "12345678Z",
            name: "Admin",
            email: "admin@gmail.com",
            lastname: "Principal",
            password: crypto.createHmac("sha256", clave).update("@Dm1n1str@D0r").digest("hex"),
            role: "Administrador"
        });

        // Crear 15 usuarios empleados
        const employeeUsers = Array.from({ length: 15 }, (_, i) => {
            const loginNumber = (i + 1).toString().padStart(2, "0");
            const dni = `100000${loginNumber}${String.fromCharCode(83 + (i % 5))}`;
            return {
                dni,
                name: `Empleado${i + 1}`,
                lastname: `Apellido${i + 1}`,
                password: crypto.createHmac("sha256", clave).update(`Us3r@${i + 1}-PASSW`).digest("hex"),
                role: "Empleado Estándar",
                email: `a${i + 1}@gmail.com`
            };
        });
        await db.collection("users").insertMany(employeeUsers);

    } catch (err) {
        console.error("Error al reiniciar la base de datos:", err);
        process.exit(1);
    } finally {
        await client.close();
    }
})();