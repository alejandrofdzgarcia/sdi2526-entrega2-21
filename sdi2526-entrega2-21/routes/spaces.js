const express = require('express');
const router = express.Router();
const repositories = require('../modules/repositories');

/* GET listado de espacios disponibles. */
router.get('/list', async function (req, res, next) {
    try {
        const filter = { active: true };

        // Filtering by type
        if (req.query.tipo && req.query.tipo !== "") {
            filter.type = req.query.tipo;
        }

        // Filtering by minimum capacity
        if (req.query.capacidad && req.query.capacidad !== "") {
            filter.capacity = { $gte: parseInt(req.query.capacidad) };
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
