module.exports = function (app, spacesRepository) {
    /**
     * @swagger
     * /api/v1.0/spaces:
     *   get:
     *     summary: Obtener todos los espacios activos
     *     description: Devuelve una lista de espacios activos ordenados por nombre.
     *     tags:
     *       - Spaces
     *     responses:
     *       200:
     *         description: Lista de espacios obtenida correctamente
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   _id:
     *                     type: string
     *                     description: ID del espacio
     *                     example: "64f123abc456def789"
     *                   name:
     *                     type: string
     *                     description: Nombre del espacio
     *                     example: "Sala de reuniones"
     *                   active:
     *                     type: boolean
     *                     description: Indica si el espacio está activo
     *                     example: true
     *       500:
     *         description: Error al obtener los espacios
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: "Error al obtener los espacios: mensaje de error"
     */
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
