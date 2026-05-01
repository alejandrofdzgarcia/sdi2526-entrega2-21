package com.uniovi.sdi2526entrega2test.n.pageobjects;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class PO_SignUpView extends PO_NavView {
    static public void fillForm(WebDriver driver, String dnip, String namep, String lastnamep,
                                String passwordp, String passwordconfp) {
        WebElement dni = driver.findElement(By.name("dni"));
        dni.click(); dni.clear(); dni.sendKeys(dnip);

        WebElement name = driver.findElement(By.name("nombre"));
        name.click(); name.clear(); name.sendKeys(namep);

        WebElement lastname = driver.findElement(By.name("apellidos"));
        lastname.click(); lastname.clear(); lastname.sendKeys(lastnamep);

        WebElement password = driver.findElement(By.name("password"));
        password.click(); password.clear(); password.sendKeys(passwordp);

        WebElement passwordConfirm = driver.findElement(By.name("confirmPassword"));
        passwordConfirm.click(); passwordConfirm.clear(); passwordConfirm.sendKeys(passwordconfp);

        driver.findElement(By.className("btn")).click();
    }

}
