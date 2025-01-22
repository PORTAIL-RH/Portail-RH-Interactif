package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findAll();
    List<Notification> findByViewedFalse();

}
