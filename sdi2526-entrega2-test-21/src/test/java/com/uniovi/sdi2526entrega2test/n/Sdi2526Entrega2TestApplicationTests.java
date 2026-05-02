package com.uniovi.sdi2526entrega2test.n;

import com.uniovi.sdi2526entrega2test.n.pageobjects.*;
import com.uniovi.sdi2526entrega2test.n.util.SeleniumUtils;

import io.github.bonigarcia.wdm.WebDriverManager;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

import org.json.simple.JSONObject;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import static org.junit.jupiter.api.Assertions.*;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;

import java.util.List;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Sdi2425Entrega2TestApplicationTests {

    static String PathFirefox = "C:\\Program Files\\Mozilla Firefox\\firefox.exe";

    static WebDriver driver = getDriver(PathFirefox);
    static String URL = "http://localhost:8081";

    public static WebDriver getDriver(String PathFirefox) {
        WebDriverManager.firefoxdriver().setup();
        System.setProperty("webdriver.firefox.bin", PathFirefox);
        driver = new FirefoxDriver();
        return driver;
    }

    @BeforeEach
    public void setUp() {
        driver.navigate().to(URL);
    }

    // Después de cada prueba se borran las cookies del navegador
    @AfterEach
    public void tearDown() {
        driver.manage().deleteAllCookies();
    }

    // Antes de la primera prueba
    @BeforeAll
    static public void begin() {
        PO_View.setTimeout(5);
        try {
            java.net.URL url = new java.net.URL("http://localhost:8081/test/reset");
            java.net.HttpURLConnection con = (java.net.HttpURLConnection) url.openConnection();
            con.setRequestMethod("GET");
            con.getResponseCode();
            con.disconnect();
        } catch (Exception e) {
            System.out.println("Reset DB: " + e.getMessage());
        }
    }

    // Al finalizar la última prueba
    @AfterAll
    static public void end() {
        // Cerramos el navegador al finalizar las pruebas
        driver.quit();
    }

    // ─── API Helpers ──────────────────────────────────────────────────────────

    private String getToken(String dni, String password) {
        String loginURL = URL + "/api/users/login";
        RequestSpecification request = RestAssured.given();
        JSONObject requestParams = new JSONObject();
        requestParams.put("dni", dni);
        requestParams.put("password", password);
        request.header("Content-Type", "application/json");
        request.body(requestParams.toJSONString());
        Response response = request.post(loginURL);
        return response.jsonPath().getString("token");
    }

    private String getSpaceIdByName(String name) {
        Response response = RestAssured.given()
                .get(URL + "/api/v1.0/spaces");
        return response.jsonPath().getString("find { it.name == '" + name + "' }._id");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private void loginAsAdmin() {
        driver.navigate().to(URL + "/users/login");
        PO_LoginView.fillLoginForm(driver, "12345678Z", "@Dm1n1str@D0r");
    }

    private void loginAsUser() {
        driver.navigate().to(URL + "/users/login");
        PO_LoginView.fillLoginForm(driver, "10000001S", "Us3r@1-PASSW");
    }

    private static void userLoginReact() {
        WebElement dni = driver.findElement(By.xpath("/html/body/div/div/input[1]"));
        dni.click();
        dni.clear();
        dni.sendKeys("10000001S");
        WebElement password = driver.findElement(By.xpath("/html/body/div/div/input[2]"));
        password.click();
        password.clear();
        password.sendKeys("Us3r@1-PASSW");
        driver.findElement(By.xpath("/html/body/div/div/button")).click();
    }

    /**
     * [PR01] Registro con datos válidos.
     * El formulario va a /users/signup (POST).
     * Tras el registro exitoso debe redirigir al listado de espacios.
     */
    @Test
    @Order(1)
    void PR01() {
        driver.navigate().to(URL + "/users/signup");
        PO_SignUpView.fillForm(driver, "87654321Z", "Maria", "Garcia",
                "Pass@12345678", "Pass@12345678");
        assertTrue(driver.getCurrentUrl().contains("/spaces/list"),
                "Tras registro válido debe redirigir al listado de espacios");
    }

    /**
     * [PR02] Registro con nombre, apellidos y DNI en blanco.
     * Debe mostrar error de campos obligatorios y NO redirigir.
     */
    @Test
    @Order(2)
    void PR02() {
        driver.navigate().to(URL + "/users/signup");
        // Quitar required HTML5 para poder enviar vacío
        ((JavascriptExecutor) driver).executeScript(
                "['dni','nombre','apellidos','password','confirmPassword']" +
                        ".forEach(id => { var e=document.getElementById(id); if(e) e.removeAttribute('required'); });");
        driver.findElement(By.className("btn")).click();
        List<WebElement> errors = PO_View.checkElementBy(driver, "text", "obligatorio");
        assertFalse(errors.isEmpty(), "Debe mostrar error de campo obligatorio");
        assertFalse(driver.getCurrentUrl().contains("/spaces/list"),
                "No debe redirigir si hay errores de validación");
    }

    /**
     * [PR03] Registro con DNI ya registrado (12345678Z = admin).
     * Debe mostrar error de DNI duplicado.
     */
    @Test
    @Order(3)
    void PR03() {
        driver.navigate().to(URL + "/users/signup");
        PO_SignUpView.fillForm(driver, "12345678Z", "Pedro", "Lopez",
                "Pass@12345678", "Pass@12345678");
        List<WebElement> errors = PO_View.checkElementBy(driver, "text", "DNI");
        assertFalse(errors.isEmpty(), "Debe mostrar error de DNI ya registrado");
        assertFalse(driver.getCurrentUrl().contains("/spaces/list"));
    }

    /**
     * [PR04] Registro con contraseña que no cumple requisitos (sin carácter
     * especial).
     * Debe mostrar error de contraseña inválida.
     */
    @Test
    @Order(4)
    void PR04() {
        driver.navigate().to(URL + "/users/signup");
        PO_SignUpView.fillForm(driver, "11223344H", "Ana", "Martinez",
                "Password12345", "Password12345");
        List<WebElement> errors = PO_View.checkElementBy(driver, "text", "contraseña");
        assertFalse(errors.isEmpty(), "Debe mostrar error de contraseña inválida");
        assertFalse(driver.getCurrentUrl().contains("/spaces/list"));
    }

    @Test
    @Order(5)
    public void PR05() {
        Assertions.assertTrue(false, "PR05 sin hacer");
    }

    @Test
    @Order(6)
    public void PR06() {
        Assertions.assertTrue(false, "PR06 sin hacer");
    }

    @Test
    @Order(7)
    public void PR07() {
        Assertions.assertTrue(false, "PR07 sin hacer");
    }

    @Test
    @Order(8)
    public void PR08() {
        Assertions.assertTrue(false, "PR08 sin hacer");
    }

    @Test
    @Order(9)
    void PR09() {
        loginAsAdmin();
        PO_LoginView.logout(driver);
        assertTrue(driver.getCurrentUrl().contains("/users/login"),
                "Debe redirigir a /users/login tras cerrar sesión");
        List<WebElement> msg = PO_View.checkElementBy(driver, "text", "cerrado sesión correctamente");
        assertFalse(msg.isEmpty(), "Debe aparecer mensaje de cierre de sesión correcto");
    }

    /**
     * [PR10] Sin autenticación el botón de cerrar sesión NO debe estar visible.
     */
    @Test
    @Order(10)
    void PR10() {
        driver.navigate().to(URL + "/users/login");
        List<WebElement> logoutBtn = driver.findElements(By.id("btn-logout"));
        assertTrue(logoutBtn.isEmpty(),
                "El botón de cerrar sesión no debe ser visible sin autenticación");
    }

    /**
     * [PR11] Registrar espacio con datos válidos.
     * Debe redirigir a /admin/spaces/list con mensaje de éxito.
     */
    @Test
    @Order(11)
    void PR11() {
        loginAsAdmin();
        driver.navigate().to(URL + "/admin/spaces/new");
        PO_SpacesView.fillSpaceForm(driver, "Sala Test PR11", "SALA",
                "Planta 1 - Ala Norte", "12", "Sala para prueba PR11");
        assertTrue(driver.getCurrentUrl().contains("/admin/spaces/list"),
                "Debe redirigir al listado admin tras crear espacio válido");
        assertFalse(PO_View.checkElementBy(driver, "text", "correctamente").isEmpty(),
                "Debe aparecer mensaje de operación correcta");
    }

    /**
     * [PR12] Registrar espacio con nombre vacío.
     * Debe mostrar error y permanecer en el formulario.
     */
    @Test
    @Order(12)
    void PR12() {
        loginAsAdmin();
        driver.navigate().to(URL + "/admin/spaces/new");
        PO_SpacesView.fillSpaceForm(driver, "", "AULA", "Planta 2", "20", "Sin nombre");
        assertFalse(PO_View.checkElementBy(driver, "text", "nombre").isEmpty(),
                "Debe mostrar error por nombre vacío");
        assertFalse(driver.getCurrentUrl().contains("/admin/spaces/list"),
                "No debe redirigir si el nombre está vacío");
    }

    /**
     * [PR13] Registrar espacio con capacidad menor que 1 (capacidad = 0).
     * Debe mostrar error y permanecer en el formulario.
     */
    @Test
    @Order(13)
    void PR13() {
        loginAsAdmin();
        driver.navigate().to(URL + "/admin/spaces/new");
        PO_SpacesView.fillSpaceForm(driver, "Sala Capacidad Cero", "COWORK",
                "Planta B", "0", "Test capacidad inválida");
        assertFalse(PO_View.checkElementBy(driver, "text", "capacidad").isEmpty(),
                "Debe mostrar error por capacidad inválida");
        assertFalse(driver.getCurrentUrl().contains("/admin/spaces/list"),
                "No debe redirigir si la capacidad es inválida");
    }

    /**
     * [PR14] Registrar espacio con nombre duplicado activo ("Sala Turing" existe en
     * semilla).
     * Debe mostrar error de nombre duplicado.
     */
    @Test
    @Order(14)
    void PR14() {
        loginAsAdmin();
        driver.navigate().to(URL + "/admin/spaces/new");
        PO_SpacesView.fillSpaceForm(driver, "Sala Turing", "SALA",
                "Planta 1", "10", "Duplicado");
        assertFalse(PO_View.checkElementBy(driver, "text", "nombre").isEmpty(),
                "Debe mostrar error de nombre ya existente");
        assertFalse(driver.getCurrentUrl().contains("/admin/spaces/list"),
                "No debe redirigir si el nombre ya está en uso");
    }

    /**
     * [PR15] Editar espacio existente con datos válidos.
     * Los datos deben modificarse y redirigir al listado con mensaje de éxito.
     */
    @Test
    @Order(15)
    void PR15() {
        loginAsAdmin();
        driver.navigate().to(URL + "/admin/spaces/list");
        // Clicar el primer botón Editar disponible
        driver.findElement(By.cssSelector("a[href*='/admin/spaces/'][href*='/edit']")).click();
        // Modificar la ubicación
        WebElement locationField = driver.findElement(By.id("location"));
        locationField.clear();
        locationField.sendKeys("Ubicacion actualizada por PR15");
        driver.findElement(By.cssSelector("button[type='submit']")).click();
        assertTrue(driver.getCurrentUrl().contains("/admin/spaces/list"),
                "Edición válida debe redirigir al listado admin");
        assertFalse(PO_View.checkElementBy(driver, "text", "correctamente").isEmpty(),
                "Debe aparecer mensaje de operación correcta");
    }

    /**
     * [PR16] Editar espacio con capacidad menor que 1.
     * Los datos NO deben modificarse y debe aparecer mensaje de error.
     */
    @Test
    @Order(16)
    void PR16() {
        loginAsAdmin();
        driver.navigate().to(URL + "/admin/spaces/list");
        driver.findElement(By.cssSelector("a[href*='/admin/spaces/'][href*='/edit']")).click();
        // Poner capacidad 0 (inválida)
        PO_SpacesView.fillSpaceForm(driver, null, null, null, "0", null);
        assertFalse(PO_View.checkElementBy(driver, "text", "capacidad").isEmpty(),
                "Debe mostrar error por capacidad inválida");
        assertFalse(driver.getCurrentUrl().contains("/admin/spaces/list"),
                "No debe redirigir si la capacidad es inválida");
    }

    /**
     * [PR17] Desactivar un espacio activo y verificar que no aparece en el listado
     * público.
     */
    @Test
    @Order(17)
    void PR17() {
        loginAsAdmin();
        driver.navigate().to(URL + "/admin/spaces/list");
        // Obtener el nombre del primer espacio activo (fila sin clase 'danger')
        WebElement firstActiveRow = driver.findElement(
                By.xpath("//tbody/tr[not(contains(@class,'danger'))][1]"));
        String spaceName = firstActiveRow.findElement(By.xpath("td[1]")).getText();
        // Clicar el botón de desactivar de esa fila
        firstActiveRow.findElement(By.cssSelector("form button")).click();
        // Verificar que aparece etiqueta "Inactivo"
        SeleniumUtils.waitLoadElementsBy(driver, "text", "Inactivo", PO_View.getTimeout());
        // Verificar que NO aparece en el listado público del usuario estándar
        driver.manage().deleteAllCookies();
        loginAsUser();
        driver.navigate().to(URL + "/spaces/list");
        assertTrue(driver.findElements(
                By.xpath("//*[contains(text(),'" + spaceName + "')]")).isEmpty(),
                "El espacio desactivado no debe aparecer en el listado público");
    }

    /**
     * [PR18] Activar un espacio inactivo y verificar que aparece en el listado
     * público.
     * "Aula Antigua" está desactivada en los datos semilla.
     */
    @Test
    @Order(18)
    void PR18() {
        loginAsAdmin();
        driver.navigate().to(URL + "/admin/spaces/list");
        // Obtener el nombre del primer espacio inactivo (fila con clase 'danger')
        WebElement inactiveRow = driver.findElement(
                By.xpath("//tbody/tr[contains(@class,'danger')][1]"));
        String spaceName = inactiveRow.findElement(By.xpath("td[1]")).getText();
        // Clicar el botón de activar
        inactiveRow.findElement(By.cssSelector("form button")).click();
        SeleniumUtils.waitLoadElementsBy(driver, "text", "correctamente", PO_View.getTimeout());
        // Verificar que SÍ aparece en el listado público
        driver.manage().deleteAllCookies();
        loginAsUser();
        driver.navigate().to(URL + "/spaces/list");
        assertFalse(PO_View.checkElementBy(driver, "text", spaceName).isEmpty(),
                "El espacio activado debe aparecer en el listado público");
    }

    /**
     * [PR19] Crear bloqueo de mantenimiento válido en fechas lejanas (2099).
     * Debe redirigir con mensaje de éxito.
     */
    @Test
    @Order(19)
    void PR19() {
        loginAsAdmin();
        PO_SpacesView.navigateToFirstMaintenanceForm(driver, URL);
        PO_SpacesView.fillMaintenanceForm(driver,
                "2099-01-01T09:00", "2099-01-01T18:00",
                "Mantenimiento preventivo PR19");
        assertFalse(PO_View.checkElementBy(driver, "text", "correctamente").isEmpty(),
                "Debe aparecer mensaje de éxito al crear bloqueo válido");
    }

    /**
     * [PR20] Crear bloqueo solapado con otro bloqueo activo del mismo espacio.
     * Primero crea un bloqueo base, luego intenta crear uno que lo solape.
     * Debe mostrar error de solapamiento.
     */
    @Test
    @Order(20)
    void PR20() {
        loginAsAdmin();
        // Crear bloqueo base en fechas únicas de esta prueba
        PO_SpacesView.navigateToFirstMaintenanceForm(driver, URL);
        PO_SpacesView.fillMaintenanceForm(driver,
                "2099-02-01T08:00", "2099-02-01T20:00",
                "Bloqueo base para PR20");
        // Intentar crear bloqueo solapado (dentro del anterior)
        PO_SpacesView.navigateToFirstMaintenanceForm(driver, URL);
        PO_SpacesView.fillMaintenanceForm(driver,
                "2099-02-01T10:00", "2099-02-01T15:00",
                "Bloqueo solapado PR20");
        assertFalse(PO_View.checkElementBy(driver, "text", "solapa").isEmpty(),
                "Debe mostrar error de solapamiento con bloqueo activo");
    }

    /**
     * [PR21] Crear bloqueo solapado con una reserva activa del mismo espacio.
     * Las reservas semilla están en el futuro próximo (año 2026).
     * El bloqueo cubre 2026 para garantizar el solapamiento.
     */
    @Test
    @Order(21)
    void PR21() {
        loginAsAdmin();
        // Navegar al listado y buscar el botón de bloqueo de "Sala Turing"
        // que es el espacio con reservas activas en el seed
        driver.navigate().to(URL + "/admin/spaces/list");

        // Buscar la fila que contiene "Sala Turing" y clicar su botón de bloqueo
        WebElement salaTuringRow = driver.findElement(
                By.xpath("//tbody/tr[td[contains(text(),'Sala Turing')]]"));
        salaTuringRow.findElement(By.cssSelector("a[href*='/maintenance/new']")).click();

        ((JavascriptExecutor) driver).executeScript(
                "document.getElementById('startDate').value = '2026-01-01T00:00';");
        ((JavascriptExecutor) driver).executeScript(
                "document.getElementById('endDate').value = '2026-12-31T23:59';");
        driver.findElement(By.id("reason")).sendKeys("Bloqueo sobre reserva activa PR21");
        driver.findElement(By.cssSelector("button[type='submit']")).click();
        assertFalse(PO_View.checkElementBy(driver, "text", "solapa").isEmpty(),
                "Debe mostrar error de solapamiento con reserva activa");
    }

    /**
     * [PR22] Crear un bloqueo, luego cancelarlo.
     * El bloqueo cancelado debe aparecer en el listado con estado CANCELADO.
     */
    @Test
    @Order(22)
    void PR22() {
        loginAsAdmin();
        PO_SpacesView.navigateToFirstMaintenanceForm(driver, URL);
        PO_SpacesView.fillMaintenanceForm(driver,
                "2099-03-01T09:00", "2099-03-01T18:00",
                "Bloqueo a cancelar en PR22");
        driver.navigate().to(URL + "/admin/maintenance/list");
        SeleniumUtils.waitLoadElementsBy(driver, "free", "//tbody/tr", PO_View.getTimeout());
        driver.findElement(By.cssSelector("form[action*='/cancel'] button")).click();

        // Aceptar el confirm() de JavaScript
        driver.switchTo().alert().accept();

        assertFalse(PO_View.checkElementBy(driver, "text", "CANCELADO").isEmpty(),
                "El bloqueo debe aparecer con estado CANCELADO tras cancelarlo");
    }

    /**
     * [PR23] Consultar listado global de reservas
     * Se prueba la pagionación
     */
    @Test
    @Order(23)
    public void PR23() {
        loginAsAdmin();

        driver.navigate().to(URL + "/admin/reservations/list");

        //PO_View.checkElementBy(driver, "text", "Usuario");
        PO_View.checkElementBy(driver, "text", "Espacio");
        PO_View.checkElementBy(driver, "text", "Inicio");
        PO_View.checkElementBy(driver, "text", "Fin");
        PO_View.checkElementBy(driver, "text", "Estado");

        List<WebElement> rows = driver.findElements(By.xpath("//*[@id=\"tableReservation\"]/table/tbody/tr"));
        assertEquals(5, rows.size(), "Debería haber exactamente 5 elementos en la tabla");
        //probar paginación
        PO_PrivateView.checkPagination(driver);
        rows = driver.findElements(By.xpath("//*[@id=\"tableReservation\"]/table/tbody/tr"));
        assertEquals(5, rows.size(), "Debería haber exactamente 5 elementos en la tabla");

        //Assertions.assertTrue(false, "PR23 sin hacer");
    }

    /**
     * [PR24] Filtrar listado global de reservas por espacio
     * Se prueba la pagionación
     */
    @Test
    @Order(24)
    public void PR24() {
        loginAsAdmin();

        driver.navigate().to(URL + "/admin/reservations/list");

        driver.findElement(By.xpath("//*[@id=\"searchSpace\"]/option[2]")).click();

        PO_PrivateView.checkPagination(driver);
        assertTrue(driver.getCurrentUrl().contains("searchSpace="), "La URL debe contener el filtro por espacio");
        PO_PrivateView.checkPagination(driver);
        assertTrue(driver.getCurrentUrl().contains("searchSpace="), "El filtro de espacio debe mantenerse al cambiar de página");
        List<WebElement> filas = driver.findElements(By.xpath("//*[@id=\"tableReservation\"]/table/tbody/tr"));
        assertEquals(5, filas.size(), "Debería haber exactamente 5 elementos en la tabla");

        //assertTrue(false, "PR24 sin hacer");
    }

    /**
     * [PR25] Filtrar listado global de reservas por rango de fechas
     * Se prueba la pagionación
     */
    @Test
    @Order(25)
    public void PR25() {
        loginAsAdmin();

        driver.navigate().to(URL + "/admin/reservations/list");
        driver.findElement(By.id("startDate")).sendKeys("2026-05-01");
        driver.findElement(By.id("endDate")).sendKeys("2026-05-05");
        driver.findElement(By.xpath("//button[@type='submit']")).click();
        assertTrue(driver.getCurrentUrl().contains("startDate=2026-05-01"), "La URL debe contener la fecha de inicio");
        assertTrue(driver.getCurrentUrl().contains("endDate=2026-05-05"), "La URL debe contener la fecha de fin");

        List<WebElement> rows = driver.findElements(By.xpath("//*[@id=\"tableReservation\"]/table/tbody/tr"));
        assertEquals(5, rows.size(), "Debería haber exactamente 5 elementos en la tabla");

        PO_PrivateView.checkPagination(driver);
        assertTrue(driver.getCurrentUrl().contains("startDate=2026-05-01"), "El filtro de fecha debe mantenerse al cambiar de página");
        assertTrue(driver.getCurrentUrl().contains("endDate=2026-05-05"), "El filtro de fecha debe mantenerse al cambiar de página");
        rows = driver.findElements(By.xpath("//*[@id=\"tableReservation\"]/table/tbody/tr"));
        assertEquals(5, rows.size(), "Debería haber exactamente 5 elementos en la tabla");
        //Assertions.assertTrue(false, "PR25 sin hacer");
    }

    /**
     * [PR26] Consultar el listado de espacios disponibles (usuario estándar).
     * Debe mostrar nombre, tipo, ubicación y capacidad.
     */
    @Test
    @Order(26)
    void PR26() {
        loginAsUser();
        driver.navigate().to(URL + "/spaces/list");

        PO_View.checkElementBy(driver, "text", "Nombre");
        PO_View.checkElementBy(driver, "text", "Tipo");
        PO_View.checkElementBy(driver, "text", "Localización");
        PO_View.checkElementBy(driver, "text", "Capacidad");

        List<WebElement> rows = driver.findElements(By.xpath("//tbody/tr"));
        assertEquals(6, rows.size(), "El listado de espacios no debe estar vacío");

        // Verificar que la primera fila tiene datos en las columnas
        WebElement firstRow = rows.get(0);
        assertFalse(firstRow.findElement(By.xpath("td[1]")).getText().isEmpty(), "Nombre no debe estar vacío");
        assertFalse(firstRow.findElement(By.xpath("td[2]")).getText().isEmpty(), "Tipo no debe estar vacío");
        assertFalse(firstRow.findElement(By.xpath("td[3]")).getText().isEmpty(), "Localización no debe estar vacío");
        assertFalse(firstRow.findElement(By.xpath("td[4]")).getText().isEmpty(), "Capacidad no debe estar vacío");

        PO_LoginView.logout(driver);
    }

    /**
     * [PR27] Aplicar un filtro en el listado de espacios.
     * Filtrar por tipo y verificar resultados. Luego por capacidad.
     */
    @Test
    @Order(27)
    void PR27() {
        loginAsUser();
        driver.navigate().to(URL + "/spaces/list");

        List<WebElement> rows = driver.findElements(By.xpath("//tbody/tr"));
        assertTrue(rows.size() == 6, "El listado de espacios no debe estar vacío");

        PO_SpacesView.filterSpaces(driver, "SALA", null);
        rows = driver.findElements(By.xpath("//tbody/tr"));
        assertTrue(rows.size() == 3, "El listado de espacios no debe tener 3 salas");
        for (WebElement row : rows) {
            if (row.findElements(By.xpath("td")).size() > 1) {
                assertEquals("SALA", row.findElement(By.xpath("td[2]")).getText(),
                        "Todos los resultados deben ser de tipo SALA");
            }
        }

        driver.navigate().to(URL + "/spaces/list");
        PO_SpacesView.filterSpaces(driver, "", "50");
        rows = driver.findElements(By.xpath("//tbody/tr"));
        assertEquals(1, rows.size(), "Debe haber exactamente una fila en la tabla");
        String message = rows.get(0).findElement(By.xpath("td")).getText();
        assertEquals("No se encontraron espacios que coincidan con la búsqueda.", message);

        PO_LoginView.logout(driver);
    }

    /**
     * [PR28] Acceder al detalle de un espacio desde el listado
     * Se verifica que se muestra la información del espacio
     */
    @Test
    @Order(28)
    public void PR28() {
        loginAsUser();

        driver.navigate().to(URL + "/spaces/list");

        driver.findElement(By.xpath("/html/body/div/div/div[2]/table/tbody/tr[1]/td[6]/a")).click();

        String checkText = "Aula Newton";
        List<WebElement> result = PO_View.checkElementBy(driver, "text", checkText);
        Assertions.assertEquals(checkText, result.get(0).getText());

        checkText = "AULA";
        result = PO_View.checkElementBy(driver, "text", checkText);
        Assertions.assertEquals(checkText, result.get(0).getText());

        //assertTrue(false, "PR28 sin hacer");
    }

    /**
     * [PR29] Consultar disponibilidad de un espacio en un rango amplio.
     * Debe mostrar eventos RESERVA o MANTENIMIENTO, o indicar que está libre.
     */
    @Test
    @Order(29)
    void PR29() {
        loginAsUser();
        driver.navigate().to(URL + "/spaces/list");
        // Clicar en Disponibilidad del primer espacio
        driver.findElement(By.cssSelector("a[href*='/availability']")).click();
        // Consultar rango amplio que incluye las reservas semilla
        ((JavascriptExecutor) driver).executeScript(
                "document.getElementById('startDate').value = '2026-01-01T00:00';");
        ((JavascriptExecutor) driver).executeScript(
                "document.getElementById('endDate').value = '2027-12-31T23:59';");
        driver.findElement(By.cssSelector("button[type='submit']")).click();
        boolean hayReserva = !driver.findElements(
                By.xpath("//*[contains(text(),'RESERVA')]")).isEmpty();
        boolean hayMantenimiento = !driver.findElements(
                By.xpath("//*[contains(text(),'MANTENIMIENTO')]")).isEmpty();
        boolean hayLibre = !driver.findElements(
                By.xpath("//*[contains(text(),'libre')]")).isEmpty();
        assertTrue(hayReserva || hayMantenimiento || hayLibre,
                "Debe mostrar eventos de disponibilidad o indicar que el espacio está libre");
    }

    @Test
    @Order(30)
    public void PR30() {
        Assertions.assertTrue(false, "PR30 sin hacer");
    }

    @Test
    @Order(31)
    public void PR31() {
        Assertions.assertTrue(false, "PR31 sin hacer");
    }

    @Test
    @Order(32)
    public void PR32() {
        Assertions.assertTrue(false, "PR32 sin hacer");
    }

    @Test
    @Order(33)
    public void PR33() {
        Assertions.assertTrue(false, "PR33 sin hacer");
    }

    /**
     * [PR34] Listado paginado de usuarios del sistema.
     * Debe mostrar 5 usuarios por página, tener al menos 2 páginas,
     * y el administrador debe estar visible.
     */
    @Test
    @Order(34)
    void PR34() {
        loginAsAdmin();
        driver.navigate().to(URL + "/admin/users/list");
        // Verificar columnas básicas
        PO_View.checkElementBy(driver, "text", "DNI");
        PO_View.checkElementBy(driver, "text", "Nombre");
        // Verificar 5 filas en primera página
        List<WebElement> rows = SeleniumUtils.waitLoadElementsBy(
                driver, "free", "//tbody/tr", PO_View.getTimeout());
        assertEquals(5, rows.size(), "Debe mostrar exactamente 5 usuarios por página");
        // Verificar que existe la página 2
        List<WebElement> page2Link = driver.findElements(
                By.xpath("//ul[contains(@class,'pagination')]//a[text()='2']"));
        assertFalse(page2Link.isEmpty(), "Debe existir enlace a la página 2");
        // Navegar a página 2 y verificar que tiene usuarios
        page2Link.get(0).click();
        List<WebElement> rowsPage2 = SeleniumUtils.waitLoadElementsBy(
                driver, "free", "//tbody/tr", PO_View.getTimeout());
        assertFalse(rowsPage2.isEmpty(), "La página 2 debe tener usuarios");
        // Verificar que el administrador aparece en el listado (página 1)
        driver.navigate().to(URL + "/admin/users/list");
        assertFalse(PO_View.checkElementBy(driver, "text", "12345678Z").isEmpty(),
                "El administrador debe aparecer en el listado de usuarios");
    }

    /**
     * [PR35] El usuario administrador dispondrá de una acción para exportar a CSV el listado global de
     * reservas (o el resultado de un filtro). El CSV deberá incluir, al menos: espacio, usuario, inicio, fin
     * y estado.
     */
    @Test
    @Order(35)
    void PR35() throws Exception {
        java.nio.file.Path downloadDir = java.nio.file.Files.createTempDirectory("csv_test_");

        org.openqa.selenium.firefox.FirefoxOptions options = new org.openqa.selenium.firefox.FirefoxOptions();
        options.addPreference("browser.download.folderList", 2);
        options.addPreference("browser.download.dir", downloadDir.toAbsolutePath().toString());
        options.addPreference("browser.helperApps.neverAsk.saveToDisk", "text/csv");

        WebDriverManager.firefoxdriver().setup();
        System.setProperty("webdriver.firefox.bin", PathFirefox);
        WebDriver csvDriver = new FirefoxDriver(options);

        try {
            csvDriver.navigate().to(URL + "/users/login");
            PO_LoginView.fillLoginForm(csvDriver, "12345678Z", "@Dm1n1str@D0r");

            csvDriver.navigate().to(URL + "/admin/reservations/list");

            String spaceId = getSpaceIdByName("Sala Turing");
            new org.openqa.selenium.support.ui.Select(csvDriver.findElement(By.id("searchSpace"))).selectByValue(spaceId);

            SeleniumUtils.waitLoadElementsBy(csvDriver, "free", "//tbody/tr", PO_View.getTimeout());

            int rowsInWeb = csvDriver.findElements(By.xpath("//tbody/tr")).size();
            assertTrue(rowsInWeb > 0, "Debe haber reservas en la web para exportar");

            csvDriver.findElement(By.id("btn-export")).click();

            java.io.File csvFile = null;
            long limit = System.currentTimeMillis() + 10000;
            while (System.currentTimeMillis() < limit) {
                java.io.File[] files = downloadDir.toFile().listFiles(
                        f -> f.getName().endsWith(".csv") && !f.getName().endsWith(".part"));
                if (files != null && files.length > 0) {
                    csvFile = files[0];
                    break;
                }
                Thread.sleep(500);
            }
            assertNotNull(csvFile, "El CSV debería haberse descargado");

            String content = new String(java.nio.file.Files.readAllBytes(csvFile.toPath()),
                    java.nio.charset.StandardCharsets.UTF_8).replace("\uFEFF", "");
            String[] lines = content.split("\\r?\\n");

            assertTrue(lines[0].contains("Espacio"), "Falta campo Espacio");
            assertTrue(lines[0].contains("Nombre"),  "Falta campo Nombre");
            assertTrue(lines[0].contains("DNI"),     "Falta campo DNI");
            assertTrue(lines[0].contains("Inicio"),  "Falta campo Inicio");
            assertTrue(lines[0].contains("Fin"),     "Falta campo Fin");
            assertTrue(lines[0].contains("Estado"),  "Falta campo Estado");

            assertEquals(16, lines.length, "El CSV debe tener 15 reservas + 1 cabecera");

            for (int i = 1; i < lines.length; i++) {
                assertTrue(lines[i].contains("Sala Turing"), "Fila " + i + " no pertenece al espacio filtrado");
            }

        } finally {
            csvDriver.quit();

            if (downloadDir.toFile().exists()) {
                java.nio.file.Files.walk(downloadDir)
                        .sorted(java.util.Comparator.reverseOrder())
                        .map(java.nio.file.Path::toFile)
                        .forEach(java.io.File::delete);
            }
        }
    }

    @Test
    @Order(36)
    public void PR36() {
        Assertions.assertTrue(false, "PR36 sin hacer");
    }

    @Test
    @Order(37)
    public void PR37() {
        Assertions.assertTrue(false, "PR37 sin hacer");
    }

    @Test
    @Order(38)
    public void PR38() {
        final String RestAssuredURL = URL + "/api/users/login";
        RequestSpecification request = RestAssured.given();
        JSONObject requestParams = new JSONObject();
        requestParams.put("dni", "12345678Z");
        requestParams.put("password", "@Dm1n1str@D0r");
        request.header("Content-Type", "application/json");
        request.body(requestParams.toJSONString());
        Response response = request.post(RestAssuredURL);
        Assertions.assertEquals(200, response.getStatusCode());
        Assertions.assertNotNull(response.jsonPath().getString("token"));
    }

    /**
     * [PR39] Registrar una reserva válida (usuario estándar).
     * Debe devolver 201 Created.
     */
    @Test @Order(39)
    void PR39() {
        String token = getToken("10000001S", "Us3r@1-PASSW");
        String spaceId = getSpaceIdByName("Sala Turing");

        RequestSpecification request = RestAssured.given();
        request.header("token", token);
        request.header("Content-Type", "application/json");

        JSONObject params = new JSONObject();
        params.put("spaceId", spaceId);
        params.put("startDate", "2026-12-01T10:00:00");
        params.put("endDate", "2026-12-01T12:00:00");
        params.put("userDni", "10000001S");
        params.put("reason", "Reserva PR39");

        request.body(params.toJSONString());
        Response response = request.post(URL + "/api/v1.0/reservations");
        assertEquals(201, response.getStatusCode());
        assertNotNull(response.jsonPath().getString("reservationId"));
    }

    /**
     * [PR40] Registrar una reserva inválida (inicio posterior al fin).
     * Debe devolver 400 Bad Request.
     */
    @Test @Order(40)
    void PR40() {
        String token = getToken("10000001S", "Us3r@1-PASSW");
        String spaceId = getSpaceIdByName("Sala Turing");

        RequestSpecification request = RestAssured.given();
        request.header("token", token);
        request.header("Content-Type", "application/json");

        JSONObject params = new JSONObject();
        params.put("spaceId", spaceId);
        params.put("startDate", "2026-06-02T12:00:00"); // Inicio después
        params.put("endDate", "2026-06-02T10:00:00");   // de fin
        params.put("userDni", "10000001S");

        request.body(params.toJSONString());
        Response response = request.post(URL + "/api/v1.0/reservations");
        assertEquals(400, response.getStatusCode());
    }

    /**
     * [PR41] Intentar crear una reserva solapada en el mismo espacio (debe fallar).
     * El seed tiene una reserva en "Sala Turing" el 2026-01-15 de 09:00 a 11:00.
     * Debe devolver 409 Conflict.
     */
    @Test @Order(41)
    void PR41() {
        String token = getToken("10000001S", "Us3r@1-PASSW");
        String spaceId = getSpaceIdByName("Sala Turing");

        RequestSpecification request = RestAssured.given();
        request.header("token", token);
        request.header("Content-Type", "application/json");

        JSONObject params = new JSONObject();
        params.put("spaceId", spaceId);
        params.put("startDate", "2026-01-15T10:00:00"); // Se solapa (09-11)
        params.put("endDate", "2026-01-15T12:00:00");
        params.put("userDni", "10000001S");

        request.body(params.toJSONString());
        Response response = request.post(URL + "/api/v1.0/reservations");
        assertEquals(409, response.getStatusCode());
        assertTrue(response.getBody().asString().contains("horario"));
    }

    /**
     * [PR42] Intentar reservar dentro de un bloqueo (debe fallar).
     * El seed tiene un bloqueo en "Sala Turing" para mañana (+24h).
     */
    @Test @Order(42)
    void PR42() {
        String token = getToken("10000001S", "Us3r@1-PASSW");
        String spaceId = getSpaceIdByName("Sala Turing");

        RequestSpecification request = RestAssured.given();
        request.header("token", token);
        request.header("Content-Type", "application/json");

        // Calculamos una fecha para mañana (+24h)
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.add(java.util.Calendar.DAY_OF_YEAR, 1);
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
        String tomorrow = sdf.format(cal.getTime());

        JSONObject params = new JSONObject();
        params.put("spaceId", spaceId);
        params.put("startDate", tomorrow); 
        params.put("endDate", sdf.format(new java.util.Date(cal.getTimeInMillis() + 3600000)));
        params.put("userDni", "10000001S");

        request.body(params.toJSONString());
        Response response = request.post(URL + "/api/v1.0/reservations");
        assertEquals(409, response.getStatusCode());
        assertTrue(response.getBody().asString().contains("mantenimiento"));
    }

    /**
     * [PR42] Consulta el listado de reservas propias
     * El json recibido como respuesta debe contener 5 elementos
     */
    @Test
    @Order(43)
    public void PR43() {
        final String RestAssuredURL = "http://localhost:8081/api/v1.0/reservations";
        String token = getToken("10000001S", "Us3r@1-PASSW");

        RequestSpecification request = RestAssured.given();
        request.header("token", token);
        request.header("Content-Type", "application/json");

        Response response = request.get(RestAssuredURL);

        //se comprueba codigo OK
        assertEquals(200, response.getStatusCode());

        //se comprueba tamaño de la respuesta
        assertEquals(5, response.jsonPath().getList("$").size());

    }

    /**
     * [PR44] Cancelar una reserva propia y verificar que deja de ocupar espacio.
     * 1. Crea reserva A.
     * 2. Verifica que reserva B (solapada) falla.
     * 3. Cancela reserva A.
     * 4. Verifica que reserva B ahora tiene éxito.
     */
    /**
     * [PR44] Cancelar una reserva propia y verificar que deja de ocupar espacio.
     * Utiliza una reserva de la semilla (Sala Turing, 15 de Enero).
     */
    @Test @Order(44)
    void PR44() {
        String token = getToken("10000001S", "Us3r@1-PASSW");
        String spaceId = getSpaceIdByName("Sala Turing");
        String dni = "10000001S";

        // 1. Obtener la reserva de la semilla (Sala Turing, 15 de Enero 09:00)
        Response resList = RestAssured.given()
                .header("token", token)
                .get(URL + "/api/v1.0/reservations");
        
        // Buscamos el ID de la reserva en Sala Turing que empieza a las 09:00
        // (La fecha viene formateada como "15/01/2026, 09:00" segun el locale es-ES en el server)
        String resId = resList.jsonPath().getString("find { it.space == 'Sala Turing' && it.startDate.contains('09:00') }.id");
        assertNotNull(resId, "Debe existir la reserva de la semilla");

        // 2. Verificar que bloquea un solape (10:00-12:00)
        JSONObject paramsOverlap = new JSONObject();
        paramsOverlap.put("spaceId", spaceId);
        paramsOverlap.put("startDate", "2026-01-15T10:00:00");
        paramsOverlap.put("endDate", "2026-01-15T12:00:00");
        paramsOverlap.put("userDni", dni);

        Response resFail = RestAssured.given()
                .header("token", token).header("Content-Type", "application/json")
                .body(paramsOverlap.toJSONString())
                .post(URL + "/api/v1.0/reservations");
        assertEquals(409, resFail.getStatusCode());

        // 3. Cancelar la reserva de la semilla
        JSONObject cancelParams = new JSONObject();
        cancelParams.put("userDni", dni);
        Response resCancel = RestAssured.given()
                .header("token", token).header("Content-Type", "application/json")
                .body(cancelParams.toJSONString())
                .delete(URL + "/api/v1.0/reservations/" + resId);
        assertEquals(200, resCancel.getStatusCode());

        // 4. Verificar que ahora el solape tiene exito
        Response resOk = RestAssured.given()
                .header("token", token).header("Content-Type", "application/json")
                .body(paramsOverlap.toJSONString())
                .post(URL + "/api/v1.0/reservations");
        assertEquals(201, resOk.getStatusCode());
    }

    @Test
    @Order(45)
    public void PR45() {
        Assertions.assertTrue(false, "PR45 sin hacer");
    }

    @Test
    @Order(46)
    public void PR46() {
        Assertions.assertTrue(false, "PR46 sin hacer");
    }

    @Test
    @Order(47)
    public void PR47() {
        Assertions.assertTrue(false, "PR47 sin hacer");
    }

    @Test
    @Order(48)
    public void PR48() {
        Assertions.assertTrue(false, "PR48 sin hacer");
    }

    @Test
    @Order(49)
    public void PR49() {
        Assertions.assertTrue(false, "PR49 sin hacer");
    }

    @Test
    @Order(50)
    public void PR50() {
        Assertions.assertTrue(false, "PR50 sin hacer");
    }

    @Test
    @Order(51)
    public void PR51() {
        Assertions.assertTrue(false, "PR51 sin hacer");
    }

    @Test
    @Order(52)
    public void PR52() {
        Assertions.assertTrue(false, "PR52 sin hacer");
    }

    @Test
    @Order(53)
    public void PR53() {
        Assertions.assertTrue(false, "PR53 sin hacer");
    }

    /**
     * [PR54]  Consultar el listado de reservas propias
     * Se verifica que se muestra la informacion de las reservas
     * Se verifica que aparece el numero de reservas correcto
     */
    @Test
    @Order(54)
    public void PR54() {
        driver.navigate().to("http://localhost:3000/");

        //login react
        userLoginReact();

        PO_View.checkElementBy(driver, "text", "Espacio");
        PO_View.checkElementBy(driver, "text", "Inicio");
        PO_View.checkElementBy(driver, "text", "Fin");

        List<WebElement> rows = driver.findElements(By.xpath("//*[@id=\"tableReservation\"]/table/tbody/tr"));
        assertEquals(5, rows.size(), "Debería haber exactamente 5 elementos en la tabla");

        //Assertions.assertTrue(false, "PR54 sin hacer");
    }

    /**
     * [PR55]  Filtrar reservas propias por estado CANCELADA
     * Se verifica que aparece el numero de reservas correcto
     */
    @Test
    @Order(55)
    public void PR55() {
        driver.navigate().to("http://localhost:3000/");

        //login react
        userLoginReact();

        //se filtra por reservas canceladas
        driver.findElement(By.xpath("/html/body/div/div/main/div/div[1]/select/option[3]")).click();

        List<WebElement> rows = driver.findElements(By.xpath("//*[@id=\"tableReservation\"]/table/tbody/tr"));
        assertEquals(1, rows.size(), "Debería haber exactamente 1 elementos en la tabla");
    }

    /**
     * [PR56]  Cancelar una reserva propia y verificar que deja de ocupar espacios
     * Se crea una nueva reserva y se cancela
     * Se comprueba que se ha cancelado la reserva con exito
     */
    @Test
    @Order(56)
    public void PR56() {
        driver.navigate().to("http://localhost:3000/");

        //login react
        userLoginReact();

        //crear reserva nueva
        driver.findElement(By.xpath("/html/body/div/div/header/nav/button[2]")).click();
        //escoger espacio
        driver.findElement(By.xpath("/html/body/div/div/main/div/form/div[1]/select/option[2]")).click();
        //seleccionar fecha //*[@id="startDate"]
        driver.findElement(By.id("startDate")).sendKeys("01-05-2027, 14:00");
        driver.findElement(By.id("endDate")).sendKeys("01-05-2027, 16:00");

        driver.findElement(By.xpath("/html/body/div/div/main/div/form/button")).click();

        //se cancela la reserva
        driver.findElement(By.xpath("/html/body/div/div/main/div/div[2]/table/tbody/tr[6]/td[5]/div/button[2]")).click();

        //se filtra por reservas canceladas
        driver.findElement(By.xpath("/html/body/div/div/main/div/div[1]/select/option[3]")).click();

        List<WebElement> rows = driver.findElements(By.xpath("//*[@id=\"tableReservation\"]/table/tbody/tr"));
        assertEquals(2, rows.size(), "Debería haber exactamente 2 elementos en la tabla");
    }

    @Test
    @Order(57)
    public void PR57() {
        Assertions.assertTrue(false, "PR57 sin hacer");
    }

    @Test
    @Order(58)
    public void PR58() {
        Assertions.assertTrue(false, "PR58 sin hacer");
    }

    @Test
    @Order(59)
    public void PR59() {
        Assertions.assertTrue(false, "PR59 sin hacer");
    }

    @Test
    @Order(60)
    public void PR60() {
        Assertions.assertTrue(false, "PR60 sin hacer");
    }
}
