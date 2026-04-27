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

    app.get('/spaces/:id', function (req, res) {
        console.log(req.params.id);
        let spaceId = new ObjectId(req.params.id);
        let filter = {_id: spaceId};

        spacesRepository.findSpace(filter, {}).then((result) => {
            let availability = result.active ? "Disponible" : "No disponible";
            let spaceDetails = {
                name: result.name,
                type: result.type,
                location: result.location,
                capacity: result.capacity,
                description: result.description,
                availability: availability
            }

            res.render('spaces/details.twig', { space: spaceDetails });
        });
    });
};
