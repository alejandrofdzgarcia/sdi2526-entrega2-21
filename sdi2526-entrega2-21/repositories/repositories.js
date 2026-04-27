module.exports = {
    dbClient: null,
    app: null,
    database: "spaceReservationManagement",
    collectionName: "spaces",
    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },
    getSpaces: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const spacesCollection = database.collection(this.collectionName);
            const spaces = await spacesCollection.find(filter, options).toArray();
            return spaces;
        } catch (error) {
            throw (error);
        }
    }
};
