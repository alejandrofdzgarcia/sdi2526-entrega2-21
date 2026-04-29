module.exports = function (app, spacesRepository) {
    app.get('/api/v1.0/spaces', async (req, res) => {
        try {
            const filter = { active: true };
            const options = { sort: { name: 1 } };
            const spaces = await spacesRepository.getSpaces(filter, options);
            res.status(200).json(spaces);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener los espacios: " + error.message });
        }
    });
};
