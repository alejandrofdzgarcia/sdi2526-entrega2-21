const { ObjectId } = require("mongodb");
const spacesRepository = require("../repositories/spacesRepository");
const { query } = require("express");
module.exports = function (app, reservationsRepository, spacesRepository, usersRepository) {

    app.get("/admin/reservations/list", async function (req, res) {
        try {

            let filter = {};
            let options = {};
            const selectSpacesOptions = (await spacesRepository.getSpaces({}, {}))
                .map(space => ({
                    id: space._id,
                    name: space.name
                }));

            //filtros
            let searchSpace = req.query.searchSpace || "";
            let startDate = req.query.startDate || "";
            let endDate = req.query.endDate || "";

            //filtro de espacio
            if (searchSpace != null && typeof (searchSpace) != "undefined" && searchSpace !== "") {
                let spaceID = new ObjectId(searchSpace);
                filter = { spaceId: spaceID };
            }

            // filtro por rango de fechas
            if (startDate || endDate) {
                filter.startDate = {};

                if (startDate) {
                    filter.startDate.$gte = new Date(startDate);
                }

                if (endDate) {
                    filter.startDate.$lte = new Date(endDate);
                }
            }

            let page = parseInt(req.query.page); // Es String !!!
            if (typeof req.query.page === "undefined" || req.query.page === null || req.query.page === "0") {
                page = 1;
            }
            const limit = 5;

            let result = await reservationsRepository.getReservationPg(filter, options, page);

            let lastPage = result.total / limit;

            //quitar decimales
            if (result.total % limit > 0) {
                lastPage = lastPage + 1;
            }
            let pages = []; // paginas mostrar
            for (let i = page - 2; i <= page + 2; i++) {
                if (i > 0 && i <= lastPage) {
                    pages.push(i);
                }
            }

            const formattedReservations = await Promise.all(
                result.reservations.map(async (r) => {

                    const startDate = new Date(r.startDate).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    });

                    const endDate = new Date(r.endDate).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    });

                    const space = await spacesRepository.findSpace({ _id: r.spaceId }, {});

                    return {
                        user: r.userDni,
                        space: space ? space.name : "Desconocido",
                        startDate,
                        endDate,
                        status: r.status
                    };
                })
            );

            res.render("reservations/globalList.twig", {
                reservations: formattedReservations,
                selectSpacesOptions: selectSpacesOptions,
                pages: pages,
                currentPage: page,
                searchSpace: searchSpace,
                startDate: startDate,
                endDate: endDate
            });

        } catch (error) {
            res.send("Se ha producido un error al listar la lista de reservas: " + error);
        }
    });

    app.get("/admin/reservations/export", async function (req, res) {
        try {
            let filter = {};
            let options = {};

            let searchSpace = req.query.searchSpace || "";
            let startDate = req.query.startDate || "";
            let endDate = req.query.endDate || "";

            if (searchSpace !== "") {
                filter = { spaceId: new ObjectId(searchSpace) };
            }

            if (startDate || endDate) {
                filter.startDate = {};
                if (startDate) filter.startDate.$gte = new Date(startDate);
                if (endDate) filter.startDate.$lte = new Date(endDate);
            }

            let reservations = await reservationsRepository.getReservations(filter, options);

            const formattedReservations = await Promise.all(
                reservations.map(async (r) => {
                    const space = await spacesRepository.findSpace({ _id: r.spaceId }, {});
                    const user = await usersRepository.findUser({ dni: r.userDni }, {});

                    const startDateStr = new Date(r.startDate).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    });

                    const endDateStr = new Date(r.endDate).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    });

                    return {
                        espacio: space ? space.name : "Desconocido",
                        nombre: user ? (user.nombre + " " + user.apellidos) : "Desconocido",
                        dni: r.userDni,
                        inicio: startDateStr,
                        fin: endDateStr,
                        estado: r.status
                    };
                })
            );

            res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
            res.setHeader('Content-Disposition', 'attachment; filename=reservas.csv');

            let csv = '\ufeff';
            csv += "Espacio;Nombre;DNI;Inicio;Fin;Estado\n";

            formattedReservations.forEach(r => {
                csv += `${r.espacio};${r.nombre};${r.dni};${r.inicio};${r.fin};${r.estado}\n`;
            });

            res.status(200).send(csv);

        } catch (error) {
            res.send("Error al exportar reservas: " + error);
        }
    });
}