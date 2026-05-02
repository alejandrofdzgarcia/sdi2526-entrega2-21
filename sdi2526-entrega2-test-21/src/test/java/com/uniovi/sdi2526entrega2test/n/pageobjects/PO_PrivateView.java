package com.uniovi.sdi2526entrega2test.n.pageobjects;

import com.uniovi.sdi2526entrega2test.n.util.SeleniumUtils;
import org.junit.jupiter.api.Assertions;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;

import java.util.List;

public class PO_PrivateView extends PO_NavView {
    static public void fillFormAddMark(WebDriver driver, int userOrder, String descriptionp, String scorep) {
        //Esperamos 5 segundo a que carge el DOM porque en algunos equipos falla
        SeleniumUtils.waitSeconds(driver, 5);
        //Seleccionamos el alumnos userOrder
        new Select(driver.findElement(By.id("user"))).selectByIndex(userOrder);
        //Rellenemos el campo de descripción
        WebElement description = driver.findElement(By.name("description"));
        description.clear();
        description.sendKeys(descriptionp);
        WebElement score = driver.findElement(By.name("score"));
        score.click();
        score.clear();
        score.sendKeys(scorep);
        By boton = By.className("btn");
        driver.findElement(boton).click();
    }

    public static void checkPagination(WebDriver driver) {
        List<WebElement> page2 = driver.findElements(By.xpath("//*[@id=\"main-container\"]/div[3]/ul/li[3]/a"));
        if (!page2.isEmpty()) {
            page2.get(0).click();
            Assertions.assertTrue(driver.getCurrentUrl().contains("page="), "La URL debe mantener el parámetro de paginación");
        } else {
            System.out.println("Aviso: No hay suficientes datos para probar la paginación física (menos de 5 reservas).");
        }
    }
}
