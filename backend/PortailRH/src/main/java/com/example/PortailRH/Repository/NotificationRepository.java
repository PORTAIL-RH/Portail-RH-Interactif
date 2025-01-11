package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByViewedFalse();
}
