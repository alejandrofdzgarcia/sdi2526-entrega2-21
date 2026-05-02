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
 * Page Object para la vista de edición de reserva propia en el cliente React.
 */
public class PO_EditView extends PO_NavView {

    /**
     * Pulsa el botón "Editar" de la primera reserva ACTIVE de la tabla.
     * Espera a que se cargue el formulario de edición.
     */
    public static void clickEditarPrimeraReservaActiva(WebDriver driver) {
        List<WebElement> editButtons = SeleniumUtils.waitLoadElementsBy(
                driver, "free", "//button[contains(text(),'Editar')]", getTimeout()
        );
        editButtons.get(0).click();
        SeleniumUtils.waitLoadElementsBy(driver, "text", "Editar Reserva", getTimeout());
    }

    /**
     * Rellena el formulario de edición. Los parámetros null no se tocan.
     *
     * @param spaceNameContains  Texto parcial del nombre del espacio en el select (ej. "Aula 1")
     * @param startDate          Formato "yyyy-MM-ddTHH:mm" (ej. "2026-08-01T09:00")
     * @param endDate            Formato "yyyy-MM-ddTHH:mm" (ej. "2026-08-01T11:00")
     * @param reason             Motivo de la reserva
     */
    public static void fillEditForm(WebDriver driver,
                                    String spaceNameContains,
                                    String startDate,
                                    String endDate,
                                    String reason) {
        JavascriptExecutor js = (JavascriptExecutor) driver;

        if (spaceNameContains != null) {
            Select select = new Select(driver.findElement(By.cssSelector("select[name='spaceId']")));
            for (WebElement opt : select.getOptions()) {
                if (opt.getText().contains(spaceNameContains)) {
                    opt.click();
                    break;
                }
            }
        }

        if (startDate != null) {
            WebElement startInput = driver.findElement(By.cssSelector("input[name='startDate']"));
            js.executeScript("arguments[0].value = arguments[1];", startInput, startDate);
            startInput.sendKeys(Keys.TAB);
        }

        if (endDate != null) {
            WebElement endInput = driver.findElement(By.cssSelector("input[name='endDate']"));
            js.executeScript("arguments[0].value = arguments[1];", endInput, endDate);
            endInput.sendKeys(Keys.TAB);
        }

        if (reason != null) {
            WebElement reasonField = driver.findElement(By.cssSelector("textarea[name='reason']"));
            reasonField.clear();
            reasonField.sendKeys(reason);
        }
    }

    /**
     * Pulsa el botón "Guardar Cambios".
     */
    public static void submitEditForm(WebDriver driver) {
        driver.findElement(By.cssSelector("button[type='submit']")).click();
    }
}