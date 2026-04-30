package com.uniovi.sdi2425entrega2test.n;

import io.restassured.RestAssured;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import org.json.simple.JSONObject;
import org.junit.jupiter.api.*;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Sdi2425Entrega2TestApplicationTests {

    static String PathFirefox = "C:\\Program Files\\Mozilla Firefox\\firefox.exe";

    static WebDriver driver = getDriver(PathFirefox);
    static String URL = "http://localhost:8081";

    public static WebDriver getDriver(String PathFirefox) {
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
    }

    // Al finalizar la última prueba
    @AfterAll
    static public void end() {
        // Cerramos el navegador al finalizar las pruebas
        driver.quit();
    }

    @Test
    @Order(1)
    void PR01() {
        Assertions.assertTrue(true, "PR01 sin hacer");
    }

    @Test
    @Order(2)
    public void PR02() {
        Assertions.assertTrue(false, "PR02 sin hacer");
    }

    @Test
    @Order(3)
    public void PR03() {
        Assertions.assertTrue(false, "PR03 sin hacer");
    }

    @Test
    @Order(4)
    public void PR04() {
        Assertions.assertTrue(false, "PR04 sin hacer");
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
    public void PR09() {
        Assertions.assertTrue(false, "PR09 sin hacer");
    }

    @Test
    @Order(10)
    public void PR10() {
        Assertions.assertTrue(false, "PR10 sin hacer");
    }

    @Test
    @Order(11)
    public void PR11() {
        final String RestAssuredURL = "http://localhost:8081/api/v1.0/songs";
        Response response = RestAssured.get(RestAssuredURL);
        Assertions.assertEquals(403, response.getStatusCode());
    }

    @Test
    @Order(12)
    public void PR12() {
        Assertions.assertTrue(false, "PR12 sin hacer");
    }

    @Test
    @Order(13)
    public void PR13() {
        Assertions.assertTrue(false, "PR13 sin hacer");
    }

    @Test
    @Order(14)
    public void PR14() {
        Assertions.assertTrue(false, "PR14 sin hacer");
    }

    @Test
    @Order(15)
    public void PR15() {
        Assertions.assertTrue(false, "PR15 sin hacer");
    }

    @Test
    @Order(16)
    public void PR16() {
        Assertions.assertTrue(false, "PR16 sin hacer");
    }

    @Test
    @Order(17)
    public void PR17() {
        Assertions.assertTrue(false, "PR17 sin hacer");
    }

    @Test
    @Order(18)
    public void PR18() {
        Assertions.assertTrue(false, "PR18 sin hacer");
    }

    @Test
    @Order(19)
    public void PR19() {
        Assertions.assertTrue(false, "PR19 sin hacer");
    }

    @Test
    @Order(20)
    public void PR20() {
        Assertions.assertTrue(false, "PR20 sin hacer");
    }

    @Test
    @Order(21)
    public void PR21() {
        Assertions.assertTrue(false, "PR21 sin hacer");
    }

    @Test
    @Order(22)
    public void PR22() {
        Assertions.assertTrue(false, "PR22 sin hacer");
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

    @Test
    @Order(29)
    public void PR29() {
        Assertions.assertTrue(false, "PR29 sin hacer");
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

    @Test
    @Order(34)
    public void PR34() {
        Assertions.assertTrue(false, "PR34 sin hacer");
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
        //2. Preparamos el parámetro en formato JSON
        RequestSpecification request = RestAssured.given();
        JSONObject requestParams = new JSONObject();
        requestParams.put("email", "delacal@uniovi.es");
        requestParams.put("password", "1234");
        request.header("Content-Type", "application/json");
        request.body(requestParams.toJSONString());
        //3. Hacemos la petición
        Response response = request.post(RestAssuredURL);
        //4. Comprobamos que el servicio ha tenido exito
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
