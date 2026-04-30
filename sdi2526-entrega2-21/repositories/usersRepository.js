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
    }
};