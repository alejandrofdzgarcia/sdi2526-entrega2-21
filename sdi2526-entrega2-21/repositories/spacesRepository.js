const { ObjectId } = require("mongodb");

module.exports = {
    dbClient: null,
    app: null,
    database: "spaceReservationManagement",
    collectionName: "spaces",

    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },

    /**
     * Devuelve una lista de espacios según filtro y opciones.
     */
    getSpaces: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const spacesCollection = database.collection(this.collectionName);
            const spaces = await spacesCollection.find(filter, options).toArray();
            return spaces;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Devuelve un único espacio según filtro.
     */
    findSpace: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const spacesCollection = database.collection(this.collectionName);
            const space = await spacesCollection.findOne(filter, options);
            return space;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Inserta un nuevo espacio en la base de datos.
     * @param {Object} space - Objeto espacio a insertar
     */
    insertSpace: async function (space) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const spacesCollection = database.collection(this.collectionName);
            const result = await spacesCollection.insertOne(space);
            return result;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualiza un espacio existente.
     * @param {Object} filter - Filtro para encontrar el espacio
     * @param {Object} update - Campos a actualizar
     */
    updateSpace: async function (filter, update) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const spacesCollection = database.collection(this.collectionName);
            const result = await spacesCollection.updateOne(filter, { $set: update });
            return result;
        } catch (error) {
            throw error;
        }
    }
};