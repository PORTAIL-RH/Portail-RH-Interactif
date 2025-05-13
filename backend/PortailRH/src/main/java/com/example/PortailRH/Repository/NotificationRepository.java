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

    List<Notification> findByPersonnelIdAndViewedFalse(String personnelId);

    //Fetches unread notifications for the given role and Personnel ID
    List<Notification> findByRoleAndPersonnelIdAndViewedFalse(String role, String personnelId); // Nouvelle méthode

    List<Notification> findByRole(String role);

    List<Notification> findByPersonnelId(String personnelId);

    // Filtrer par rôle et Personnel ID
    List<Notification> findByRoleAndPersonnelId(String role, String personnelId);

}