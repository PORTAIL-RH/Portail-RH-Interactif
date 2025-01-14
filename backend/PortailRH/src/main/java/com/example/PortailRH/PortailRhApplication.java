package com.example.PortailRH;

import io.github.cdimascio.dotenv.Dotenv;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@SpringBootApplication
public class PortailRhApplication {

	private static String emailUsername;
	private static String emailPassword;

	public static void main(String[] args) {
		SpringApplication.run(PortailRhApplication.class, args);
	}

	// Load environment variables after Spring Boot application starts
	@PostConstruct
	public void init() {
		Dotenv dotenv = Dotenv.load();

		// Access email credentials from .env file
		emailUsername = dotenv.get("SPRING_MAIL_USERNAME");
		emailPassword = dotenv.get("SPRING_MAIL_PASSWORD");

	}

	// Configure JavaMailSender bean to use loaded email credentials
	@Bean
	public JavaMailSender javaMailSender() {
		JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
		mailSender.setHost("smtp.gmail.com");
		mailSender.setPort(587);

		// Use credentials loaded from .env file
		mailSender.setUsername(emailUsername);
		mailSender.setPassword(emailPassword);

		Properties props = mailSender.getJavaMailProperties();
		props.put("mail.transport.protocol", "smtp");
		props.put("mail.smtp.auth", "true");
		props.put("mail.smtp.starttls.enable", "true");

		return mailSender;
	}
}
