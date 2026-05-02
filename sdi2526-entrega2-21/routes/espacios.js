const express = require('express');
const router = express.Router();
const repositories = require('../repositories/repositories');

router.get('/list', async function (req, res, next) {
    try {
        const filter = { active: true };

        if (req.query.type && req.query.type !== "") {
            filter.type = req.query.type;
        }

        if (req.query.capacity && req.query.capacity !== "") {
            filter.capacity = { $gte: parseInt(req.query.capacity) };
        }

        const spaces = await repositories.getSpacesCollection().find(filter).toArray();

        res.render('spaces/list', {
            title: 'Espacios Disponibles',
            spaces: spaces,
            activeFilters: req.query
        });
    } catch (error) {
        console.error("Error fetching spaces:", error);
        res.status(500).send("Error al obtener el listado de espacios");
    }
});

module.exports = router;
