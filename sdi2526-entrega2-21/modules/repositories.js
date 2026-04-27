const { MongoClient } = require("mongodb");

class Repositories {
    constructor() {
        this.uri = "mongodb://localhost:27017";
        this.databaseName = "spaceReservationManagement";
        this.client = new MongoClient(this.uri);
    }

    async connect() {
        try {
            await this.client.connect();
            this.db = this.client.db(this.databaseName);
            console.log("Connected to MongoDB");
        } catch (error) {
            console.error("Error connecting to MongoDB:", error);
        }
    }

    getSpacesCollection() {
        return this.db.collection("spaces");
    }
}

const repositories = new Repositories();
repositories.connect();

module.exports = repositories;
