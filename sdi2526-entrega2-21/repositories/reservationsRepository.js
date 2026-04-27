module.exports = {
    dbClient: null,
    app: null,
    database: "spaceReservationManagement",
    collectionName: "reservations",
    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },
    getReservations: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const reservationsCollection = database.collection(this.collectionName);
            const reservations = await reservationsCollection.find(filter, options).toArray();
            return reservations;
        } catch (error) {
            throw (error);
        }
    },
    insertReservation: async function (reservation) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const reservationsCollection = database.collection(this.collectionName);
            const result = await reservationsCollection.insertOne(reservation);
            return result;
        } catch (error) {
            throw (error);
        }
    },
    updateReservation: async function (filter, update) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const reservationsCollection = database.collection(this.collectionName);
            const result = await reservationsCollection.updateOne(filter, { $set: update });
            return result;
        } catch (error) {
            throw (error);
        }
    }
};
