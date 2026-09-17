package com.finance.salary;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SalaryManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(SalaryManagementApplication.class, args);
	}

}
