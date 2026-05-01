package com.uniovi.sdi2526entrega2test.n.pageobjects;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;

import java.util.List;

public class PO_SpacesView extends PO_NavView {

    /**
     * Rellena y envía el formulario de creación/edición de espacio.
     * Si un parámetro es null, ese campo no se toca (útil en edición parcial).
     *
     * IDs del formulario (según el template Twig):
     *   name, type (select), location, capacity, description
     */
    public static void fillSpaceForm(WebDriver driver,
                                     String name,
                                     String type,
                                     String location,
                                     String capacity,
                                     String description) {
        if (name != null) {
            WebElement nameField = driver.findElement(By.id("name"));
            if (name.isEmpty()) {
                ((JavascriptExecutor) driver).executeScript(
                        "arguments[0].removeAttribute('required');", nameField);
            }
            nameField.clear();
            nameField.sendKeys(name);
        }

        if (type != null) {
            Select typeSelect = new Select(driver.findElement(By.id("type")));
            typeSelect.selectByValue(type); // "SALA", "AULA" o "COWORK"
        }

        if (location != null) {
            WebElement locationField = driver.findElement(By.id("location"));
            locationField.clear();
            locationField.sendKeys(location);
        }

        if (capacity != null) {
            WebElement capacityField = driver.findElement(By.id("capacity"));
            // Eliminamos min="1" y required via JS para poder enviar valores inválidos
            // en los tests negativos (PR13, PR16) sin que el navegador los bloquee
            ((JavascriptExecutor) driver).executeScript(
                    "arguments[0].removeAttribute('min');" +
                            "arguments[0].removeAttribute('required');",
                    capacityField);
            capacityField.clear();
            capacityField.sendKeys(capacity);
        }

        if (description != null) {
            WebElement descField = driver.findElement(By.id("description"));
            descField.clear();
            descField.sendKeys(description);
        }

        driver.findElement(By.cssSelector("button[type='submit']")).click();
    }

    /**
     * Navega al formulario de bloqueo de mantenimiento del PRIMER espacio
     * activo que aparezca en /admin/spaces/list.
     *
     * El botón "+ Bloqueo" solo se renderiza en filas de espacios activos
     * (ver template: {% if space.active %} ... {% endif %}).
     *
     * URL destino: /admin/spaces/{id}/maintenance/new
     */
    public static void navigateToFirstMaintenanceForm(WebDriver driver, String baseUrl) {
        driver.navigate().to(baseUrl + "/admin/spaces/list");

        // El selector busca los enlaces "+ Bloqueo" que apuntan a /maintenance/new
        List<WebElement> maintenanceLinks = driver.findElements(
                By.cssSelector("a[href*='/maintenance/new']"));

        if (maintenanceLinks.isEmpty()) {
            throw new RuntimeException(
                    "No se encontró ningún botón '+ Bloqueo' en /admin/spaces/list. " +
                            "Verifica que existe al menos un espacio activo en la BD.");
        }

        maintenanceLinks.get(0).click();
    }

    /**
     * Rellena y envía el formulario de bloqueo de mantenimiento.
     *
     * Los campos datetime-local no aceptan sendKeys de forma fiable en Firefox,
     * por eso se fijan via JavaScript (mismo patrón que usa PR21 directamente).
     *
     * IDs del formulario (según el template Twig): startDate, endDate, reason
     *
     * @param startDate  Formato "yyyy-MM-ddTHH:mm", p.ej. "2099-01-01T09:00"
     * @param endDate    Formato "yyyy-MM-ddTHH:mm", p.ej. "2099-01-01T18:00"
     * @param reason     Texto libre del motivo del bloqueo
     */
    public static void fillMaintenanceForm(WebDriver driver,
                                           String startDate,
                                           String endDate,
                                           String reason) {
        JavascriptExecutor js = (JavascriptExecutor) driver;

        js.executeScript(
                "document.getElementById('startDate').value = arguments[0];",
                startDate);

        js.executeScript(
                "document.getElementById('endDate').value = arguments[0];",
                endDate);

        WebElement reasonField = driver.findElement(By.id("reason"));
        reasonField.clear();
        reasonField.sendKeys(reason);

        driver.findElement(By.cssSelector("button[type='submit']")).click();
    }
}