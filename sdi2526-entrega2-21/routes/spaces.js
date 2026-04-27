const { ObjectId } = require("mongodb");

module.exports = function (app, spacesRepository) {
    app.get('/spaces/list', function (req, res) {
        let filter = { active: true };

        if (req.query.type && req.query.type !== "") {
            filter.type = req.query.type;
        }

        if (req.query.capacity && req.query.capacity !== "") {
            filter.capacity = { $gte: parseInt(req.query.capacity) };
        }

        let options = { sort: { name: 1 } };

        spacesRepository.getSpaces(filter, options).then(spaces => {
            res.render('spaces/list.twig', {
                title: 'Espacios Disponibles',
                spaces: spaces,
                activeFilters: req.query
            });
        }).catch(error => {
            res.send("Se ha producido un error al listar los espacios: " + error);
        });
    });
};
