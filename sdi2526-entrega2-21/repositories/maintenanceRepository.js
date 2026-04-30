const { ObjectId } = require("mongodb");

module.exports = {
    dbClient: null,
    app: null,
    database: "spaceReservationManagement",
    collectionName: "maintenanceBlocks",

    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },

    /**
     * Devuelve una lista de bloqueos de mantenimiento según filtro.
     */
    getMaintenanceBlocks: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const maintenanceCollection = database.collection(this.collectionName);
            const blocks = await maintenanceCollection.find(filter, options || {}).toArray();
            return blocks;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Devuelve un único bloqueo según filtro.
     */
    findBlock: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const maintenanceCollection = database.collection(this.collectionName);
            const block = await maintenanceCollection.findOne(filter, options || {});
            return block;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Inserta un nuevo bloqueo de mantenimiento.
     * @param {Object} block - Objeto bloqueo a insertar
     */
    insertBlock: async function (block) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const maintenanceCollection = database.collection(this.collectionName);
            const result = await maintenanceCollection.insertOne(block);
            return result;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualiza un bloqueo existente.
     * @param {Object} filter - Filtro para encontrar el bloqueo
     * @param {Object} update - Campos a actualizar
     */
    updateBlock: async function (filter, update) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const maintenanceCollection = database.collection(this.collectionName);
            const result = await maintenanceCollection.updateOne(filter, { $set: update });
            return result;
        } catch (error) {
            throw error;
        }
    }
};