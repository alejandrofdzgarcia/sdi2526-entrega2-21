package com.uniovi.sdi2526entrega2test.n;

import com.uniovi.sdi2526entrega2test.n.pageobjects.PO_LoginView;
import com.uniovi.sdi2526entrega2test.n.pageobjects.PO_SignUpView;
import com.uniovi.sdi2526entrega2test.n.pageobjects.PO_SpacesView;
import com.uniovi.sdi2526entrega2test.n.pageobjects.PO_View;
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

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private void loginAsAdmin() {
        driver.navigate().to(URL + "/users/login");
        PO_LoginView.fillLoginForm(driver, "12345678Z", "@Dm1n1str@D0r");
    }

    private void loginAsUser() {
        driver.navigate().to(URL + "/users/login");
        PO_LoginView.fillLoginForm(driver, "10000001S", "Us3r@1-PASSW");
    }

    /**
     * [PR01] Registro con datos válidos.
     * El formulario va a /users/signup (POST).
     * Tras el registro exitoso debe redirigir al listado de espacios.
     */
    @Test @Order(1)
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
    @Test @Order(2)
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
    @Test @Order(3)
    void PR03() {
        driver.navigate().to(URL + "/users/signup");
        PO_SignUpView.fillForm(driver, "12345678Z", "Pedro", "Lopez",
                "Pass@12345678", "Pass@12345678");
        List<WebElement> errors = PO_View.checkElementBy(driver, "text", "DNI");
        assertFalse(errors.isEmpty(), "Debe mostrar error de DNI ya registrado");
        assertFalse(driver.getCurrentUrl().contains("/spaces/list"));
    }

    /**
     * [PR04] Registro con contraseña que no cumple requisitos (sin carácter especial).
     * Debe mostrar error de contraseña inválida.
     */
    @Test @Order(4)
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

    @Test @Order(9)
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
    @Test @Order(10)
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
    @Test @Order(11)
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
    @Test @Order(12)
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
    @Test @Order(13)
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
     * [PR14] Registrar espacio con nombre duplicado activo ("Sala Turing" existe en semilla).
     * Debe mostrar error de nombre duplicado.
     */
    @Test @Order(14)
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
    @Test @Order(15)
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
    @Test @Order(16)
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
     * [PR17] Desactivar un espacio activo y verificar que no aparece en el listado público.
     */
    @Test @Order(17)
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
     * [PR18] Activar un espacio inactivo y verificar que aparece en el listado público.
     * "Aula Antigua" está desactivada en los datos semilla.
     */
    @Test @Order(18)
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
    @Test @Order(19)
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
    @Test @Order(20)
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
    @Test @Order(21)
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
    @Test @Order(22)
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

    @Test
    @Order(23)
    public void PR23() {
        Assertions.assertTrue(false, "PR23 sin hacer");
    }

    @Test
    @Order(24)
    public void PR24() {
        Assertions.assertTrue(false, "PR24 sin hacer");
    }

    @Test
    @Order(25)
    public void PR25() {
        Assertions.assertTrue(false, "PR25 sin hacer");
    }

    @Test
    @Order(26)
    public void PR26() {
        Assertions.assertTrue(false, "PR26 sin hacer");
    }

    @Test
    @Order(27)
    public void PR27() {
        Assertions.assertTrue(false, "PR27 sin hacer");
    }

    @Test
    @Order(28)
    public void PR28() {
        Assertions.assertTrue(false, "PR28 sin hacer");
    }

    /**
     * [PR29] Consultar disponibilidad de un espacio en un rango amplio.
     * Debe mostrar eventos RESERVA o MANTENIMIENTO, o indicar que está libre.
     */
    @Test @Order(29)
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
    @Test @Order(34)
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

    @Test
    @Order(35)
    public void PR35() {
        Assertions.assertTrue(false, "PR35 sin hacer");
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
        final String RestAssuredURL = "http://localhost:8081/api/v1.0/users/login";
        // 2. Preparamos el parámetro en formato JSON
        RequestSpecification request = RestAssured.given();
        JSONObject requestParams = new JSONObject();
        requestParams.put("email", "delacal@uniovi.es");
        requestParams.put("password", "1234");
        request.header("Content-Type", "application/json");
        request.body(requestParams.toJSONString());
        // 3. Hacemos la petición
        Response response = request.post(RestAssuredURL);
        // 4. Comprobamos que el servicio ha tenido exito
        Assertions.assertEquals(200, response.getStatusCode());
    }

    @Test
    @Order(39)
    public void PR39() {
        Assertions.assertTrue(false, "PR39 sin hacer");
    }

    @Test
    @Order(40)
    public void PR40() {
        Assertions.assertTrue(false, "PR40 sin hacer");
    }

    @Test
    @Order(41)
    public void PR41() {
        Assertions.assertTrue(false, "PR41 sin hacer");
    }

    @Test
    @Order(42)
    public void PR42() {
        Assertions.assertTrue(false, "PR42 sin hacer");
    }

    @Test
    @Order(43)
    public void PR43() {
        Assertions.assertTrue(false, "PR43 sin hacer");
    }

    @Test
    @Order(44)
    public void PR44() {
        Assertions.assertTrue(false, "PR44 sin hacer");
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

    @Test
    @Order(54)
    public void PR54() {
        Assertions.assertTrue(false, "PR54 sin hacer");
    }

    @Test
    @Order(55)
    public void PR55() {
        Assertions.assertTrue(false, "PR55 sin hacer");
    }

    @Test
    @Order(56)
    public void PR56() {
        Assertions.assertTrue(false, "PR56 sin hacer");
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
