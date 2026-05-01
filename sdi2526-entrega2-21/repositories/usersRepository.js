const { ObjectId } = require("mongodb");
const crypto = require("crypto");
const clave = "abcdefg";

module.exports = {
    dbClient: null,
    app: null,
    database: "spaceReservationManagement",
    collectionName: "users",

    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },

    findUser: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const usersCollection = database.collection(this.collectionName);
            return await usersCollection.findOne(filter, options);
        } catch (error) {
            throw (error);
        }
    },

    /**
     * Devuelve la lista de usuarios paginada.
     * @param {Object} filter
     * @param {Object} options
     * @param {number} page
     */
    getUsersPg: async function (filter, options, page) {
        try {
            const limit = 5;
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const usersCollection = database.collection(this.collectionName);
            const total = await usersCollection.find(filter, options).count();
            const users = await usersCollection.find(filter, options)
                .skip((page - 1) * limit)
                .limit(limit)
                .toArray();
            return { users, total };
        } catch (error) {
            throw (error);
        }
    },

    getUsers: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const usersCollection = database.collection(this.collectionName);
            return await usersCollection.find(filter, options).toArray();
        } catch (error) {
            throw (error);
        }
    },

    /**
     * Inserta un nuevo usuario en la base de datos.
     * @param {Object} user
     */
    insertUser: async function (user) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const usersCollection = database.collection(this.collectionName);
            return await usersCollection.insertOne(user);
        } catch (error) {
            throw (error);
        }
    },

    updatePassword: async function (dni, newPassHash) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const usersCollection = database.collection(this.collectionName);
            return await usersCollection.updateOne(
                { dni: dni },
                { $set: { password: newPassHash } }
            );
        } catch (error) {
            throw (error);
        }
    },
    /**
     * Actualiza un usuario existente.
     */
    updateUser: async function (filter, update) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const usersCollection = database.collection(this.collectionName);
            const result = await usersCollection.updateOne(filter, { $set: update });
            return result;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Hashea una contraseña con HMAC-SHA256.
     * @param {string} password
     */
    hashPassword: function (password) {
        return crypto.createHmac("sha256", clave).update(password).digest("hex");
    }
};