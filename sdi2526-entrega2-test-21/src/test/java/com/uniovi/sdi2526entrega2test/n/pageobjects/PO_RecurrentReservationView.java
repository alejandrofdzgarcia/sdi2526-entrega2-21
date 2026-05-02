package com.uniovi.sdi2526entrega2test.n.pageobjects;

import com.uniovi.sdi2526entrega2test.n.util.SeleniumUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;

import java.util.List;

/**
 * Page Object para la vista de creación de reservas recurrentes en el cliente React.
 */
public class PO_RecurrentReservationView extends PO_NavView {

    /**
     * Navega a la vista de reservas recurrentes pulsando el botón del Header.
     * Espera a que se cargue el título "Crear Reservas Recurrentes".
     */
    public static void navigateTo(WebDriver driver) {
        List<WebElement> buttons = SeleniumUtils.waitLoadElementsBy(
                driver, "free", "//button[contains(text(),'Reserva Recurrente')]", getTimeout()
        );
        buttons.get(0).click();
        SeleniumUtils.waitLoadElementsBy(driver, "text", "Crear Reservas Recurrentes", getTimeout());
    }

    /**
     * Selecciona la reserva base en el desplegable buscando por texto parcial.
     * @param spaceNameContains Texto que debe contener la opción (ej. "Sala A")
     */
    public static void selectReservaBase(WebDriver driver, String spaceNameContains) {
        Select select = new Select(
                driver.findElement(By.cssSelector("select[name='reservationId']"))
        );
        for (WebElement opt : select.getOptions()) {
            if (opt.getText().contains(spaceNameContains)) {
                opt.click();
                return;
            }
        }
    }

    /**
     * Selecciona la frecuencia en el desplegable.
     * @param frequency "diaria", "semanal", "mensual" o "anual"
     */
    public static void selectFrecuencia(WebDriver driver, String frequency) {
        Select select = new Select(
                driver.findElement(By.cssSelector("select[name='frequency']"))
        );
        select.selectByValue(frequency);
    }

    /**
     * Establece la fecha límite de recurrencia.
     * @param endDate Formato "yyyy-MM-ddTHH:mm" (ej. "2026-09-01T09:00")
     */
    public static void setEndRecurrence(WebDriver driver, String endDate) {
        WebElement input = driver.findElement(By.cssSelector("input[name='endRecurrence']"));
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].value = arguments[1];", input, endDate
        );
        input.sendKeys(Keys.TAB);
    }

    /**
     * Pulsa el botón "Crear Reservas Recurrentes".
     */
    public static void submitForm(WebDriver driver) {
        driver.findElement(By.cssSelector("button[type='submit']")).click();
    }

    /**
     * Devuelve las filas de la tabla de reservas creadas (si aparece).
     */
    public static List<WebElement> getCreatedRows(WebDriver driver) {
        return driver.findElements(By.cssSelector("table tbody tr"));
    }
}