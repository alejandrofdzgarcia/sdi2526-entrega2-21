package com.uniovi.sdi2425entrega2test.n.pageobjects;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class PO_LoginView extends PO_NavView {

	static public void fillLoginForm(WebDriver driver, String dnip, String passwordp) {
		WebElement dni = driver.findElement(By.name("username"));
		dni.click();
		dni.clear();
		dni.sendKeys(dnip);
		WebElement password = driver.findElement(By.name("password"));
		password.click();
		password.clear();
		password.sendKeys(passwordp);
		//Pulsar el boton de Alta.
		By boton = By.className("btn");
		driver.findElement(boton).click();	
	}
	static public void login(WebDriver driver,String user, String password, String checkText) {
		clickOption(driver, "login", "class", "btn btn-primary");
		fillLoginForm(driver, user, password);
		//Comprobamos que entramos en la pagina privada del Profesor
		checkElementBy(driver, "text", checkText);
	}

	static public void logout(WebDriver driver, String checkKeyText) {
		String loginText = getP().getString(checkKeyText, PO_Properties.getSPANISH());
		clickOption(driver, "logout", "text", loginText);
	}
}
