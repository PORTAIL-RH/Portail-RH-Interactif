package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findAll();
    List<Notification> findByViewedFalse();
    List<Notification> findByRoleAndViewedFalse(String role);
    List<Notification> findByRoleAndServiceIdAndViewedFalse(String role, String serviceId); // Nouvelle méthode

    List<Notification> findByRole(String role);

    // Filtrer par rôle et serviceId
    List<Notification> findByRoleAndServiceId(String role, String serviceId);

}