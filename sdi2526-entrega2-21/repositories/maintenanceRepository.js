module.exports = {
    dbClient: null,
    app: null,
    database: "spaceReservationManagement",
    collectionName: "maintenanceBlocks",
    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },
    getMaintenanceBlocks: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const maintenanceCollection = database.collection(this.collectionName);
            const blocks = await maintenanceCollection.find(filter, options).toArray();
            return blocks;
        } catch (error) {
            throw (error);
        }
    }
};
