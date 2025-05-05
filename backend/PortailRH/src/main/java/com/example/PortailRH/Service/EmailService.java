package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Candidature;
import com.example.PortailRH.Model.candidat;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String senderEmail;

    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        this.senderEmail = mailSender instanceof JavaMailSenderImpl ?
                ((JavaMailSenderImpl) mailSender).getUsername() :
                "noreply@yourdomain.com";
    }

    public void sendHtmlEmail(String toEmail, String subject, String body) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Attempted to send email to null/blank address");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            helper.setFrom(senderEmail);
            helper.setTo(toEmail.trim());
            helper.setSubject(subject);
            helper.setText(body, true); // true = HTML content

            mailSender.send(message);
            log.info("Email sent successfully to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to create email message for {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Email creation failed", e);
        } catch (MailException e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Email sending failed", e);
        }
    }

    // Legacy method for backward compatibility
    public void sendVerificationEmail(String toEmail, String subject, String body) {
        sendHtmlEmail(toEmail, subject, body);
    }

    @Async
    public void sendCandidateConfirmation(candidat candidate, Candidature jobPosting) {
        if (candidate == null || candidate.getEmail() == null || jobPosting == null) {
            log.warn("Cannot send confirmation - candidate, email, or job posting is null");
            return;
        }

        String email = candidate.getEmail().trim();
        String fullName = candidate.getPrenom() + " " + candidate.getNom();
        String poste = jobPosting.getDescription();

        String subject = "Your Application Received - ArabSoft";
        String body;

        if (candidate.getScore() == null || candidate.getScore() <= 0.0) {
            // Generic thank-you message for unqualified candidates
            body = String.format("""
            <html>
                <head><style>body{font-family:Arial,sans-serif}</style></head>
                <body>
                    <h2>Dear %s,</h2>
                    <p>Thank you for applying to ArabSoft!</p>
                    <p>We have received your application for the position of <strong>%s</strong>.</p>
                    <p>We appreciate your interest.</p>
                </body>
            </html>
            """, fullName, poste);
        } else {
            // Message for candidates with score > 0 (considered for interview)
            body = String.format("""
            <html>
                <head><style>body{font-family:Arial,sans-serif}</style></head>
                <body>
                    <h2>Dear %s,</h2>
                    <p>Thank you for applying to ArabSoft!</p>
                    <p>We have received your application for the position of <strong>%s</strong>.</p>
                    <p>Your application status: <strong>waiting for an interview</strong>.</p>
                </body>
            </html>
            """, fullName, poste);
        }

        try {
            sendHtmlEmail(email, subject, body);
            log.info("Confirmation email sent to candidate {}", email);
        } catch (Exception e) {
            log.error("Failed to send confirmation to {}: {}", email, e.getMessage());
        }
    }

}