package com.example.PortailRH;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@SpringBootApplication
@EnableAsync
public class PortailRhApplication {

	private static final Dotenv dotenv = Dotenv.configure()
			.directory("./")
			.ignoreIfMissing()
			.load();

	public static void main(String[] args) {
		SpringApplication.run(PortailRhApplication.class, args);
	}


	@Bean
	public JavaMailSender javaMailSender() {
		JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
		mailSender.setHost("smtp.gmail.com");
		mailSender.setPort(587);
		mailSender.setUsername("fidaasassi@gmail.com");
		mailSender.setPassword("dopn sbtu mhai dosj");

		Properties props = mailSender.getJavaMailProperties();
		props.put("mail.transport.protocol", "smtp");
		props.put("mail.smtp.auth", "true");
		props.put("mail.smtp.starttls.enable", "true"); // Enables STARTTLS
		props.put("mail.smtp.ssl.enable", "false");     // Disable SSL
		props.put("mail.smtp.auth.mechanisms", "PLAIN"); // Force PLAIN
		props.put("mail.debug", "true");

		return mailSender;
	}


}