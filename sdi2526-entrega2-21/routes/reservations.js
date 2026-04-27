const {ObjectId} = require("mongodb");
module.exports = function (app, reservationsRepository) {

    app.get("/admin/reservations/list", function (req, res) {
        let filter = {};
        let options = {};

        let page = parseInt(req.query.page); // Es String !!!
        if (typeof req.query.page === "undefined" || req.query.page === null || req.query.page === "0") {
            page = 1;
        }

        reservationsRepository.getReservationPg(filter, options, page).then(result =>{
            let lastPage = result.total / 4;
            //quitar decimales
            if (result.total % 4 > 0) {
                lastPage = lastPage + 1;
            }

            let pages = []; // paginas mostrar
            for (let i = page - 2; i <= page + 2; i++) {
                if (i > 0 && i <= lastPage) {
                    pages.push(i);
                }
            }

            let response = {
                songs: result.reservations,
                pages: pages,
                currentPage: page
            }

            res.render("globalList.twig", response);
        }).catch(error => {
            res.send("Se ha producido un error al listar la lista de reservas" + error);
        });


    });
}