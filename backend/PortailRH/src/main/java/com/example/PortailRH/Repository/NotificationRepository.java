package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;
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

    //Fetches unread notifications for the given role and service ID
    List<Notification> findByRoleAndServiceIdAndViewedFalse(String role, String serviceId); // Nouvelle méthode

    List<Notification> findByRoleAndServiceIdAndCodeSoc(String role, String serviceId, String codeSoc);
    List<Notification> findByRoleAndCodeSoc(String role, String codeSoc);


    // Filtrer par rôle et Personnel ID
    List<Notification> findByRoleAndPersonnelId(String role, String personnelId);

    List<Notification> findByPersonnelId(String personnelId);


    //  méthode pour trouver les notifications non lues par un utilisateur spécifique
    @Query("{ $and: [ "
            + "{ $or: [ "
            + "  { 'personnelId': ?0 }, "
            + "  { $and: [ "
            + "    { 'role': ?1 }, "
            + "    { 'serviceId': ?2 }, "
            + "    { 'codeSoc': ?3 } "  // Changé de 'code_soc' à 'codeSoc'
            + "  ] } "
            + "] }, "
            + "{ 'readBy': { $nin: [ ?0 ] } } "
            + "] }")
    List<Notification> findUnreadForUser(String personnelId, String role, String serviceId, String codeSoc);
    List<Notification> findByRoleAndServiceIdAndCodeSocAndReadByNotContaining(
            String role,
            String serviceId,
            String codeSoc,
            String personnelId
    );

    // Bulk update to mark all unread notifications as read by user
    @Query("{ $and: [ "
            + "{ $or: [ "
            + "  { 'personnelId': ?0 }, "
            + "  { $and: [ "
            + "    { 'role': ?1 }, "
            + "    { 'serviceId': ?2 }, "
            + "    { 'codeSoc': ?3 } "
            + "  ] } "
            + "] }, "
            + "{ 'readBy': { $nin: [ ?0 ] } } "
            + "] }")
    @Update("{ $addToSet: { 'readBy': ?0 } }")
    void markAllAsReadByUser(String personnelId, String role, String serviceId, String codeSoc);
}